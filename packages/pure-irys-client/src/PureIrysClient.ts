import { ethers, Contract, Signer } from "ethers";
import Irys from "@irys/upload";
import Query from "@irys/query";
import { IndexedDBCache } from "./cache/IndexedDBCache";
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
  private irys!: any; // Irys type
  private query!: any; // Query type
  private cache: IndexedDBCache;
  private config: PureIrysClientConfig;

  // Smart contracts
  private documentRegistry!: Contract;
  private accessControl!: Contract;
  private provenanceChain!: Contract;
  private eventBus!: Contract;
  private cacheController!: Contract;
  private searchIndex!: Contract;

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

    // Initialize Irys uploader (will be initialized when needed)
    try {
      // @ts-ignore - Irys types are incomplete
      this.irys = new (Irys as any)({
        network: this.config.irys.network,
        token: this.config.irys.token,
        key: this.signer,
      });
    } catch (err) {
      console.warn("Irys uploader initialization deferred:", err);
    }

    // Initialize Irys query (will be initialized when needed)
    try {
      // @ts-ignore - Irys query types are incomplete
      this.query = new (Query as any)({ network: this.config.irys.network });
    } catch (err) {
      console.warn("Irys query initialization deferred:", err);
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

    const receipt = await this.irys.upload(options.content, { tags });
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

    // Fetch content from Irys (simplified for now)
    const irysId = ethers.toUtf8String(doc.irysId).replace(/\x00/g, "");

    // TODO: Fetch actual content from Irys
    let content = "";
    try {
      // const txData = await this.query.search("irys:transactions").ids([irysId]);
      // content = txData[0]?.data || "";
      content = "[Content stored on Irys]"; // Placeholder
    } catch (err) {
      console.warn("Failed to fetch content from Irys:", err);
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

      const receipt = await this.irys.upload(options.content, { tags });
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

  /**
   * Ensure client is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }
}
