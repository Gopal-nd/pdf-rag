import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextRequest, NextResponse } from 'next/server';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export class ApiResponse {
  statusCode: number;
  data: any;
  message: string;
  success: boolean;

  constructor({ statusCode, data, message = "Success" }: { statusCode: number; data: any; message?: string }) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export const asyncHandler = (fn: (req: NextRequest) => Promise<NextResponse>) => {
  return async (req: NextRequest) => {
    try {
      return await fn(req);
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        new ApiResponse({
          statusCode: 500,
          data: null,
          message: 'Internal server error'
        }),
        { status: 500 }
      );
    }
  };
};
