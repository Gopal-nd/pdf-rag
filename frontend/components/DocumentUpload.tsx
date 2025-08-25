"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import axiosInstance from "@/lib/axios";
import DocumentAccordion from "./DocumentList";
import { Button } from "./ui/button";
import { UploadThingUploader } from "./UploadThingUploader";

const DocumentUpload = ({id}:{id:string}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const {data, refetch} = useQuery({
    queryKey:["documets",id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/upload`,{params:{id}});
      return res.data.data
    }
  });

  const handleUploadComplete = (file: any) => {
    // Refresh the document list after upload
    refetch();
    // Set the PDF URL for preview if needed
    if (file.url) {
      setPdfUrl(file.url);
    }
  };

  return (
    <div className="w-[100%] h-[100%] mx-auto p-1">
      <div className="flex items-center justify-between mb-4">
        <DocumentAccordion documents={data} setpfdUrl={setPdfUrl}/>
        <Button variant="default" onClick={() => setPdfUrl(null)}>
          Add 
        </Button>
      </div>
      
      {!pdfUrl ? (
        <div className="w-full">
          <UploadThingUploader 
            collectionId={id} 
            onUploadComplete={handleUploadComplete}
          />
        </div>
      ) : (
        <div className="w-full h-full">
          <iframe
            src={pdfUrl}
            className="w-full h-full border rounded-lg"
            title="PDF Preview"
          />
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
