import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { PubSub } from 'graphql-subscriptions';
import { BlockchainService } from '../services/blockchain';
import { IrysService } from '../services/irys';

const prisma = new PrismaClient();
const pubsub = new PubSub();
const blockchainService = new BlockchainService();
const irysService = new IrysService();

const POST_UPDATES_EVENT = 'POST_UPDATES';

interface EventListenerConfig {
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
}

const config: EventListenerConfig = {
  maxRetries: 3,
  retryDelay: 5000,
  healthCheckInterval: 60000, // 1 minute
};

class EventListener {
  private isRunning = false;
  private reconnectAttempts = 0;
  private provider: ethers.JsonRpcProvider;
  private healthCheckTimer?: NodeJS.Timer;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://rpc.irys.computer'
    );
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Event listener is already running');
      return;
    }

    console.log('🎧 Starting blockchain event listener...');
    this.isRunning = true;
    this.reconnectAttempts = 0;

    try {
      await this.setupEventListeners();
      this.startHealthCheck();
      console.log('✅ Event listener started successfully');
    } catch (error) {
      console.error('❌ Failed to start event listener:', error);
      await this.handleError(error as Error);
    }
  }

  async stop() {
    console.log('🛑 Stopping event listener...');
    this.isRunning = false;
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    await this.provider.removeAllListeners();
    console.log('✅ Event listener stopped');
  }

  private async setupEventListeners() {
    // Set up PostCreated event listener
    const postsContract = new ethers.Contract(
      process.env.POSTS_CONTRACT_ADDRESS || '',
      [
        'event PostCreated(address indexed author, string irysTransactionId, uint256 timestamp)',
        'event PostUpdated(address indexed author, string newTransactionId, string previousTransactionId)'
      ],
      this.provider
    );

    postsContract.on('PostCreated', async (author, irysTransactionId, timestamp, event) => {
      console.log(`📝 New PostCreated event: ${author} - ${irysTransactionId}`);
      
      try {
        await this.handlePostCreatedEvent(author, irysTransactionId, timestamp, event);
      } catch (error) {
        console.error('Failed to handle PostCreated event:', error);
      }
    });

    postsContract.on('PostUpdated', async (author, newTransactionId, previousTransactionId, event) => {
      console.log(`🔄 New PostUpdated event: ${newTransactionId}`);
      
      try {
        await this.handlePostUpdatedEvent(author, newTransactionId, previousTransactionId, event);
      } catch (error) {
        console.error('Failed to handle PostUpdated event:', error);
      }
    });

    // Handle connection errors
    this.provider.on('error', async (error) => {
      console.error('🔴 Provider error:', error);
      await this.handleError(error);
    });

    // Test connection
    const blockNumber = await this.provider.getBlockNumber();
    console.log(`🔗 Connected to blockchain at block ${blockNumber}`);
  }

  private async handlePostCreatedEvent(
    author: string, 
    irysTransactionId: string, 
    timestamp: bigint, 
    event: ethers.EventLog
  ) {
    // Store the event
    await prisma.contractEvent.create({
      data: {
        eventName: 'PostCreated',
        contractAddress: event.address,
        blockNumber: BigInt(event.blockNumber),
        transactionHash: event.transactionHash,
        logIndex: event.index,
        args: { author, irysTransactionId, timestamp: timestamp.toString() },
        processed: false,
      },
    });

    // Check if post already exists
    const existingPost = await prisma.post.findUnique({
      where: { irysTransactionId },
    });

    if (!existingPost) {
      let content = 'Content pending sync from Irys';
      
      // Try to fetch actual content from Irys
      try {
        const contentData = await irysService.getPost(irysTransactionId);
        if (contentData?.content) {
          content = contentData.content;
        }
      } catch (error) {
        console.warn(`Failed to fetch content from Irys for ${irysTransactionId}:`, error);
      }
      
      const post = await prisma.post.create({
        data: {
          irysTransactionId,
          content,
          authorAddress: author,
          version: 1,
          timestamp: new Date(Number(timestamp) * 1000),
        },
      });

      // Publish to subscribers
      pubsub.publish(POST_UPDATES_EVENT, {
        postUpdates: {
          type: 'CREATED',
          post: {
            id: post.id,
            irysTransactionId: post.irysTransactionId,
            content: post.content,
            authorAddress: post.authorAddress,
            timestamp: post.timestamp.toISOString(),
            version: post.version,
            previousVersionId: post.previousVersionId,
          },
        },
      });
    }

    // Mark event as processed
    await prisma.contractEvent.updateMany({
      where: {
        transactionHash: event.transactionHash,
        logIndex: event.index,
      },
      data: { processed: true },
    });
  }

  private async handlePostUpdatedEvent(
    author: string,
    newTransactionId: string,
    previousTransactionId: string,
    event: ethers.EventLog
  ) {
    // Store the event
    await prisma.contractEvent.create({
      data: {
        eventName: 'PostUpdated',
        contractAddress: event.address,
        blockNumber: BigInt(event.blockNumber),
        transactionHash: event.transactionHash,
        logIndex: event.index,
        args: { author, newTransactionId, previousTransactionId },
        processed: false,
      },
    });

    // Find previous version
    const previousPost = await prisma.post.findUnique({
      where: { irysTransactionId: previousTransactionId },
    });

    if (previousPost) {
      let content = 'Updated content pending sync from Irys';
      
      // Try to fetch actual updated content from Irys
      try {
        const contentData = await irysService.getPost(newTransactionId);
        if (contentData?.content) {
          content = contentData.content;
        }
      } catch (error) {
        console.warn(`Failed to fetch updated content from Irys for ${newTransactionId}:`, error);
      }
      
      const post = await prisma.post.create({
        data: {
          irysTransactionId: newTransactionId,
          content,
          authorAddress: author,
          version: previousPost.version + 1,
          previousVersionId: previousTransactionId,
        },
      });

      // Publish to subscribers
      pubsub.publish(POST_UPDATES_EVENT, {
        postUpdates: {
          type: 'UPDATED',
          post: {
            id: post.id,
            irysTransactionId: post.irysTransactionId,
            content: post.content,
            authorAddress: post.authorAddress,
            timestamp: post.timestamp.toISOString(),
            version: post.version,
            previousVersionId: post.previousVersionId,
          },
        },
      });
    }

    // Mark event as processed
    await prisma.contractEvent.updateMany({
      where: {
        transactionHash: event.transactionHash,
        logIndex: event.index,
      },
      data: { processed: true },
    });
  }

  private async handleError(error: Error) {
    console.error(`💥 Event listener error (attempt ${this.reconnectAttempts + 1}):`, error);

    if (this.reconnectAttempts < config.maxRetries) {
      this.reconnectAttempts++;
      console.log(`⏳ Retrying in ${config.retryDelay}ms...`);
      
      setTimeout(async () => {
        if (this.isRunning) {
          await this.restart();
        }
      }, config.retryDelay);
    } else {
      console.error('🚨 Max retry attempts reached, stopping event listener');
      await this.stop();
    }
  }

  private async restart() {
    console.log('🔄 Restarting event listener...');
    
    try {
      await this.provider.removeAllListeners();
      await this.setupEventListeners();
      this.reconnectAttempts = 0;
      console.log('✅ Event listener restarted successfully');
    } catch (error) {
      console.error('❌ Failed to restart event listener:', error);
      await this.handleError(error as Error);
    }
  }

  private startHealthCheck() {
    this.healthCheckTimer = setInterval(async () => {
      try {
        const blockNumber = await this.provider.getBlockNumber();
        console.log(`💓 Health check: Connected at block ${blockNumber}`);
      } catch (error) {
        console.error('💔 Health check failed:', error);
        await this.handleError(error as Error);
      }
    }, config.healthCheckInterval);
  }
}

// Create singleton instance
const eventListener = new EventListener();

export function startEventListener() {
  return eventListener.start();
}

export function stopEventListener() {
  return eventListener.stop();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await stopEventListener();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopEventListener();
  await prisma.$disconnect();
  process.exit(0);
});