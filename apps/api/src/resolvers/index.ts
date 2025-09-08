import { PubSub } from 'graphql-subscriptions';
import { Post as DatabasePost, PrismaClient } from '@prisma/client';
import { IrysService } from '../services/irys';
import { BlockchainService } from '../services/blockchain';
import { requireAuth, AuthContext } from '../services/auth';
import { Post, UpdateType, PAGINATION, VALIDATION } from '@irysbase/shared';

const pubsub = new PubSub();

const POST_UPDATES_EVENT = 'POST_UPDATES';

interface Context {
  prisma: PrismaClient;
  irysService: IrysService;
  blockchainService: BlockchainService;
  auth: AuthContext;
}

function mapDatabasePostToGraphQL(dbPost: DatabasePost): Post {
  return {
    id: dbPost.id,
    irysTransactionId: dbPost.irysTransactionId,
    content: dbPost.content,
    authorAddress: dbPost.authorAddress,
    timestamp: dbPost.timestamp.toISOString(),
    version: dbPost.version,
    previousVersionId: dbPost.previousVersionId || undefined,
  };
}

export const resolvers = {
  Query: {
    postsByAuthor: async (
      _: any,
      { authorAddress, limit = PAGINATION.DEFAULT_LIMIT, offset = 0 }: {
        authorAddress: string;
        limit?: number;
        offset?: number;
      },
      { prisma }: Context
    ): Promise<Post[]> => {
      const clampedLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
      
      const posts = await prisma.post.findMany({
        where: { authorAddress },
        orderBy: { timestamp: 'desc' },
        take: clampedLimit,
        skip: offset,
      });

      return posts.map(mapDatabasePostToGraphQL);
    },

    postHistory: async (
      _: any,
      { id }: { id: string },
      { prisma }: Context
    ): Promise<Post[]> => {
      // First get the post to find all versions
      const post = await prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      // Get all versions of this post (including this one)
      const allVersions = await prisma.post.findMany({
        where: {
          OR: [
            { irysTransactionId: post.irysTransactionId },
            { previousVersionId: post.irysTransactionId },
          ],
        },
        orderBy: { version: 'asc' },
      });

      return allVersions.map(mapDatabasePostToGraphQL);
    },

    verifyPostFromIrys: async (
      _: any,
      { irysTransactionId }: { irysTransactionId: string },
      { irysService }: Context
    ): Promise<Post | null> => {
      // This would query Irys directly to verify data integrity
      // For now, return null as this requires actual Irys integration
      return null;
    },
  },

  Mutation: {
    createPost: async (
      _: any,
      { content }: { content: string },
      { prisma, irysService, blockchainService, auth }: Context
    ): Promise<Post> => {
      // Validate content
      if (content.length < VALIDATION.MIN_CONTENT_LENGTH || 
          content.length > VALIDATION.MAX_CONTENT_LENGTH) {
        throw new Error(`Content must be between ${VALIDATION.MIN_CONTENT_LENGTH} and ${VALIDATION.MAX_CONTENT_LENGTH} characters`);
      }

      // Require authentication
      const authorAddress = requireAuth(auth);

      // Check creator role on-chain
      const hasCreatorRole = await blockchainService.hasRole(authorAddress, 'creator');
      if (!hasCreatorRole) {
        throw new Error('Unauthorized: creator role required');
      }

      // Upload to Irys with version 1 (new post)
      const irysTransactionId = await irysService.uploadPost(content, authorAddress, 1);

      // Register on blockchain
      const signerKey = process.env.SIGNER_PRIVATE_KEY;
      if (!signerKey) {
        throw new Error('Signer private key not configured');
      }

      await blockchainService.registerPost(irysTransactionId, signerKey);

      // Save to PostgreSQL
      const dbPost = await prisma.post.create({
        data: {
          irysTransactionId,
          content,
          authorAddress,
          version: 1,
        },
      });

      const post = mapDatabasePostToGraphQL(dbPost);

      // Invalidate cache and publish event
      await irysService.invalidateCache(authorAddress);
      pubsub.publish(POST_UPDATES_EVENT, {
        postUpdates: {
          type: UpdateType.CREATED,
          post,
        },
      });

      return post;
    },

    updatePost: async (
      _: any,
      { id, content }: { id: string; content: string },
      { prisma, irysService, blockchainService, auth }: Context
    ): Promise<Post> => {
      // Validate content
      if (content.length < VALIDATION.MIN_CONTENT_LENGTH || 
          content.length > VALIDATION.MAX_CONTENT_LENGTH) {
        throw new Error(`Content must be between ${VALIDATION.MIN_CONTENT_LENGTH} and ${VALIDATION.MAX_CONTENT_LENGTH} characters`);
      }

      // Require authentication
      const authorAddress = requireAuth(auth);

      // Get existing post
      const existingPost = await prisma.post.findUnique({
        where: { id },
      });

      if (!existingPost) {
        throw new Error('Post not found');
      }

      if (existingPost.authorAddress !== authorAddress) {
        throw new Error('Unauthorized: can only update your own posts');
      }

      // Check creator role on-chain
      const hasCreatorRole = await blockchainService.hasRole(authorAddress, 'creator');
      if (!hasCreatorRole) {
        throw new Error('Unauthorized: creator role required');
      }

      // Create new version with mutable reference pattern
      const newVersion = existingPost.version + 1;
      const irysTransactionId = await irysService.updatePost(
        content, 
        authorAddress, 
        existingPost.irysTransactionId, 
        newVersion
      );

      // Register update on blockchain
      const signerKey = process.env.SIGNER_PRIVATE_KEY;
      if (!signerKey) {
        throw new Error('Signer private key not configured');
      }

      // Register update on blockchain with mutable reference
      await blockchainService.updatePost(
        irysTransactionId, 
        existingPost.irysTransactionId, 
        signerKey
      );

      // Create new version in PostgreSQL
      const dbPost = await prisma.post.create({
        data: {
          irysTransactionId,
          content,
          authorAddress,
          version: newVersion,
          previousVersionId: existingPost.irysTransactionId,
        },
      });

      const post = mapDatabasePostToGraphQL(dbPost);

      // Invalidate cache and publish event
      await irysService.invalidateCache(authorAddress);
      pubsub.publish(POST_UPDATES_EVENT, {
        postUpdates: {
          type: UpdateType.UPDATED,
          post,
        },
      });

      return post;
    },
  },

  Subscription: {
    postUpdates: {
      subscribe: () => pubsub.asyncIterator([POST_UPDATES_EVENT]),
    },
  },
};