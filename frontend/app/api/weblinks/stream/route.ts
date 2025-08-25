import { NextRequest, NextResponse } from 'next/server';
import Crawler from "simplecrawler";
import { authMiddleware } from '@/lib/auth-middleware';
import { ApiResponse } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await authMiddleware(req);
    if (session instanceof NextResponse) {
      return session;
    }

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        new ApiResponse({
          statusCode: 400,
          data: null,
          message: 'Invalid or missing domain parameter',
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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        crawler.on('fetchcomplete', (queueItem) => {
          const url = queueItem.url;
          crawledUrls.add(url);
          const data = `data: ${JSON.stringify(url)}\n\n`;
          controller.enqueue(encoder.encode(data));
        });

        crawler.on('complete', () => {
          const data = `event: done\ndata: ${JSON.stringify([...crawledUrls])}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        });

        crawler.start();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Weblinks stream error:', error);
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
