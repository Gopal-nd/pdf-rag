import { ApiResponse } from "@/utils/api-response";
import asyncHandler from "@/utils/async-handler";
import { prisma } from "@/lib/db";
import { APIError } from "@/utils/api-error";


export const createCollection = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if(!title || !description || typeof title !== 'string' || typeof description !== 'string') {
        throw new APIError({message: 'title and description are required',status: 400});
    }
    if(!req.user?.id) {
        throw new APIError({message: 'user not found',status: 400});
    }
    const collection = await prisma.collection.create({
      data: { title : title,
         description:description,
         userId: req.user?.id
         },
    });


    res.json(new ApiResponse({
        statusCode: 200,
        data: null,
        message: 'collection created success'
    }));
});



export const updateCollection = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const { id } = req.params;
    if(!title || !description || typeof title !== 'string' || typeof description !== 'string') {
        throw new APIError({message: 'title and description are required',status: 400});
    }
    if(!req.user?.id) {
        throw new APIError({message: 'user not found',status: 400});
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: { description },
    });

    res.json(new ApiResponse({
        statusCode: 200,
        data: updated,
        message: 'collection updated success'
    }));
});

export const getCollection = asyncHandler(async (req, res) => {
    
    const q = typeof req.query.q === 'string' ? req.query.q : ''
  const collections = await prisma.collection.findMany({
    where: {
      title: { contains: q, mode: 'insensitive' }
    },
    orderBy: { createdAt: 'desc' },
  });

    res.json(new ApiResponse({
        statusCode: 200,
        data: collections,
        message: 'collection updated success'
    }));
});