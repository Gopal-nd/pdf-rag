"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import DocumentAccordion from "./DocumentList";
import { Button } from "./ui/button";
import { Loader2, Upload } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";

const DocumentUpload = ({ id }: { id: string }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<any | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Fetch documents
  const { data, refetch } = useQuery({
    queryKey: ["documents", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/upload`, { params: { id } });
      return res.data.data;
    },
  });

  // UploadThing hook
  const { startUpload, isUploading } = useUploadThing("pdfUploader", {
    onClientUploadComplete: (files) => {
      if (files?.length) {
        const file = files[0];
        setUploadedFile(file);
        setPdfUrl(file.url);
        refetch();
        setSelectedFiles([]);
      }
    },
    onUploadError: (err) => {
      console.error("Upload failed:", err);
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  // Handle upload trigger
  const handleUpload = async () => {
    if (selectedFiles.length > 0) {
      await startUpload(selectedFiles);
    }
  };

  // Send uploaded file to backend
  const handleSendToBackend = async () => {
    if (!uploadedFile) return;
    setIsSending(true);
    try {
      await axiosInstance.post("/api/upload/process", {
        fileKey: uploadedFile.key,
        collectionId: id,
      });
      await refetch();
      setUploadedFile(null);
    } catch (error) {
      console.error("Failed to send to backend:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-full mx-auto p-1 space-y-4">
      {/* Document List + Add New Button */}
      <div className="flex items-center justify-between">
        <DocumentAccordion documents={data} setpfdUrl={setPdfUrl} />
        {pdfUrl && !uploadedFile && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPdfUrl(null)}
          >
            Add New
          </Button>
        )}
      </div>

      {/* Uploader or PDF Preview */}
      {!pdfUrl ? (
        <div className="flex flex-col items-center border-2 border-dashed rounded-xl p-6 bg-gray-50 gap-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="cursor-pointer"
          />

          <Button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <iframe
            src={pdfUrl}
            className="w-full h-[500px] border rounded-lg shadow-sm"
            title="PDF Preview"
          />

          {uploadedFile && (
            <Button
              className="w-full"
              onClick={handleSendToBackend}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send to Backend"
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
