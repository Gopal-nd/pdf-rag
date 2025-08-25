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
          message: 'id is required'
        }),
        { status: 400 }
      );
    }

    const files = await prisma.documents.findMany({
      where: {
        collectionId: id
      }
    });

    // With UploadThing, URLs are already accessible, no need for signed URLs
    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: files,
        message: 'success'
      })
    );
  } catch (error) {
    console.error('Get files error:', error);
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
