import { QdrantClient } from '@qdrant/js-client-rest';

// Initialize Qdrant client with optimized settings
export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || 'https://89e4f4ae-5e00-4ecc-9273-30ed96e43085.europe-west3-0.gcp.cloud.qdrant.io:6333',
  apiKey: process.env.QDRANT_APIKEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.Esb2tye4aeJuAB_toEE2Z1sGtqu8uUVCWAzBSHt5oOM',
  timeout: 30000, // 30 second timeout
});

// Optimized collection configuration
const COLLECTION_CONFIG = {
  vectors: {
    size: 768, // Google's text-embedding-004 model dimension
    distance: 'Cosine', // Better for semantic similarity
    on_disk: true, // Store vectors on disk for better performance
  },
  optimizers_config: {
    memmap_threshold: 20000, // Use memory mapping for large collections
    indexing_threshold: 20000, // Index after 20k points
    payload_indexing: {
      text: {
        tokenizer: 'word', // Word-based tokenization
        min_token_len: 2,
        max_token_len: 15,
        lowercase: true,
      },
    },
  },
  replication_factor: 1, // Single replica for cloud setup
  write_consistency_factor: 1,
};

// Check if collection exists with caching
const collectionCache = new Map<string, boolean>();
export async function collectionExists(collectionName: string): Promise<boolean> {
  if (collectionCache.has(collectionName)) {
    return collectionCache.get(collectionName)!;
  }

  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(col => col.name === collectionName);
    collectionCache.set(collectionName, exists);
    return exists;
  } catch (error) {
    console.error('Error checking collection existence:', error);
    return false;
  }
}

// Create collection with optimized settings
export async function ensureCollection(collectionName: string): Promise<boolean> {
  try {
    const exists = await collectionExists(collectionName);
    if (!exists) {
      console.log(`Creating optimized Qdrant collection: ${collectionName}`);
      await qdrantClient.createCollection(collectionName, COLLECTION_CONFIG as any);
      console.log(`✅ Created optimized Qdrant collection: ${collectionName}`);
      
      // Create payload indexes for better search performance
      await qdrantClient.createPayloadIndex(collectionName, {
        field_name: 'metadata.source',
        field_schema: 'keyword',
      });
      
      await qdrantClient.createPayloadIndex(collectionName, {
        field_name: 'metadata.page',
        field_schema: 'integer',
      });
      
      collectionCache.set(collectionName, true);
    } else {
      console.log(`✅ Qdrant collection already exists: ${collectionName}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Error creating/checking collection ${collectionName}:`, error);
    return false;
  }
}

// Get collection info with performance metrics
export async function getCollectionInfo(collectionName: string) {
  try {
    const info = await qdrantClient.getCollection(collectionName);
    const stats = await qdrantClient.getCollection(collectionName);
    return {
      ...info,
      stats,
      performance: {
        vectorCount: stats.points_count,
        segmentsCount: stats.segments_count,
        status: stats.status,
      }
    };
  } catch (error) {
    console.error(`Error getting collection info for ${collectionName}:`, error);
    return null;
  }
}

// List all collections with performance data
export async function listCollections() {
  try {
    const result = await qdrantClient.getCollections();
    const collectionsWithStats = await Promise.all(
      result.collections.map(async (col) => {
        try {
          const stats = await qdrantClient.getCollection(col.name);
          return {
            ...col,
            points_count: stats.points_count,
            segments_count: stats.segments_count,
            status: stats.status,
          };
        } catch (error) {
          return col;
        }
      })
    );
    
    console.log('Available Qdrant collections:', collectionsWithStats.map(col => ({
      name: col.name,
    })));
    
    return collectionsWithStats;
  } catch (error) {
    console.error('Could not get collections:', error);
    return [];
  }
}

// Optimized search function with filters
export async function searchCollection(
  collectionName: string,
  vector: number[],
  limit: number = 5,
  scoreThreshold: number = 0.7,
  filters?: any
) {
  try {
    const searchParams = {
      vector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: true,
      with_vectors: false, // Don't return vectors to save bandwidth
      ...(filters && { filter: filters }),
    };

    const results = await qdrantClient.search(collectionName, searchParams);
    return results;
  } catch (error) {
    console.error(`Error searching collection ${collectionName}:`, error);
    return [];
  }
}

// Batch operations for better performance
export async function batchUpsert(collectionName: string, points: any[]) {
  try {
    const batchSize = 100; // Optimal batch size for Qdrant
    const batches = [];
    
    for (let i = 0; i < points.length; i += batchSize) {
      batches.push(points.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      await qdrantClient.upsert(collectionName, {
        points: batch,
        wait: true, // Wait for operation to complete
      });
    }
    
    console.log(`✅ Batch upserted ${points.length} points to ${collectionName}`);
  } catch (error) {
    console.error(`Error in batch upsert for ${collectionName}:`, error);
    throw error;
  }
}

// Collection optimization
export async function optimizeCollection(collectionName: string) {
  try {
    await qdrantClient.updateCollection(collectionName, {
      optimizers_config: {
        memmap_threshold: 20000,
        indexing_threshold: 20000,
        payload_indexing: {
          text: {
            tokenizer: 'word',
            min_token_len: 2,
            max_token_len: 15,
            lowercase: true,
          },
        },
      },
    });
    
    console.log(`✅ Optimized collection: ${collectionName}`);
  } catch (error) {
    console.error(`Error optimizing collection ${collectionName}:`, error);
  }
}

// Clear collection cache (useful for testing)
export function clearCollectionCache() {
  collectionCache.clear();
}
