import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';
import { GoogleGenAI } from '@google/genai';
import { AdvancedDocumentProcessor } from '@/lib/advanced-document-processor';

// Advanced system prompt template for chat continuation with semantic understanding
const createContinuationPrompt = (context: any[], query: string, chatHistory: any[], collectionTitle?: string) => {
  const contextText = context.length > 0 
    ? context.map((doc, index) => {
        const metadata = doc.metadata || {};
        const contentType = metadata.contentType || 'content';
        const complexity = metadata.complexity || 'medium';
        const keyPhrases = metadata.keyPhrases || [];
        
        return `[Document ${index + 1} - ${contentType.toUpperCase()}]:
Content: ${doc.pageContent}
Type: ${contentType}
Complexity: ${complexity}
Key Topics: ${keyPhrases.join(', ')}
Relevance Score: ${(doc.enhancedScore || doc.score || 0).toFixed(3)}`;
      }).join('\n\n')
    : 'No relevant documents found.';

  const historyText = chatHistory.length > 0
    ? chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
    : 'No previous conversation history.';

  return `You are an expert AI assistant continuing a conversation about the user's documents. Use both the document context and conversation history to provide accurate, helpful responses.

IMPORTANT INSTRUCTIONS:
1. Base your answers on the provided document context and conversation history
2. Consider the content type (header, list, statistics, etc.) when formulating responses
3. Maintain consistency with previous responses in the conversation
4. If the context doesn't contain relevant information, clearly state this
5. Be concise but comprehensive in your responses
6. Use a professional yet conversational tone
7. Reference specific details from the documents when relevant
8. Maintain accuracy and avoid speculation
9. Consider the complexity level of the content when explaining concepts

DOCUMENT CONTEXT:
${contextText}

CONVERSATION HISTORY:
${historyText}

COLLECTION: ${collectionTitle || 'User Documents'}

CURRENT USER QUERY: ${query}

Please provide a helpful response that continues the conversation naturally, using both the document context and conversation history.`;
};

// Query intent analysis for better semantic matching
const analyzeQueryIntent = (query: string) => {
  const queryLower = query.toLowerCase();
  
  const intent = {
    type: 'general',
    requiresSpecifics: false,
    needsExamples: false,
    needsSteps: false,
    needsNumbers: false,
    needsSummary: false,
  };

  // Analyze query patterns
  if (queryLower.includes('how') || queryLower.includes('steps') || queryLower.includes('process')) {
    intent.type = 'procedural';
    intent.needsSteps = true;
  } else if (queryLower.includes('what') && (queryLower.includes('is') || queryLower.includes('are'))) {
    intent.type = 'definition';
    intent.requiresSpecifics = true;
  } else if (/\d+/.test(query) || queryLower.includes('percentage') || queryLower.includes('number')) {
    intent.type = 'statistical';
    intent.needsNumbers = true;
  } else if (queryLower.includes('list') || queryLower.includes('examples')) {
    intent.type = 'enumerative';
    intent.needsExamples = true;
  } else if (queryLower.includes('summary') || queryLower.includes('overview')) {
    intent.type = 'summarization';
    intent.needsSummary = true;
  }

  return intent;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
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
    const { chatId } = await params;

    if (!query || !id) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'query and id are required'
        }),
        { status: 400 }
      );
    }

    // Analyze query intent for better semantic matching
    const queryIntent = analyzeQueryIntent(query);
    console.log(`🔍 Query intent analysis:`, queryIntent);

    // Get collection info for better context
    const collection = await prisma.collection.findUnique({
      where: { id },
      select: { title: true, description: true }
    });

    const ai = new GoogleGenAI({ apiKey: session.user.apiKey });

    // Get past messages for context with optimized query
    const pastMessages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        content: true,
        createdAt: true,
      }
    });

    // Create chat session with history
    const chatSession = await ai.chats.create({
      model: "gemini-2.0-flash-exp", // Use experimental model for better performance
      history: pastMessages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    // Save user message
    await prisma.message.create({
      data: {
        chatId,
        messageId: `msg_${Date.now()}`,
        role: "user",
        content: query,
      },
    });

    // Initialize advanced document processor
    const processor = new AdvancedDocumentProcessor(session.user.apiKey);

    let contextResults: any[] = [];

    // Check if Qdrant URL is configured
    if (process.env.QDRANT_URL && process.env.QDRANT_APIKEY) {
      try {
        const collectionName = `user-${id}`;
        console.log(`🔍 Performing advanced semantic search: ${collectionName}`);

        // Prepare search filters based on query intent
        const searchFilters: any = {};
        if (queryIntent.needsSteps) {
          searchFilters.contentType = 'list';
        } else if (queryIntent.needsNumbers) {
          searchFilters.contentType = 'statistics';
        } else if (queryIntent.needsSummary) {
          searchFilters.contentType = 'summary';
        }

        // Perform advanced semantic search
        contextResults = await processor.semanticSearch(query, collectionName, {
          k: 6, // Get more results for better context
          filters: Object.keys(searchFilters).length > 0 ? searchFilters : undefined,
          similarityThreshold: 0.6, // Lower threshold for better recall
        });

        console.log(`✅ Retrieved ${contextResults.length} semantically relevant documents`);
        console.log(`📊 Average relevance score: ${(contextResults.reduce((sum, r) => sum + (r.enhancedScore || 0), 0) / contextResults.length).toFixed(3)}`);
      } catch (error: any) {
        console.log('Advanced semantic search failed, proceeding without vector search:', error?.message || error);
        contextResults = [];
      }
    } else {
      console.log('QDRANT_URL or QDRANT_APIKEY not configured, proceeding without semantic search');
    }

    // Create optimized system prompt for continuation
    const systemPrompt = createContinuationPrompt(
      contextResults, 
      query, 
      pastMessages,
      collection?.title
    );

    const stream = await chatSession.sendMessageStream({
      message: query,
      config: {
        systemInstruction: systemPrompt
      }
    });

    let modelResponse = "";
    for await (const chunk of stream) {
      modelResponse += chunk.text;
    }

    // Save AI response
    await prisma.message.create({
      data: {
        chatId,
        messageId: `msg_${Date.now()}`,
        role: "model",
        content: modelResponse,
      },
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: { 
          res: modelResponse, 
          docs: contextResults,
          contextCount: contextResults.length,
          collectionTitle: collection?.title,
          queryIntent: queryIntent,
          averageRelevanceScore: contextResults.length > 0 
            ? (contextResults.reduce((sum, r) => sum + (r.enhancedScore || 0), 0) / contextResults.length).toFixed(3)
            : 0,
        },
        message: 'success'
      })
    );
  } catch (error) {
    console.error('Advanced continue chat error:', error);
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
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
          statusCode: 401,
          data: { redirectTo: '/dashboard/account', message: 'Please add your Google AI API key to your profile to start chatting.' },
          message: 'API key not found. Please add your Google AI API key to your profile.'
        }),
        { status: 401 }
      );
    }

    const { query, id } = await req.json();
    const { chatId } = await params;

    if (!query || !id) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'query and id are required'
        }),
        { status: 400 }
      );
    }

    // Analyze query intent for better semantic matching
    const queryIntent = analyzeQueryIntent(query);
    console.log(`🔍 Query intent analysis:`, queryIntent);

    // Get collection info for better context
    const collection = await prisma.collection.findUnique({
      where: { id },
      select: { title: true, description: true }
    });

    const ai = new GoogleGenAI({ apiKey: session.user.apiKey });

    const pastMessages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        content: true,
        createdAt: true,
      }
    });

    const chatSession = await ai.chats.create({
      model: "gemini-2.0-flash-exp", // Use experimental model for better performance
      history: pastMessages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    await prisma.message.create({
      data: {
        chatId,
        messageId: `msg_${Date.now()}`,
        role: "user",
        content: query,
      },
    });

    // Initialize advanced document processor
    const processor = new AdvancedDocumentProcessor(session.user.apiKey);

    let contextResults: any[] = [];

    // Check if Qdrant URL is configured
    if (process.env.QDRANT_URL && process.env.QDRANT_APIKEY) {
      try {
        const collectionName = `user-${id}`;
        console.log(`🔍 Performing advanced semantic search: ${collectionName}`);

        // Prepare search filters based on query intent
        const searchFilters: any = {};
        if (queryIntent.needsSteps) {
          searchFilters.contentType = 'list';
        } else if (queryIntent.needsNumbers) {
          searchFilters.contentType = 'statistics';
        } else if (queryIntent.needsSummary) {
          searchFilters.contentType = 'summary';
        }

        // Perform advanced semantic search
        contextResults = await processor.semanticSearch(query, collectionName, {
          k: 6, // Get more results for better context
          filters: Object.keys(searchFilters).length > 0 ? searchFilters : undefined,
          similarityThreshold: 0.6, // Lower threshold for better recall
        });

        console.log(`✅ Retrieved ${contextResults.length} semantically relevant documents`);
        console.log(`📊 Average relevance score: ${(contextResults.reduce((sum, r) => sum + (r.enhancedScore || 0), 0) / contextResults.length).toFixed(3)}`);
      } catch (error: any) {
        console.log('Advanced semantic search failed, proceeding without vector search:', error?.message || error);
        contextResults = [];
      }
    } else {
      console.log('QDRANT_URL or QDRANT_APIKEY not configured, proceeding without semantic search');
    }

    // Create optimized system prompt for continuation
    const systemPrompt = createContinuationPrompt(
      contextResults, 
      query, 
      pastMessages,
      collection?.title
    );

    const stream = await chatSession.sendMessageStream({
      message: query,
      config: {
        systemInstruction: systemPrompt
      }
    });

    let modelResponse = "";
    for await (const chunk of stream) {
      modelResponse += chunk.text;
    }

    await prisma.message.create({
      data: {
        chatId,
        messageId: `msg_${Date.now()}`,
        role: "model",
        content: modelResponse,
      },
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: { 
          res: modelResponse, 
          docs: contextResults,
          contextCount: contextResults.length,
          collectionTitle: collection?.title,
          queryIntent: queryIntent,
          averageRelevanceScore: contextResults.length > 0 
            ? (contextResults.reduce((sum, r) => sum + (r.enhancedScore || 0), 0) / contextResults.length).toFixed(3)
            : 0,
        },
        message: 'success'
      })
    );
  } catch (error) {
    console.error('Advanced continue chat error:', error);
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
