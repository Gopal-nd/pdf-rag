import { Queue, Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { prisma } from "./db";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { AdvancedDocumentProcessor } from "./advanced-document-processor";
import IORedis from "ioredis";

// ---- REDIS CONNECTION (Upstash REST compatible for BullMQ) ----
const connection = new IORedis(process.env.UPSTASH_REDIS_REST_URL!, {
  password: process.env.UPSTASH_REDIS_REST_TOKEN!,
  maxRetriesPerRequest: null,
});

// ---- QUEUE SETUP ----
export const fileUploadQueue = new Queue("file-upload", {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  },
});

export const websiteQueue = new Queue("website-crawl", {
  connection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
  },
});

// ---- FILE UPLOAD WORKER ----
new Worker(
  "file-upload",
  async (job) => {
    let tempFilePath: string | null = null;
    try {
      const data = job.data;
      console.log("🚀 Processing advanced file upload job:", data.filename);

      if (!data.user?.apiKey) {
        console.error("❌ User does not have API key configured");
        return;
      }

      const processor = new AdvancedDocumentProcessor(data.user.apiKey);
      const collectionName = `user-${data.collectionId}`;

      // Ensure collection exists
      const collectionReady = await processor.storeDocuments([], collectionName);
      if (!collectionReady) {
        console.error(`❌ Failed to ensure collection ${collectionName}`);
        return;
      }

      // Download file
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const response = await fetch(data.url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PDF-RAG-Bot/1.0)" },
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);

      const buffer = Buffer.from(await response.arrayBuffer());

      // Save temp file
      tempFilePath = join(
        tmpdir(),
        `pdf-rag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.pdf`
      );
      writeFileSync(tempFilePath, buffer);

      // Load PDF
      const loader = new PDFLoader(tempFilePath, { splitPages: true });
      const docs = await loader.load();
      console.log(`📄 Loaded ${docs.length} pages from PDF`);

      // Process and store
      const enhancedChunks = await processor.processDocuments(
        docs,
        data.filename,
        data.collectionId
      );
      console.log(`🧠 Enhanced processing completed: ${enhancedChunks.length} semantic chunks`);

      await processor.storeDocuments(enhancedChunks, collectionName);
      console.log(`🎉 Advanced file processing completed successfully: ${data.filename}`);
    } catch (error) {
      console.error("❌ Advanced file upload processing error:", error);
    } finally {
      if (tempFilePath) {
        try {
          unlinkSync(tempFilePath);
          console.log(`🧹 Cleaned up temp file: ${tempFilePath}`);
        } catch (cleanupError) {
          console.error("Failed to clean up temp file:", cleanupError);
        }
      }
    }
  },
  { connection, concurrency: 2, autorun: true }
);

// ---- WEBSITE CRAWL WORKER ----
new Worker(
  "website-crawl",
  async (job) => {
    try {
      const data = job.data;
      console.log("🌐 Processing optimized website crawl job:", data.url);

      if (!data.user?.apiKey) {
        console.error("❌ User does not have API key configured");
        return;
      }

      const processor = new AdvancedDocumentProcessor(data.user.apiKey);
      const collectionName = `user-${data.collectionId}`;
      const collectionReady = await processor.storeDocuments([], collectionName);
      if (!collectionReady) {
        console.error(`❌ Failed to ensure collection ${collectionName}`);
        return;
      }

      // TODO: Implement crawling
      console.log(`✅ Collection ready for website data: ${collectionName}`);
    } catch (error) {
      console.error("❌ Website crawl processing error:", error);
    }
  },
  { connection, concurrency: 1, autorun: true }
);

// ---- LOGGING ----
console.log("🚀 Advanced queue workers started with semantic processing");

fileUploadQueue.on("error", (error) => console.error("❌ Queue error:", error));
websiteQueue.on("error", (error) => console.error("❌ Website queue error:", error));
