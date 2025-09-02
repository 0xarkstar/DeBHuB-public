import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import express from 'express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { readFileSync } from 'fs';
import { join } from 'path';
import cors from 'cors';
import { resolvers } from './resolvers';
import { connectDatabase, prisma } from './services/database';
import { IrysService } from './services/irys';
import { BlockchainService } from './services/blockchain';
import { extractAuthFromHeaders, AuthContext } from './services/auth';
import { startSyncWorker } from './workers/sync-worker';
import { startEventListener } from './workers/event-listener';

const typeDefs = readFileSync(join(__dirname, 'schema.graphql'), 'utf8');

const schema = makeExecutableSchema({ typeDefs, resolvers });

async function startServer() {
  // Initialize services
  await connectDatabase();
  const irysService = new IrysService();
  const blockchainService = new BlockchainService();

  // Start background workers
  startSyncWorker();
  await startEventListener();

  const app = express();
  const httpServer = createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer({ schema }, wsServer);

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
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
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<{
        prisma: typeof prisma;
        irysService: IrysService;
        blockchainService: BlockchainService;
        auth: AuthContext;
      }> => ({
        prisma,
        irysService,
        blockchainService,
        auth: extractAuthFromHeaders(req.headers),
      }),
    }),
  );

  const PORT = process.env.PORT || 4000;

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🚀 Subscription endpoint ready at ws://localhost:${PORT}/graphql`);
  });
}

startServer().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});