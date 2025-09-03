import { Uploader } from '@irys/upload';
import { Query } from '@irys/query';
import { createClient } from 'redis';
import { Post, IrysTag } from '../types';
import { createPostTags, createMutableReference } from '@irysbase/shared';

const IRYS_GATEWAY_URL = 'https://gateway.irys.xyz';

export class IrysService {
  private uploader: Uploader;
  private query: Query;
  private redisClient: ReturnType<typeof createClient>;

  constructor() {
    this.uploader = new Uploader({
      url: "https://uploader.irys.xyz",
      token: "ethereum",
    });
    
    this.query = new Query({ url: "https://uploader.irys.xyz" });
    
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.redisClient.connect().catch(console.error);
  }

  async uploadPost(
    content: string, 
    authorAddress: string, 
    version: number = 1, 
    previousId?: string
  ): Promise<string> {
    // Use shared utility to create proper tags with mutable reference pattern
    const tags = createPostTags(authorAddress, version, previousId);

    // For updates, wrap content in mutable reference structure
    let uploadContent = content;
    if (previousId && version > 1) {
      const mutableRef = createMutableReference(content, previousId, version);
      uploadContent = JSON.stringify(mutableRef);
    }

    try {
      const receipt = await this.uploader.upload(uploadContent, { tags });
      console.log(`✅ Uploaded to Irys: ${receipt.id} (version ${version})`);
      return receipt.id;
    } catch (error) {
      console.error('Failed to upload to Irys:', error);
      throw new Error('Failed to upload post to Irys');
    }
  }

  async updatePost(
    newContent: string,
    authorAddress: string,
    previousTransactionId: string,
    newVersion: number
  ): Promise<string> {
    return this.uploadPost(newContent, authorAddress, newVersion, previousTransactionId);
  }

  async getPostsByAuthor(authorAddress: string): Promise<Post[]> {
    const cacheKey = `posts:${authorAddress}`;
    
    try {
      const cached = await this.redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis cache read failed:', error);
    }

    try {
      const results = await this.query
        .search("irys:transactions")
        .tags([
          { name: "table", values: ["posts"] },
          { name: "author-address", values: [authorAddress] }
        ])
        .limit(100);

      const posts: Post[] = [];

      for (const tx of results) {
        try {
          const response = await fetch(`${IRYS_GATEWAY_URL}/${tx.id}`);
          const content = await response.text();

          posts.push({
            id: tx.id,
            content,
            authorAddress,
            timestamp: new Date(tx.timestamp).toISOString()
          });
        } catch (error) {
          console.warn(`Failed to fetch content for transaction ${tx.id}:`, error);
        }
      }

      posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      try {
        await this.redisClient.setEx(cacheKey, 300, JSON.stringify(posts));
      } catch (error) {
        console.warn('Redis cache write failed:', error);
      }

      return posts;
    } catch (error) {
      console.error('Failed to query posts from Irys:', error);
      throw new Error('Failed to fetch posts from Irys');
    }
  }

  async invalidateCache(authorAddress: string): Promise<void> {
    const cacheKey = `posts:${authorAddress}`;
    try {
      await this.redisClient.del(cacheKey);
    } catch (error) {
      console.warn('Redis cache invalidation failed:', error);
    }
  }
}