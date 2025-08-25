import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { ensureCollection, qdrantClient } from './qdrant';

// Advanced text processing utilities
export class AdvancedDocumentProcessor {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: apiKey,
      maxConcurrency: 5,
    });
  }

  // Intelligent text splitting with semantic boundaries
  private createSemanticTextSplitter() {
    return new RecursiveCharacterTextSplitter({
      chunkSize: 800, // Smaller chunks for better precision
      chunkOverlap: 150, // 18% overlap for context continuity
      separators: [
        '\n\n## ', // Headers
        '\n\n### ', // Sub-headers
        '\n\n', // Paragraphs
        '\n', // Lines
        '. ', // Sentences
        '! ', // Exclamations
        '? ', // Questions
        '; ', // Semi-colons
        ': ', // Colons
        ', ', // Commas
        ' ', // Words
        '', // Characters
      ],
      lengthFunction: (text) => text.length,
    });
  }

  // Enhanced document processing with semantic understanding
  async processDocument(doc: any, fileName: string, collectionId: string) {
    // Extract and enhance metadata
    const pageNumber = doc.metadata?.page || 0;
    const enhancedMetadata = {
      ...doc.metadata,
      source: fileName,
      collectionId: collectionId,
      page: pageNumber,
      processedAt: new Date().toISOString(),
      chunkType: 'semantic',
      language: 'en',
      documentType: 'pdf',
      // Add semantic markers
      hasHeaders: this.containsHeaders(doc.pageContent),
      hasLists: this.containsLists(doc.pageContent),
      hasNumbers: this.containsNumbers(doc.pageContent),
      complexity: this.assessComplexity(doc.pageContent),
    };

    return {
      ...doc,
      metadata: enhancedMetadata,
    };
  }

  // Semantic analysis utilities
  private containsHeaders(text: string): boolean {
    const headerPatterns = [
      /^[A-Z][A-Z\s]{2,}$/m, // ALL CAPS headers
      /^\d+\.\s+[A-Z]/m, // Numbered headers
      /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/m, // Title Case headers
    ];
    return headerPatterns.some(pattern => pattern.test(text));
  }

  private containsLists(text: string): boolean {
    const listPatterns = [
      /^\s*[-•*]\s+/m, // Bullet points
      /^\s*\d+\.\s+/m, // Numbered lists
      /^\s*[a-z]\)\s+/m, // Lettered lists
    ];
    return listPatterns.some(pattern => pattern.test(text));
  }

  private containsNumbers(text: string): boolean {
    return /\d+/.test(text);
  }

  private assessComplexity(text: string): 'low' | 'medium' | 'high' {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    if (avgWordsPerSentence > 25 || words > 200) return 'high';
    if (avgWordsPerSentence > 15 || words > 100) return 'medium';
    return 'low';
  }

  // Intelligent chunk filtering and enhancement
  private enhanceChunks(chunks: any[], fileName: string, collectionId: string) {
    return chunks
      .map((chunk, index) => {
        const enhancedChunk = {
          ...chunk,
          metadata: {
            ...chunk.metadata,
            chunkIndex: index,
            totalChunks: chunks.length,
            fileName,
            collectionId,
            // Add semantic markers
            hasHeaders: this.containsHeaders(chunk.pageContent),
            hasLists: this.containsLists(chunk.pageContent),
            hasNumbers: this.containsNumbers(chunk.pageContent),
            complexity: this.assessComplexity(chunk.pageContent),
            // Add content type detection
            contentType: this.detectContentType(chunk.pageContent),
            // Add key phrases
            keyPhrases: this.extractKeyPhrases(chunk.pageContent),
          }
        };
        return enhancedChunk;
      })
      .filter(chunk => {
        // Filter out low-quality chunks
        const content = chunk.pageContent.trim();
        return (
          content.length > 30 && // Minimum length
          content.length < 3000 && // Maximum length
          !this.isLowQualityContent(content) // Quality check
        );
      });
  }

  private detectContentType(text: string): string {
    if (this.containsHeaders(text)) return 'header';
    if (this.containsLists(text)) return 'list';
    if (/\d+%|\d+\.\d+%/.test(text)) return 'statistics';
    if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(text)) return 'title';
    if (text.length < 100) return 'summary';
    return 'content';
  }

  private extractKeyPhrases(text: string): string[] {
    // Simple key phrase extraction
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private isLowQualityContent(text: string): boolean {
    const lowQualityPatterns = [
      /^\s*$/, // Empty or whitespace only
      /^[^\w]*$/, // No words
      /^(page|chapter|section)\s+\d+/i, // Page numbers
      /^©\s*\d{4}/, // Copyright notices
      /^all\s+rights\s+reserved/i, // Legal text
      /^confidential/i, // Confidential notices
    ];
    
    return lowQualityPatterns.some(pattern => pattern.test(text.trim()));
  }

  // Advanced document processing pipeline
  async processDocuments(docs: any[], fileName: string, collectionId: string) {
    console.log(`🔄 Processing ${docs.length} document pages...`);

    // Process documents with enhanced metadata
    const processedDocs = await Promise.all(
      docs.map(doc => this.processDocument(doc, fileName, collectionId))
    );

    // Use semantic text splitter
    const textSplitter = this.createSemanticTextSplitter();
    const splitDocs = await textSplitter.splitDocuments(processedDocs);
    console.log(`✂️ Split into ${splitDocs.length} initial chunks`);

    // Enhance and filter chunks
    const enhancedChunks = this.enhanceChunks(splitDocs, fileName, collectionId);
    console.log(`🔍 Filtered to ${enhancedChunks.length} quality chunks`);

    return enhancedChunks;
  }

  // Advanced vector storage with semantic indexing
  async storeDocuments(chunks: any[], collectionName: string) {
    try {
      // Ensure collection exists with optimized settings
      const collectionReady = await ensureCollection(collectionName);
      if (!collectionReady) {
        throw new Error(`Failed to ensure collection ${collectionName}`);
      }

      // Create vector store
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        this.embeddings,
        {
          url: process.env.QDRANT_URL!,
          apiKey: process.env.QDRANT_APIKEY!,
          collectionName,
        }
      );

      // Store documents in optimized batches
      const batchSize = 50; // Smaller batches for better quality
      const batches = [];
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        batches.push(chunks.slice(i, i + batchSize));
      }

      console.log(`📦 Storing ${chunks.length} chunks in ${batches.length} batches...`);

      for (const batch of batches) {
        await vectorStore.addDocuments(batch);
      }

      console.log(`✅ Successfully stored ${chunks.length} enhanced chunks in Qdrant`);
      return true;
    } catch (error) {
      console.error('❌ Error storing documents:', error);
      throw error;
    }
  }

  // Advanced semantic search with context understanding
  async semanticSearch(query: string, collectionName: string, options: {
    k?: number;
    filters?: any;
    similarityThreshold?: number;
  } = {}) {
    const {
      k = 5,
      filters,
      similarityThreshold = 0.7
    } = options;

    try {
      // Create vector store
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        this.embeddings,
        {
          url: process.env.QDRANT_URL!,
          apiKey: process.env.QDRANT_APIKEY!,
          collectionName,
        }
      );

      // Enhanced retriever with semantic understanding
      const retriever = vectorStore.asRetriever({
        k: k * 2, // Get more results for better filtering
      });

      // Get initial results
      const results = await retriever.invoke(query);
      
      // Apply semantic filtering and ranking
      const enhancedResults = this.enhanceSearchResults(results, query, similarityThreshold);
      
      // Apply filters if provided
      const filteredResults = filters 
        ? this.applyFilters(enhancedResults, filters)
        : enhancedResults;

      // Return top k results
      return filteredResults.slice(0, k);
    } catch (error) {
      console.error('❌ Semantic search error:', error);
      return [];
    }
  }

  // Enhance search results with semantic understanding
  private enhanceSearchResults(results: any[], query: string, threshold: number) {
    return results
      .map(result => {
        const relevanceScore = this.calculateSemanticRelevance(result, query);
        return {
          ...result,
          semanticScore: relevanceScore,
          enhancedScore: (result.score || 0) * relevanceScore,
        };
      })
      .filter(result => result.enhancedScore >= threshold)
      .sort((a, b) => b.enhancedScore - a.enhancedScore);
  }

  // Calculate semantic relevance based on content analysis
  private calculateSemanticRelevance(result: any, query: string): number {
    const content = result.pageContent.toLowerCase();
    const queryWords = query.toLowerCase().split(/\s+/);
    
    // Exact phrase matching
    if (content.includes(query.toLowerCase())) {
      return 1.0;
    }
    
    // Word overlap
    const contentWords = content.split(/\s+/);
    const matchingWords = queryWords.filter(word => 
      contentWords.some((contentWord: string | string[])  => 
        contentWord.includes(word) || word.includes(contentWord as string)
      )
    );
    
    const wordOverlap = matchingWords.length / queryWords.length;
    
    // Key phrase matching
    const keyPhrases = result.metadata?.keyPhrases || [];
    const phraseMatches = queryWords.filter(word => 
      keyPhrases.some((phrase: string) => phrase.includes(word))
    ).length;
    
    const phraseScore = phraseMatches / queryWords.length;
    
    // Content type relevance
    const contentType = result.metadata?.contentType || 'content';
    const typeRelevance = this.getContentTypeRelevance(contentType, query);
    
    // Combine scores
    return (wordOverlap * 0.4 + phraseScore * 0.3 + typeRelevance * 0.3);
  }

  private getContentTypeRelevance(contentType: string, query: string): number {
    const queryLower = query.toLowerCase();
    
    switch (contentType) {
      case 'header':
        return queryLower.includes('what') || queryLower.includes('how') ? 0.8 : 0.6;
      case 'list':
        return queryLower.includes('list') || queryLower.includes('steps') ? 0.9 : 0.5;
      case 'statistics':
        return /\d+/.test(query) ? 0.9 : 0.4;
      case 'title':
        return 0.7;
      case 'summary':
        return queryLower.includes('summary') || queryLower.includes('overview') ? 0.8 : 0.6;
      default:
        return 0.5;
    }
  }

  private applyFilters(results: any[], filters: any): any[] {
    return results.filter(result => {
      for (const [key, value] of Object.entries(filters)) {
        if (result.metadata?.[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }
}
