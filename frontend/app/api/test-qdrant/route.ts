import { NextRequest, NextResponse } from 'next/server';
import { listCollections, qdrantClient } from '@/lib/qdrant';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Testing Qdrant connectivity...');
    
    // Test basic connectivity
    const collections = await listCollections();
    
    return NextResponse.json({
      success: true,
      message: 'Qdrant connection successful',
      collections: collections,
      totalCollections: collections.length
    });
  } catch (error: any) {
    console.error('❌ Qdrant test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Qdrant connection failed',
      error: error?.message || error
    }, { status: 500 });
  }
}
