from fastapi import FastAPI
from database import database, engine, metadata
from models import users
from pydantic import BaseModel, EmailStr

app = FastAPI()

metadata.create_all(bind=engine)

# Connect and disconnect to DB
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


@app.get("/")
def home():
    return {'message':"Hello this is the start"}

@app.get('/hello/{name}')
def hello(name:str):
    return{'hi':f"hello {name}"}

@app.get("/users/{user_id}")
def read_user(user_id):
    return {"user_id": user_id}

# Query parameter example
# http://localhost:8000/search/?q=ok
@app.get("/search/")
def search_items(q: str = ""):
    return {"results": f"Showing search results for '{q}'"}

# Define the structure of the request body
class User(BaseModel):
    username: str
    email: str
    is_active: bool = True

@app.post('/users/')
async def create_user(user:User):
    query = users.insert().values(
        username=user.username,
        email=user.email,
        is_active=user.is_active,
    )
    last_record_id = await database.execute(query)
    return {
        "message":'user created sucessfully',
        "user_data":user,
        "id": last_record_id, **user.dict()
    }
# send the data in the form of JSON
# {
#   "username": "manu",
#   "email": "manu@example.com"
# }
