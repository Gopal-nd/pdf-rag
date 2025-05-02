import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { APIError } from '@/utils/api-error';
import { ApiResponse } from '@/utils/api-response';
import { fromNodeHeaders } from 'better-auth/node';
import { type Request, type Response, type NextFunction } from 'express';


export const checkAuth = async(req: any, res: Response, next: NextFunction): Promise<void> => {
  const session = await auth.api.getSession({
     headers: fromNodeHeaders(req.headers),
   });
   const apikey = await prisma.user.findUnique({
    where:{
      id: session?.user.id
    },
    select:{
      apiKey:true
    }
  })
   console.log('session',session?.user.id)
   if(!session?.user.id) {
    console.log('no session ,unauthorized check auth')
   res.status(403).json(new ApiResponse({
    statusCode: 403,
    message: 'Unauthorized',
    data: null
   }));
   return;
   }
   if(!session?.user.id) {
    console.log('Enter a valid api key ')
   res.status(403).json(new ApiResponse({
    statusCode: 403,
    message: 'API KEY IS INVALID',
    data: null
   }));
   return;

   }
   req.user ={ ...session.user,apikey:apikey?.apiKey}
   next();

};