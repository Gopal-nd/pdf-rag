import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';
import { prisma } from '@/lib/db';
import { fileUploadQueue } from '@/lib/queue';
import Crawler from "simplecrawler";

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
    });

    return NextResponse.json(
      new ApiResponse({
        statusCode: 200,
        data: urls,
        message: 'Websites retrieved successfully',
      })
    );
  } catch (error) {
    console.error('Get websites error:', error);
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

export async function POST(req: NextRequest): Promise<Response> {
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
          message: 'Invalid or missing domain parameter',
          data: null,
        }),
        { status: 400 }
      );
    }

    console.log('Requested domain:', domain);
    
    const isExist = await prisma.urls.findUnique({
      where: {
        url_userId: {
          url: domain,
          userId: session.user.id
        }
      }
    });

    if (isExist) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          message: 'url already exists',
          data: null,
        }),
        { status: 400 }
      );
    }

    const crawledUrls = new Set<string>();
    const crawler = new Crawler(domain);

    crawler.maxDepth = 3;
    crawler.downloadUnsupported = false;
    crawler.userAgent = 'Mozilla/5.0 (compatible; MyCrawler/1.0)';
    crawler.maxConcurrency = 5;

    const blockedExtensions = [
      '.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.svg',
      '.ico', '.woff', '.woff2', '.ttf', '.eot', '.otf',
      '.pdf', '.zip', '.rar', '.exe', '.mp4', '.webm', '.avi',
    ];

    crawler.addFetchCondition((queueItem) => {
      const url = queueItem.url.split('?')[0];
      return !blockedExtensions.some((ext) => url.toLowerCase().endsWith(ext));
    });

    return await new Promise<Response>((resolve) => {
      crawler.on('fetchcomplete', (queueItem) => {
        console.log('Fetched:', queueItem.url);
        crawledUrls.add(queueItem.url);
      });

      crawler.on('complete', async () => {
        console.log('\n✅ Finished Crawling. Found URLs:', crawledUrls.size);
        
        try {
          const dbRes = await prisma.urls.create({
            data: {
              url: domain,
              allUrls: [...crawledUrls],
              userId: session.user.id,
            }
          });

          await fileUploadQueue.add('website-add', JSON.stringify({
            filename: domain,
            urls: [...crawledUrls],
            urlId: dbRes.id,
            user: session.user,
          }));

          resolve(NextResponse.json(
            new ApiResponse({
              statusCode: 200,
              data: [...crawledUrls],
              message: 'Crawling completed successfully',
            })
          ));
        } catch (error) {
          console.error('Error saving crawled data:', error);
          resolve(NextResponse.json(
            new ApiResponse({
              statusCode: 500,
              data: null,
              message: 'Error saving crawled data',
            }),
            { status: 500 }
          ));
        }
      });

      crawler.start();
    });
  } catch (error) {
    console.error('Upload website error:', error);
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
