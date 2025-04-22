import { Worker } from "bullmq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

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
        console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY);


        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "text-embedding-004", // 768 dimensions
            apiKey: process.env.GOOGLE_API_KEY
          });
        console.log('passed l0')
        // console.log('embeddings are ',embeddings)
  
        try {
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



