import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    const { chatId } = await params;

    if (!chatId) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'Chat ID is required'
        }),
        { status: 400 }
      );
    }

    // Get chat with messages
    const chat = await prisma.chat.findUnique({
      where: { 
        id: chatId,
        userId: session.user.id // Ensure user owns this chat
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            messageId: true,
            role: true,
            content: true,
            createdAt: true,
          }
        },
        collection: {
          select: {
            id: true,
            title: true,
            description: true,
          }
        }
      }
    });

    if (!chat) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 404,
          data: null,
          message: 'Chat not found'
        }),
        { status: 404 }
      );
    }

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: {
          chatId: chat.id,
          collection: chat.collection,
          messages: chat.messages,
          createdAt: chat.createdAt
        },
        message: 'Chat history retrieved successfully'
      })
    );
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      new ApiResponse({
        statusCode: 500,
        data: null,
        message: 'Internal server error'
      }),
      { status: 500 }
    );
  }
}
