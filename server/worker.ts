import { Worker } from "bullmq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import fs from "fs/promises";
import axios from "axios";
import path from "path";
import os from "os";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const worker = new Worker("file-upload-queue",
    async (job: any) => {
      try {
        const data = JSON.parse(job.data);
    
        // Step 1: Download the file
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `${Date.now()}-${data.filename}`);

    
        const response = await axios.get(data.path, { responseType: "arraybuffer" });
        await fs.writeFile(tempFilePath, response.data);
        console.log("✅ File downloaded to:", tempFilePath);

        const loader = new PDFLoader(tempFilePath);
        const docs = await loader.load();
        console.log("📄 Loaded documents:", docs.length);
        console.log('documents are ',docs)
        console.log('embeddings are ')
        console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY);


        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "text-embedding-004", // 768 dimensions
            apiKey: process.env.GOOGLE_API_KEY
          });
        console.log('passed l0')
        // console.log('embeddings are ',embeddings)
  
    
          const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
            url: 'http://localhost:6333',
            collectionName: "langchain-testing",
          });

          const output = await vectorStore.addDocuments(docs);

        } catch (err) {
          console.error("Error during Qdrant vector store setup:", err);
        }
        
        console.log('passed all docs added tothe vector store')

        console.log('Jobs', job.data)

    }, { concurrency: 100, connection: { host: "localhost", port: 6379 } });



