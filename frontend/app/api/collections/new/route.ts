import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    const { title, description } = await req.json();
    
    if (!title || !description || typeof title !== 'string' || typeof description !== 'string') {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'title and description are required'
        }),
        { status: 400 }
      );
    }

    const collection = await prisma.collection.create({
      data: {
        title: title,
        description: description,
        userId: session.user.id
      },
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: collection,
        message: 'collection created success'
      })
    );
  } catch (error) {
    console.error('Create collection error:', error);
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
