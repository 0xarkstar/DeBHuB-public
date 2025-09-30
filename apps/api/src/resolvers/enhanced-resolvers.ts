import { PubSub } from 'graphql-subscriptions';
import { PrismaClient } from '@prisma/client';
import { IrysService } from '../services/irys';
import { BlockchainService } from '../services/blockchain';
import { DatabaseService } from '../services/database-service';
import { StorageService } from '../services/storage-service';
import { RealtimeService } from '../services/realtime-service';
import { VectorDBService } from '../services/vector-db-service';
import { FunctionService } from '../services/function-service';
import { SearchService } from '../services/search-service';
import { AnalyticsService } from '../services/analytics-service';
import { ProgrammableDataService } from '../services/programmable-data-service';
import { requireAuth, AuthContext } from '../services/auth';

/**
 * Enhanced GraphQL Resolvers for IrysBase Platform
 * Implements the complete document management system from the plan
 */

const pubsub = new PubSub();

// Event constants
const DOCUMENT_CHANGED = 'DOCUMENT_CHANGED';
const PROJECT_UPDATED = 'PROJECT_UPDATED';
const COLLABORATION_UPDATED = 'COLLABORATION_UPDATED';
const COMMENT_ADDED = 'COMMENT_ADDED';
const NOTIFICATION_SENT = 'NOTIFICATION_SENT';

interface EnhancedContext {
  prisma: PrismaClient;
  irysService: IrysService;
  blockchainService: BlockchainService;
  databaseService: DatabaseService;
  storageService: StorageService;
  realtimeService: RealtimeService;
  vectorDBService: VectorDBService;
  functionService: FunctionService;
  searchService: SearchService;
  analyticsService: AnalyticsService;
  programmableDataService: ProgrammableDataService;
  auth: AuthContext;
}

export const enhancedResolvers = {
  Query: {
    // Project Queries
    project: async (
      _: any,
      { id }: { id: string },
      { prisma }: EnhancedContext
    ) => {
      return await prisma.project.findUnique({
        where: { id },
        include: {
          owner: true,
          documents: {
            orderBy: { order: 'asc' },
            take: 50,
          },
          collaborators: {
            include: {
              user: true,
            },
          },
        },
      });
    },

    projectBySlug: async (
      _: any,
      { slug }: { slug: string },
      { prisma }: EnhancedContext
    ) => {
      return await prisma.project.findUnique({
        where: { slug },
        include: {
          owner: true,
          documents: {
            orderBy: { order: 'asc' },
            take: 50,
          },
          collaborators: {
            include: {
              user: true,
            },
          },
        },
      });
    },

    myProjects: async (
      _: any,
      { limit = 10, offset = 0 }: { limit?: number; offset?: number },
      { prisma, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      return await prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            {
              collaborators: {
                some: {
                  userId: userId,
                },
              },
            },
          ],
        },
        include: {
          owner: true,
          documents: {
            orderBy: { order: 'asc' },
            take: 10,
          },
          _count: {
            select: {
              documents: true,
              collaborators: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      });
    },

    // Document Queries
    document: async (
      _: any,
      { id }: { id: string },
      { prisma }: EnhancedContext
    ) => {
      return await prisma.document.findUnique({
        where: { id },
        include: {
          project: true,
          author: true,
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 10,
          },
          comments: {
            where: { resolved: false },
            include: {
              author: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    },

    documentByPath: async (
      _: any,
      { projectId, path }: { projectId: string; path: string },
      { prisma }: EnhancedContext
    ) => {
      return await prisma.document.findUnique({
        where: {
          projectId_path: {
            projectId,
            path,
          },
        },
        include: {
          project: true,
          author: true,
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 5,
          },
        },
      });
    },

    projectDocuments: async (
      _: any,
      { projectId, limit = 50, offset = 0 }: {
        projectId: string;
        limit?: number;
        offset?: number;
      },
      { prisma }: EnhancedContext
    ) => {
      return await prisma.document.findMany({
        where: { projectId },
        include: {
          author: true,
          _count: {
            select: {
              versions: true,
              comments: true,
            },
          },
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      });
    },

    documentHistory: async (
      _: any,
      { documentId }: { documentId: string },
      { prisma }: EnhancedContext
    ) => {
      return await prisma.version.findMany({
        where: { documentId },
        include: {
          author: true,
        },
        orderBy: { versionNumber: 'desc' },
      });
    },

    // Search Queries
    searchDocuments: async (
      _: any,
      { input }: { input: any },
      { searchService, prisma }: EnhancedContext
    ) => {
      const { query, projectId, type = 'FULLTEXT', limit = 10 } = input;

      // For now, only implement FULLTEXT search (AI/Vector search will be added later)
      if (type === 'FULLTEXT' || type === 'HYBRID') {
        return await searchService.search(query, { projectId, limit });
      }

      // Fallback to basic search
      const documents = await prisma.document.findMany({
        where: {
          ...(projectId && { projectId }),
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          author: true,
          project: true,
        },
        take: limit,
      });

      return documents.map(doc => ({
        documentId: doc.id,
        title: doc.title,
        content: doc.content.substring(0, 200),
        similarity: 0.5,
        highlights: [query],
        metadata: doc.metadata,
      }));
    },

    askQuestion: async (
      _: any,
      { input }: { input: any },
      { prisma }: EnhancedContext
    ) => {
      // Placeholder - AI feature will be implemented separately
      const { question, projectId } = input;

      // Return a helpful message
      return {
        question,
        answer: 'AI Q&A feature is not yet available. Please use document search instead.',
        confidence: 0,
        sources: [],
        generatedAt: new Date().toISOString(),
      };
    },

    suggestRelated: async (
      _: any,
      { documentId, limit = 5 }: { documentId: string; limit?: number },
      { prisma }: EnhancedContext
    ) => {
      // Find related documents by tags and project
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: { project: true },
      });

      if (!document) return [];

      const relatedDocs = await prisma.document.findMany({
        where: {
          projectId: document.projectId,
          id: { not: documentId },
        },
        include: {
          author: true,
          project: true,
        },
        take: limit,
      });

      return relatedDocs.map(doc => ({
        documentId: doc.id,
        title: doc.title,
        content: doc.content.substring(0, 200),
        similarity: 0.7,
        highlights: [],
        metadata: doc.metadata,
      }));
    },

    // Collaboration Queries
    collaborationSession: async (
      _: any,
      { documentId }: { documentId: string },
      { realtimeService }: EnhancedContext
    ) => {
      return await realtimeService.createCollaborationSession(documentId);
    },

    activeUsers: async (
      _: any,
      { documentId }: { documentId: string },
      { realtimeService }: EnhancedContext
    ) => {
      return await realtimeService.getActiveUsers(documentId);
    },

    // User Queries
    me: async (
      _: any,
      __: any,
      { auth, prisma }: EnhancedContext
    ) => {
      const userAddress = requireAuth(auth);

      return await prisma.user.findUnique({
        where: { address: userAddress },
        include: {
          projects: {
            take: 10,
            orderBy: { updatedAt: 'desc' },
          },
          documents: {
            take: 10,
            orderBy: { updatedAt: 'desc' },
          },
          _count: {
            select: {
              projects: true,
              documents: true,
              collaborations: true,
            },
          },
        },
      });
    },

    user: async (
      _: any,
      { id }: { id: string },
      { prisma }: EnhancedContext
    ) => {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          projects: {
            where: { visibility: 'PUBLIC' },
            take: 10,
            orderBy: { updatedAt: 'desc' },
          },
          _count: {
            select: {
              projects: true,
              documents: true,
            },
          },
        },
      });
    },

    publicProjects: async (
      _: any,
      { limit = 20, offset = 0 }: { limit?: number; offset?: number },
      { prisma }: EnhancedContext
    ) => {
      return await prisma.project.findMany({
        where: { visibility: 'PUBLIC' },
        include: {
          owner: true,
          _count: {
            select: {
              documents: true,
              collaborators: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      });
    },

    // Analytics
    projectMetrics: async (
      _: any,
      { projectId, timeframe = 'last_30_days' }: {
        projectId: string;
        timeframe?: string;
      },
      { analyticsService, prisma }: EnhancedContext
    ) => {
      // Get basic metrics from database
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          documents: true,
          collaborators: true,
        },
      });

      if (!project) return null;

      // Calculate time range
      const now = new Date();
      let startDate = new Date();

      switch (timeframe) {
        case 'last_7_days':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'last_30_days':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'last_90_days':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get documents created in timeframe
      const newDocuments = await prisma.document.count({
        where: {
          projectId,
          createdAt: { gte: startDate },
        },
      });

      // Get versions created in timeframe
      const newVersions = await prisma.version.count({
        where: {
          document: { projectId },
          createdAt: { gte: startDate },
        },
      });

      // Get comments in timeframe
      const newComments = await prisma.comment.count({
        where: {
          document: { projectId },
          createdAt: { gte: startDate },
        },
      });

      return {
        projectId,
        timeframe,
        totalDocuments: project.documents.length,
        totalCollaborators: project.collaborators.length,
        newDocuments,
        newVersions,
        newComments,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
      };
    },
  },

  Mutation: {
    // Project Mutations
    createProject: async (
      _: any,
      { input }: { input: any },
      { prisma, auth, storageService }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      // Ensure user exists
      const user = await prisma.user.upsert({
        where: { address: userId },
        update: {},
        create: { address: userId },
      });

      // Create project
      const project = await prisma.project.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          ownerId: user.id,
          visibility: input.visibility || 'PRIVATE',
          settings: input.settings || {},
        },
        include: {
          owner: true,
        },
      });

      // Upload project metadata to Irys
      try {
        const metadata = {
          type: 'project',
          projectId: project.id,
          name: project.name,
          slug: project.slug,
          createdAt: project.createdAt,
        };

        const uploadResult = await storageService.uploadFile('metadata', {
          name: `project-${project.id}.json`,
          data: Buffer.from(JSON.stringify(metadata)),
          type: 'application/json',
          size: Buffer.byteLength(JSON.stringify(metadata)),
        }, {
          metadata: { projectId: project.id },
        });

        // Update project with Irys ID
        await prisma.project.update({
          where: { id: project.id },
          data: {
            irysId: uploadResult.id,
            permanentUrl: uploadResult.permanentUrl,
          },
        });
      } catch (error) {
        console.error('Failed to upload project to Irys:', error);
      }

      // Publish project creation event
      await pubsub.publish(PROJECT_UPDATED, {
        projectUpdated: {
          type: 'CREATED',
          projectId: project.id,
          data: project,
          timestamp: new Date().toISOString(),
        },
      });

      return project;
    },

    updateProject: async (
      _: any,
      { id, input }: { id: string; input: any },
      { prisma, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      // Check if user is owner
      const project = await prisma.project.findUnique({
        where: { id },
        include: { owner: true },
      });

      if (!project || project.owner.address !== userId) {
        throw new Error('Not authorized to update this project');
      }

      return await prisma.project.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          visibility: input.visibility,
          settings: input.settings,
        },
        include: {
          owner: true,
          documents: true,
          collaborators: {
            include: { user: true },
          },
        },
      });
    },

    deleteProject: async (
      _: any,
      { id }: { id: string },
      { prisma, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      // Check if user is owner
      const project = await prisma.project.findUnique({
        where: { id },
        include: { owner: true },
      });

      if (!project || project.owner.address !== userId) {
        throw new Error('Not authorized to delete this project');
      }

      await prisma.project.delete({
        where: { id },
      });

      return true;
    },

    // Document Mutations
    createDocument: async (
      _: any,
      { input }: { input: any },
      { prisma, auth, storageService }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      // Ensure user exists
      const user = await prisma.user.upsert({
        where: { address: userId },
        update: {},
        create: { address: userId },
      });

      // Generate content hash
      const crypto = await import('crypto');
      const contentHash = crypto.createHash('sha256').update(input.content).digest('hex');

      // Create document
      const document = await prisma.document.create({
        data: {
          projectId: input.projectId,
          path: input.path,
          title: input.title,
          content: input.content,
          contentHash,
          authorId: user.id,
          order: input.order || 0,
          metadata: input.metadata || {},
          tags: input.tags || [],
        },
        include: {
          project: true,
          author: true,
        },
      });

      // Upload document to Irys in background
      setImmediate(async () => {
        try {
          const docData = {
            id: document.id,
            title: document.title,
            content: document.content,
            projectId: document.projectId,
            authorId: document.authorId,
            createdAt: document.createdAt,
          };

          const uploadResult = await storageService.uploadFile('documents', {
            name: `document-${document.id}.json`,
            data: Buffer.from(JSON.stringify(docData)),
            type: 'application/json',
            size: Buffer.byteLength(JSON.stringify(docData)),
          }, {
            metadata: {
              documentId: document.id,
              projectId: document.projectId,
            },
          });

          // Update document with Irys info
          await prisma.document.update({
            where: { id: document.id },
            data: {
              irysId: uploadResult.id,
              irysProof: uploadResult.receipt ? JSON.stringify(uploadResult.receipt) : null,
            },
          });

          // Record transaction
          await prisma.irysTransaction.create({
            data: {
              transactionId: uploadResult.id,
              type: 'upload',
              status: 'confirmed',
              size: BigInt(uploadResult.size),
              documentId: document.id,
              gatewayUrl: uploadResult.permanentUrl,
              receipt: uploadResult.receipt || {},
              confirmedAt: new Date(),
            },
          });
        } catch (error) {
          console.error('Failed to upload document to Irys:', error);
        }
      });

      // Publish document creation event
      await pubsub.publish(DOCUMENT_CHANGED, {
        documentChanged: {
          type: 'CREATED',
          documentId: document.id,
          userId: user.id,
          change: { type: 'create', data: document },
          timestamp: new Date().toISOString(),
        },
      });

      return document;
    },

    updateDocument: async (
      _: any,
      { input }: { input: any },
      { prisma, auth, realtimeService }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      // Check if user has permission
      const document = await prisma.document.findUnique({
        where: { id: input.id },
        include: {
          author: true,
          project: {
            include: {
              owner: true,
              collaborators: true,
            },
          },
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const user = await prisma.user.findUnique({
        where: { address: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const isAuthor = document.authorId === user.id;
      const isOwner = document.project.owner.address === userId;
      const isCollaborator = document.project.collaborators.some(c => c.userId === user.id);

      if (!isAuthor && !isOwner && !isCollaborator) {
        throw new Error('Not authorized to update this document');
      }

      // Generate new content hash if content changed
      let contentHash = document.contentHash;
      if (input.content && input.content !== document.content) {
        const crypto = await import('crypto');
        contentHash = crypto.createHash('sha256').update(input.content).digest('hex');
      }

      // Update document
      const updatedDocument = await prisma.document.update({
        where: { id: input.id },
        data: {
          ...(input.title && { title: input.title }),
          ...(input.content && {
            content: input.content,
            contentHash,
            version: document.version + 1,
          }),
          ...(input.metadata && { metadata: input.metadata }),
        },
        include: {
          project: true,
          author: true,
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 5,
          },
        },
      });

      // Broadcast real-time update
      try {
        await realtimeService.streamChange(`doc:${document.id}`, userId, {
          operation: 'replace',
          position: 0,
          text: input.content || document.content,
        });
      } catch (error) {
        console.error('Failed to broadcast realtime update:', error);
      }

      return updatedDocument;
    },

    deleteDocument: async (
      _: any,
      { id }: { id: string },
      { prisma, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          author: true,
          project: { include: { owner: true } },
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const user = await prisma.user.findUnique({
        where: { address: userId },
      });

      const isAuthor = document.authorId === user?.id;
      const isOwner = document.project.owner.address === userId;

      if (!isAuthor && !isOwner) {
        throw new Error('Not authorized to delete this document');
      }

      await prisma.document.delete({
        where: { id },
      });

      return true;
    },

    publishDocument: async (
      _: any,
      { id }: { id: string },
      { prisma, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          author: true,
          project: { include: { owner: true } },
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const user = await prisma.user.findUnique({
        where: { address: userId },
      });

      const isAuthor = document.authorId === user?.id;
      const isOwner = document.project.owner.address === userId;

      if (!isAuthor && !isOwner) {
        throw new Error('Not authorized to publish this document');
      }

      return await prisma.document.update({
        where: { id },
        data: {
          publishedAt: new Date(),
        },
        include: {
          project: true,
          author: true,
        },
      });
    },

    // Version Mutations
    createVersion: async (
      _: any,
      { input }: { input: any },
      { prisma, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      const user = await prisma.user.findUnique({
        where: { address: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get current version number
      const lastVersion = await prisma.version.findFirst({
        where: { documentId: input.documentId },
        orderBy: { versionNumber: 'desc' },
      });

      const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

      // Calculate content diff (simplified)
      const document = await prisma.document.findUnique({
        where: { id: input.documentId },
      });

      let contentDiff = '';
      if (document) {
        contentDiff = `Changed from version ${document.version}`;
      }

      return await prisma.version.create({
        data: {
          documentId: input.documentId,
          versionNumber: nextVersionNumber,
          content: input.content,
          contentDiff,
          authorId: user.id,
          commitMessage: input.commitMessage,
          timestamp: new Date(),
        },
        include: {
          document: true,
          author: true,
        },
      });
    },

    revertToVersion: async (
      _: any,
      { documentId, versionNumber }: { documentId: string; versionNumber: number },
      { prisma, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      const version = await prisma.version.findUnique({
        where: {
          documentId_versionNumber: {
            documentId,
            versionNumber,
          },
        },
      });

      if (!version) {
        throw new Error('Version not found');
      }

      return await prisma.document.update({
        where: { id: documentId },
        data: {
          content: version.content,
          version: version.versionNumber,
        },
        include: {
          project: true,
          author: true,
        },
      });
    },

    // Collaboration Mutations
    addCollaborator: async (
      _: any,
      { input }: { input: any },
      { prisma, auth }: EnhancedContext
    ) => {
      const inviterId = requireAuth(auth);

      // Check if inviter is project owner or admin
      const project = await prisma.project.findUnique({
        where: { id: input.projectId },
        include: { owner: true },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const inviter = await prisma.user.findUnique({
        where: { address: inviterId },
      });

      if (!inviter || project.owner.address !== inviterId) {
        throw new Error('Not authorized to add collaborators');
      }

      // Ensure collaborator user exists
      const collaboratorUser = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!collaboratorUser) {
        throw new Error('Collaborator user not found');
      }

      return await prisma.collaborator.create({
        data: {
          projectId: input.projectId,
          userId: input.userId,
          role: input.role || 'VIEWER',
          permissions: input.permissions || [],
        },
        include: {
          project: true,
          user: true,
        },
      });
    },

    updateCollaboratorRole: async (
      _: any,
      { collaboratorId, role }: { collaboratorId: string; role: string },
      { prisma, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      return await prisma.collaborator.update({
        where: { id: collaboratorId },
        data: { role },
        include: {
          project: true,
          user: true,
        },
      });
    },

    removeCollaborator: async (
      _: any,
      { collaboratorId }: { collaboratorId: string },
      { prisma, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      await prisma.collaborator.delete({
        where: { id: collaboratorId },
      });

      return true;
    },

    joinCollaboration: async (
      _: any,
      { documentId }: { documentId: string },
      { realtimeService, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);
      
      const session = await realtimeService.createCollaborationSession(documentId);
      
      // Would join user to session with WebSocket
      // This requires WebSocket context which isn't available in GraphQL resolver
      // The actual joining would happen through WebSocket connection
      
      return session;
    },

    // Comment Mutations
    createComment: async (
      _: any,
      { input }: { input: any },
      { prisma, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      const user = await prisma.user.findUnique({
        where: { address: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const comment = await prisma.comment.create({
        data: {
          documentId: input.documentId,
          content: input.content,
          authorId: user.id,
          ...(input.versionId && { versionId: input.versionId }),
          ...(input.lineStart && { lineStart: input.lineStart }),
          ...(input.lineEnd && { lineEnd: input.lineEnd }),
          ...(input.threadId && { parentId: input.threadId }),
        },
        include: {
          document: true,
          author: true,
        },
      });

      // Publish comment event
      await pubsub.publish(COMMENT_ADDED, {
        commentAdded: comment,
      });

      return comment;
    },

    resolveComment: async (
      _: any,
      { commentId }: { commentId: string },
      { prisma, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      return await prisma.comment.update({
        where: { id: commentId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: userId,
        },
        include: {
          document: true,
          author: true,
        },
      });
    },

    deleteComment: async (
      _: any,
      { commentId }: { commentId: string },
      { prisma, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);

      await prisma.comment.delete({
        where: { id: commentId },
      });

      return true;
    },

    // AI Function Mutations
    invokeFunction: async (
      _: any,
      { input }: { input: any },
      { functionService }: EnhancedContext
    ) => {
      const { functionName, payload } = input;
      
      return await functionService.invoke(functionName, payload);
    },

    // Translation Mutations
    createTranslation: async (
      _: any,
      { documentId, language, content }: { 
        documentId: string; 
        language: string; 
        content: string;
      },
      { databaseService, functionService, auth }: EnhancedContext
    ) => {
      const userId = requireAuth(auth);
      
      // Validate translation with AI
      const validation = await functionService.invoke('validate-translation', {
        originalDocumentId: documentId,
        translatedContent: content,
        targetLanguage: language,
      });

      // Create translation record
      // Implementation would create translation in database
      
      return null; // Placeholder
    },

    // Storage Mutations
    uploadFile: async (
      _: any,
      { projectId, file }: { projectId: string; file: any },
      { storageService, auth }: EnhancedContext
    ) => {
      requireAuth(auth);
      
      // Handle file upload
      const result = await storageService.uploadFile('images', {
        name: file.filename,
        data: file.stream,
        type: file.mimetype,
        size: file.size,
      }, {
        metadata: { projectId },
      });

      return result;
    },
  },

  Subscription: {
    documentChanged: {
      subscribe: (_: any, { documentId }: { documentId: string }) => {
        return pubsub.asyncIterator([DOCUMENT_CHANGED]);
      },
      resolve: (payload: any, { documentId }: { documentId: string }) => {
        // Filter events for specific document
        if (payload.documentChanged.documentId === documentId) {
          return payload.documentChanged;
        }
        return null;
      },
    },

    projectUpdated: {
      subscribe: (_: any, { projectId }: { projectId: string }) => {
        return pubsub.asyncIterator([PROJECT_UPDATED]);
      },
      resolve: (payload: any, { projectId }: { projectId: string }) => {
        if (payload.projectUpdated.projectId === projectId) {
          return payload.projectUpdated;
        }
        return null;
      },
    },

    collaborationUpdated: {
      subscribe: (_: any, { documentId }: { documentId: string }) => {
        return pubsub.asyncIterator([COLLABORATION_UPDATED]);
      },
    },

    commentAdded: {
      subscribe: (_: any, { documentId }: { documentId: string }) => {
        return pubsub.asyncIterator([COMMENT_ADDED]);
      },
      resolve: (payload: any, { documentId }: { documentId: string }) => {
        if (payload.commentAdded.documentId === documentId) {
          return payload.commentAdded;
        }
        return null;
      },
    },

    notifications: {
      subscribe: (_: any, { userId }: { userId: string }) => {
        return pubsub.asyncIterator([NOTIFICATION_SENT]);
      },
      resolve: (payload: any, { userId }: { userId: string }) => {
        if (payload.notification.userId === userId) {
          return payload.notification;
        }
        return null;
      },
    },
  },

  // Type Resolvers
  Project: {
    documents: async (parent: any, _: any, { databaseService }: EnhancedContext) => {
      return await databaseService.getProjectDocuments(parent.id);
    },
    collaborators: async (parent: any, _: any, { prisma }: EnhancedContext) => {
      // Implementation would fetch collaborators
      return [];
    },
  },

  Document: {
    project: async (parent: any, _: any, { prisma }: EnhancedContext) => {
      // Implementation would fetch project
      return null;
    },
    author: async (parent: any, _: any, { prisma }: EnhancedContext) => {
      // Implementation would fetch author
      return null;
    },
    versions: async (parent: any, _: any, { databaseService }: EnhancedContext) => {
      return await databaseService.getDocumentHistory(parent.id);
    },
    comments: async (parent: any, _: any, { prisma }: EnhancedContext) => {
      // Implementation would fetch comments
      return [];
    },
  },

  User: {
    projects: async (parent: any, _: any, { prisma }: EnhancedContext) => {
      // Implementation would fetch user's projects
      return [];
    },
    documents: async (parent: any, _: any, { prisma }: EnhancedContext) => {
      // Implementation would fetch user's documents
      return [];
    },
  },
};

// Export pubsub for use in other services
export { pubsub };