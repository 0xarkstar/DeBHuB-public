import { ethers, Contract, Signer } from "ethers";
import { VectorClient, SimilarityResult } from "./VectorClient";
import { IndexedDBCache } from "./cache/IndexedDBCache";

/**
 * Semantic Search Engine for Pure Irys BaaS
 * Enables AI-powered document discovery using vector embeddings
 *
 * @remarks
 * This engine provides advanced search capabilities including:
 * - Semantic similarity search using vector embeddings
 * - Hybrid search combining semantic + keyword matching
 * - Question-answering with RAG (Retrieval-Augmented Generation)
 * - Document suggestions and recommendations
 * - Cluster-based efficient retrieval
 *
 * @example
 * ```typescript
 * const semanticSearch = new SemanticSearch(
 *   vectorClient,
 *   vectorRegistry,
 *   cache,
 *   signer
 * );
 *
 * // Search for similar documents
 * const results = await semanticSearch.search(
 *   'blockchain technology',
 *   { limit: 10, threshold: 0.7 }
 * );
 *
 * // Ask a question
 * const answer = await semanticSearch.askQuestion(
 *   'What is blockchain?',
 *   { maxContext: 5 }
 * );
 * ```
 */
export class SemanticSearch {
  private vectorClient: VectorClient;
  private vectorRegistry: Contract;
  private cache: IndexedDBCache;
  private signer: Signer;

  /**
   * Creates a new SemanticSearch instance
   *
   * @param vectorClient - VectorClient for embedding operations
   * @param vectorRegistry - Smart contract for vector metadata
   * @param cache - IndexedDB cache for query results
   * @param signer - Ethereum signer for contract interactions
   */
  constructor(
    vectorClient: VectorClient,
    vectorRegistry: Contract,
    cache: IndexedDBCache,
    signer: Signer
  ) {
    this.vectorClient = vectorClient;
    this.vectorRegistry = vectorRegistry;
    this.cache = cache;
    this.signer = signer;
  }

  /**
   * Semantic search for similar documents using vector similarity
   *
   * @param query - The search query text
   * @param options - Optional search configuration
   * @param options.limit - Maximum number of results (default: 10)
   * @param options.threshold - Minimum similarity score 0-1 (default: 0.7)
   * @param options.projectId - Filter by project ID
   * @param options.owner - Filter by document owner
   * @param options.useCache - Use cached results (default: true)
   * @returns A promise that resolves to an array of search results with metadata
   *
   * @remarks
   * This method:
   * 1. Generates embedding for the query
   * 2. Finds relevant cluster using LSH
   * 3. Retrieves candidate vectors from cluster
   * 4. Calculates similarity scores
   * 5. Returns top matches with metadata
   * 6. Caches results for faster subsequent queries
   *
   * @example
   * ```typescript
   * const results = await semanticSearch.search(
   *   'decentralized storage solutions',
   *   { limit: 5, threshold: 0.75, owner: '0x123...' }
   * );
   *
   * results.forEach(result => {
   *   console.log(`${result.docId}: ${(result.similarity * 100).toFixed(1)}%`);
   * });
   * ```
   */
  async search(
    query: string,
    options: SemanticSearchOptions = {}
  ): Promise<SemanticSearchResult[]> {
    const {
      limit = 10,
      threshold = 0.7,
      projectId,
      owner,
      useCache = true,
    } = options;

    console.log(`🔍 Semantic search: "${query.substring(0, 50)}..."`);

    // Check cache
    const cacheKey = `semantic:${query}:${JSON.stringify(options)}`;
    if (useCache) {
      const cached = await this.cache.getQuery<SemanticSearchResult[]>(cacheKey);
      if (cached) {
        console.log(`💾 Semantic search cache hit`);
        return cached;
      }
    }

    // 1. Generate query embedding
    const queryEmbedding = await this.vectorClient.createEmbedding(query);

    // 2. Find relevant cluster
    const clusterId = this.calculateClusterId(queryEmbedding);
    console.log(`📊 Target cluster: ${clusterId.substring(0, 10)}...`);

    // 3. Get candidate vectors from cluster
    let candidateDocIds: string[];

    if (owner) {
      // Filter by owner
      const ownerVectors = await this.vectorRegistry.getVectorsByOwner(owner);
      candidateDocIds = ownerVectors;
    } else {
      // Get from cluster
      candidateDocIds = await this.vectorRegistry.getActiveVectorsByCluster(
        clusterId
      );
    }

    console.log(`📋 Found ${candidateDocIds.length} candidates`);

    if (candidateDocIds.length === 0) {
      console.log(`⚠️ No vectors in cluster, falling back to full scan`);
      // Fallback: search nearby clusters or full scan
      candidateDocIds = await this.expandClusterSearch(clusterId, 3);
    }

    // 4. Get vector metadata
    const metadataList = await this.vectorRegistry.batchGetVectors(
      candidateDocIds
    );

    // 5. Fetch vectors and calculate similarities
    const irysVectorIds = metadataList.map((m: any) => m.irysVectorId);
    const similarityResults = await this.vectorClient.findSimilar(
      query,
      irysVectorIds,
      {
        limit,
        threshold,
        includeEmbeddings: false,
      }
    );

    // 6. Enhance results with metadata
    const enhancedResults: SemanticSearchResult[] = [];

    for (const result of similarityResults) {
      const metadata = metadataList.find(
        (m: any) => m.irysVectorId === result.irysVectorId
      );

      if (metadata && metadata.active) {
        enhancedResults.push({
          docId: result.docId,
          irysVectorId: result.irysVectorId,
          similarity: result.similarity,
          owner: metadata.owner,
          dimensions: Number(metadata.dimensions),
          embeddingModel: metadata.embeddingModel,
          timestamp: Number(metadata.timestamp),
          metadata: result.metadata,
        });
      }
    }

    // 7. Cache results
    if (useCache) {
      await this.cache.setQuery(cacheKey, enhancedResults);
    }

    console.log(`✅ Found ${enhancedResults.length} semantically similar documents`);
    return enhancedResults;
  }

  /**
   * Find documents similar to an existing document
   *
   * @param docId - The document ID to find similar documents for
   * @param options - Optional search configuration (same as search method)
   * @returns A promise that resolves to an array of similar documents
   *
   * @remarks
   * Uses the existing document's content to find semantically similar documents.
   * Threshold is automatically set higher (0.8) for better quality matches.
   *
   * @example
   * ```typescript
   * const similar = await semanticSearch.findSimilarDocuments(
   *   'my-article-123',
   *   { limit: 5 }
   * );
   * console.log(`Found ${similar.length} similar documents`);
   * ```
   */
  async findSimilarDocuments(
    docId: string,
    options: SemanticSearchOptions = {}
  ): Promise<SemanticSearchResult[]> {
    console.log(`🔍 Finding similar to: ${docId}`);

    // 1. Get vector metadata
    const docIdBytes = ethers.id(docId);
    const metadata = await this.vectorRegistry.getVector(docIdBytes);

    if (!metadata.active) {
      throw new Error(`Vector for ${docId} is not active`);
    }

    // 2. Get vector data from Irys
    const vectorData = await this.vectorClient.getVector(metadata.irysVectorId);
    if (!vectorData) {
      throw new Error(`Failed to fetch vector data for ${docId}`);
    }

    // 3. Search using the document's content
    return this.search(vectorData.contentPreview, {
      ...options,
      threshold: options.threshold || 0.8, // Higher threshold for similar docs
    });
  }

  /**
   * Hybrid search combining semantic similarity and keyword matching
   *
   * @param query - The semantic search query
   * @param keywords - Array of keywords to boost results
   * @param options - Optional search configuration
   * @param options.limit - Maximum number of results (default: 10)
   * @param options.semanticWeight - Weight for semantic score 0-1 (default: 0.7)
   * @param options.keywordWeight - Weight for keyword score 0-1 (default: 0.3)
   * @returns A promise that resolves to hybrid search results with combined scores
   *
   * @remarks
   * Combines the best of both worlds:
   * - Semantic search finds conceptually similar content
   * - Keyword matching ensures specific terms are present
   * - Combined score = (semantic × semanticWeight) + (keyword × keywordWeight)
   *
   * @example
   * ```typescript
   * const results = await semanticSearch.hybridSearch(
   *   'database technology',
   *   ['vector', 'blockchain', 'decentralized'],
   *   { limit: 10, semanticWeight: 0.6, keywordWeight: 0.4 }
   * );
   * ```
   */
  async hybridSearch(
    query: string,
    keywords: string[],
    options: HybridSearchOptions = {}
  ): Promise<HybridSearchResult[]> {
    const {
      limit = 10,
      semanticWeight = 0.7,
      keywordWeight = 0.3,
    } = options;

    console.log(`🔍 Hybrid search: semantic + keywords`);

    // 1. Semantic search
    const semanticResults = await this.search(query, { limit: limit * 2 });

    // 2. Keyword scoring (simple TF-IDF approximation)
    const hybridResults: HybridSearchResult[] = semanticResults.map((result) => {
      const keywordScore = this.calculateKeywordScore(
        result.metadata?.contentPreview || "",
        keywords
      );

      const combinedScore =
        result.similarity * semanticWeight + keywordScore * keywordWeight;

      return {
        ...result,
        keywordScore,
        combinedScore,
      };
    });

    // 3. Re-rank by combined score
    const rankedResults = hybridResults
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, limit);

    console.log(`✅ Hybrid search returned ${rankedResults.length} results`);
    return rankedResults;
  }

  /**
   * Answer questions using RAG (Retrieval-Augmented Generation)
   *
   * @param question - The question to answer
   * @param options - Optional QA configuration
   * @param options.maxContext - Maximum number of documents to use for context (default: 5)
   * @param options.projectId - Filter context documents by project
   * @param options.model - AI model to use for generation (future)
   * @returns A promise that resolves to an answer with sources and confidence
   *
   * @remarks
   * RAG process:
   * 1. Search for documents relevant to the question
   * 2. Build context from top matching documents
   * 3. Generate answer based on context (requires OpenAI API key)
   * 4. Return answer with confidence score and source citations
   *
   * Note: Full AI generation requires OpenAI API key configuration.
   *
   * @example
   * ```typescript
   * const answer = await semanticSearch.askQuestion(
   *   'How does blockchain consensus work?',
   *   { maxContext: 5 }
   * );
   *
   * console.log('Answer:', answer.answer);
   * console.log('Confidence:', answer.confidence);
   * console.log('Sources:', answer.sources.length);
   * ```
   */
  async askQuestion(
    question: string,
    options: QAOptions = {}
  ): Promise<QAAnswer> {
    const { maxContext = 5, projectId } = options;

    console.log(`❓ Question: ${question}`);

    // 1. Find relevant documents
    const relevantDocs = await this.search(question, {
      limit: maxContext,
      threshold: 0.6,
      projectId,
    });

    if (relevantDocs.length === 0) {
      return {
        question,
        answer: "I don't have enough information to answer this question.",
        confidence: 0,
        sources: [],
        method: "semantic-search",
      };
    }

    // 2. Fetch document content
    const context = await this.buildContext(relevantDocs);

    // 3. Generate answer (placeholder - would use OpenAI GPT in production)
    const answer = await this.generateAnswer(question, context, options);

    return {
      question,
      answer: answer.text,
      confidence: answer.confidence,
      sources: relevantDocs.map((doc) => ({
        docId: doc.docId,
        similarity: doc.similarity,
        preview: doc.metadata?.contentPreview || "",
      })),
      method: "rag",
    };
  }

  /**
   * Get document suggestions based on content similarity
   *
   * @param content - The content to find suggestions for
   * @param options - Optional suggestion configuration
   * @param options.limit - Maximum number of suggestions (default: 5)
   * @param options.excludeDocId - Document ID to exclude from suggestions
   * @returns A promise that resolves to an array of document suggestions
   *
   * @remarks
   * Useful for "Related Documents" or "You might also like" features.
   * Each suggestion includes a similarity score and human-readable reason.
   *
   * @example
   * ```typescript
   * const suggestions = await semanticSearch.getSuggestions(
   *   currentDocument.content,
   *   { limit: 5, excludeDocId: currentDocument.id }
   * );
   *
   * suggestions.forEach(s => {
   *   console.log(`${s.docId}: ${s.reason}`);
   * });
   * ```
   */
  async getSuggestions(
    content: string,
    options: SuggestionOptions = {}
  ): Promise<DocumentSuggestion[]> {
    const { limit = 5, excludeDocId } = options;

    // Find similar documents
    const similarDocs = await this.search(content, {
      limit: limit + (excludeDocId ? 1 : 0),
      threshold: 0.65,
    });

    // Filter out excluded doc
    const filtered = excludeDocId
      ? similarDocs.filter((doc) => doc.docId !== excludeDocId)
      : similarDocs;

    return filtered.slice(0, limit).map((doc) => ({
      docId: doc.docId,
      similarity: doc.similarity,
      reason: this.getSuggestionReason(doc.similarity),
      preview: doc.metadata?.contentPreview || "",
    }));
  }

  // ==================== Private Helpers ====================

  /**
   * Calculate cluster ID (same as VectorClient)
   */
  private calculateClusterId(embedding: number[]): string {
    const hashBits = 32;
    const hash = embedding
      .slice(0, hashBits)
      .map((v) => (v > 0 ? "1" : "0"))
      .join("");

    return ethers.id(hash).substring(0, 10);
  }

  /**
   * Expand cluster search to nearby clusters
   */
  private async expandClusterSearch(
    baseClusterId: string,
    radius: number
  ): Promise<string[]> {
    // Simple expansion: flip bits to find nearby clusters
    const baseHash = baseClusterId;
    const nearbyClusters = [baseClusterId];

    for (let i = 0; i < radius; i++) {
      // Flip one bit at a time (very simplified LSH expansion)
      const variant = baseHash.slice(0, i) +
        (baseHash[i] === '1' ? '0' : '1') +
        baseHash.slice(i + 1);
      nearbyClusters.push(ethers.id(variant).substring(0, 10));
    }

    // Get all candidates
    const allCandidates: string[] = [];
    for (const clusterId of nearbyClusters) {
      const candidates = await this.vectorRegistry.getActiveVectorsByCluster(
        clusterId
      );
      allCandidates.push(...candidates);
    }

    return Array.from(new Set(allCandidates)); // Dedupe
  }

  /**
   * Calculate keyword score (simple TF matching)
   */
  private calculateKeywordScore(text: string, keywords: string[]): number {
    if (!text || keywords.length === 0) return 0;

    const lowerText = text.toLowerCase();
    let matches = 0;

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, "g");
      const count = (lowerText.match(regex) || []).length;
      matches += count;
    }

    // Normalize by text length and keyword count
    return Math.min(matches / (keywords.length * 2), 1);
  }

  /**
   * Build context from relevant documents
   */
  private async buildContext(
    docs: SemanticSearchResult[]
  ): Promise<string> {
    const previews = docs.map(
      (doc, i) => `[${i + 1}] ${doc.metadata?.contentPreview || ""}`
    );
    return previews.join("\n\n");
  }

  /**
   * Generate answer (placeholder for OpenAI integration)
   */
  private async generateAnswer(
    question: string,
    context: string,
    options: QAOptions
  ): Promise<{ text: string; confidence: number }> {
    // TODO: Integrate with OpenAI GPT-4 or similar
    // For now, return extracted context

    return {
      text: `Based on the available documents:\n\n${context}\n\n[Note: Full AI answer generation requires OpenAI API key]`,
      confidence: 0.7,
    };
  }

  /**
   * Get suggestion reason based on similarity
   */
  private getSuggestionReason(similarity: number): string {
    if (similarity >= 0.9) return "Highly related content";
    if (similarity >= 0.8) return "Similar topic";
    if (similarity >= 0.7) return "Related concepts";
    return "Potentially relevant";
  }

  /**
   * Clear all cached search results
   *
   * @remarks
   * Use this when you want to force fresh results or free up IndexedDB space.
   *
   * @example
   * ```typescript
   * await semanticSearch.clearCache();
   * console.log('Cache cleared!');
   * ```
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
    console.log("🗑️ Semantic search cache cleared");
  }

  /**
   * Get cache statistics and performance metrics
   *
   * @returns Cache statistics including size, hit rate, etc.
   *
   * @example
   * ```typescript
   * const stats = await semanticSearch.getCacheStats();
   * console.log('Cache entries:', stats.count);
   * console.log('Hit rate:', stats.hitRate);
   * ```
   */
  async getCacheStats() {
    return await this.cache.getStats();
  }
}

// ==================== Type Definitions ====================

export interface SemanticSearchOptions {
  limit?: number;
  threshold?: number;
  projectId?: string;
  owner?: string;
  useCache?: boolean;
}

export interface SemanticSearchResult {
  docId: string;
  irysVectorId: string;
  similarity: number;
  owner: string;
  dimensions: number;
  embeddingModel: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface HybridSearchOptions extends SemanticSearchOptions {
  semanticWeight?: number;
  keywordWeight?: number;
}

export interface HybridSearchResult extends SemanticSearchResult {
  keywordScore: number;
  combinedScore: number;
}

export interface QAOptions {
  maxContext?: number;
  projectId?: string;
  model?: string;
}

export interface QAAnswer {
  question: string;
  answer: string;
  confidence: number;
  sources: Array<{
    docId: string;
    similarity: number;
    preview: string;
  }>;
  method: "semantic-search" | "rag" | "keyword";
}

export interface SuggestionOptions {
  limit?: number;
  excludeDocId?: string;
}

export interface DocumentSuggestion {
  docId: string;
  similarity: number;
  reason: string;
  preview: string;
}
