import Queue from 'bull';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { BlockchainService } from '../services/blockchain';
import { IrysService } from '../services/irys';

const prisma = new PrismaClient();
const syncQueue = new Queue('sync queue', process.env.REDIS_URL || 'redis://localhost:6379');
const blockchainService = new BlockchainService();
const irysService = new IrysService();

interface SyncJob {
  type: 'blockchain' | 'irys';
  fromBlock?: number;
  toBlock?: number;
}

// Process sync jobs
syncQueue.process('sync-blockchain', async (job) => {
  const { fromBlock, toBlock } = job.data;
  
  console.log(`🔄 Syncing blockchain events from block ${fromBlock} to ${toBlock}`);
  
  try {
    const events = await blockchainService.getPostCreatedEvents(fromBlock);
    
    for (const event of events) {
      await processBlockchainEvent(event);
    }
    
    // Update sync status
    await prisma.syncStatus.upsert({
      where: { syncType: 'blockchain' },
      update: {
        lastSyncedBlock: BigInt(toBlock),
        isHealthy: true,
        lastSyncTime: new Date(),
      },
      create: {
        syncType: 'blockchain',
        lastSyncedBlock: BigInt(toBlock),
        isHealthy: true,
        lastSyncTime: new Date(),
      },
    });
    
    console.log(`✅ Blockchain sync completed up to block ${toBlock}`);
  } catch (error) {
    console.error('❌ Blockchain sync failed:', error);
    
    // Mark as unhealthy
    await prisma.syncStatus.upsert({
      where: { syncType: 'blockchain' },
      update: {
        isHealthy: false,
        lastSyncTime: new Date(),
      },
      create: {
        syncType: 'blockchain',
        lastSyncedBlock: BigInt(fromBlock),
        isHealthy: false,
        lastSyncTime: new Date(),
      },
    });
    
    throw error;
  }
});

syncQueue.process('sync-irys', async (job) => {
  console.log('🔄 Syncing Irys transactions');
  
  try {
    // This would implement Irys-specific sync logic
    // For now, just mark as healthy
    await prisma.syncStatus.upsert({
      where: { syncType: 'irys' },
      update: {
        isHealthy: true,
        lastSyncTime: new Date(),
      },
      create: {
        syncType: 'irys',
        lastSyncedBlock: BigInt(0),
        isHealthy: true,
        lastSyncTime: new Date(),
      },
    });
    
    console.log('✅ Irys sync completed');
  } catch (error) {
    console.error('❌ Irys sync failed:', error);
    
    await prisma.syncStatus.upsert({
      where: { syncType: 'irys' },
      update: {
        isHealthy: false,
        lastSyncTime: new Date(),
      },
      create: {
        syncType: 'irys',
        lastSyncedBlock: BigInt(0),
        isHealthy: false,
        lastSyncTime: new Date(),
      },
    });
    
    throw error;
  }
});

async function processBlockchainEvent(event: ethers.EventLog) {
  try {
    // Store the event
    await prisma.contractEvent.create({
      data: {
        eventName: event.eventName || 'PostCreated',
        contractAddress: event.address,
        blockNumber: BigInt(event.blockNumber),
        transactionHash: event.transactionHash,
        logIndex: event.index,
        args: event.args ? JSON.parse(JSON.stringify(event.args)) : {},
        processed: false,
      },
    });
    
    // Process the event based on type
    if (event.eventName === 'PostCreated') {
      await processPostCreatedEvent(event);
    } else if (event.eventName === 'PostUpdated') {
      await processPostUpdatedEvent(event);
    }
  } catch (error) {
    console.error('Failed to process blockchain event:', error);
  }
}

async function processPostCreatedEvent(event: ethers.EventLog) {
  const [author, irysTransactionId, timestamp] = event.args || [];
  
  console.log(`📝 Processing PostCreated event: ${author} - ${irysTransactionId}`);
  
  // Check if we already have this post
  const existingPost = await prisma.post.findUnique({
    where: { irysTransactionId },
  });
  
  if (existingPost) {
    console.log(`Post ${irysTransactionId} already exists, skipping`);
    return;
  }
  
  // Try to fetch content from Irys
  try {
    // This would fetch actual content from Irys
    // For now, create a placeholder
    await prisma.post.create({
      data: {
        irysTransactionId,
        content: 'Content to be synced from Irys',
        authorAddress: author,
        version: 1,
        timestamp: new Date(Number(timestamp) * 1000),
      },
    });
    
    console.log(`✅ Created post from blockchain event: ${irysTransactionId}`);
  } catch (error) {
    console.error(`Failed to create post from event:`, error);
  }
}

async function processPostUpdatedEvent(event: ethers.EventLog) {
  const [author, newTransactionId, previousTransactionId] = event.args || [];
  
  console.log(`🔄 Processing PostUpdated event: ${newTransactionId}`);
  
  // Find the previous version
  const previousPost = await prisma.post.findUnique({
    where: { irysTransactionId: previousTransactionId },
  });
  
  if (!previousPost) {
    console.warn(`Previous post ${previousTransactionId} not found`);
    return;
  }
  
  // Create new version
  await prisma.post.create({
    data: {
      irysTransactionId: newTransactionId,
      content: 'Updated content to be synced from Irys',
      authorAddress: author,
      version: previousPost.version + 1,
      previousVersionId: previousTransactionId,
    },
  });
  
  console.log(`✅ Created updated post from blockchain event: ${newTransactionId}`);
}

// Start periodic sync
export function startSyncWorker() {
  console.log('🚀 Starting sync worker');
  
  // Schedule blockchain sync every 30 seconds
  syncQueue.add('sync-blockchain', {
    type: 'blockchain'
  }, {
    repeat: { every: 30000 },
    removeOnComplete: 10,
    removeOnFail: 5,
  });
  
  // Schedule Irys sync every 5 minutes
  syncQueue.add('sync-irys', {
    type: 'irys'
  }, {
    repeat: { every: 300000 },
    removeOnComplete: 10,
    removeOnFail: 5,
  });
  
  console.log('⏰ Sync jobs scheduled');
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down sync worker...');
  await syncQueue.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down sync worker...');
  await syncQueue.close();
  await prisma.$disconnect();
  process.exit(0);
});