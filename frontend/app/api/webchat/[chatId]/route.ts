import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenAI } from "@google/genai";

export async function POST(
  req: NextRequest,
  { params }: { params:Promise<{ chatId: string }> }
) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    // Check if user has API key
    if (!session.user.apiKey) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'API key not found. Please add your Google AI API key to your profile.'
        }),
        { status: 400 }
      );
    }

    const { query, id } = await req.json();
    const { chatId } = await params;

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

    const pastMessages = await prisma.webMessage.findMany({
      where: { webChatId: chatId },
      orderBy: { createdAt: "asc" },
    });

    const chatSession = await ai.chats.create({
      model: "gemini-2.0-flash",
      history: pastMessages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    await prisma.webMessage.create({
      data: {
        webChatId: chatId,
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
    const system_prompt = `you are helpful ai assistant who answers the user query based on the available context from website content and the chat history of the user that you have based on the conversation
    Context:
    ${JSON.stringify(result)}`;

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

    await prisma.webMessage.create({
      data: {
        webChatId: chatId,
        role: "model",
        content: modelResponse,
      },
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: { res: modelResponse, docs: result },
        message: 'success'
      })
    );
  } catch (error) {
    console.error('Continue webchat error:', error);
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

export async function GET(
  req: NextRequest,
  { params }: { params:Promise<{ chatId: string }> }
) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    const { chatId } = await params;

    const history = await prisma.webChat.findMany({
      where: {
        id: chatId,
      },
      include: {
        webMessages: true
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: history,
        message: 'success'
      })
    );
  } catch (error) {
    console.error('Get webchat history error:', error);
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
