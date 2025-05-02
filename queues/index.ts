import { Worker } from "bullmq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import fs from "fs/promises";
import axios from "axios";
import path from "path";
import os from "os";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { loadWebDocuments } from "./utils/web-loader";

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
if(job.name ==='file-add'){
  console.log(job)

  
  let tempFilePath: string | null = null;
  
    try {
      const data = JSON.parse(job.data);
      // Step 1: Download file
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `${Date.now()}-${data.filename}`);
      const response = await axios.get(data.path, { responseType: "arraybuffer" });

      await fs.writeFile(tempFilePath, response.data);
      console.log("✅ File downloaded to:", tempFilePath);

      // Step 2: Load and embed
      const loader = new PDFLoader(tempFilePath);
      const docs = await loader.load();
      console.log("📄 Loaded documents:", docs.length);

      const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey: data.user.apiKey!,
      });
      console.log(data)
      const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: "http://localhost:6333",
        collectionName: `user-${data.collectionId}`,
      });

      const result = await vectorStore.addDocuments(docs);
      console.log("✅ Documents added to Qdrant",result);
    } catch (err) {
      console.error("❌ Error during processing:", err);
    } finally {
      // Step 3: Cleanup
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
          console.log("🧹 Temp file cleaned:", tempFilePath);
        } catch (cleanupErr) {
          console.error("⚠️ Failed to clean temp file:", cleanupErr);
        }
      }
    }

    console.log("📦 Job data:", job.data);
  }else if(job.name ==='file-remove'){
    const data = JSON.parse(job.data);
    console.log(data)
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey: data.user.apiKey!,
      }),
      {
        url: "http://localhost:6333",
        collectionName: `user-${data.collectionId}`,
      }
    );
    await vectorStore.delete(data.key)  
  }else if(job.name=='website-add'){
    const data = JSON.parse(job.data);
    // get the job data
    console.log(data)
 
    // set up for the embedding
   const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: data.user.apiKey!,
  });
  // set up for the vector store
  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: "http://localhost:6333",
    collectionName: `user-${data.urlId}`,
  });
  // for every url 
  data.urls.map(async(url:string) => {
    // load the content
   const response = await loadWebDocuments(url)
    // store in the vector db
    const result = await vectorStore.addDocuments(response);

  })
  console.log('✅ Documents added to Qdrant')
  }

},
  {
    concurrency: 100,
    connection: { host: "localhost", port: 6379 },
  }
);
