import { auth } from "@/lib/auth";
import Crawler from "simplecrawler"
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/utils/api-response";
import asyncHandler from "@/utils/async-handler";
import {  type PlaywrightEvaluate, type PlaywrightGotoOptions } from "@langchain/community/document_loaders/web/playwright";
import {
    PlaywrightWebBaseLoader,
    type Page,
    type Browser,
  } from "@langchain/community/document_loaders/web/playwright";
import fileUploadQueue from "@/lib/queue";


export const getTheWebsiteDeatils = asyncHandler(async (req, res) => {


  const urls = await prisma.urls.findMany({
    where: {
      userId: req.user?.id
    },
  });

 res.status(200).json(new ApiResponse({
  statusCode: 200,
  data:urls,
  message: 'Crawling completed successfully',
 }))
});



export const uploadTheWebsiteDeatils = asyncHandler(async (req, res) => {
    const { domain } = req.body;
  
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json(
        new ApiResponse({
          statusCode: 400,
          message: 'Invalid or missing domain parameter',
          data: null,
        })
      );
    }
  
    console.log('Requested domain:', domain);
    const isExist = await prisma.urls.findUnique({
      where:{
       url_userId:{
        url:domain,
        userId:req.user?.id as string
       }
      }
    })
    console.log(isExist)
  if(isExist){
    return res.status(400).json(
      new ApiResponse({
        statusCode: 400,
        message: 'url already exist',
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
  
    crawler.on('fetchcomplete', (queueItem) => {
      console.log('Fetched:', queueItem.url);
      crawledUrls.add(queueItem.url);
    });
  
    crawler.on('complete', async() => {
      console.log('\n✅ Finished Crawling. Found URLs:', crawledUrls.size);
    const dbRes =  await prisma.urls.create({
          data:{
              url:domain as string,
              allUrls:[...crawledUrls],
              userId:req.user?.id as string,
          }
      })
      const respose = await fileUploadQueue.add('website-add',JSON.stringify({
        filename: domain,
        urls: [...crawledUrls],
        // urlId:dbRes.id,
        urlId:Date.now(),
        user: req.user,
    
    }))

      return res.json(
        new ApiResponse({
          statusCode: 200,
          data: [...crawledUrls],
          message: 'Crawling completed successfully',
        })
      );
    });
  
    crawler.start();
  });
