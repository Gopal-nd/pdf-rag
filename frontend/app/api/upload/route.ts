import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';
import { fileUploadQueue } from '@/lib/queue';

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

    const files = await prisma.documents.findMany({
      where: {
        collectionId: id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: files,
        message: 'Files retrieved successfully'
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

export async function POST(req: NextRequest) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    const { fileUrl, fileName, fileType, collectionId, uploadThingKey } = await req.json();

    if (!fileUrl || !fileName || !collectionId) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'fileUrl, fileName, and collectionId are required'
        }),
        { status: 400 }
      );
    }

    // Add job to queue for processing
    await fileUploadQueue.add('file-add', JSON.stringify({
      filename: fileName,
      type: fileType,
      url: fileUrl,
      user: session.user,
      collectionId: collectionId
    }));

    // Save to database
    const saveToDB = await prisma.documents.create({
      data: {
        originalName: fileName,
        fileType: fileType || 'application/pdf',
        uploadThingKey: uploadThingKey,
        url: fileUrl,
        collectionId: collectionId
      }
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: saveToDB,
        message: 'File uploaded successfully'
      })
    );
  } catch (error) {
    console.error('Upload error:', error);
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
