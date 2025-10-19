import { ethers, Contract, Signer } from "ethers";
import { WebUploader } from "@irys/web-upload";
import { WebEthereum } from "@irys/web-upload-ethereum";
import { EthersV6Adapter } from "@irys/web-upload-ethereum-ethers-v6";
import Query from "@irys/query";
import { IndexedDBCache } from "./cache/IndexedDBCache";
import { VectorClient } from "./VectorClient";
import { SemanticSearch } from "./SemanticSearch";
import {
  PureIrysClientConfig,
  Document,
  CreateDocumentOptions,
  UpdateDocumentOptions,
  SearchOptions,
  DocumentStatus,
  Version,
  ProvenanceRecord,
} from "./types";
import { PURE_IRYS_CONTRACTS, NETWORK } from "./contracts/addresses";

// Import ABIs
import DocumentRegistryABI from "./contracts/abis/DocumentRegistry.json";
import AccessControlABI from "./contracts/abis/AccessControl.json";
import ProvenanceChainABI from "./contracts/abis/ProvenanceChain.json";
import EventBusABI from "./contracts/abis/EventBus.json";
import CacheControllerABI from "./contracts/abis/CacheController.json";
import SearchIndexABI from "./contracts/abis/SearchIndex.json";

/**
 * Pure Irys BaaS Client
 * World's first blockchain-native BaaS with zero backend dependencies
 */
export class PureIrysClient {
  private signer: Signer;
  private irysUploader!: any; // WebUploader type
  private query: Query;
  private cache: IndexedDBCache;
  private config: PureIrysClientConfig;

  // Smart contracts
  private documentRegistry!: Contract;
  private accessControl!: Contract;
  private provenanceChain!: Contract;
  private eventBus!: Contract;
  private cacheController!: Contract;
  private searchIndex!: Contract;
  private vectorRegistry!: Contract;

  // Vector DB & Semantic Search
  private vectorClient!: VectorClient;
  private semanticSearchEngine!: SemanticSearch;

  private initialized = false;

  constructor(
    signer: Signer,
    config?: Partial<PureIrysClientConfig>
  ) {
    this.signer = signer;

    // Default configuration
    this.config = {
      contracts: PURE_IRYS_CONTRACTS,
      network: NETWORK,
      irys: {
        network: "testnet",
        token: "ethereum",
        providerUrl: "https://testnet-rpc.irys.xyz/v1/execution-rpc",
      },
      cache: {
        ttl: 5 * 60 * 1000, // 5 minutes
        enabled: true,
      },
      ...config,
    };

    this.cache = new IndexedDBCache(this.config.cache?.ttl);
    this.query = new Query();
  }

  /**
   * Initialize the client
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    console.log("🚀 Initializing Pure Irys BaaS Client...");

    // Initialize cache
    if (this.config.cache?.enabled) {
      await this.cache.init();
    }

    // Initialize Irys L1 WebUploader for browser with ethers v6
    try {
      const provider = this.signer.provider;

      if (!provider) {
        throw new Error("Signer does not have a provider attached");
      }

      this.irysUploader = await WebUploader(WebEthereum)
        .withAdapter(EthersV6Adapter(provider));

      console.log("✅ Irys uploader initialized with ethers v6 adapter");
    } catch (err) {
      console.warn("⚠️ Irys uploader initialization deferred:", err);
      throw err; // Re-throw to surface the error during development
    }

    // Initialize smart contracts
    await this.initContracts();

    // Setup event listeners
    this.setupEventListeners();

    this.initialized = true;
    console.log("✅ Pure Irys Client initialized");
  }

  /**
   * Initialize smart contract instances
   */
  private async initContracts(): Promise<void> {
    this.documentRegistry = new Contract(
      this.config.contracts.documentRegistry,
      DocumentRegistryABI.abi,
      this.signer
    );

    this.accessControl = new Contract(
      this.config.contracts.accessControl,
      AccessControlABI.abi,
      this.signer
    );

    this.provenanceChain = new Contract(
      this.config.contracts.provenanceChain,
      ProvenanceChainABI.abi,
      this.signer
    );

    this.eventBus = new Contract(
      this.config.contracts.eventBus,
      EventBusABI.abi,
      this.signer
    );

    this.cacheController = new Contract(
      this.config.contracts.cacheController,
      CacheControllerABI.abi,
      this.signer
    );

    this.searchIndex = new Contract(
      this.config.contracts.searchIndex,
      SearchIndexABI.abi,
      this.signer
    );

    // Note: VectorRegistry will be initialized when contract is deployed
    // For now, we'll check if the address exists in config
    if (this.config.contracts.vectorRegistry) {
      const VectorRegistryABI = await import("./contracts/abis/VectorRegistry.json");
      this.vectorRegistry = new Contract(
        this.config.contracts.vectorRegistry,
        VectorRegistryABI.abi,
        this.signer
      );

      // Initialize Vector DB components
      this.vectorClient = new VectorClient(
        this.irysUploader,
        this.signer,
        this.config.ai?.openaiApiKey
      );

      this.semanticSearchEngine = new SemanticSearch(
        this.vectorClient,
        this.vectorRegistry,
        this.cache,
        this.signer
      );

      console.log("✅ Vector DB initialized");
    }
  }

  /**
   * Setup blockchain event listeners for real-time updates
   */
  private setupEventListeners(): void {
    // Listen to DocumentUpdated events for cache invalidation
    this.eventBus.on(
      "DocumentUpdated",
      async (docId: string, author: string, newVersionId: string) => {
        console.log(`📡 Document updated: ${docId}`);
        await this.cache.invalidateDocument(docId);
      }
    );

    // Listen to CacheInvalidated events
    this.cacheController.on(
      "CacheInvalidated",
      async (resourceId: string) => {
        console.log(`🗑️ Cache invalidated: ${resourceId}`);
        await this.cache.invalidateDocument(resourceId);
      }
    );
  }

  /**
   * Create a new document
   */
  async createDocument(options: CreateDocumentOptions): Promise<string> {
    await this.ensureInitialized();

    console.log("📝 Creating document...");

    // 1. Upload content to Irys
    const tags = [
      { name: "Content-Type", value: "text/plain" },
      { name: "App-Name", value: "DeBHuB" },
      { name: "Title", value: options.title },
      { name: "Project-Id", value: options.projectId },
      ...(options.tags || []).map((tag) => ({ name: "Tag", value: tag })),
    ];

    const receipt = await this.irysUploader.upload(options.content, { tags });
    console.log(`✅ Uploaded to Irys: ${receipt.id}`);

    // 2. Register in smart contract
    const irysIdBytes = ethers.id(receipt.id);
    const projectIdBytes = ethers.id(options.projectId);
    const tagHashes = (options.tags || []).map((tag) => ethers.id(tag));

    const tx = await this.documentRegistry.registerDocument(
      irysIdBytes,
      projectIdBytes,
      options.title,
      tagHashes
    );
    const txReceipt = await tx.wait();

    // Extract docId from event
    const event = txReceipt.logs.find((log: any) => {
      try {
        const parsed = this.documentRegistry.interface.parseLog(log);
        return parsed?.name === "DocumentRegistered";
      } catch {
        return false;
      }
    });

    const docId = event
      ? this.documentRegistry.interface.parseLog(event)?.args[0]
      : null;

    console.log(`✅ Document registered: ${docId}`);

    // 3. Initialize provenance
    await this.provenanceChain.recordProvenance(
      docId,
      irysIdBytes,
      false,
      "",
      "Initial version"
    );

    // 4. Emit event
    await this.eventBus.emitDocumentCreated(
      irysIdBytes,
      projectIdBytes,
      options.title
    );

    // 5. Invalidate query caches
    await this.cache.invalidatePattern(options.projectId);

    return docId;
  }

  /**
   * Get document by ID (with caching)
   */
  async getDocument(docId: string): Promise<Document | null> {
    await this.ensureInitialized();

    // Check cache first
    if (this.config.cache?.enabled) {
      const cached = await this.cache.getDocument<Document>(docId);
      if (cached) {
        console.log(`💾 Cache hit: ${docId}`);
        return cached;
      }
    }

    // Fetch from blockchain
    const doc = await this.documentRegistry.getDocument(docId);
    if (doc.owner === ethers.ZeroAddress) {
      return null;
    }

    // Fetch content from Irys
    const irysId = ethers.toUtf8String(doc.irysId).replace(/\x00/g, "");

    let content = "";
    try {
      const gatewayAddress = this.config.irys.network === "testnet"
        ? "https://gateway.irys.xyz/"
        : "https://gateway.irys.xyz/";

      const response = await fetch(`${gatewayAddress}${irysId}`);
      if (response.ok) {
        content = await response.text();
        console.log(`✅ Fetched content from Irys: ${irysId.substring(0, 8)}...`);
      } else {
        console.warn(`Failed to fetch from Irys gateway: ${response.status}`);
        content = "[Content not available]";
      }
    } catch (err) {
      console.warn("Failed to fetch content from Irys:", err);
      content = "[Content fetch error]";
    }

    const document: Document = {
      docId,
      irysId,
      owner: doc.owner,
      createdAt: Number(doc.createdAt),
      updatedAt: Number(doc.updatedAt),
      projectId: ethers.toUtf8String(doc.projectId).replace(/\x00/g, ""),
      title: doc.title,
      content,
      isPublic: doc.isPublic,
      status: doc.status,
      viewCount: doc.viewCount,
      tags: [], // Would need to fetch from tags mapping
    };

    // Cache the result
    if (this.config.cache?.enabled) {
      await this.cache.setDocument(docId, document, irysId);
    }

    return document;
  }

  /**
   * Update document
   */
  async updateDocument(
    docId: string,
    options: UpdateDocumentOptions
  ): Promise<void> {
    await this.ensureInitialized();

    console.log(`📝 Updating document: ${docId}`);

    // 1. Upload new content to Irys
    if (options.content) {
      const tags = [
        { name: "Content-Type", value: "text/plain" },
        { name: "App-Name", value: "DeBHuB" },
        { name: "Version-Of", value: docId },
        ...(options.tags || []).map((tag) => ({ name: "Tag", value: tag })),
      ];

      const receipt = await this.irysUploader.upload(options.content, { tags });
      const newIrysId = ethers.id(receipt.id);

      // 2. Update smart contract
      await this.documentRegistry.updateDocument(
        docId,
        newIrysId,
        options.title || ""
      );

      // 3. Add version to provenance
      await this.provenanceChain.addVersion(
        docId,
        newIrysId,
        options.changeDescription || "Updated",
        false,
        ""
      );

      // 4. Emit event
      await this.eventBus.emitDocumentUpdated(docId, newIrysId);
    }

    // 5. Invalidate cache
    await this.cache.invalidateDocument(docId);
    await this.cacheController.invalidateCache(ethers.id(docId));
  }

  /**
   * Search documents
   */
  async searchDocuments(options: SearchOptions): Promise<Document[]> {
    await this.ensureInitialized();

    const cacheKey = `search:${JSON.stringify(options)}`;

    // Check cache
    if (this.config.cache?.enabled) {
      const cached = await this.cache.getQuery<Document[]>(cacheKey);
      if (cached) {
        console.log(`💾 Query cache hit`);
        return cached;
      }
    }

    let docIds: string[] = [];

    if (options.owner) {
      docIds = await this.documentRegistry.getDocumentsByOwner(options.owner);
    } else if (options.projectId) {
      const projectIdBytes = ethers.id(options.projectId);
      docIds = await this.documentRegistry.getDocumentsByProject(
        projectIdBytes
      );
    } else if (options.tags && options.tags.length > 0) {
      const tagHash = ethers.id(options.tags[0]);
      docIds = await this.searchIndex.search(tagHash);
    }

    // Fetch documents
    const documents = await Promise.all(
      docIds.slice(0, options.limit || 10).map((id) => this.getDocument(id))
    );

    const results = documents.filter((doc): doc is Document => doc !== null);

    // Cache results
    if (this.config.cache?.enabled) {
      await this.cache.setQuery(cacheKey, results);
    }

    return results;
  }

  /**
   * Get document version history
   */
  async getVersionHistory(docId: string): Promise<Version[]> {
    await this.ensureInitialized();

    const entityId = ethers.id(docId);
    const versions = await this.provenanceChain.getVersionHistory(entityId);

    return versions.map((v: any) => ({
      irysId: ethers.toUtf8String(v.irysId).replace(/\x00/g, ""),
      author: v.author,
      timestamp: Number(v.timestamp),
      previousVersion: ethers.toUtf8String(v.previousVersion).replace(
        /\x00/g,
        ""
      ),
      changeDescription: v.changeDescription,
      aiGenerated: v.aiGenerated,
      aiModel: v.aiModel,
    }));
  }

  /**
   * Subscribe to document updates
   */
  onDocumentUpdate(
    docId: string,
    callback: (docId: string, newVersion: string) => void
  ): () => void {
    const listener = (
      eventDocId: string,
      author: string,
      newVersionId: string
    ) => {
      if (eventDocId === docId) {
        callback(eventDocId, newVersionId);
      }
    };

    this.eventBus.on("DocumentUpdated", listener);

    // Return unsubscribe function
    return () => {
      this.eventBus.off("DocumentUpdated", listener);
    };
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await this.cache.getStats();
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  // ==================== Vector DB & Semantic Search ====================

  /**
   * Create vector embedding for a document and store it
   * Enables semantic search and AI-powered document discovery
   */
  async createDocumentVector(
    docId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.ensureInitialized();

    if (!this.vectorClient || !this.vectorRegistry) {
      throw new Error("Vector DB not initialized. Please deploy VectorRegistry contract.");
    }

    // 1. Store vector on Irys
    const vectorRecord = await this.vectorClient.storeVector(
      docId,
      content,
      metadata
    );

    // 2. Register in VectorRegistry smart contract
    const docIdBytes = ethers.id(docId);
    const irysVectorIdBytes = ethers.id(vectorRecord.irysVectorId);
    const clusterIdBytes = ethers.id(vectorRecord.clusterId);

    await this.vectorRegistry.registerVector(
      docIdBytes,
      irysVectorIdBytes,
      vectorRecord.dimensions,
      vectorRecord.model,
      clusterIdBytes
    );

    console.log(`✅ Vector created for document: ${docId}`);
  }

  /**
   * Semantic search - find documents by meaning, not just keywords
   */
  async semanticSearch(
    query: string,
    options?: { limit?: number; threshold?: number; projectId?: string }
  ) {
    await this.ensureInitialized();

    if (!this.semanticSearchEngine) {
      throw new Error("Semantic search not available. Vector DB not initialized.");
    }

    return await this.semanticSearchEngine.search(query, options);
  }

  /**
   * Find documents similar to an existing document
   */
  async findSimilarDocuments(docId: string, options?: { limit?: number }) {
    await this.ensureInitialized();

    if (!this.semanticSearchEngine) {
      throw new Error("Semantic search not available. Vector DB not initialized.");
    }

    return await this.semanticSearchEngine.findSimilarDocuments(docId, options);
  }

  /**
   * Ask a question using RAG (Retrieval-Augmented Generation)
   */
  async askQuestion(question: string, options?: { maxContext?: number; projectId?: string }) {
    await this.ensureInitialized();

    if (!this.semanticSearchEngine) {
      throw new Error("Q&A not available. Vector DB not initialized.");
    }

    return await this.semanticSearchEngine.askQuestion(question, options);
  }

  /**
   * Get document suggestions based on content
   */
  async getDocumentSuggestions(
    content: string,
    options?: { limit?: number; excludeDocId?: string }
  ) {
    await this.ensureInitialized();

    if (!this.semanticSearchEngine) {
      throw new Error("Suggestions not available. Vector DB not initialized.");
    }

    return await this.semanticSearchEngine.getSuggestions(content, options);
  }

  /**
   * Check if Vector DB is available
   */
  isVectorDBAvailable(): boolean {
    return !!this.vectorClient && !!this.vectorRegistry && !!this.semanticSearchEngine;
  }

  // ==================== Private Helpers ====================

  /**
   * Ensure client is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }
}
