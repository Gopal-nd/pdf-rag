import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'Collection ID is required'
        }),
        { status: 400 }
      );
    }

    const chats = await prisma.chat.findMany({
      where: {
        collectionId: id,
        userId: session.user.id
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: chats,
        message: 'Chats retrieved successfully'
      })
    );
  } catch (error) {
    console.error('Get chats error:', error);
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
