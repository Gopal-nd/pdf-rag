
import { auth } from "@/lib/auth";
import Crawler from "simplecrawler"
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/utils/api-response";
import asyncHandler from "@/utils/async-handler";


export const getAllWeblinks = asyncHandler(async (req, res) => {
    const { domain } = req.query;
  
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json(
        new ApiResponse({
          statusCode: 400,
          message: 'Invalid or missing domain parameter',
          data: null,
        })
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
  
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
  
    crawler.on('fetchcomplete', (queueItem) => {
      const url = queueItem.url;
      crawledUrls.add(url);
      res.write(`data: ${JSON.stringify(url)}\n\n`);
    });
  
    crawler.on('complete', () => {
      res.write(`event: done\ndata: ${JSON.stringify([...crawledUrls])}\n\n`);
      res.end();
    });
  
    crawler.start();
  });
  