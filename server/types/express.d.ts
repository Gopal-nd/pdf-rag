import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        apiKey?: string
      };
    }
  }
}

declare module 'express' {
    interface Request {
      user?: { 
        id: string;
        email?: string;
        apiKey?: string

       };
    }
  }