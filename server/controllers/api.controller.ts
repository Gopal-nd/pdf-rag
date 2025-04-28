import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/utils/api-response";
import asyncHandler from "@/utils/async-handler";

export const getApiKey = asyncHandler(async (req, res) => {
    
  
  const key = await prisma.user.findUnique({
    where: {
      id: req.user?.id
    },
        select:{
            apiKey:true,

        }
  });

  console.log('get key is ',key)

    res.json(new ApiResponse({
        statusCode: 200,
        data: key?.apiKey,
        message: 'collection updated success'
    }));
});


export const setApiKey = asyncHandler(async (req, res) => {
    console.log("u called")
    const {key} = req.body
    console.log(req.body)
    console.log('key is ',key)

  const ApiKey = await prisma.user.update({
    where: {
      id: req.user?.id
    },
    data:{
        apiKey:key
    }

  });

    res.json(new ApiResponse({
        statusCode: 200,
        data: ApiKey.apiKey,
        message: 'collection updated success'
    }));
});
