import { Worker } from "bullmq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { QdrantClient } from "@qdrant/js-client-rest";

const worker = new Worker("file-upload-queue",
    async (job: any) => {
        const data = JSON.parse(job.data);
        // path : data.path
        const loader =  new PDFLoader(data.path)
        // console.log('loader is ',loader)
        const docs = await loader.load();
        // read the pdf from the path
        console.log('documents are ',docs)
        console.log('embeddings are ')

        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "text-embedding-001", // 768 dimensions
            apiKey: process.env.GOOGLE_API_KEY
          });
          const res = await embeddings.embedQuery(
            "What would be a good company name for a company that makes colorful socks?"
          );
          console.log({ res });
          console.log('embeddings are ',embeddings)
        console.log('passed l0')
        const client = new QdrantClient({ url: 'http://localhost:6333' });

        const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
            client,
            collectionName: "movie-collection",
          });
        console.log('passed l1')
       const output =  await vectorStore.addDocuments(docs);
       console.log('output:',output)
        console.log('passed l2')

        console.log('Jobs', job.data)

    }, { concurrency: 100, connection: { host: "localhost", port: 6379 } });



