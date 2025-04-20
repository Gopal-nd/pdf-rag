import { auth } from '@/lib/auth';
import { APIError } from '@/utils/api-error';
import { ApiResponse } from '@/utils/api-response';
import { fromNodeHeaders } from 'better-auth/node';
import { type Request, type Response, type NextFunction } from 'express';


export const checkAuth = async(req: any, res: Response, next: NextFunction): Promise<void> => {
  const session = await auth.api.getSession({
     headers: fromNodeHeaders(req.headers),
   });
   if(!session) {
    console.log('no session ,unauthorized check auth')
   res.status(403).json(new ApiResponse({
    statusCode: 403,
    message: 'Unauthorized',
    data: null
   }));
   return;
   }
   req.user = session.user;
   next();

};