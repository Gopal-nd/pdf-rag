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

    const urls = await prisma.urls.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: urls,
        message: 'Web URLs retrieved successfully'
      })
    );
  } catch (error) {
    console.error('Get web URLs error:', error);
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

    const { domain } = await req.json();

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'domain is required'
        }),
        { status: 400 }
      );
    }

    // Create URL record
    const urlRecord = await prisma.urls.create({
      data: {
        url: domain,
        userId: session.user.id
      }
    });

    // Add job to queue for processing
    await fileUploadQueue.add('website-add', JSON.stringify({
      domain: domain,
      user: session.user,
      urlId: urlRecord.id
    }));

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: urlRecord,
        message: 'Web loader job queued successfully'
      })
    );
  } catch (error) {
    console.error('Web loader error:', error);
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
