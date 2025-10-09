/**
 * Irys-Only Type Definitions
 *
 * Pure Irys DataChain types - No PostgreSQL!
 */

// ============================================================================
// Core Irys Types
// ============================================================================

export interface IrysTag {
  name: string;
  value: string;
}

export interface IrysTransaction {
  id: string;
  tags: IrysTag[];
  timestamp: number;
  owner: string;
}

export interface IrysEntity {
  entityType: string;
  entityId: string;
  irysId?: string;
  permanentUrl?: string;
  createdAt: string;
  updatedAt?: string;
  schemaVersion: string;
}

// ============================================================================
// User Entity
// ============================================================================

export interface User extends IrysEntity {
  entityType: 'user';
  address: string;
  profile: UserProfile;
  preferences: UserPreferences;
}

export interface UserProfile {
  displayName?: string;
  bio?: string;
  avatar?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
}

export interface UserInput {
  address: string;
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
}

// ============================================================================
// Project Entity
// ============================================================================

export interface Project extends IrysEntity {
  entityType: 'project';
  name: string;
  slug: string;
  description?: string;
  owner: string;
  visibility: 'public' | 'private' | 'unlisted';
  collaborators: Collaborator[];
  settings?: ProjectSettings;
}

export interface Collaborator {
  address: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  addedAt: string;
  addedBy: string;
}

export interface ProjectSettings {
  defaultLanguage?: string;
  enableComments?: boolean;
  [key: string]: any;
}

export interface ProjectInput {
  name: string;
  slug: string;
  description?: string;
  owner: string;
  visibility?: 'public' | 'private' | 'unlisted';
  settings?: ProjectSettings;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  settings?: ProjectSettings;
}

// ============================================================================
// Document Entity
// ============================================================================

export interface Document extends IrysEntity {
  entityType: 'document';
  projectId: string;
  path: string;
  title: string;
  content: string;
  contentHash: string;
  author: string;
  version: number;
  previousVersion?: string;
  tags: string[];
  metadata: DocumentMetadata;
  deleted?: boolean;
  deletedBy?: string;
  deletedAt?: string;
}

export interface DocumentMetadata {
  wordCount?: number;
  readingTime?: string;
  language?: string;
  [key: string]: any;
}

export interface DocumentInput {
  projectId: string;
  path: string;
  title: string;
  content: string;
  author: string;
  tags?: string[];
  metadata?: DocumentMetadata;
}

export interface DocumentUpdate {
  title?: string;
  content?: string;
  tags?: string[];
  metadata?: DocumentMetadata;
}

export interface DocumentVersion extends Document {
  versionNumber: number;
  changelog?: string;
}

// ============================================================================
// Comment Entity
// ============================================================================

export interface Comment extends IrysEntity {
  entityType: 'comment';
  documentId: string;
  content: string;
  author: string;
  parentId?: string;
  position?: CommentPosition;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface CommentPosition {
  line: number;
  column: number;
  selection?: string;
}

export interface CommentInput {
  documentId: string;
  content: string;
  author: string;
  parentId?: string;
  position?: CommentPosition;
}

// ============================================================================
// Search & Query Types
// ============================================================================

export interface SearchQuery {
  entityType?: string[];
  owner?: string;
  projectId?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  tags?: string[];
  keyword?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  forceRefresh?: boolean;
}

// ============================================================================
// Upload Types
// ============================================================================

export interface UploadOptions {
  tags?: IrysTag[];
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  id: string;
  permanentUrl: string;
  size: number;
  timestamp: number;
}

// ============================================================================
// Error Types
// ============================================================================

export class IrysError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'IrysError';
  }
}

export const IrysErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  QUERY_FAILED: 'QUERY_FAILED',
  INVALID_DATA: 'INVALID_DATA',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  CACHE_ERROR: 'CACHE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

// ============================================================================
// Utility Types
// ============================================================================

export type EntityType = 'user' | 'project' | 'document' | 'comment';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithIrysId<T> = T & {
  irysId: string;
  permanentUrl: string;
};
