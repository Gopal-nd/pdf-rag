import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

export async function GET(req: NextRequest) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { apiKey: true }
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: { apiKey: user?.apiKey || null },
        message: 'API key retrieved successfully'
      })
    );
  } catch (error) {
    console.error('Get API key error:', error);
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

    const { key } = await req.json();

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'API key is required'
        }),
        { status: 400 }
      );
    }

    // Validate the provided key by attempting a tiny embedding
    try {
      const embeddings = new GoogleGenerativeAIEmbeddings({
        model: 'text-embedding-004',
        apiKey: key,
      });
      // Make a minimal call; if invalid, it should throw
      await embeddings.embedQuery('healthcheck');
    } catch (e) {
      console.error('Invalid API key provided:', e);
      return NextResponse.json(
        new ApiResponse({
          statusCode: 401,
          data: null,
          message: 'Invalid API key. Please provide a valid Google AI API key.',
        }),
        { status: 401 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { apiKey: key },
      select: { apiKey: true }
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: updatedUser,
        message: 'API key updated successfully'
      })
    );
  } catch (error) {
    console.error('Update API key error:', error);
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
