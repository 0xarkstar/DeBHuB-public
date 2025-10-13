/**
 * Type definitions for Pure Irys BaaS Client
 */

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
  DRAFT = 0,
  PUBLISHED = 1,
  ARCHIVED = 2,
  DELETED = 3,
}

export enum Permission {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  ADMIN = 3,
  OWNER = 4,
}

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
  originalAuthor: string;
  createdAt: number;
  versionCount: number;
  latestVersion: string;
  isLocked: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  irysId?: string;
}

export interface SearchOptions {
  tags?: string[];
  status?: DocumentStatus;
  owner?: string;
  projectId?: string;
  limit?: number;
  offset?: number;
}

export interface CreateDocumentOptions {
  projectId: string;
  title: string;
  content: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateDocumentOptions {
  title?: string;
  content?: string;
  tags?: string[];
  changeDescription?: string;
}

export interface ContractAddresses {
  documentRegistry: string;
  accessControl: string;
  provenanceChain: string;
  eventBus: string;
  cacheController: string;
  searchIndex: string;
}

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
}

export interface IrysConfig {
  network: "mainnet" | "testnet";
  token: string;
  providerUrl?: string;
}

export interface PureIrysClientConfig {
  contracts: ContractAddresses;
  network: NetworkConfig;
  irys: IrysConfig;
  cache?: {
    ttl?: number; // milliseconds
    enabled?: boolean;
  };
}
