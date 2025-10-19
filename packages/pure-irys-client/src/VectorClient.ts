import { ethers, Signer } from "ethers";
import { WebUploader } from "@irys/web-upload";
import Query from "@irys/query";

/**
 * Pure Irys Vector Database Client
 * Enables semantic search and AI features using blockchain-native vector storage
 *
 * @remarks
 * This client provides methods for creating, storing, and searching vector embeddings
 * on the Irys DataChain. It supports both OpenAI embeddings and mock embeddings for development.
 *
 * @example
 * ```typescript
 * const vectorClient = new VectorClient(irysUploader, signer, 'your-openai-key');
 *
 * // Store a document with vector embedding
 * const record = await vectorClient.storeVector(
 *   'doc-123',
 *   'This is my document content',
 *   { author: 'John Doe' }
 * );
 *
 * // Find similar documents
 * const similar = await vectorClient.findSimilar(
 *   'search query',
 *   ['vector-id-1', 'vector-id-2'],
 *   { limit: 10, threshold: 0.7 }
 * );
 * ```
 */
export class VectorClient {
  private irysUploader: any;
  private query: Query;
  private signer: Signer;
  private openaiApiKey?: string;

  // Configuration
  private config = {
    embeddingModel: "text-embedding-3-small",
    dimensions: 1536,
    openaiEndpoint: "https://api.openai.com/v1/embeddings",
  };

  /**
   * Creates a new VectorClient instance
   *
   * @param irysUploader - Irys uploader instance for storing vectors on DataChain
   * @param signer - Ethereum signer for transaction signing
   * @param openaiApiKey - Optional OpenAI API key for generating embeddings. If not provided, mock embeddings will be used
   */
  constructor(
    irysUploader: any,
    signer: Signer,
    openaiApiKey?: string
  ) {
    this.irysUploader = irysUploader;
    this.signer = signer;
    this.query = new Query();
    this.openaiApiKey = openaiApiKey;
  }

  /**
   * Create vector embedding for text using OpenAI API
   *
   * @param text - The text to convert into a vector embedding
   * @returns A promise that resolves to a 1536-dimension embedding vector
   *
   * @remarks
   * Uses OpenAI's text-embedding-3-small model by default.
   * Falls back to mock embeddings if API key is not set or API call fails.
   *
   * @example
   * ```typescript
   * const embedding = await vectorClient.createEmbedding('Hello world');
   * console.log(embedding.length); // 1536
   * ```
   */
  async createEmbedding(text: string): Promise<number[]> {
    if (!this.openaiApiKey) {
      console.warn("⚠️ OpenAI API key not set, using mock embedding");
      return this.createMockEmbedding(text);
    }

    try {
      console.log(`🤖 Generating embedding for text (${text.length} chars)...`);

      const response = await fetch(this.config.openaiEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.embeddingModel,
          input: text,
          encoding_format: "float",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;

      console.log(`✅ Embedding generated (${embedding.length} dimensions)`);
      return embedding;
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      console.warn("Falling back to mock embedding");
      return this.createMockEmbedding(text);
    }
  }

  /**
   * Create mock embedding for development/testing
   * Uses simple hash-based deterministic approach
   */
  private createMockEmbedding(text: string): number[] {
    console.log("📝 Creating mock embedding (for development)");

    // Create deterministic mock embedding based on text content
    const seed = this.hashString(text);
    const embedding: number[] = [];

    for (let i = 0; i < this.config.dimensions; i++) {
      // Simple pseudo-random with seed
      const value = Math.sin(seed + i) * Math.cos(seed * i);
      embedding.push(value);
    }

    // Normalize
    return this.normalizeVector(embedding);
  }

  /**
   * Store vector embedding on Irys DataChain
   *
   * @param docId - Unique identifier for the document
   * @param content - The document content to vectorize and store
   * @param metadata - Optional metadata to associate with the vector
   * @returns A promise that resolves to a VectorRecord containing storage details
   *
   * @remarks
   * This method:
   * 1. Generates a vector embedding from the content
   * 2. Calculates a cluster ID for efficient retrieval
   * 3. Uploads the vector data to Irys with proper tags
   * 4. Returns a record with the Irys transaction ID
   *
   * @example
   * ```typescript
   * const record = await vectorClient.storeVector(
   *   'article-123',
   *   'AI and blockchain are transforming the internet',
   *   { category: 'technology', author: 'Alice' }
   * );
   * console.log('Stored at:', record.irysVectorId);
   * ```
   */
  async storeVector(
    docId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<VectorRecord> {
    console.log(`💾 Storing vector for document: ${docId}`);

    // 1. Generate embedding
    const embedding = await this.createEmbedding(content);

    // 2. Calculate cluster ID (for efficient search)
    const clusterId = this.calculateClusterId(embedding);

    // 3. Prepare vector data
    const vectorData: VectorData = {
      docId,
      embedding,
      clusterId,
      dimensions: embedding.length,
      model: this.config.embeddingModel,
      contentPreview: content.substring(0, 200),
      metadata: metadata || {},
      timestamp: Date.now(),
    };

    // 4. Upload to Irys
    const tags = [
      { name: "Content-Type", value: "application/json" },
      { name: "App-Name", value: "DeBHuB" },
      { name: "Entity-Type", value: "vector-embedding" },
      { name: "Document-Id", value: docId },
      { name: "Embedding-Model", value: this.config.embeddingModel },
      { name: "Dimensions", value: String(embedding.length) },
      { name: "Cluster-Id", value: clusterId },
    ];

    const receipt = await this.irysUploader.upload(
      JSON.stringify(vectorData),
      { tags }
    );

    console.log(`✅ Vector stored on Irys: ${receipt.id}`);

    return {
      docId,
      irysVectorId: receipt.id,
      clusterId,
      dimensions: embedding.length,
      model: this.config.embeddingModel,
      timestamp: Date.now(),
    };
  }

  /**
   * Retrieve vector data from Irys DataChain
   *
   * @param irysVectorId - The Irys transaction ID of the stored vector
   * @returns A promise that resolves to the VectorData or null if not found
   *
   * @example
   * ```typescript
   * const vectorData = await vectorClient.getVector('irys-tx-id-123');
   * if (vectorData) {
   *   console.log('Document:', vectorData.docId);
   *   console.log('Embedding dimensions:', vectorData.dimensions);
   * }
   * ```
   */
  async getVector(irysVectorId: string): Promise<VectorData | null> {
    try {
      const gatewayUrl = `https://gateway.irys.xyz/${irysVectorId}`;
      const response = await fetch(gatewayUrl);

      if (!response.ok) {
        console.warn(`Failed to fetch vector: ${response.status}`);
        return null;
      }

      const vectorData: VectorData = await response.json();
      return vectorData;
    } catch (error) {
      console.error("Error fetching vector:", error);
      return null;
    }
  }

  /**
   * Find similar vectors using semantic search
   *
   * @param queryText - The search query text
   * @param candidateVectorIds - Array of Irys vector IDs to search within
   * @param options - Optional search configuration
   * @param options.limit - Maximum number of results to return (default: 10)
   * @param options.threshold - Minimum similarity score (0-1) to include (default: 0.7)
   * @param options.includeEmbeddings - Whether to include embeddings in results (default: false)
   * @returns A promise that resolves to an array of similarity results, sorted by score
   *
   * @remarks
   * Uses cosine similarity to measure how semantically similar vectors are.
   * Results are sorted by similarity score in descending order.
   *
   * @example
   * ```typescript
   * const results = await vectorClient.findSimilar(
   *   'blockchain technology',
   *   ['vec1', 'vec2', 'vec3'],
   *   { limit: 5, threshold: 0.75 }
   * );
   * results.forEach(r => {
   *   console.log(`${r.docId}: ${(r.similarity * 100).toFixed(1)}% match`);
   * });
   * ```
   */
  async findSimilar(
    queryText: string,
    candidateVectorIds: string[],
    options: SimilaritySearchOptions = {}
  ): Promise<SimilarityResult[]> {
    const {
      limit = 10,
      threshold = 0.7,
      includeEmbeddings = false,
    } = options;

    console.log(`🔍 Searching for similar vectors (${candidateVectorIds.length} candidates)...`);

    // 1. Generate query embedding
    const queryEmbedding = await this.createEmbedding(queryText);

    // 2. Fetch candidate vectors in parallel
    const vectors = await Promise.all(
      candidateVectorIds.map(async (id) => {
        const vectorData = await this.getVector(id);
        return { id, data: vectorData };
      })
    );

    // 3. Calculate similarities
    const similarities: SimilarityResult[] = [];

    for (const { id, data } of vectors) {
      if (!data) continue;

      const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);

      if (similarity >= threshold) {
        similarities.push({
          irysVectorId: id,
          docId: data.docId,
          similarity,
          embedding: includeEmbeddings ? data.embedding : undefined,
          metadata: data.metadata,
        });
      }
    }

    // 4. Sort by similarity (descending) and limit
    const results = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`✅ Found ${results.length} similar vectors`);
    return results;
  }

  /**
   * Calculate cosine similarity between two vectors
   *
   * @param a - First vector
   * @param b - Second vector
   * @returns Cosine similarity score between 0 and 1 (1 = identical, 0 = orthogonal)
   * @throws Error if vector dimensions don't match
   *
   * @remarks
   * Cosine similarity measures the angle between two vectors in high-dimensional space.
   * It's ideal for semantic similarity as it's invariant to vector magnitude.
   *
   * @example
   * ```typescript
   * const similarity = vectorClient.cosineSimilarity([1, 0, 1], [1, 1, 0]);
   * console.log(similarity); // 0.5
   * ```
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vector dimensions must match");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate cluster ID using LSH (Locality-Sensitive Hashing)
   * Groups similar vectors for efficient search
   */
  private calculateClusterId(embedding: number[]): string {
    // Simple LSH: use signs of first N dimensions
    const hashBits = 32;
    const hash = embedding
      .slice(0, hashBits)
      .map((v) => (v > 0 ? "1" : "0"))
      .join("");

    return ethers.id(hash).substring(0, 10); // Short cluster ID
  }

  /**
   * Normalize vector to unit length
   */
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );
    return magnitude === 0 ? vector : vector.map((v) => v / magnitude);
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Query vectors by cluster ID from Irys GraphQL
   *
   * @param clusterId - The cluster ID to search for
   * @returns A promise that resolves to an array of Irys transaction IDs in the cluster
   *
   * @remarks
   * Clusters are used to group similar vectors for efficient retrieval.
   * This enables approximate nearest neighbor search at scale.
   *
   * @example
   * ```typescript
   * const vectorIds = await vectorClient.queryVectorsByCluster('cluster-abc123');
   * console.log(`Found ${vectorIds.length} vectors in cluster`);
   * ```
   */
  async queryVectorsByCluster(clusterId: string): Promise<string[]> {
    try {
      const results = await this.query
        .search("irys:transactions")
        .tags([
          { name: "Entity-Type", values: ["vector-embedding"] },
          { name: "Cluster-Id", values: [clusterId] },
        ])
        .limit(100);

      return results.map((tx: any) => tx.id);
    } catch (error) {
      console.error("Error querying vectors by cluster:", error);
      return [];
    }
  }

  /**
   * Batch store multiple vectors in parallel
   *
   * @param documents - Array of documents to vectorize and store
   * @returns A promise that resolves to an array of VectorRecords
   *
   * @remarks
   * Processes all documents in parallel for maximum efficiency.
   * Use this for bulk operations to save time.
   *
   * @example
   * ```typescript
   * const records = await vectorClient.batchStoreVectors([
   *   { docId: 'doc1', content: 'First document' },
   *   { docId: 'doc2', content: 'Second document', metadata: { author: 'Bob' } }
   * ]);
   * console.log(`Stored ${records.length} vectors`);
   * ```
   */
  async batchStoreVectors(
    documents: Array<{ docId: string; content: string; metadata?: any }>
  ): Promise<VectorRecord[]> {
    console.log(`📦 Batch storing ${documents.length} vectors...`);

    const results = await Promise.all(
      documents.map((doc) =>
        this.storeVector(doc.docId, doc.content, doc.metadata)
      )
    );

    console.log(`✅ Batch stored ${results.length} vectors`);
    return results;
  }
}

// ==================== Type Definitions ====================

export interface VectorData {
  docId: string;
  embedding: number[];
  clusterId: string;
  dimensions: number;
  model: string;
  contentPreview: string;
  metadata: Record<string, any>;
  timestamp: number;
}

export interface VectorRecord {
  docId: string;
  irysVectorId: string;
  clusterId: string;
  dimensions: number;
  model: string;
  timestamp: number;
}

export interface SimilaritySearchOptions {
  limit?: number;
  threshold?: number;
  includeEmbeddings?: boolean;
}

export interface SimilarityResult {
  irysVectorId: string;
  docId: string;
  similarity: number;
  embedding?: number[];
  metadata?: Record<string, any>;
}
