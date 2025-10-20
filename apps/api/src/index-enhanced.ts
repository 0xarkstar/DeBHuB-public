import { ApolloServer } from '@apollo/server';
import fastifyApollo, { fastifyApolloDrainPlugin } from '@as-integrations/fastify';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCompress from '@fastify/compress';
import fastifyRateLimit from '@fastify/rate-limit';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { readFileSync } from 'fs';
import { join } from 'path';

// Import services
import { connectDatabase, prisma } from './services/database';
import { IrysService } from './services/irys';
import { BlockchainService } from './services/blockchain';
import { extractAuthFromHeaders, AuthContext } from './services/auth';

// Import enhanced platform
import { 
  createPlatform, 
  DeBHuBPlatformImpl 
} from './services/debhub-platform';

// Import resolvers
import { resolvers } from './resolvers'; // Legacy resolvers
import { enhancedResolvers } from './resolvers/enhanced-resolvers';

// Import error handling
import { AppError } from './utils/errors';

// Import workers
import { startSyncWorker } from './workers/sync-worker';
import { startEventListener } from './workers/event-listener';

/**
 * Enhanced DeBHuB Server with Full Platform Integration
 * Implements the complete Supabase-like BaaS functionality
 */

const typeDefs = readFileSync(join(__dirname, 'schema-enhanced.graphql'), 'utf8');

// Combine legacy and enhanced resolvers
const combinedResolvers = {
  Query: {
    ...resolvers.Query,
    ...enhancedResolvers.Query,
  },
  Mutation: {
    ...resolvers.Mutation,
    ...enhancedResolvers.Mutation,
  },
  Subscription: {
    ...resolvers.Subscription,
    ...enhancedResolvers.Subscription,
  },
  // Add type resolvers from enhanced resolvers (excluding Query, Mutation, Subscription)
  Project: enhancedResolvers.Project,
  Document: enhancedResolvers.Document,
  User: enhancedResolvers.User,
};

const schema = makeExecutableSchema({ 
  typeDefs, 
  resolvers: combinedResolvers 
});

async function startEnhancedServer() {
  console.log('🚀 Starting DeBHuB Enhanced Server...');

  // Initialize database
  await connectDatabase();

  // Initialize core services
  const irysService = new IrysService();
  const blockchainService = new BlockchainService();

  // Initialize the complete DeBHuB platform
  const platform = createPlatform(irysService, {
    services: {
      enableVector: true,
      enableSearch: true,
      enableAnalytics: true,
      enableEdge: true,
      enableProgrammable: true,
    },
    irys: {
      network: process.env.IRYS_NETWORK || 'mainnet',
      token: process.env.IRYS_TOKEN || 'arweave',
    },
    database: {
      url: process.env.DATABASE_URL,
      poolSize: 10,
    },
  });

  // Initialize all platform services
  console.log('📦 Initializing platform services...');
  await platform.initialize();

  // Health check
  const healthStatus = await platform.healthCheck();
  console.log('🏥 Platform health check:', healthStatus);

  if (!healthStatus.healthy) {
    console.error('❌ Some services are unhealthy:', healthStatus.services);
    // Continue but with warnings
  }

  // Start background workers
  console.log('⚙️ Starting background workers...');
  startSyncWorker();
  await startEventListener();

  // Setup Fastify app with performance optimizations
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    requestIdLogLabel: 'reqId',
    disableRequestLogging: process.env.NODE_ENV === 'production',
    bodyLimit: 52428800, // 50MB for document uploads
  });

  // Register plugins for performance
  await app.register(fastifyCors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  await app.register(fastifyCompress, {
    encodings: ['gzip', 'deflate'],
    threshold: 1024, // Compress responses > 1KB
  });

  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Setup WebSocket server for GraphQL subscriptions
  const wsServer = new WebSocketServer({
    server: app.server,
    path: '/graphql',
  });

  // Enhanced WebSocket handling for collaboration
  wsServer.on('connection', (websocket, request) => {
    console.log('🔗 New WebSocket connection');
    
    // Handle collaboration session joining
    websocket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join_collaboration') {
          const { documentId, user } = data;
          await platform.core.realtime.joinSession(
            `doc:${documentId}`,
            user,
            websocket
          );
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
  });

  const serverCleanup = useServer({ schema }, wsServer);

  // Define context type
  interface GraphQLContext {
    prisma: typeof prisma;
    irysService: IrysService;
    blockchainService: BlockchainService;
    databaseService: any;
    storageService: any;
    realtimeService: any;
    vectorDBService: any;
    functionService: any;
    searchService: any;
    analyticsService: any;
    programmableDataService: any;
    auth: AuthContext;
    platform: DeBHuBPlatformImpl;
  }

  // Create Apollo Server with error formatting
  const server = new ApolloServer<GraphQLContext>({
    schema,
    plugins: [
      fastifyApolloDrainPlugin(app),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    formatError: (formattedError, error) => {
      // Check if it's our custom AppError
      const originalError = error as any;

      if (originalError?.originalError instanceof AppError) {
        const appError = originalError.originalError as AppError;
        return {
          message: appError.message,
          code: appError.code,
          statusCode: appError.statusCode,
          path: formattedError.path,
          locations: formattedError.locations,
        };
      }

      // For other errors, return formatted error with code
      console.error('GraphQL Error:', formattedError);

      return {
        message: formattedError.message,
        code: formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR',
        path: formattedError.path,
        locations: formattedError.locations,
        ...(process.env.NODE_ENV === 'development' && {
          stack: (formattedError.extensions?.exception as any)?.stacktrace,
        }),
      };
    },
  });

  await server.start();

  // Register Apollo Server with Fastify, providing context function
  await app.register(fastifyApollo(server), {
    context: async (request: any, reply: any): Promise<GraphQLContext> => ({
      // Legacy services
      prisma,
      irysService,
      blockchainService,

      // Enhanced platform services
      databaseService: platform.core.database,
      storageService: platform.core.storage,
      realtimeService: platform.core.realtime,
      vectorDBService: platform.advanced.vector,
      functionService: platform.core.functions,
      searchService: platform.advanced.search,
      analyticsService: platform.advanced.analytics,
      programmableDataService: platform.advanced.programmable,

      // Auth context
      auth: extractAuthFromHeaders(request.headers),

      // Full platform access
      platform,
    }),
  });

  // Health check endpoint
  app.get('/health', async (request, reply) => {
    const healthStatus = await platform.healthCheck();
    return reply.send({
      status: healthStatus.healthy ? 'healthy' : 'degraded',
      timestamp: healthStatus.timestamp,
      services: healthStatus.services,
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  // Metrics endpoint
  app.get('/metrics', async (request, reply) => {
    // Basic metrics - could integrate with Prometheus
    return reply.send({
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  });

  // Documentation endpoint
  app.get('/docs', async (request, reply) => {
    return reply.send({
      platform: 'DeBHuB',
      version: '2.0.0',
      description: 'Web3 Backend-as-a-Service Platform',
      documentation: 'https://docs.debhub.io',
      graphql: {
        endpoint: '/graphql',
        playground: process.env.NODE_ENV !== 'production',
        subscriptions: 'ws://localhost:4000/graphql',
      },
      services: {
        core: ['auth', 'database', 'storage', 'realtime', 'functions'],
        advanced: ['vector', 'search', 'analytics', 'edge', 'programmable'],
      },
    });
  });

  // API status endpoint
  app.get('/api/status', async (request, reply) => {
    const healthStatus = await platform.healthCheck();

    return reply.send({
      api: 'DeBHuB Platform API',
      status: 'operational',
      services: {
        database: healthStatus.services.database ? 'online' : 'offline',
        storage: healthStatus.services.storage ? 'online' : 'offline',
        realtime: healthStatus.services.realtime ? 'online' : 'offline',
        functions: healthStatus.services.functions ? 'online' : 'offline',
        vector: healthStatus.services.vector ? 'online' : 'offline',
        search: healthStatus.services.search ? 'online' : 'offline',
        analytics: healthStatus.services.analytics ? 'online' : 'offline',
        programmable: healthStatus.services.programmable ? 'online' : 'offline',
      },
      features: [
        'Document Management',
        'Real-time Collaboration',
        'Vector Search',
        'AI Functions',
        'Blockchain Storage',
        'Analytics',
        'Multi-language Support',
      ],
      timestamp: new Date().toISOString(),
    });
  });

  const PORT = Number(process.env.PORT) || 4000;

  await app.listen({ port: PORT, host: '0.0.0.0' });

  console.log(`
🎉 DeBHuB Enhanced Server Ready!

📊 Server Details:
   • GraphQL API: http://localhost:${PORT}/graphql
   • WebSocket: ws://localhost:${PORT}/graphql
   • Health Check: http://localhost:${PORT}/health
   • API Status: http://localhost:${PORT}/api/status
   • Documentation: http://localhost:${PORT}/docs

🔧 Platform Services:
   • Database: ${healthStatus.services.database ? '✅' : '❌'}
   • Storage: ${healthStatus.services.storage ? '✅' : '❌'}
   • Realtime: ${healthStatus.services.realtime ? '✅' : '❌'}
   • Functions: ${healthStatus.services.functions ? '✅' : '❌'}
   • Vector DB: ${healthStatus.services.vector ? '✅' : '❌'}
   • Search: ${healthStatus.services.search ? '✅' : '❌'}
   • Analytics: ${healthStatus.services.analytics ? '✅' : '❌'}
   • Programmable: ${healthStatus.services.programmable ? '✅' : '❌'}

🚀 Ready for IrysBook integration!
  `);
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection:', error);
  process.exit(1);
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

startEnhancedServer().catch((error) => {
  console.error('❌ Error starting enhanced server:', error);
  process.exit(1);
});