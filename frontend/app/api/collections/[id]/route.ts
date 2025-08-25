import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';
import axios from 'axios';

export async function PUT(
  req: NextRequest,
  { params }: { params:Promise<{ id: string }> }
) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    const { title, description } = await req.json();
    const { id } = await params;
    
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

    const updated = await prisma.collection.update({
      where: { id },
      data: { description },
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: updated,
        message: 'collection updated success'
      })
    );
  } catch (error) {
    console.error('Update collection error:', error);
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

export async function DELETE(
  req: NextRequest,
  { params }: { params:Promise<{ id: string }> }
) {
  try {
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    const { id } = await params;
    
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

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: { documents: true },
    });
    
    if (!collection) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 404,
          data: null,
          message: "Collection not found"
        }),
        { status: 404 }
      );
    }

    // Delete Qdrant collection
    try {
      await axios.delete(`${process.env.QDRANT_URL}/collections/user-${id}`);
      console.log("✅ Qdrant collection deleted");
    } catch (err) {
      console.error("❌ Failed to delete Qdrant collection", err);
    }
    
    // Delete documents from database (UploadThing handles file deletion)
    for (const doc of collection.documents) {
      await prisma.documents.delete({ where: { id: doc.id } });
    }
 
    await prisma.collection.delete({ where: { id } });
    
    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: null,
        message: 'Collection deleted successfully'
      })
    );
  } catch (error) {
    console.error('Delete collection error:', error);
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
