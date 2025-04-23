"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { Document, Page, pdfjs } from "react-pdf";
import { UploadCloud, Loader2 } from "lucide-react";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import axiosInstance from "@/lib/axios";

// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DocumentUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("document", file);
      const res = await axiosInstance.post("/api/upload/new", formData);
      console.log(res.data.data);
      setPdfUrl(res.data.data);
      return res.data.filename;
    },
    onSuccess: (filename) => {
   
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      alert("Please select a valid PDF file");
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      mutation.mutate(selectedFile);
    }
  };

  return (
    <div className="w-[100%] h-[100%] mx-auto p-1">
   {  !pdfUrl && 
   <>
   <div className="border-2 border-dashed  rounded-lg p-6 text-center  transition">
        <label
          htmlFor="pdf-upload"
          className="flex flex-col items-center justify-center space-y-2 cursor-pointer"
        >
          <UploadCloud className="w-10 h-10 text-blue-600" />
          <p className="text-sm text-gray-600">
            Click to <span className="font-medium text-blue-600">browse</span>{" "}
            or drag & drop a PDF
          </p>
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {selectedFile && (
          <p className="mt-4 text-sm text-green-600 font-medium">
            Selected: {selectedFile.name}
            
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || mutation.isPending}
          className="flex items-center gap-2 bg-blue-600  px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Upload PDF
        </button>
      </div>
   </>

        }


    {
      pdfUrl &&<>
    <iframe
    src={pdfUrl!}
    className="w-full h-full border"
    title="PDF Preview"
    ></iframe>
  
    </>
    }
    
    </div>
  );
};

export default DocumentUpload;
