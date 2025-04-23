import express from "express";
import type {Request, Response,NextFunction } from "express";
import chatRoute from "./routes/chat.route";
import uploadRoute from "./routes/upload.route";
import collectionRoute from './routes/collections.route';
import path from 'path';
import { auth } from "@/lib/auth";
import cors from "cors"; 
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import errorHandler from "./middleware/errorHandler";
import { checkAuth } from "./middleware/auth.middleware";
const app = express();
const port = 5000
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(
	cors({
		origin: ["http://localhost:3000"], 
		methods: ["GET", "POST", "PUT", "DELETE"], 
		credentials: true,
		
	})
);
app.all("/api/auth/*splat", toNodeHandler(auth)); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/chat', chatRoute);
app.use('/api/upload',checkAuth, uploadRoute);
app.use('/api/collections',checkAuth, collectionRoute);


 
app.get("/api/me", async (req:Request, res:any) => {
	const session = await auth.api.getSession({
	 headers: fromNodeHeaders(req.headers),
   });
   return res.json(session);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error(' Error:', err.message || err);
	errorHandler(err, req, res, next);

  });
app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});