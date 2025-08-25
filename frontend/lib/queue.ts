import { Queue, Worker } from 'bullmq';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { prisma } from './db';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { AdvancedDocumentProcessor } from './advanced-document-processor';

// Redis connection with optimized settings
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxLoadingTimeout: 10000,
};

// Create queues with optimized settings
export const fileUploadQueue = new Queue('file-upload', { 
  connection,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 second delay
    },
  },
});

export const websiteQueue = new Queue('website-crawl', { 
  connection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

// File upload worker with advanced document processing
const fileUploadWorker = new Worker(
  'file-upload',
  async (job) => {
    let tempFilePath: string | null = null;
    
    try {
      const data = JSON.parse(job.data);
      console.log('🚀 Processing advanced file upload job:', data.filename);

      if (!data.user.apiKey) {
        console.error("❌ User does not have API key configured");
        return;
      }

      // Initialize advanced document processor
      const processor = new AdvancedDocumentProcessor(data.user.apiKey);

      // Ensure collection exists with optimized settings
      const collectionName = `user-${data.collectionId}`;
      const collectionReady = await processor.storeDocuments([], collectionName);
      
      if (!collectionReady) {
        console.error(`❌ Failed to ensure collection ${collectionName}`);
        return;
      }

      // Download file from UploadThing URL with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(data.url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PDF-RAG-Bot/1.0)',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create temporary file with unique name
      tempFilePath = join(tmpdir(), `pdf-rag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.pdf`);
      writeFileSync(tempFilePath, buffer);

      // Load PDF with optimized settings
      const loader = new PDFLoader(tempFilePath, {
        splitPages: true, // Split by pages for better context
      });
      
      const docs = await loader.load();
      console.log(`📄 Loaded ${docs.length} pages from PDF`);

      // Process documents with advanced semantic understanding
      const enhancedChunks = await processor.processDocuments(docs, data.filename, data.collectionId);
      console.log(`🧠 Enhanced processing completed: ${enhancedChunks.length} semantic chunks`);

      // Store documents with advanced semantic indexing
      await processor.storeDocuments(enhancedChunks, collectionName);

      console.log(`🎉 Advanced file processing completed successfully: ${data.filename}`);

    } catch (error) {
      console.error('❌ Advanced file upload processing error:', error);
    } finally {
      // Clean up temporary file
      if (tempFilePath) {
        try {
          unlinkSync(tempFilePath);
          console.log(`🧹 Cleaned up temp file: ${tempFilePath}`);
        } catch (cleanupError) {
          console.error('Failed to clean up temp file:', cleanupError);
        }
      }
    }
  },
  { 
    connection,
    concurrency: 2, // Process 2 jobs concurrently
    autorun: true,
  }
);

// Website crawl worker with optimizations
const websiteWorker = new Worker(
  'website-crawl',
  async (job) => {
    try {
      const data = JSON.parse(job.data);
      console.log('🌐 Processing optimized website crawl job:', data.url);

      if (!data.user.apiKey) {
        console.error("❌ User does not have API key configured");
        return;
      }

      // Initialize advanced document processor
      const processor = new AdvancedDocumentProcessor(data.user.apiKey);

      // Ensure collection exists
      const collectionName = `user-${data.collectionId}`;
      const collectionReady = await processor.storeDocuments([], collectionName);
      
      if (!collectionReady) {
        console.error(`❌ Failed to ensure collection ${collectionName}`);
        return;
      }

      // TODO: Implement website crawling logic here
      console.log(`✅ Collection ready for website data: ${collectionName}`);

    } catch (error) {
      console.error('❌ Website crawl processing error:', error);
    }
  },
  { 
    connection,
    concurrency: 1, // Single website crawl at a time
    autorun: true,
  }
);

// Enhanced error handling and monitoring
fileUploadWorker.on('error', (error) => {
  console.error('❌ File upload worker error:', error);
});

websiteWorker.on('error', (error) => {
  console.error('❌ Website worker error:', error);
});

fileUploadWorker.on('completed', (job) => {
  console.log(`✅ Advanced file upload job completed: ${job.id}`);
});

websiteWorker.on('completed', (job) => {
  console.log(`✅ Website crawl job completed: ${job.id}`);
});

fileUploadWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`❌ Advanced file upload job failed: ${job.id}`, err);
  }
});

websiteWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`❌ Website crawl job failed: ${job.id}`, err);
  }
});

console.log('🚀 Advanced queue workers started with semantic processing');
