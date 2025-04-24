import { ApiResponse } from "@/utils/api-response";
import asyncHandler from "@/utils/async-handler";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db";


const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });


export const newChat = asyncHandler(async (req, res) => {
    const query = req.query.query as string
    const id = req.query.id as string
    console.log(req.query)
    if(!query) {
        return res.status(400).json(new ApiResponse({
            statusCode: 400,
            data: null,
            message: 'query is required'
        }));
    }

    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004", // 768 dimensions
        apiKey: process.env.GOOGLE_API_KEY
      });
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: 'http://localhost:6333',
        collectionName: `user-${id}`,
      });

      const response = vectorStore.asRetriever({
        k:2,
      })

      const result = await response.invoke( query!)
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
        data: {res:aiResponse.text,docs:result},
        message: 'success'
    }));
});


export const newAiChat = asyncHandler(async (req, res) => {
    const query = req.query.query as string

    const id = req.query.id as string

    console.log('from new chat /new',req.query)

    if(!query) {
        return res.status(400).json(new ApiResponse({
            statusCode: 400,
            data: null,
            message: 'query is required'
        }));
    }

    const chat = await prisma.chat.create({
      data:{
        collectionId:id,
        userId:req.user?.id as string
      }
    });

    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "user",
        content: query,
      },
    });

    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004", // 768 dimensions
        apiKey: process.env.GOOGLE_API_KEY
      });
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: 'http://localhost:6333',
        collectionName: `user-${id}`,
      });

      const response = vectorStore.asRetriever({
        k:2,
      })

      const result = await response.invoke( query!)
      const system_prompt =` you are helpfull ai assistant who answeres the user query based on the avialablle context from pdf file and the chat history of the user that u have based on the conversation
      Context:
      ${JSON.stringify(result)}`

      console.log(system_prompt)

      const chatSession = await ai.chats.create({
        model: "gemini-2.0-flash",
      });
   
      const stream = await chatSession.sendMessageStream({
        message:query!,
        config:{
          systemInstruction:system_prompt
      }});

      let modelResponse = "";
      for await (const chunk of stream) {
        modelResponse += chunk.text;
      }

      await prisma.message.create({
        data: {
          chatId: chat.id,
          role: "model",
          content: modelResponse,
        },
      });
    res.json(new ApiResponse({
        statusCode: 200,
        data: {res:modelResponse,docs:result,chatId:chat.id},
        message: 'success'
    }));
});



export const continueChat = asyncHandler(async (req, res) => {
  const query = req.query.query as string
  const { chatId } = req.params;
  const id = req.query.id as string

  console.log('from the continue chat /chat:id',req.query, 'from continue', chatId)

  if(!query) {
      return res.status(400).json(new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'query is required'
      }));
  }

  const pastMessages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
  });

  const chatSession = await ai.chats.create({
    model: "gemini-2.0-flash",
    history: pastMessages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
  });

  await prisma.message.create({
    data: {
      chatId,
      role: "user",
      content: query!,
    },
  });


  const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004", // 768 dimensions
      apiKey: process.env.GOOGLE_API_KEY
    });
  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: 'http://localhost:6333',
      collectionName: `user-${id}`,
    });
    // console.log(vectorStore)

    const response = vectorStore.asRetriever({
      k:2,
    })
    // console.log(response)

    const result = await response.invoke( query!)
    console.log(result)
    const system_prompt =` you are helpfull ai assistant who answeres the user query based on the avialablle context from pdf file and the chat history of the user that u have based on the conversation
    Context:
    ${JSON.stringify(result)}`

    console.log(system_prompt)

    const stream = await chatSession.sendMessageStream({
      message:query!,
      config:{
        systemInstruction:system_prompt
    }});

    let modelResponse = "";
    for await (const chunk of stream) {
      modelResponse += chunk.text;
    }

    await prisma.message.create({
      data: {
        chatId,
        role: "model",
        content: modelResponse,
      },
    });

  res.json(new ApiResponse({
      statusCode: 200,
      // data: { messages: [...pastMessages, { role: "user", content: query }, { role: "model", content: modelResponse }] },
      data: { res: modelResponse,docs:result },

      message: 'success'
  }));
});





export const getAllChats = asyncHandler(async (req, res) => {

  const id = req.query.id as string

  console.log('from all chats /all chats of collections ',req.query)


  const history = await prisma.chat.findMany({
    where: { 
      collectionId:id,
      userId: req.user?.id as string
     },
    orderBy: { createdAt: "asc" },
    include:{
      messages:true
      
    }
  });

  res.json(new ApiResponse({
      statusCode: 200,
      data: history,
      message: 'success'
  }));
});





export const getChatHistory = asyncHandler(async (req, res) => {


  console.log('function called ',req.query , "get specific user chat history")
 
  const chatId = req.query.chatId as string



  const history = await prisma.chat.findMany({
    where: { 
      id:chatId,
     },
     include:{
      messages:true
     },
    orderBy: { createdAt: "asc" },
  });

  res.json(new ApiResponse({
      statusCode: 200,
      data: history,
      message: 'success'
  }));
});





export const test = asyncHandler(async (req, res) => {
  const chatId = req.params.chatId

  console.log(req.params)
  console.log('function called ',req.query , "get specific user chat history")
 
  const history = await prisma.chat.findMany({
    where: { 
      id:chatId,
     },
     include:{
      messages:true
     },
    orderBy: { createdAt: "asc" },
  });

  // console.log(history)

  res.json(new ApiResponse({
      statusCode: 200,
      data: history[0].messages,
      message: 'success'
  }));
});




