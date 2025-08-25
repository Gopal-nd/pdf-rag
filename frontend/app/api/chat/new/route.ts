import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';
import { GoogleGenAI } from '@google/genai';
import { AdvancedDocumentProcessor } from '@/lib/advanced-document-processor';

// Advanced system prompt template with semantic understanding
const createSystemPrompt = (context: any[], query: string, collectionTitle?: string) => {
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

  return `You are an expert AI assistant with deep semantic understanding of the user's documents. Your role is to provide accurate, helpful, and contextually relevant answers based on the provided document content.

IMPORTANT INSTRUCTIONS:
1. Base your answers primarily on the provided document context
2. Consider the content type (header, list, statistics, etc.) when formulating responses
3. If the context doesn't contain relevant information, clearly state this
4. Be concise but comprehensive in your responses
5. Use a professional yet conversational tone
6. Reference specific details from the documents when relevant
7. Maintain accuracy and avoid speculation
8. Consider the complexity level of the content when explaining concepts

DOCUMENT CONTEXT:
${contextText}

COLLECTION: ${collectionTitle || 'User Documents'}

USER QUERY: ${query}

Please provide a helpful response based on the above context. If the context doesn't contain relevant information for the query, politely inform the user and suggest what information might be helpful.`;
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

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    // Ensure API key is set
    if (!session.user.apiKey) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 401,
          data: {
            redirectTo: '/dashboard/account',
            message: 'Please add your Google AI API key to your profile to start chatting.',
          },
          message: 'API key not found. Please add your Google AI API key to your profile.',
        }),
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const id = searchParams.get('id');

    if (!query || !id) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'query and id are required',
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

    // Create new chat entry
    const chat = await prisma.chat.create({
      data: {
        collectionId: id,
        userId: session.user.id,
      },
    });

    // Save user query as a message
    await prisma.message.create({
      data: {
        chatId: chat.id,
        messageId: `msg_${Date.now()}`,
        role: 'user',
        content: query,
      },
    });

    // Initialize advanced document processor
    const processor = new AdvancedDocumentProcessor(session.user.apiKey);

    let contextResults: any[] = [];

    // ---------------- ADVANCED SEMANTIC SEARCH ----------------
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
        console.error(
          '⚠️ Advanced semantic search failed:',
          error?.response?.data || error?.message || error
        );
        contextResults = [];
      }
    } else {
      console.warn('⚠️ QDRANT_URL or QDRANT_APIKEY not configured. Skipping semantic search.');
    }
    // -----------------------------------------------------

    // Create optimized system prompt with semantic understanding
    const systemPrompt = createSystemPrompt(
      contextResults, 
      query, 
      collection?.title
    );

    // Start chat session with optimized model
    const chatSession = await ai.chats.create({
      model: 'gemini-2.0-flash-exp', // Use experimental model for better performance
    });

    // Stream response from AI with optimized settings
    const stream = await chatSession.sendMessageStream({
      message: query,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    let modelResponse = '';
    for await (const chunk of stream) {
      modelResponse += chunk.text;
    }

    // Save AI response to DB
    await prisma.message.create({
      data: {
        chatId: chat.id,
        messageId: `msg_${Date.now()}`,
        role: 'model',
        content: modelResponse,
      },
    });

    // Return optimized response with enhanced metadata
    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: { 
          res: modelResponse, 
          docs: contextResults,
          chatId: chat.id,
          contextCount: contextResults.length,
          collectionTitle: collection?.title,
          queryIntent: queryIntent,
          averageRelevanceScore: contextResults.length > 0 
            ? (contextResults.reduce((sum, r) => sum + (r.enhancedScore || 0), 0) / contextResults.length).toFixed(3)
            : 0,
        },
        message: 'success',
      })
    );
  } catch (error) {
    console.error('❌ Advanced new chat error:', error);
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
