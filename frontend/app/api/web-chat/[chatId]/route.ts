import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { GoogleGenAI } from '@google/genai';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    // API key required
    if (!session.user.apiKey) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 401,
          data: { redirectTo: '/dashboard/account', message: 'Please add your Google AI API key to your profile to start chatting.' },
          message: 'API key not found.'
        }),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const id = searchParams.get('id');
    const { chatId } = await params;

    if (!query || !id) {
      return NextResponse.json(
        new ApiResponse({ statusCode: 400, data: null, message: 'query and id are required' }),
        { status: 400 }
      );
    }

    // Ensure the chat belongs to the user
    const chat = await prisma.webChat.findUnique({
      where: { id: chatId },
      select: { id: true, userId: true }
    });
    if (!chat || chat.userId !== session.user.id) {
      return NextResponse.json(
        new ApiResponse({ statusCode: 404, data: null, message: 'Chat not found' }),
        { status: 404 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: session.user.apiKey });

    // Load history
    const history = await prisma.webMessage.findMany({
      where: { webChatId: chatId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true }
    });

    // Create chat session with history
    const chatSession = await ai.chats.create({
      model: 'gemini-2.0-flash',
      history: history.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
    });

    // Save user message
    await prisma.webMessage.create({ data: { webChatId: chatId, role: 'user', content: query } });

    // Vector search (graceful fallback)
    let result: any[] = [];
    try {
      if (process.env.QDRANT_URL && process.env.QDRANT_APIKEY) {
        const embeddings = new GoogleGenerativeAIEmbeddings({ model: 'text-embedding-004', apiKey: session.user.apiKey });
        const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
          url: process.env.QDRANT_URL,
          apiKey: process.env.QDRANT_APIKEY,
          collectionName: `user-${id}`,
        });
        const retriever = vectorStore.asRetriever({ k: 2 });
        result = await retriever.invoke(query);
      }
    } catch (error) {
      console.log('Qdrant collection not found or access denied, proceeding without vector search:', error);
      result = [];
    }

    const system_prompt = `you are helpful ai assistant who answers the user query based on the available context from website content and the chat history of the user that you have based on the conversation\nContext:\n${JSON.stringify(result)}`;

    const stream = await chatSession.sendMessageStream({
      message: query,
      config: { systemInstruction: system_prompt }
    });

    let modelResponse = '';
    for await (const chunk of stream) { modelResponse += chunk.text; }

    await prisma.webMessage.create({
      data: { webChatId: chatId, role: 'model', content: modelResponse }
    });

    return NextResponse.json(
      new ApiResponse({ statusCode: 200, data: { res: modelResponse, docs: result }, message: 'success' })
    );
  } catch (error) {
    console.error('Continue web chat error:', error);
    return NextResponse.json(
      new ApiResponse({ statusCode: 500, data: null, message: 'Internal server error' }),
      { status: 500 }
    );
  }
}
