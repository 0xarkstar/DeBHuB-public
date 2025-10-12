import { IrysService } from './irys';
import { prisma } from './database';
import { PrismaClient, Post, User } from '@prisma/client';

/**
 * Enhanced Database Service for DeBHuB post management
 * Adapted to work with the existing Prisma schema
 */
export class DatabaseService {
  constructor(
    private irysService: IrysService,
    private prisma: PrismaClient = prisma
  ) {}

  async initialize(): Promise<void> {
    // Test database connection
    try {
      await this.prisma.$connect();
      console.log('✅ Database service initialized');
    } catch (error) {
      console.error('❌ Database service initialization failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Post Management Operations
   */
  async createPost(data: CreatePostData): Promise<Post> {
    const contentHash = this.generateContentHash(data.content);
    
    const post = await this.prisma.post.create({
      data: {
        irysTransactionId: `temp_${Date.now()}_${Math.random().toString(36)}`,
        content: data.content,
        authorAddress: data.authorAddress,
        version: data.version || 1,
        previousVersionId: data.previousVersionId,
        timestamp: new Date(),
      },
    });

    // Store permanently on Irys
    try {
      const irysResult = await this.irysService.uploadData(data.content, [
        { name: 'Content-Type', value: 'text/plain' },
        { name: 'Entity-Type', value: 'post' },
        { name: 'Post-Id', value: post.id },
        { name: 'Version', value: post.version.toString() },
        { name: 'Author', value: data.authorAddress },
        { name: 'Content-Hash', value: contentHash },
      ]);

      // Update with Irys transaction ID
      return this.prisma.post.update({
        where: { id: post.id },
        data: {
          irysTransactionId: irysResult.id,
        },
      });
    } catch (error) {
      console.error('Failed to upload to Irys:', error);
      return post;
    }
  }

  async updatePost(id: string, data: Partial<UpdatePostData>): Promise<Post> {
    return this.prisma.post.update({
      where: { id },
      data: {
        ...(data.content && { content: data.content }),
        ...(data.version && { version: data.version }),
        updatedAt: new Date(),
      },
    });
  }

  async getPost(id: string): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: { id },
    });
  }

  async getPostsByAuthor(authorAddress: string, options: QueryOptions = {}): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: { authorAddress },
      orderBy: { timestamp: 'desc' },
      take: options.limit,
      skip: options.offset,
    });
  }

  async searchPosts(query: string, options: QueryOptions = {}): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: {
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: { timestamp: 'desc' },
      take: options.limit || 20,
      skip: options.offset,
    });
  }

  /**
   * User Management Operations
   */
  async createUser(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        address: data.address,
        role: data.role,
      },
    });
  }

  async getUser(address: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { address },
    });
  }

  async getOrCreateUser(address: string, role?: string): Promise<User> {
    let user = await this.getUser(address);
    
    if (!user) {
      user = await this.createUser({ address, role });
    }
    
    return user;
  }

  /**
   * Sync Status Operations
   */
  async updateSyncStatus(syncType: string, blockNumber: bigint): Promise<void> {
    await this.prisma.syncStatus.upsert({
      where: { syncType },
      update: {
        lastSyncedBlock: blockNumber,
        lastSyncTime: new Date(),
        isHealthy: true,
      },
      create: {
        syncType,
        lastSyncedBlock: blockNumber,
        lastSyncTime: new Date(),
        isHealthy: true,
      },
    });
  }

  async getSyncStatus(syncType: string) {
    return this.prisma.syncStatus.findUnique({
      where: { syncType },
    });
  }

  /**
   * Contract Event Operations
   */
  async recordContractEvent(eventData: ContractEventData) {
    return this.prisma.contractEvent.create({
      data: {
        eventName: eventData.eventName,
        contractAddress: eventData.contractAddress,
        blockNumber: eventData.blockNumber,
        transactionHash: eventData.transactionHash,
        logIndex: eventData.logIndex,
        args: eventData.args,
        processed: false,
      },
    });
  }

  async getUnprocessedEvents(eventName?: string) {
    return this.prisma.contractEvent.findMany({
      where: {
        processed: false,
        ...(eventName && { eventName }),
      },
      orderBy: { blockNumber: 'asc' },
    });
  }

  async markEventProcessed(id: string) {
    return this.prisma.contractEvent.update({
      where: { id },
      data: { processed: true },
    });
  }

  /**
   * Utility methods
   */
  private generateContentHash(content: string): string {
    // Simple hash implementation - in production, use crypto
    return Buffer.from(content).toString('base64').slice(0, 32);
  }

  // Stub methods for enhanced resolvers compatibility
  async getProjectDocuments(projectId: string, options: QueryOptions = {}): Promise<any[]> {
    // Fallback to posts for now
    return this.prisma.post.findMany({
      where: { authorAddress: projectId }, // Using authorAddress as project fallback
      take: options.limit,
      skip: options.offset,
    });
  }

  async getDocumentHistory(documentId: string): Promise<any[]> {
    // Return post versions (simplified)
    return this.prisma.post.findMany({
      where: { id: documentId },
      orderBy: { version: 'desc' },
    });
  }

  async createProject(data: any): Promise<any> {
    // Fallback implementation - create a user instead
    return this.createUser({
      address: data.ownerId || 'unknown',
      role: 'owner',
    });
  }

  async createDocument(data: any): Promise<any> {
    // Fallback to creating a post
    return this.createPost({
      content: data.content || '',
      authorAddress: data.authorId || 'unknown',
    });
  }

  async createVersion(data: any): Promise<any> {
    // Create a new post version
    return this.createPost({
      content: data.content,
      authorAddress: data.authorId,
      version: data.versionNumber,
    });
  }

  async addCollaborator(data: any): Promise<any> {
    // Fallback - create user
    return this.createUser({
      address: data.userId,
      role: data.role,
    });
  }

  async createComment(data: any): Promise<any> {
    // Create a post as comment fallback
    return this.createPost({
      content: data.content,
      authorAddress: data.authorId,
    });
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Type definitions adapted for the current Prisma schema
export interface CreatePostData {
  content: string;
  authorAddress: string;
  version?: number;
  previousVersionId?: string;
}

export interface UpdatePostData {
  content?: string;
  version?: number;
}

export interface CreateUserData {
  address: string;
  role?: string;
}

export interface ContractEventData {
  eventName: string;
  contractAddress: string;
  blockNumber: bigint;
  transactionHash: string;
  logIndex: number;
  args: any;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  includeVersions?: boolean;
  includeComments?: boolean;
  includeDeleted?: boolean;
}