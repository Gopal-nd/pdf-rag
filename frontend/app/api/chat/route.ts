import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenAI } from "@google/genai";

export async function GET(req: NextRequest) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    // Check if user has API key
    if (!session.user.apiKey) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 401,
          data: { redirectTo: '/dashboard/account', message: 'Please add your Google AI API key to your profile to start chatting.' },
          message: 'API key not found. Please add your Google AI API key to your profile.'
        }),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const id = searchParams.get('id');

    if (!query) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'query is required'
        }),
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: session.user.apiKey });

    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: session.user.apiKey
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: process.env.QDRANT_URL!,
      collectionName: `user-${id}`,
    });

    const response = vectorStore.asRetriever({
      k: 2,
    });

    const result = await response.invoke(query);
    const system_prompt = `you are helpful ai assistant who answers the user query based on the available context from pdf file 
    Context:
    ${JSON.stringify(result)}`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: query,
      config: {
        systemInstruction: system_prompt
      }
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: { res: aiResponse.text, docs: result },
        message: 'success'
      })
    );
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      new ApiResponse({
        statusCode: 500,
        data: null,
        message: 'Internal server error',
      }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    // Check if user has API key
    if (!session.user.apiKey) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 401,
          data: { redirectTo: '/dashboard/account', message: 'Please add your Google AI API key to your profile to start chatting.' },
          message: 'API key not found. Please add your Google AI API key to your profile.'
        }),
        { status: 401 }
      );
    }

    const { query, id } = await req.json();

    if (!query) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'query is required'
        }),
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: session.user.apiKey });

    const chat = await prisma.chat.create({
      data: {
        collectionId: id,
        userId: session.user.id
      }
    });

    await prisma.message.create({
      data: {
        chatId: chat.id,
        messageId: `msg_${Date.now()}`,
        role: "user",
        content: query,
      },
    });

    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: session.user.apiKey
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: process.env.QDRANT_URL!,
      collectionName: `user-${id}`,
    });

    const response = vectorStore.asRetriever({
      k: 2,
    });

    const result = await response.invoke(query);
    const system_prompt = `you are helpful ai assistant who answers the user query based on the available context from pdf file and the chat history of the user that you have based on the conversation
    Context:
    ${JSON.stringify(result)}`;

    const chatSession = await ai.chats.create({
      model: "gemini-2.0-flash",
    });

    const stream = await chatSession.sendMessageStream({
      message: query,
      config: {
        systemInstruction: system_prompt
      }
    });

    let modelResponse = "";
    for await (const chunk of stream) {
      modelResponse += chunk.text;
    }

    await prisma.message.create({
      data: {
        chatId: chat.id,
        messageId: `msg_${Date.now()}`,
        role: "model",
        content: modelResponse,
      },
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: { res: modelResponse, docs: result, chatId: chat.id },
        message: 'success'
      })
    );
  } catch (error) {
    console.error('New AI chat error:', error);
    return NextResponse.json(
      new ApiResponse({
        statusCode: 500,
        data: null,
        message: 'Internal server error',
      }),
      { status: 500 }
    );
  }
}
