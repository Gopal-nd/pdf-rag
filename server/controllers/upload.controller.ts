import fileUploadQueue from "@/lib/queue";
import { ApiResponse } from "@/utils/api-response";
import asyncHandler from "@/utils/async-handler";
import type { Request, Response } from "express";
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import fs from 'fs/promises'
import {GetObjectCommand, S3Client,PutObjectCommand,ListObjectsV2Command, DeleteObjectCommand,} from '@aws-sdk/client-s3'
import { prisma } from "@/lib/db";

const s3client = new S3Client({
    region: 'ap-south-1',
    credentials: {
     accessKeyId:process.env.AWS_ACCESS_KEY!,
     secretAccessKey:process.env.AWS_SECRET_KEY!
    },
})

async function getObject(key: string) {
    const command = new GetObjectCommand({
        Bucket: 'private.gopal',
        Key: key,
    });
    const url = await getSignedUrl(s3client, command);
    return url
}


async function putObject(key: string,contetType:string) {
    const command = new PutObjectCommand({
        Bucket: 'private.gopal',
        Key: key,
        ContentType:contetType
    });
    const url = await getSignedUrl(s3client, command);
    return url
}

export const newUpload = asyncHandler(async (req:Request, res:Response) => {
    const file = req.file
    console.log(req.file)
    if(!file) {
        return res.status(400).json(new ApiResponse({
            statusCode: 400,
            data: null,
            message: 'file is required'
        }));
    }


      const fileStream =await fs.readFile(file.path);
      console.log(fileStream)
      const key = `uploads/user-${req.user?.id}/${Date.now()}-${file.originalname}`
      const command = new PutObjectCommand({
        Bucket: 'private.gopal',
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype,
      });
    
      await s3client.send(command);
    console.log('deleteing')

    if (await fs.exists(file.path)) {
        await fs.unlink(file.path);
      }
    
      const signedURL = await getObject(key)
      console.log('image url is ', signedURL)
   const respose = await fileUploadQueue.add('file-ready',JSON.stringify({
        filename: req.file?.originalname,
        type: req.file?.mimetype,
        key:key,
        path: signedURL
    }))
    // const respose = await putObject('gopal.jpeg','image/jpeg')
    // console.log(respose)
    res.json(new ApiResponse({
        statusCode: 200,
        data: signedURL,
        message: 'success'
    }));
});


export const getFiles = asyncHandler(async (req:Request, res:Response) => {
    const id = req.query?.id
    if(!id || typeof id !== 'string') {
        return res.status(400).json(new ApiResponse({
            statusCode: 400,
            data: null,
            message: 'id is required'
        }));
    }

    const files = await prisma.file.findMany({
        where: {
            userId: id
        }
    })
    res.json(new ApiResponse({
        statusCode: 200,
        data: files,
        message: 'success'
    }));
});