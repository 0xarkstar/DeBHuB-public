import { ApolloServer } from '@apollo/server';
import fastifyApollo, { fastifyApolloDrainPlugin } from '@as-integrations/fastify';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ethers } from 'ethers';

/**
 * Pure Irys Backend - Minimal GraphQL Gateway
 * No PostgreSQL, No Redis - Pure blockchain native
 */

// Simple GraphQL Schema
const typeDefs = `
  type Query {
    health: HealthStatus!
    status: String!
  }

  type Mutation {
    ping: String!
  }

  type Subscription {
    documentUpdated(documentId: ID!): DocumentEvent!
  }

  type HealthStatus {
    status: String!
    timestamp: String!
    blockchain: BlockchainStatus!
  }

  type BlockchainStatus {
    connected: Boolean!
    chainId: Int!
    blockNumber: Int
  }

  type DocumentEvent {
    documentId: ID!
    type: String!
    timestamp: String!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    health: async (_: any, __: any, context: any) => {
      const provider = context.provider;
      const connected = provider !== null;
      let blockNumber = null;

      try {
        blockNumber = await provider?.getBlockNumber();
      } catch (error) {
        console.error('Failed to get block number:', error);
      }

      return {
        status: connected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        blockchain: {
          connected,
          chainId: 1270,
          blockNumber,
        },
      };
    },
    status: () => 'Pure Irys BaaS - Fully Decentralized',
  },
  Mutation: {
    ping: () => 'pong',
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

async function startPureServer() {
  console.log('🚀 Starting Pure Irys Backend...');
  console.log('📦 Mode: Blockchain-native (No PostgreSQL, No Redis)');

  // Initialize blockchain provider
  const rpcUrl = process.env.RPC_URL || 'https://testnet-rpc.irys.xyz/v1/execution-rpc';
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Test blockchain connection
  try {
    const network = await provider.getNetwork();
    console.log(`✅ Connected to blockchain: ${network.name} (Chain ID: ${network.chainId})`);

    const blockNumber = await provider.getBlockNumber();
    console.log(`📊 Current block: ${blockNumber}`);
  } catch (error) {
    console.error('❌ Failed to connect to blockchain:', error);
    console.log('⚠️  Continuing in offline mode...');
  }

  // Setup Fastify app
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // CORS
  await app.register(fastifyCors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // GraphQL Context
  interface GraphQLContext {
    provider: ethers.JsonRpcProvider;
  }

  // Create Apollo Server
  const server = new ApolloServer<GraphQLContext>({
    schema,
    plugins: [
      fastifyApolloDrainPlugin(app),
    ],
  });

  await server.start();

  // Register Apollo Server
  await app.register(fastifyApollo(server), {
    context: async (): Promise<GraphQLContext> => ({
      provider,
    }),
  });

  // Health endpoint
  app.get('/health', async (request, reply) => {
    let blockNumber = null;
    let connected = false;

    try {
      blockNumber = await provider.getBlockNumber();
      connected = true;
    } catch (error) {
      console.error('Health check failed:', error);
    }

    return reply.send({
      status: connected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      mode: 'pure-irys',
      blockchain: {
        connected,
        chainId: 1270,
        blockNumber,
      },
      version: '3.0.0-pure',
    });
  });

  // Status endpoint
  app.get('/api/status', async (request, reply) => {
    return reply.send({
      api: 'DeBHuB Pure Irys BaaS',
      mode: 'fully-decentralized',
      status: 'operational',
      architecture: {
        database: 'Irys DataChain + Smart Contracts',
        cache: 'Client-side IndexedDB',
        storage: 'Irys Permanent Storage',
        authentication: 'Wallet-based (ethers.js)',
      },
      features: [
        'Zero Backend Dependencies',
        'No PostgreSQL',
        'No Redis',
        'Pure Blockchain',
        'Immutable Data',
        'Permanent Storage',
      ],
      contracts: {
        documentRegistry: '0x937956DA31B42C3ad9f6eC4366360Ae763391566',
        accessControl: '0xdD1ACe083c156296760aAe07718Baab969642B8D',
        provenanceChain: '0x44755E8C746Dc1819a0e8c74503AFC106FC800CB',
        eventBus: '0x042E4e6a56aA1680171Da5e234D9cE42CBa03E1c',
        cacheController: '0x8aFb8b9d57e9b6244e29a090ea4da1A9043a91E2',
        searchIndex: '0x2345938F52790F1d8a1E3355cA66eA3e60494A36',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Info endpoint
  app.get('/info', async (request, reply) => {
    return reply.send({
      platform: 'DeBHuB',
      version: '3.0.0-pure',
      description: 'World\'s First Pure Irys BaaS Platform',
      architecture: 'Blockchain-Native',
      documentation: 'https://docs.debhub.io',
      graphql: {
        endpoint: '/graphql',
        playground: process.env.NODE_ENV !== 'production',
      },
      note: 'All data operations happen client-side via Pure Irys Client',
    });
  });

  const PORT = Number(process.env.PORT) || 4000;
  await app.listen({ port: PORT, host: '0.0.0.0' });

  console.log(`
🎉 Pure Irys Backend Ready!

📊 Server Details:
   • GraphQL API: http://localhost:${PORT}/graphql
   • Health Check: http://localhost:${PORT}/health
   • API Status: http://localhost:${PORT}/api/status
   • Info: http://localhost:${PORT}/info

🔧 Architecture:
   • Database: ❌ None (Smart Contracts)
   • Cache: ❌ None (Client-side IndexedDB)
   • Storage: ✅ Irys DataChain
   • Backend: ✅ Minimal Gateway

🌟 Pure Irys Features:
   • Zero PostgreSQL ✅
   • Zero Redis ✅
   • 100% Decentralized ✅
   • Immutable Data ✅
   • Client-side First ✅

🚀 Ready for client connections!
  `);
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startPureServer().catch((error) => {
  console.error('❌ Error starting Pure Irys server:', error);
  process.exit(1);
});
