import { IrysService } from './irys';
import { prisma } from './database';
import { PrismaClient } from '@prisma/client';

/**
 * Enhanced Database Service for IrysBook document management
 * Implements the specialized document database schema from the plan
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
   * Document Management Operations for IrysBook
   */
  async createProject(data: CreateProjectData): Promise<Project> {
    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        ownerId: data.ownerId,
        organizationId: data.organizationId,
        visibility: data.visibility,
        settings: data.settings as any,
        // Irys metadata will be added after permanent storage
        irysId: '',
        permanentUrl: '',
      },
    });

    // Store permanently on Irys
    const irysResult = await this.irysService.uploadData(JSON.stringify({
      type: 'project',
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      settings: project.settings,
    }), [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Entity-Type', value: 'project' },
      { name: 'Project-Id', value: project.id },
    ]);

    // Update with Irys metadata
    return this.prisma.project.update({
      where: { id: project.id },
      data: {
        irysId: irysResult.id,
        permanentUrl: `https://gateway.irys.xyz/${irysResult.id}`,
      },
    });
  }

  async createDocument(data: CreateDocumentData): Promise<Document> {
    const contentHash = this.generateContentHash(data.content);
    
    const document = await this.prisma.document.create({
      data: {
        projectId: data.projectId,
        path: data.path,
        title: data.title,
        content: data.content,
        contentHash,
        authorId: data.authorId,
        version: 1,
        parentId: data.parentId,
        order: data.order || 0,
        metadata: data.metadata as any,
        // Irys fields will be updated after permanent storage
        irysId: '',
        irysProof: '',
      },
    });

    // Store permanently on Irys with version proof
    const irysResult = await this.irysService.uploadData(data.content, [
      { name: 'Content-Type', value: 'text/markdown' },
      { name: 'Entity-Type', value: 'document' },
      { name: 'Project-Id', value: data.projectId },
      { name: 'Document-Id', value: document.id },
      { name: 'Version', value: '1' },
      { name: 'Author', value: data.authorId },
      { name: 'Content-Hash', value: contentHash },
    ]);

    // Update with Irys proof
    return this.prisma.document.update({
      where: { id: document.id },
      data: {
        irysId: irysResult.id,
        irysProof: `https://gateway.irys.xyz/${irysResult.id}`,
      },
    });
  }

  async createVersion(data: CreateVersionData): Promise<Version> {
    const contentDiff = this.calculateDiff(data.previousContent || '', data.content);
    
    const version = await this.prisma.version.create({
      data: {
        documentId: data.documentId,
        versionNumber: data.versionNumber,
        content: data.content,
        contentDiff,
        authorId: data.authorId,
        commitMessage: data.commitMessage,
        // Blockchain proof fields
        irysId: '',
        blockHeight: 0,
        signature: '',
      },
    });

    // Store version proof on Irys blockchain
    const proofData = {
      documentId: data.documentId,
      version: data.versionNumber,
      contentHash: this.generateContentHash(data.content),
      author: data.authorId,
      timestamp: Date.now(),
      commitMessage: data.commitMessage,
    };

    const irysResult = await this.irysService.uploadData(
      JSON.stringify(proofData), 
      [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Entity-Type', value: 'version' },
        { name: 'Document-Id', value: data.documentId },
        { name: 'Version', value: data.versionNumber.toString() },
        { name: 'Author', value: data.authorId },
      ]
    );

    // Update with blockchain proof
    return this.prisma.version.update({
      where: { id: version.id },
      data: {
        irysId: irysResult.id,
        blockHeight: 0, // Will be updated by blockchain service
        signature: '', // Will be updated with author signature
      },
    });
  }

  /**
   * Collaboration Management
   */
  async addCollaborator(data: AddCollaboratorData): Promise<Collaborator> {
    return this.prisma.collaborator.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        role: data.role,
        permissions: data.permissions as any,
        invitedBy: data.invitedBy,
        acceptedAt: data.acceptedAt,
      },
    });
  }

  async createComment(data: CreateCommentData): Promise<Comment> {
    const comment = await this.prisma.comment.create({
      data: {
        documentId: data.documentId,
        versionId: data.versionId,
        authorId: data.authorId,
        content: data.content,
        lineStart: data.lineStart,
        lineEnd: data.lineEnd,
        resolved: false,
        threadId: data.threadId,
      },
    });

    // Optionally store comment on Irys for permanence
    if (data.permanent) {
      const irysResult = await this.irysService.uploadData(
        JSON.stringify({
          type: 'comment',
          documentId: data.documentId,
          content: data.content,
          author: data.authorId,
          timestamp: comment.createdAt,
        }),
        [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'Entity-Type', value: 'comment' },
          { name: 'Document-Id', value: data.documentId },
        ]
      );
      
      // Could store irysId reference in comment if needed
    }

    return comment;
  }

  /**
   * Query Operations
   */
  async getProjectDocuments(projectId: string, options: QueryOptions = {}): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { 
        projectId,
        ...(options.includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
      take: options.limit,
      skip: options.offset,
      include: {
        versions: options.includeVersions ? {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        } : false,
        comments: options.includeComments ? true : false,
      },
    });
  }

  async getDocumentHistory(documentId: string): Promise<Version[]> {
    return this.prisma.version.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      include: {
        author: true,
      },
    });
  }

  /**
   * Utility methods
   */
  private generateContentHash(content: string): string {
    // Simple hash implementation - in production, use crypto
    return Buffer.from(content).toString('base64').slice(0, 32);
  }

  private calculateDiff(oldContent: string, newContent: string): string {
    // Simple diff implementation - in production, use a proper diff library
    if (oldContent === newContent) return '';
    return `@@ -1,${oldContent.split('\n').length} +1,${newContent.split('\n').length} @@`;
  }
}

// Type definitions based on the plan's database schema
export interface CreateProjectData {
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  organizationId?: string;
  visibility: 'public' | 'private' | 'unlisted';
  settings: ProjectSettings;
}

export interface CreateDocumentData {
  projectId: string;
  path: string;
  title: string;
  content: string;
  authorId: string;
  parentId?: string;
  order?: number;
  metadata: DocumentMetadata;
}

export interface CreateVersionData {
  documentId: string;
  versionNumber: number;
  content: string;
  previousContent?: string;
  authorId: string;
  commitMessage: string;
}

export interface AddCollaboratorData {
  projectId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'reviewer' | 'viewer';
  permissions: string[];
  invitedBy: string;
  acceptedAt?: Date;
}

export interface CreateCommentData {
  documentId: string;
  versionId?: string;
  authorId: string;
  content: string;
  lineStart?: number;
  lineEnd?: number;
  threadId?: string;
  permanent?: boolean;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
  includeVersions?: boolean;
  includeComments?: boolean;
}

export interface ProjectSettings {
  allowContributions?: boolean;
  rewardContributors?: boolean;
  languages?: string[];
  theme?: string;
  customDomain?: string;
}

export interface DocumentMetadata {
  description?: string;
  keywords?: string[];
  readingTime?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  lastModifiedBy?: string;
}

// Prisma model types (these should match your actual Prisma schema)
export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  organizationId?: string;
  visibility: string;
  settings: any;
  irysId: string;
  permanentUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  projectId: string;
  path: string;
  title: string;
  content: string;
  contentHash: string;
  authorId: string;
  version: number;
  parentId?: string;
  order: number;
  metadata: any;
  irysId: string;
  irysProof: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  deletedAt?: Date;
}

export interface Version {
  id: string;
  documentId: string;
  versionNumber: number;
  content: string;
  contentDiff: string;
  authorId: string;
  commitMessage: string;
  irysId: string;
  blockHeight: number;
  signature: string;
  timestamp: Date;
}

export interface Collaborator {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  permissions: any;
  invitedBy: string;
  acceptedAt?: Date;
  createdAt: Date;
}

export interface Comment {
  id: string;
  documentId: string;
  versionId?: string;
  authorId: string;
  content: string;
  lineStart?: number;
  lineEnd?: number;
  resolved: boolean;
  resolvedBy?: string;
  threadId?: string;
  createdAt: Date;
  updatedAt: Date;
}