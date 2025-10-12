/**
 * IrysDatabase - Pure Irys DataChain Database
 *
 * No PostgreSQL, No API Server, No Backend!
 * Just Irys + IndexedDB caching
 */

import Query from '@irys/query';
import Uploader from '@irys/upload';
import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import {
  IrysTag,
  Project,
  ProjectInput,
  ProjectUpdate,
  Document,
  DocumentInput,
  DocumentUpdate,
  User,
  UserInput,
  Comment,
  CommentInput,
  SearchQuery,
  SearchResult,
  IrysError,
  IrysErrorCodes,
  WithIrysId
} from './irys-types';

const APP_NAME = 'DeBHuB';
const SCHEMA_VERSION = '1.0';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class IrysDatabase {
  private query: Query;
  private uploader: any | null = null;
  private cache: IDBPDatabase | null = null;
  private initialized = false;

  constructor() {
    this.query = new Query();
  }

  /**
   * Initialize database (IndexedDB cache)
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.cache = await openDB('DeBHuB', 1, {
        upgrade(db) {
          // Create object stores
          if (!db.objectStoreNames.contains('projects')) {
            db.createObjectStore('projects', { keyPath: 'entityId' });
          }
          if (!db.objectStoreNames.contains('documents')) {
            db.createObjectStore('documents', { keyPath: 'entityId' });
          }
          if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'entityId' });
          }
          if (!db.objectStoreNames.contains('comments')) {
            db.createObjectStore('comments', { keyPath: 'entityId' });
          }
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta');
          }
        }
      });

      this.initialized = true;
      console.log('✅ IrysDatabase initialized');
    } catch (error) {
      console.error('Failed to initialize IrysDatabase:', error);
      throw new IrysError(
        'Failed to initialize database',
        IrysErrorCodes.CACHE_ERROR,
        error
      );
    }
  }

  /**
   * Connect wallet and initialize uploader
   */
  async connectWallet(provider: any): Promise<void> {
    try {
      // @ts-ignore - Irys Uploader API
      this.uploader = await Uploader({ wallet: { provider } });
      console.log('✅ Wallet connected');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw new IrysError(
        'Failed to connect wallet',
        IrysErrorCodes.PERMISSION_DENIED,
        error
      );
    }
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  private ensureInitialized(): void {
    if (!this.initialized || !this.cache) {
      throw new IrysError(
        'Database not initialized. Call init() first.',
        IrysErrorCodes.CACHE_ERROR
      );
    }
  }

  private ensureUploader(): any {
    if (!this.uploader) {
      throw new IrysError(
        'Wallet not connected. Call connectWallet() first.',
        IrysErrorCodes.PERMISSION_DENIED
      );
    }
    return this.uploader;
  }

  private async getCached<T>(
    store: string,
    entityKey: string
  ): Promise<T | null> {
    this.ensureInitialized();
    try {
      const cached = await this.cache!.get(store, entityKey);
      if (cached && cached._cachedAt) {
        const age = Date.now() - cached._cachedAt;
        if (age < CACHE_TTL) {
          console.log(`✅ Cache HIT: ${store}/${entityKey} (${age}ms old)`);
          return cached as T;
        }
      }
      return null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  private async setCache<T>(
    store: string,
    _key: string,
    data: T
  ): Promise<void> {
    this.ensureInitialized();
    try {
      await this.cache!.put(store, {
        ...data,
        _cachedAt: Date.now()
      });
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  private async invalidateCache(store: string, key: string): Promise<void> {
    this.ensureInitialized();
    try {
      await this.cache!.delete(store, key);
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  private createTags(base: Record<string, string>): IrysTag[] {
    return Object.entries(base).map(([name, value]) => ({
      name,
      value
    }));
  }

  private sha256(content: string): string {
    // Simple hash for content verification
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return 'sha256:' + Math.abs(hash).toString(16);
  }

  // =========================================================================
  // Project Methods
  // =========================================================================

  async createProject(input: ProjectInput): Promise<WithIrysId<Project>> {
    const uploader = this.ensureUploader();
    const entityId = `proj-${uuidv4()}`;

    const projectData: Project = {
      entityType: 'project',
      entityId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      owner: input.owner,
      visibility: input.visibility || 'public',
      collaborators: [],
      settings: input.settings || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION
    };

    const tags = this.createTags({
      'App-Name': APP_NAME,
      'Entity-Type': 'project',
      'Entity-ID': entityId,
      'Slug': input.slug,
      'Owner': input.owner,
      'Visibility': projectData.visibility,
      'Created-At': Date.now().toString()
    });

    try {
      const receipt = await uploader.upload(JSON.stringify(projectData), {
        tags
      });

      const result: WithIrysId<Project> = {
        ...projectData,
        irysId: receipt.id,
        permanentUrl: `https://gateway.irys.xyz/${receipt.id}`
      };

      // Cache it
      await this.setCache('projects', entityId, result);

      console.log('✅ Project created:', result.name);
      return result;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw new IrysError(
        'Failed to create project',
        IrysErrorCodes.UPLOAD_FAILED,
        error
      );
    }
  }

  async getProjectById(entityId: string): Promise<WithIrysId<Project> | null> {
    // Check cache first
    const cached = await this.getCached<Project>('projects', entityId);
    if (cached) return cached as WithIrysId<Project>;

    try {
      const results = await this.query
        .search('irys:transactions')
        .tags([
          { name: 'App-Name', values: [APP_NAME] },
          { name: 'Entity-Type', values: ['project'] },
          { name: 'Entity-ID', values: [entityId] }
        ])
        .sort('DESC')
        .limit(1);

      if (results.length === 0) return null;

      const tx = results[0];
      const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
      const data = await response.json();

      const project: WithIrysId<Project> = {
        ...data,
        irysId: tx.id,
        permanentUrl: `https://gateway.irys.xyz/${tx.id}`
      };

      // Cache it
      await this.setCache('projects', entityId, project);

      return project;
    } catch (error) {
      console.error('Failed to get project:', error);
      throw new IrysError(
        'Failed to get project',
        IrysErrorCodes.QUERY_FAILED,
        error
      );
    }
  }

  async getProjectBySlug(slug: string): Promise<WithIrysId<Project> | null> {
    try {
      // Check cache first (by slug - need to scan)
      this.ensureInitialized();
      const allProjects = await this.cache!.getAll('projects');
      const cached = allProjects.find((p: any) => p.slug === slug);
      if (cached && Date.now() - cached._cachedAt < CACHE_TTL) {
        console.log('✅ Cache HIT: project by slug:', slug);
        return cached as WithIrysId<Project>;
      }

      // Query Irys
      console.log('❌ Cache MISS: querying Irys for slug:', slug);
      const results = await this.query
        .search('irys:transactions')
        .tags([
          { name: 'App-Name', values: [APP_NAME] },
          { name: 'Entity-Type', values: ['project'] },
          { name: 'Slug', values: [slug] }
        ])
        .sort('DESC')
        .limit(1);

      if (results.length === 0) return null;

      const tx = results[0];
      const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
      const data = await response.json();

      const project: WithIrysId<Project> = {
        ...data,
        irysId: tx.id,
        permanentUrl: `https://gateway.irys.xyz/${tx.id}`
      };

      // Cache it
      await this.setCache('projects', project.entityId, project);

      return project;
    } catch (error) {
      console.error('Failed to get project:', error);
      throw new IrysError(
        'Failed to get project',
        IrysErrorCodes.QUERY_FAILED,
        error
      );
    }
  }

  async getUserProjects(ownerAddress: string): Promise<WithIrysId<Project>[]> {
    try {
      const results = await this.query
        .search('irys:transactions')
        .tags([
          { name: 'App-Name', values: [APP_NAME] },
          { name: 'Entity-Type', values: ['project'] },
          { name: 'Owner', values: [ownerAddress] }
        ])
        .sort('DESC')
        .limit(100);

      // Get latest version of each project
      const latestProjects = new Map<string, WithIrysId<Project>>();

      for (const tx of results) {
        const entityIdTag = tx.tags.find((t: any) => t.name === 'Entity-ID');
        const entityId = entityIdTag?.value;

        if (entityId && !latestProjects.has(entityId)) {
          const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
          const data = await response.json();

          const project: WithIrysId<Project> = {
            ...data,
            irysId: tx.id,
            permanentUrl: `https://gateway.irys.xyz/${tx.id}`
          };

          latestProjects.set(entityId, project);

          // Cache each project
          await this.setCache('projects', entityId, project);
        }
      }

      return Array.from(latestProjects.values());
    } catch (error) {
      console.error('Failed to get user projects:', error);
      throw new IrysError(
        'Failed to get user projects',
        IrysErrorCodes.QUERY_FAILED,
        error
      );
    }
  }

  async updateProject(
    entityId: string,
    updates: ProjectUpdate
  ): Promise<WithIrysId<Project>> {
    const uploader = this.ensureUploader();

    // Get current version
    const cached = await this.getCached<Project>('projects', entityId);
    if (!cached) {
      throw new IrysError(
        'Project not found',
        IrysErrorCodes.NOT_FOUND
      );
    }

    const updatedProject: Project = {
      ...cached,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const tags = this.createTags({
      'App-Name': APP_NAME,
      'Entity-Type': 'project',
      'Entity-ID': entityId,
      'Slug': updatedProject.slug,
      'Owner': updatedProject.owner,
      'Updated-At': Date.now().toString()
    });

    try {
      const receipt = await uploader.upload(
        JSON.stringify(updatedProject),
        { tags }
      );

      const result: WithIrysId<Project> = {
        ...updatedProject,
        irysId: receipt.id,
        permanentUrl: `https://gateway.irys.xyz/${receipt.id}`
      };

      // Update cache
      await this.setCache('projects', entityId, result);

      console.log('✅ Project updated:', result.name);
      return result;
    } catch (error) {
      console.error('Failed to update project:', error);
      throw new IrysError(
        'Failed to update project',
        IrysErrorCodes.UPLOAD_FAILED,
        error
      );
    }
  }

  async deleteProject(
    entityId: string,
    deletedBy: string
  ): Promise<boolean> {
    const uploader = this.ensureUploader();

    const cached = await this.getCached<Project>('projects', entityId);
    if (!cached) {
      throw new IrysError('Project not found', IrysErrorCodes.NOT_FOUND);
    }

    const deletionMarker = {
      ...cached,
      deleted: true,
      deletedBy,
      deletedAt: new Date().toISOString()
    };

    const tags = this.createTags({
      'App-Name': APP_NAME,
      'Entity-Type': 'project',
      'Entity-ID': entityId,
      'Deleted': 'true',
      'Deleted-By': deletedBy
    });

    try {
      await uploader.upload(JSON.stringify(deletionMarker), { tags });

      // Remove from cache
      await this.invalidateCache('projects', entityId);

      console.log('✅ Project deleted:', entityId);
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw new IrysError(
        'Failed to delete project',
        IrysErrorCodes.UPLOAD_FAILED,
        error
      );
    }
  }

  // =========================================================================
  // Document Methods
  // =========================================================================

  async createDocument(
    input: DocumentInput
  ): Promise<WithIrysId<Document>> {
    const uploader = this.ensureUploader();
    const entityId = `doc-${uuidv4()}`;
    const contentHash = this.sha256(input.content);

    const documentData: Document = {
      entityType: 'document',
      entityId,
      projectId: input.projectId,
      path: input.path,
      title: input.title,
      content: input.content,
      contentHash,
      author: input.author,
      version: 1,
      tags: input.tags || [],
      metadata: input.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION
    };

    const tags = this.createTags({
      'App-Name': APP_NAME,
      'Entity-Type': 'document',
      'Entity-ID': entityId,
      'Project-ID': input.projectId,
      'Path': input.path,
      'Author': input.author,
      'Version': '1',
      'Content-Hash': contentHash,
      'Created-At': Date.now().toString()
    });

    try {
      const receipt = await uploader.upload(JSON.stringify(documentData), {
        tags
      });

      const result: WithIrysId<Document> = {
        ...documentData,
        irysId: receipt.id,
        permanentUrl: `https://gateway.irys.xyz/${receipt.id}`
      };

      // Cache it
      await this.setCache('documents', entityId, result);

      console.log('✅ Document created:', result.title);
      return result;
    } catch (error) {
      console.error('Failed to create document:', error);
      throw new IrysError(
        'Failed to create document',
        IrysErrorCodes.UPLOAD_FAILED,
        error
      );
    }
  }

  async getDocument(entityId: string): Promise<WithIrysId<Document> | null> {
    // Check cache
    const cached = await this.getCached<Document>('documents', entityId);
    if (cached) return cached as WithIrysId<Document>;

    try {
      const results = await this.query
        .search('irys:transactions')
        .tags([
          { name: 'App-Name', values: [APP_NAME] },
          { name: 'Entity-Type', values: ['document'] },
          { name: 'Entity-ID', values: [entityId] }
        ])
        .sort('DESC')
        .limit(1);

      if (results.length === 0) return null;

      const tx = results[0];
      const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
      const data = await response.json();

      const document: WithIrysId<Document> = {
        ...data,
        irysId: tx.id,
        permanentUrl: `https://gateway.irys.xyz/${tx.id}`
      };

      // Cache it
      await this.setCache('documents', entityId, document);

      return document;
    } catch (error) {
      console.error('Failed to get document:', error);
      throw new IrysError(
        'Failed to get document',
        IrysErrorCodes.QUERY_FAILED,
        error
      );
    }
  }

  async getProjectDocuments(
    projectId: string
  ): Promise<WithIrysId<Document>[]> {
    try {
      const results = await this.query
        .search('irys:transactions')
        .tags([
          { name: 'App-Name', values: [APP_NAME] },
          { name: 'Entity-Type', values: ['document'] },
          { name: 'Project-ID', values: [projectId] }
        ])
        .sort('DESC')
        .limit(1000);

      const latestDocs = new Map<string, WithIrysId<Document>>();

      for (const tx of results) {
        const entityIdTag = tx.tags.find((t: any) => t.name === 'Entity-ID');
        const entityId = entityIdTag?.value;

        if (entityId && !latestDocs.has(entityId)) {
          const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
          const data = await response.json();

          // Skip deleted documents
          if (data.deleted) continue;

          const doc: WithIrysId<Document> = {
            ...data,
            irysId: tx.id,
            permanentUrl: `https://gateway.irys.xyz/${tx.id}`
          };

          latestDocs.set(entityId, doc);

          // Cache it
          await this.setCache('documents', entityId, doc);
        }
      }

      return Array.from(latestDocs.values());
    } catch (error) {
      console.error('Failed to get project documents:', error);
      throw new IrysError(
        'Failed to get project documents',
        IrysErrorCodes.QUERY_FAILED,
        error
      );
    }
  }

  async updateDocument(
    entityId: string,
    updates: DocumentUpdate
  ): Promise<WithIrysId<Document>> {
    const uploader = this.ensureUploader();

    const cached = await this.getCached<Document>('documents', entityId);
    if (!cached) {
      throw new IrysError('Document not found', IrysErrorCodes.NOT_FOUND);
    }

    const newContent = updates.content || cached.content;
    const contentHash = this.sha256(newContent);
    const newVersion = cached.version + 1;

    const updatedDocument: Document = {
      ...cached,
      ...updates,
      content: newContent,
      contentHash,
      version: newVersion,
      previousVersion: cached.irysId,
      updatedAt: new Date().toISOString()
    };

    const tags = this.createTags({
      'App-Name': APP_NAME,
      'Entity-Type': 'document',
      'Entity-ID': entityId,
      'Project-ID': cached.projectId,
      'Version': newVersion.toString(),
      'Previous-Version': cached.irysId || '',
      'Content-Hash': contentHash
    });

    try {
      const receipt = await uploader.upload(
        JSON.stringify(updatedDocument),
        { tags }
      );

      const result: WithIrysId<Document> = {
        ...updatedDocument,
        irysId: receipt.id,
        permanentUrl: `https://gateway.irys.xyz/${receipt.id}`
      };

      // Update cache
      await this.setCache('documents', entityId, result);

      console.log('✅ Document updated:', result.title, 'v' + newVersion);
      return result;
    } catch (error) {
      console.error('Failed to update document:', error);
      throw new IrysError(
        'Failed to update document',
        IrysErrorCodes.UPLOAD_FAILED,
        error
      );
    }
  }

  async deleteDocument(
    entityId: string,
    deletedBy: string
  ): Promise<boolean> {
    const uploader = this.ensureUploader();

    const cached = await this.getCached<Document>('documents', entityId);
    if (!cached) {
      throw new IrysError('Document not found', IrysErrorCodes.NOT_FOUND);
    }

    const deletionMarker = {
      ...cached,
      deleted: true,
      deletedBy,
      deletedAt: new Date().toISOString(),
      version: cached.version + 1
    };

    const tags = this.createTags({
      'App-Name': APP_NAME,
      'Entity-Type': 'document',
      'Entity-ID': entityId,
      'Deleted': 'true',
      'Deleted-By': deletedBy
    });

    try {
      await uploader.upload(JSON.stringify(deletionMarker), { tags });

      // Remove from cache
      await this.invalidateCache('documents', entityId);

      console.log('✅ Document deleted:', entityId);
      return true;
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw new IrysError(
        'Failed to delete document',
        IrysErrorCodes.UPLOAD_FAILED,
        error
      );
    }
  }

  // =========================================================================
  // User Methods
  // =========================================================================

  async createUser(input: UserInput): Promise<WithIrysId<User>> {
    const uploader = this.ensureUploader();
    const entityId = `user-${input.address}`;

    const userData: User = {
      entityType: 'user',
      entityId,
      address: input.address,
      profile: {
        displayName: input.profile?.displayName,
        bio: input.profile?.bio,
        avatar: input.profile?.avatar
      },
      preferences: {
        theme: input.preferences?.theme || 'light',
        language: input.preferences?.language || 'en'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION
    };

    const tags = this.createTags({
      'App-Name': APP_NAME,
      'Entity-Type': 'user',
      'Entity-ID': entityId,
      'Address': input.address,
      'Created-At': Date.now().toString()
    });

    try {
      const receipt = await uploader.upload(JSON.stringify(userData), {
        tags
      });

      const result: WithIrysId<User> = {
        ...userData,
        irysId: receipt.id,
        permanentUrl: `https://gateway.irys.xyz/${receipt.id}`
      };

      // Cache it
      await this.setCache('users', entityId, result);

      console.log('✅ User created:', result.address);
      return result;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new IrysError(
        'Failed to create user',
        IrysErrorCodes.UPLOAD_FAILED,
        error
      );
    }
  }

  async getUser(address: string): Promise<WithIrysId<User> | null> {
    const entityId = `user-${address}`;

    // Check cache
    const cached = await this.getCached<User>('users', entityId);
    if (cached) return cached as WithIrysId<User>;

    try {
      const results = await this.query
        .search('irys:transactions')
        .tags([
          { name: 'App-Name', values: [APP_NAME] },
          { name: 'Entity-Type', values: ['user'] },
          { name: 'Address', values: [address] }
        ])
        .sort('DESC')
        .limit(1);

      if (results.length === 0) return null;

      const tx = results[0];
      const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
      const data = await response.json();

      const user: WithIrysId<User> = {
        ...data,
        irysId: tx.id,
        permanentUrl: `https://gateway.irys.xyz/${tx.id}`
      };

      // Cache it
      await this.setCache('users', entityId, user);

      return user;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw new IrysError(
        'Failed to get user',
        IrysErrorCodes.QUERY_FAILED,
        error
      );
    }
  }

  async updateUser(
    address: string,
    updates: Partial<UserInput>
  ): Promise<WithIrysId<User>> {
    const uploader = this.ensureUploader();
    const entityId = `user-${address}`;

    const cached = await this.getCached<User>('users', entityId);
    if (!cached) {
      throw new IrysError('User not found', IrysErrorCodes.NOT_FOUND);
    }

    const updatedUser: User = {
      ...cached,
      profile: {
        ...cached.profile,
        ...updates.profile
      },
      preferences: {
        ...cached.preferences,
        ...updates.preferences
      },
      updatedAt: new Date().toISOString()
    };

    const tags = this.createTags({
      'App-Name': APP_NAME,
      'Entity-Type': 'user',
      'Entity-ID': entityId,
      'Address': address,
      'Updated-At': Date.now().toString()
    });

    try {
      const receipt = await uploader.upload(JSON.stringify(updatedUser), {
        tags
      });

      const result: WithIrysId<User> = {
        ...updatedUser,
        irysId: receipt.id,
        permanentUrl: `https://gateway.irys.xyz/${receipt.id}`
      };

      // Update cache
      await this.setCache('users', entityId, result);

      console.log('✅ User updated:', result.address);
      return result;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw new IrysError(
        'Failed to update user',
        IrysErrorCodes.UPLOAD_FAILED,
        error
      );
    }
  }

  // =========================================================================
  // Comment Methods
  // =========================================================================

  async createComment(input: CommentInput): Promise<WithIrysId<Comment>> {
    const uploader = this.ensureUploader();
    const entityId = `comment-${uuidv4()}`;

    const commentData: Comment = {
      entityType: 'comment',
      entityId,
      documentId: input.documentId,
      content: input.content,
      author: input.author,
      parentId: input.parentId,
      position: input.position,
      resolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION
    };

    const tags = this.createTags({
      'App-Name': APP_NAME,
      'Entity-Type': 'comment',
      'Entity-ID': entityId,
      'Document-ID': input.documentId,
      'Author': input.author,
      'Parent-ID': input.parentId || 'none',
      'Created-At': Date.now().toString()
    });

    try {
      const receipt = await uploader.upload(JSON.stringify(commentData), {
        tags
      });

      const result: WithIrysId<Comment> = {
        ...commentData,
        irysId: receipt.id,
        permanentUrl: `https://gateway.irys.xyz/${receipt.id}`
      };

      // Cache it
      await this.setCache('comments', entityId, result);

      console.log('✅ Comment created');
      return result;
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw new IrysError(
        'Failed to create comment',
        IrysErrorCodes.UPLOAD_FAILED,
        error
      );
    }
  }

  async getDocumentComments(
    documentId: string
  ): Promise<WithIrysId<Comment>[]> {
    try {
      const results = await this.query
        .search('irys:transactions')
        .tags([
          { name: 'App-Name', values: [APP_NAME] },
          { name: 'Entity-Type', values: ['comment'] },
          { name: 'Document-ID', values: [documentId] }
        ])
        .sort('DESC')
        .limit(500);

      const latestComments = new Map<string, WithIrysId<Comment>>();

      for (const tx of results) {
        const entityIdTag = tx.tags.find((t: any) => t.name === 'Entity-ID');
        const entityId = entityIdTag?.value;

        if (entityId && !latestComments.has(entityId)) {
          const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
          const data = await response.json();

          const comment: WithIrysId<Comment> = {
            ...data,
            irysId: tx.id,
            permanentUrl: `https://gateway.irys.xyz/${tx.id}`
          };

          latestComments.set(entityId, comment);

          // Cache it
          await this.setCache('comments', entityId, comment);
        }
      }

      return Array.from(latestComments.values());
    } catch (error) {
      console.error('Failed to get document comments:', error);
      throw new IrysError(
        'Failed to get document comments',
        IrysErrorCodes.QUERY_FAILED,
        error
      );
    }
  }

  async resolveComment(
    entityId: string,
    resolvedBy: string
  ): Promise<WithIrysId<Comment>> {
    const uploader = this.ensureUploader();

    const cached = await this.getCached<Comment>('comments', entityId);
    if (!cached) {
      throw new IrysError('Comment not found', IrysErrorCodes.NOT_FOUND);
    }

    const resolvedComment: Comment = {
      ...cached,
      resolved: true,
      resolvedBy,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const tags = this.createTags({
      'App-Name': APP_NAME,
      'Entity-Type': 'comment',
      'Entity-ID': entityId,
      'Resolved': 'true',
      'Resolved-By': resolvedBy
    });

    try {
      const receipt = await uploader.upload(JSON.stringify(resolvedComment), {
        tags
      });

      const result: WithIrysId<Comment> = {
        ...resolvedComment,
        irysId: receipt.id,
        permanentUrl: `https://gateway.irys.xyz/${receipt.id}`
      };

      // Update cache
      await this.setCache('comments', entityId, result);

      console.log('✅ Comment resolved');
      return result;
    } catch (error) {
      console.error('Failed to resolve comment:', error);
      throw new IrysError(
        'Failed to resolve comment',
        IrysErrorCodes.UPLOAD_FAILED,
        error
      );
    }
  }

  // =========================================================================
  // Search Methods
  // =========================================================================

  async search(query: SearchQuery): Promise<SearchResult> {
    try {
      const tags: Array<{ name: string; values: string[] }> = [
        { name: 'App-Name', values: [APP_NAME] }
      ];

      if (query.entityType && query.entityType.length > 0) {
        tags.push({ name: 'Entity-Type', values: query.entityType });
      }

      if (query.owner) {
        tags.push({ name: 'Owner', values: [query.owner] });
      }

      if (query.projectId) {
        tags.push({ name: 'Project-ID', values: [query.projectId] });
      }

      if (query.visibility) {
        tags.push({ name: 'Visibility', values: [query.visibility] });
      }

      const results = await this.query
        .search('irys:transactions')
        .tags(tags)
        .sort('DESC')
        .limit(query.limit || 50);

      const items = [];
      for (const tx of results) {
        const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
        const data = await response.json();

        items.push({
          ...data,
          irysId: tx.id,
          permanentUrl: `https://gateway.irys.xyz/${tx.id}`
        });
      }

      return {
        items,
        total: items.length,
        hasMore: results.length === (query.limit || 50)
      };
    } catch (error) {
      console.error('Search failed:', error);
      throw new IrysError(
        'Search failed',
        IrysErrorCodes.QUERY_FAILED,
        error
      );
    }
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  async clearCache(): Promise<void> {
    this.ensureInitialized();
    try {
      await this.cache!.clear('projects');
      await this.cache!.clear('documents');
      await this.cache!.clear('users');
      await this.cache!.clear('comments');
      console.log('✅ Cache cleared');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  async getCacheStats(): Promise<{
    projects: number;
    documents: number;
    users: number;
    comments: number;
  }> {
    this.ensureInitialized();
    return {
      projects: (await this.cache!.getAll('projects')).length,
      documents: (await this.cache!.getAll('documents')).length,
      users: (await this.cache!.getAll('users')).length,
      comments: (await this.cache!.getAll('comments')).length
    };
  }
}

// Singleton instance
export const irysDb = new IrysDatabase();
