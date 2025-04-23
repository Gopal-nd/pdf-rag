import { ApiResponse } from "@/utils/api-response";
import asyncHandler from "@/utils/async-handler";
import { prisma } from "@/lib/db";
import { APIError } from "@/utils/api-error";
import { deleteObject } from "@/lib/awss3";
import fileUploadQueue from "@/lib/queue";
import axios from "axios";


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


export const deleteCollection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if(!id) {
        throw new APIError({message: 'id is required',status: 400});
    }
    const collection = await prisma.collection.findUnique({
        where: { id },
        include: { documents: true },
      });
      
      if (!collection) {
        return res.status(404).json(new ApiResponse({
          statusCode: 404,
          data: null,
          message: "Collection not found"
        }));
      }
      

      try {
        await axios.delete(`http://localhost:6333/collections/user-${id}`);
        console.log("✅ Qdrant collection deleted");
      } catch (err) {
        console.error("❌ Failed to delete Qdrant collection", err);
      }
      
      for (const doc of collection.documents) {
        await deleteObject(doc.key); // delete from S3
        await prisma.documents.delete({ where: { id: doc.id } });
      }
   
      await prisma.collection.delete({ where: { id } });
      
      return res.json(new ApiResponse({
        statusCode: 200,
        data: null,
        message: 'Collection deleted successfully'
      }));

});      