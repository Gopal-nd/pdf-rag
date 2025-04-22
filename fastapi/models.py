from sqlalchemy import Table, Column, Integer, String, Boolean
from .database import metadata

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String, unique=True),
    Column("email", String, unique=True),
    Column("is_active", Boolean, default=True),
)
