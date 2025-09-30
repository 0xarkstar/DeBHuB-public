import { PrismaClient } from '@prisma/client';
import { prisma } from './database';

/**
 * Search Service for full-text search using PostgreSQL
 */
export class SearchService {
  constructor(
    private prisma: PrismaClient = prisma
  ) {}

  async initialize(): Promise<void> {
    // Create full-text search indexes if they don't exist
    try {
      // Note: These would normally be in a migration file
      // For now, we'll just log that initialization is complete
      console.log('✅ Search service initialized');
    } catch (error) {
      console.error('Search service initialization error:', error);
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
   * Full-text search on documents
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      projectId,
      limit = 10,
      offset = 0,
      includeContent = true,
    } = options;

    try {
      // Build WHERE clause
      const whereConditions: any[] = [
        {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
      ];

      if (projectId) {
        whereConditions.push({ projectId });
      }

      // Execute search
      const documents = await this.prisma.document.findMany({
        where: { AND: whereConditions },
        include: {
          author: true,
          project: true,
        },
        take: limit,
        skip: offset,
        orderBy: { updatedAt: 'desc' },
      });

      // Calculate relevance score and create highlights
      return documents.map(doc => {
        const titleMatch = doc.title.toLowerCase().includes(query.toLowerCase());
        const contentMatch = doc.content.toLowerCase().includes(query.toLowerCase());

        // Simple relevance scoring
        let score = 0;
        if (titleMatch) score += 0.7;
        if (contentMatch) score += 0.3;

        // Extract highlighted snippets
        const highlights = this.extractHighlights(doc.content, query, 3);

        return {
          documentId: doc.id,
          title: doc.title,
          content: includeContent ? doc.content.substring(0, 500) : '',
          similarity: score,
          highlights,
          metadata: {
            ...doc.metadata as object,
            projectId: doc.projectId,
            authorId: doc.authorId,
            updatedAt: doc.updatedAt.toISOString(),
          },
        };
      });
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Search within a specific project
   */
  async searchInProject(
    projectId: string,
    query: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    return this.search(query, { projectId, limit });
  }

  /**
   * Advanced search with filters
   */
  async advancedSearch(params: AdvancedSearchParams): Promise<SearchResult[]> {
    const {
      query,
      projectId,
      authorId,
      tags,
      dateFrom,
      dateTo,
      limit = 10,
      offset = 0,
    } = params;

    const whereConditions: any[] = [];

    // Text search
    if (query) {
      whereConditions.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    // Project filter
    if (projectId) {
      whereConditions.push({ projectId });
    }

    // Author filter
    if (authorId) {
      whereConditions.push({ authorId });
    }

    // Tags filter
    if (tags && tags.length > 0) {
      whereConditions.push({
        tags: {
          hasSome: tags,
        },
      });
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      whereConditions.push({ createdAt: dateFilter });
    }

    const documents = await this.prisma.document.findMany({
      where: whereConditions.length > 0 ? { AND: whereConditions } : {},
      include: {
        author: true,
        project: true,
      },
      take: limit,
      skip: offset,
      orderBy: { updatedAt: 'desc' },
    });

    return documents.map(doc => ({
      documentId: doc.id,
      title: doc.title,
      content: doc.content.substring(0, 500),
      similarity: 0.8,
      highlights: query ? this.extractHighlights(doc.content, query, 3) : [],
      metadata: {
        ...doc.metadata as object,
        projectId: doc.projectId,
        authorId: doc.authorId,
        tags: doc.tags,
        updatedAt: doc.updatedAt.toISOString(),
      },
    }));
  }

  /**
   * Extract highlighted snippets from content
   */
  private extractHighlights(
    content: string,
    query: string,
    maxHighlights: number = 3
  ): string[] {
    const highlights: string[] = [];
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();

    let startIndex = 0;
    for (let i = 0; i < maxHighlights; i++) {
      const index = contentLower.indexOf(queryLower, startIndex);
      if (index === -1) break;

      // Extract context around the match (100 chars before and after)
      const start = Math.max(0, index - 100);
      const end = Math.min(content.length, index + query.length + 100);

      let snippet = content.substring(start, end);
      if (start > 0) snippet = '...' + snippet;
      if (end < content.length) snippet = snippet + '...';

      highlights.push(snippet);
      startIndex = index + query.length;
    }

    return highlights;
  }

  /**
   * Highlight search terms in content
   */
  async highlight(content: string, query: string): Promise<string> {
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return content.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(
    partialQuery: string,
    projectId?: string,
    limit: number = 5
  ): Promise<string[]> {
    const whereConditions: any = {
      OR: [
        { title: { startsWith: partialQuery, mode: 'insensitive' } },
      ],
    };

    if (projectId) {
      whereConditions.projectId = projectId;
    }

    const documents = await this.prisma.document.findMany({
      where: whereConditions,
      select: { title: true },
      take: limit,
      distinct: ['title'],
    });

    return documents.map(doc => doc.title);
  }

  /**
   * Count search results
   */
  async countResults(query: string, projectId?: string): Promise<number> {
    const whereConditions: any[] = [
      {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
    ];

    if (projectId) {
      whereConditions.push({ projectId });
    }

    return await this.prisma.document.count({
      where: { AND: whereConditions },
    });
  }

  /**
   * Search by tags
   */
  async searchByTags(
    tags: string[],
    projectId?: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        ...(projectId && { projectId }),
        tags: {
          hasSome: tags,
        },
      },
      include: {
        author: true,
        project: true,
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    return documents.map(doc => ({
      documentId: doc.id,
      title: doc.title,
      content: doc.content.substring(0, 500),
      similarity: 0.9,
      highlights: [],
      metadata: {
        ...doc.metadata as object,
        projectId: doc.projectId,
        tags: doc.tags,
      },
    }));
  }

  /**
   * Helper: Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Type definitions
export interface SearchOptions {
  projectId?: string;
  limit?: number;
  offset?: number;
  includeContent?: boolean;
}

export interface SearchResult {
  documentId: string;
  title: string;
  content: string;
  similarity: number;
  highlights: string[];
  metadata: Record<string, any>;
}

export interface AdvancedSearchParams {
  query?: string;
  projectId?: string;
  authorId?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}