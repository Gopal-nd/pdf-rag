import { createUploadthing, type FileRouter } from "uploadthing/next";
import { authMiddleware } from "@/lib/auth-middleware";
import { NextRequest } from "next/server";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      // Get user from session
      const session = await authMiddleware(req as NextRequest);
      if (session instanceof Response) {
        throw new Error("Unauthorized");
      }
      
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
