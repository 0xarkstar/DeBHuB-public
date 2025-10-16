/**
 * Type definitions for Pure Irys Client
 */

// ==================== Configuration ====================

export interface ContractAddresses {
  documentRegistry: string;
  accessControl: string;
  provenanceChain: string;
  eventBus: string;
  cacheController: string;
  searchIndex: string;
  vectorRegistry?: string; // Optional: Vector DB for AI features
}

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
}

export interface IrysConfig {
  network: "testnet" | "mainnet";
  token: string;
  providerUrl?: string;
}

export interface CacheConfig {
  ttl?: number;
  enabled?: boolean;
}

export interface AIConfig {
  openaiApiKey?: string; // OpenAI API key for embeddings
  embeddingModel?: string; // Default: "text-embedding-3-small"
}

export interface PureIrysClientConfig {
  contracts: ContractAddresses;
  network: NetworkConfig;
  irys: IrysConfig;
  cache?: CacheConfig;
  ai?: AIConfig; // AI features configuration
}

// ==================== Document Types ====================

export interface Document {
  docId: string;
  irysId: string;
  owner: string;
  createdAt: number;
  updatedAt: number;
  projectId: string;
  title: string;
  content: string;
  isPublic: boolean;
  status: DocumentStatus;
  viewCount: bigint;
  tags: string[];
}

export enum DocumentStatus {
  Draft = 0,
  Published = 1,
  Archived = 2,
}

export interface CreateDocumentOptions {
  projectId: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateDocumentOptions {
  title?: string;
  content?: string;
  tags?: string[];
  changeDescription?: string;
}

export interface SearchOptions {
  owner?: string;
  projectId?: string;
  tags?: string[];
  limit?: number;
}

// ==================== Provenance Types ====================

export interface Version {
  irysId: string;
  author: string;
  timestamp: number;
  previousVersion: string;
  changeDescription: string;
  aiGenerated: boolean;
  aiModel: string;
}

export interface ProvenanceRecord {
  entityId: string;
  irysId: string;
  previousVersion: string;
  changeDescription: string;
  aiGenerated: boolean;
  aiModel: string;
  author: string;
  timestamp: number;
}
