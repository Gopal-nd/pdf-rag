import fileUploadQueue from "@/lib/queue";
import { ApiResponse } from "@/utils/api-response";
import asyncHandler from "@/utils/async-handler";
import type { Request, Response } from "express";

export const newUpload = asyncHandler(async (req:Request, res:Response) => {
    console.log(req.file)
   const respose = await fileUploadQueue.add('file-ready',JSON.stringify({
        filename: req.file?.originalname,
        destination: req.file?.destination,
        path: req.file?.path
    }))
    // console.log(respose)
    res.json(new ApiResponse({
        statusCode: 200,
        data: req.file?.path,
        message: 'success'
    }));
});