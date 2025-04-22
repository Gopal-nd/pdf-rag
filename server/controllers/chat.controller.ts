import { ApiResponse } from "@/utils/api-response";
import asyncHandler from "@/utils/async-handler";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenAI } from "@google/genai";


const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });


export const newChat = asyncHandler(async (req, res) => {
    const query = req.query.q
    console.log(query)
    if(!query) {
        return res.status(400).json(new ApiResponse({
            statusCode: 400,
            data: null,
            message: 'query is required'
        }));
    }
    const userQuery = "what are the skills mentioned in the resume?"
    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004", // 768 dimensions
        apiKey: process.env.GOOGLE_API_KEY
      });
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: 'http://localhost:6333',
        collectionName: "langchain-testing",
      });

      const response = vectorStore.asRetriever({
        k:2,
      })

      const result = await response.invoke(userQuery)
      const system_prompt =` you are helpfull ai assistant who answeres the user query based on the avialablle context from pdf file 
      Context:
      ${JSON.stringify(result)}`

      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: query!,
        config:{
          systemInstruction: system_prompt 
          
        }
      });
      console.log(aiResponse.text);
      

    res.json(new ApiResponse({
        statusCode: 200,
        data: aiResponse.text,
        message: 'success'
    }));
});