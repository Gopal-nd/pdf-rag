import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params:Promise<{ chatId: string }> }
) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    const { chatId } =await params;

    const history = await prisma.webChat.findMany({
      where: {
        id: chatId,
        userId: session.user.id
      },
      include: {
        webMessages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: history,
        message: 'Web chat history retrieved successfully'
      })
    );
  } catch (error) {
    console.error('Get web chat history error:', error);
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
