import fileUploadQueue from "@/lib/queue";
import { ApiResponse } from "@/utils/api-response";
import asyncHandler from "@/utils/async-handler";
import type { Request, Response } from "express";
import fs from 'fs/promises'
import { prisma } from "@/lib/db";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getObject, s3client } from "@/lib/awss3";
import { file } from "bun";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";




export const newUpload = asyncHandler(async (req:Request, res:Response) => {
    const file = req.file
    const id = req.body.id
    console.log('collection is is ',id)
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
    if (await fs.exists(file.path)) {
        await fs.unlink(file.path);
      }
    
      const signedURL = await getObject(key)
      console.log('image url is ', signedURL)

   const respose = await fileUploadQueue.add('file-add',JSON.stringify({
        filename: req.file?.originalname,
        type: req.file?.mimetype,
        key:key,
        path: signedURL,
        user: req.user,
        collectionId:id
    }))
    const saveToDB = await prisma.documents.create({
        data: {
            originalName: file.originalname,
            fileType: file.mimetype,
            bucket: 'private.gopal',
            key:key,
            url: signedURL,
            collectionId:id
        }
    })
    // const respose = await putObject('gopal.jpeg','image/jpeg')
    console.log(respose)
    res.json(new ApiResponse({
        statusCode: 200,
        data: saveToDB.url,
        message: 'success'
    }));
});


export const getFiles = asyncHandler(async (req:Request, res:Response) => {
    const id = req.query.id
    // console.log('collection id is ',id)
    if(!id || typeof id !== 'string') {
        return res.status(400).json(new ApiResponse({
            statusCode: 400,
            data: null,
            message: 'id is required'
        }));
    }

    const files = await prisma.documents.findMany({
        where: {
            collectionId: id
        }
    })


    
    let signedFiles= await Promise.all( files.map(async(file) => {
        const command = new GetObjectCommand({
            Bucket: 'private.gopal',
            Key: file.key,
        });
        file.url =await getSignedUrl(s3client, command,{expiresIn:36000})
        return file
    })
)

    
    // console.log(signedFiles)
    res.json(new ApiResponse({
        statusCode: 200,
        data: signedFiles,
        message: 'success'
    }));
});