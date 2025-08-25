"use client";

import { useState } from "react";
import { UploadDropzone } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText } from "lucide-react";
import axios from "@/lib/axios";

interface UploadThingUploaderProps {
  collectionId: string;
  onUploadComplete?: (file: any) => void;
}

export function UploadThingUploader({
  collectionId,
  onUploadComplete,
}: UploadThingUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUploadComplete = async (uploadedFiles: any[]) => {
    if (uploadedFiles.length === 0) return;
    setIsUploading(true);

    try {
      const file = uploadedFiles[0];

      const response = await axios.post("/api/upload/new", {
        fileUrl: file.url,
        fileName: file.name,
        fileType: file.type || "application/pdf",
        collectionId,
        uploadThingKey: file.key,
      });

      if (response.data.statusCode === 200) {
        toast({
          title: "Upload successful",
          description: "Your file was uploaded and is being processed.",
        });

        if (onUploadComplete) {
          onUploadComplete(response.data.data);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Something went wrong while processing your file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload error:", error);
    toast({
      title: "Upload failed",
      description: error.message,
      variant: "destructive",
    });
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-md border border-gray-200 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5 text-primary" />
          Upload PDF Document
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Upload a PDF file to add to your collection. <br />
          <span className="text-gray-400">Max file size: 4MB</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isUploading ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-600">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-sm font-medium">Processing file...</span>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-gray-50/30">
            <UploadDropzone
              endpoint="pdfUploader"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              className="flex flex-col items-center gap-3"
              content={{
                allowedContent: "Only PDF files are allowed",
                button: (
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-3 px-4 py-2"
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose PDF
                  </Button>
                ),
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
