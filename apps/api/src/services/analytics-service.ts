import { PrismaClient } from '@prisma/client';
import { prisma } from './database';

/**
 * Analytics Service for usage tracking and insights
 */
export class AnalyticsService {
  constructor(
    private prisma: PrismaClient = prisma
  ) {}

  async initialize(): Promise<void> {
    console.log('✅ Analytics service initialized');
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
   * Track analytics event
   */
  async trackEvent(
    event: string,
    properties: {
      userId?: string;
      projectId?: string;
      documentId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      // Store in a generic events table or log for analytics
      // For now, we'll just log it
      console.log(`📊 Analytics Event: ${event}`, properties);

      // In production, you would store this in a time-series database or analytics platform
      // Example: await this.prisma.analyticsEvent.create({ data: { event, properties } });
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Get comprehensive project metrics
   */
  async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    try {
      const [
        totalDocuments,
        totalVersions,
        totalComments,
        totalCollaborators,
        recentActivity
      ] = await Promise.all([
        // Total documents
        this.prisma.document.count({
          where: { projectId }
        }),

        // Total versions across all documents
        this.prisma.version.count({
          where: {
            document: { projectId }
          }
        }),

        // Total comments
        this.prisma.comment.count({
          where: {
            document: { projectId }
          }
        }),

        // Total collaborators
        this.prisma.collaborator.count({
          where: { projectId }
        }),

        // Recent activity (last 30 days)
        this.getRecentActivity(projectId, 30)
      ]);

      const publishedDocuments = await this.prisma.document.count({
        where: {
          projectId,
          publishedAt: { not: null }
        }
      });

      const draftDocuments = totalDocuments - publishedDocuments;

      return {
        totalDocuments,
        publishedDocuments,
        draftDocuments,
        totalVersions,
        totalComments,
        totalCollaborators,
        recentActivity
      };
    } catch (error) {
      console.error('Failed to get project metrics:', error);
      return {
        totalDocuments: 0,
        publishedDocuments: 0,
        draftDocuments: 0,
        totalVersions: 0,
        totalComments: 0,
        totalCollaborators: 0,
        recentActivity: []
      };
    }
  }

  /**
   * Get recent activity for a project
   */
  async getRecentActivity(projectId: string, days: number = 7): Promise<ActivityItem[]> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [documents, versions, comments] = await Promise.all([
        // Recent documents
        this.prisma.document.findMany({
          where: {
            projectId,
            createdAt: { gte: since }
          },
          select: {
            id: true,
            title: true,
            createdAt: true,
            author: {
              select: { address: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }),

        // Recent versions
        this.prisma.version.findMany({
          where: {
            document: { projectId },
            createdAt: { gte: since }
          },
          select: {
            id: true,
            versionNumber: true,
            createdAt: true,
            author: {
              select: { address: true }
            },
            document: {
              select: { title: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }),

        // Recent comments
        this.prisma.comment.findMany({
          where: {
            document: { projectId },
            createdAt: { gte: since }
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: { address: true }
            },
            document: {
              select: { title: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        })
      ]);

      // Combine and format activities
      const activities: ActivityItem[] = [
        ...documents.map(doc => ({
          type: 'document_created' as const,
          timestamp: doc.createdAt,
          userId: doc.author.address,
          description: `Created document "${doc.title}"`,
          metadata: { documentId: doc.id, title: doc.title }
        })),
        ...versions.map(ver => ({
          type: 'version_created' as const,
          timestamp: ver.createdAt,
          userId: ver.author.address,
          description: `Created version ${ver.versionNumber} of "${ver.document.title}"`,
          metadata: { versionId: ver.id, documentTitle: ver.document.title }
        })),
        ...comments.map(com => ({
          type: 'comment_added' as const,
          timestamp: com.createdAt,
          userId: com.author.address,
          description: `Commented on "${com.document.title}"`,
          metadata: { commentId: com.id, documentTitle: com.document.title }
        }))
      ];

      // Sort by timestamp descending
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 50);

    } catch (error) {
      console.error('Failed to get recent activity:', error);
      return [];
    }
  }

  /**
   * Get user activity metrics
   */
  async getUserMetrics(userId: string): Promise<UserMetrics> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { address: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const [
        totalDocuments,
        totalComments,
        totalProjects,
        collaboratingProjects
      ] = await Promise.all([
        this.prisma.document.count({
          where: { authorId: user.id }
        }),
        this.prisma.comment.count({
          where: { authorId: user.id }
        }),
        this.prisma.project.count({
          where: { ownerId: user.id }
        }),
        this.prisma.collaborator.count({
          where: { userId: user.id }
        })
      ]);

      return {
        totalDocuments,
        totalComments,
        totalProjects,
        collaboratingProjects,
        joinedDate: user.createdAt
      };
    } catch (error) {
      console.error('Failed to get user metrics:', error);
      return {
        totalDocuments: 0,
        totalComments: 0,
        totalProjects: 0,
        collaboratingProjects: 0,
        joinedDate: new Date()
      };
    }
  }

  /**
   * Get document metrics
   */
  async getDocumentMetrics(documentId: string): Promise<DocumentMetrics> {
    try {
      const [
        totalVersions,
        totalComments,
        unresolvedComments,
        wordCount
      ] = await Promise.all([
        this.prisma.version.count({
          where: { documentId }
        }),
        this.prisma.comment.count({
          where: { documentId }
        }),
        this.prisma.comment.count({
          where: {
            documentId,
            resolved: false
          }
        }),
        this.getDocumentWordCount(documentId)
      ]);

      const resolvedComments = totalComments - unresolvedComments;

      return {
        totalVersions,
        totalComments,
        resolvedComments,
        unresolvedComments,
        wordCount
      };
    } catch (error) {
      console.error('Failed to get document metrics:', error);
      return {
        totalVersions: 0,
        totalComments: 0,
        resolvedComments: 0,
        unresolvedComments: 0,
        wordCount: 0
      };
    }
  }

  /**
   * Calculate word count for a document
   */
  private async getDocumentWordCount(documentId: string): Promise<number> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
        select: { content: true }
      });

      if (!document) return 0;

      // Simple word count (split by whitespace)
      const words = document.content.trim().split(/\s+/);
      return words.filter(word => word.length > 0).length;
    } catch {
      return 0;
    }
  }

  /**
   * Get platform-wide statistics
   */
  async getPlatformStats(): Promise<PlatformStats> {
    try {
      const [
        totalUsers,
        totalProjects,
        totalDocuments,
        totalVersions,
        totalComments,
        totalIrysTransactions
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.project.count(),
        this.prisma.document.count(),
        this.prisma.version.count(),
        this.prisma.comment.count(),
        this.prisma.irysTransaction.count()
      ]);

      return {
        totalUsers,
        totalProjects,
        totalDocuments,
        totalVersions,
        totalComments,
        totalIrysTransactions
      };
    } catch (error) {
      console.error('Failed to get platform stats:', error);
      return {
        totalUsers: 0,
        totalProjects: 0,
        totalDocuments: 0,
        totalVersions: 0,
        totalComments: 0,
        totalIrysTransactions: 0
      };
    }
  }
}

// Type definitions
export interface ProjectMetrics {
  totalDocuments: number;
  publishedDocuments: number;
  draftDocuments: number;
  totalVersions: number;
  totalComments: number;
  totalCollaborators: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  type: 'document_created' | 'version_created' | 'comment_added';
  timestamp: Date;
  userId: string;
  description: string;
  metadata: Record<string, any>;
}

export interface UserMetrics {
  totalDocuments: number;
  totalComments: number;
  totalProjects: number;
  collaboratingProjects: number;
  joinedDate: Date;
}

export interface DocumentMetrics {
  totalVersions: number;
  totalComments: number;
  resolvedComments: number;
  unresolvedComments: number;
  wordCount: number;
}

export interface PlatformStats {
  totalUsers: number;
  totalProjects: number;
  totalDocuments: number;
  totalVersions: number;
  totalComments: number;
  totalIrysTransactions: number;
}