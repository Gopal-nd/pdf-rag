import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';
import { fileUploadQueue } from '@/lib/queue';

export async function POST(req: NextRequest) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    let fileUrl, fileName, fileType, collectionId, uploadThingKey;
    const contentType = req.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('document') as File;
      const id = formData.get('id') as string;

      if (!file || !id) {
        return NextResponse.json(
          new ApiResponse({
            statusCode: 400,
            data: null,
            message: 'File and collection ID are required'
          }),
          { status: 400 }
        );
      }

      fileName = file.name;
      fileType = file.type;
      collectionId = id;
      fileUrl = '';
      uploadThingKey = '';
    } else {
      const body = await req.json();
      fileUrl = body.fileUrl;
      fileName = body.fileName;
      fileType = body.fileType;
      collectionId = body.collectionId;
      uploadThingKey = body.uploadThingKey;

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
    }

    // Save document to database first
    const saveToDB = await prisma.documents.create({
      data: {
        originalName: fileName,
        fileType: fileType || 'application/pdf',
        uploadThingKey: uploadThingKey,
        url: fileUrl,
        collectionId: collectionId
      }
    });

    // Add to processing queue
    await fileUploadQueue.add('file-add', JSON.stringify({
      filename: fileName,
      type: fileType,
      url: fileUrl,
      user: session.user,
      collectionId: collectionId,
      documentId: saveToDB.id // Pass the document ID for tracking
    }));

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
        message: 'Internal server error'
      }),
      { status: 500 }
    );
  }
}
