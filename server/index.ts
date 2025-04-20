import express from "express";
import type {Request, Response } from "express";

import { auth } from "@/lib/auth";
import cors from "cors"; // Import the CORS middleware
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
const app = express();
const port = 5000
app.use(
	cors({
		origin: ["http://localhost:3000"], // Replace with your frontend's origin
		methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
		credentials: true, // Allow credentials (cookies, authorization headers, etc.)
		
	})
);
app.all("/api/auth/*splat", toNodeHandler(auth)); 

 
app.get("/api/me", async (req:Request, res:any) => {
	const session = await auth.api.getSession({
	 headers: fromNodeHeaders(req.headers),
   });
   return res.json(session);
});

// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.use(express.json());
 
app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});