# Getting Started with IrysBase

Complete guide to getting started with IrysBase development.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [First Steps](#first-steps)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js 18+**
   ```bash
   node --version  # Should be 18.0.0 or higher
   ```
   [Download Node.js](https://nodejs.org/)

2. **pnpm 8+**
   ```bash
   npm install -g pnpm
   pnpm --version  # Should be 8.0.0 or higher
   ```

3. **PostgreSQL**
   - Install: [PostgreSQL Downloads](https://www.postgresql.org/download/)
   - Or use Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15`

4. **Redis**
   - Install: [Redis Downloads](https://redis.io/download)
   - Or use Docker: `docker run -p 6379:6379 redis:7`

### Optional Tools

- **Docker** - For containerized database setup
- **Git** - For version control
- **VS Code** - Recommended IDE with GraphQL extensions

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/irysbase.git
cd irysbase
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install dependencies for all packages in the monorepo.

### 3. Verify Installation

```bash
# Check workspace structure
pnpm list --depth=0

# Verify packages
ls -la apps/
ls -la packages/
```

---

## Configuration

### 1. Set Up Environment Variables

#### API Configuration

```bash
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/irysbase"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
PORT=4000
NODE_ENV=development

# Irys Configuration
IRYS_NETWORK="devnet"  # or "mainnet"
IRYS_TOKEN="matic"
IRYS_PRIVATE_KEY="your-private-key"  # Optional for uploads

# IrysVM Blockchain
IRYSVM_RPC_URL="https://rpc.irys.xyz"
IRYSVM_CHAIN_ID=1270
IRYSVM_PRIVATE_KEY="your-private-key"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-jwt-secret-here"

# CORS
CORS_ORIGIN="http://localhost:3000"
```

#### Frontend Configuration

```bash
cd apps/web
cp .env.example .env.local
```

Edit `apps/web/.env.local`:

```env
# API
NEXT_PUBLIC_API_URL="http://localhost:4000/graphql"
NEXT_PUBLIC_WS_URL="ws://localhost:4000/graphql"

# Blockchain
NEXT_PUBLIC_CHAIN_ID=1270
NEXT_PUBLIC_RPC_URL="https://rpc.irys.xyz"

# Irys
NEXT_PUBLIC_IRYS_GATEWAY="https://gateway.irys.xyz"
```

### 2. Initialize Database

```bash
cd apps/api

# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm db:migrate

# (Optional) Seed database
pnpm db:seed
```

### 3. Deploy Smart Contracts (Optional)

```bash
cd packages/contracts

# Deploy to local network
pnpm run deploy:local

# Or deploy to IrysVM testnet
pnpm run deploy
```

Save the deployed contract addresses to your `.env` file.

---

## Running Locally

### Quick Start (All Services)

```bash
# From root directory
pnpm run dev:enhanced
```

This starts:
- API Server: http://localhost:4000
- GraphQL Playground: http://localhost:4000/graphql
- Frontend: http://localhost:3000

### Individual Services

#### 1. Start API Only

```bash
# Enhanced API with all services
pnpm run api:dev:enhanced

# Or basic API
pnpm run dev:api
```

#### 2. Start Frontend Only

```bash
pnpm run dev:web
```

#### 3. Start with Docker

```bash
# Start databases
docker-compose up -d postgres redis

# Start development servers
pnpm run dev:enhanced
```

### Verify Installation

1. **Check API Health:**
   ```bash
   curl http://localhost:4000/health
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-15T12:00:00.000Z"
   }
   ```

2. **Open GraphQL Playground:**
   Navigate to http://localhost:4000/graphql

3. **Test Frontend:**
   Navigate to http://localhost:3000

---

## First Steps

### 1. Create Your First Project

Open GraphQL Playground and run:

```graphql
mutation {
  createProject(input: {
    name: "My First Project"
    slug: "my-first-project"
    description: "Getting started with IrysBase"
    visibility: PUBLIC
  }) {
    id
    name
    slug
    irysId
    permanentUrl
  }
}
```

### 2. Create a Document

```graphql
mutation {
  createDocument(input: {
    projectId: "YOUR_PROJECT_ID"
    title: "Hello World"
    content: "# Hello World\n\nThis is my first document on IrysBase!"
    path: "/hello-world"
    tags: ["tutorial"]
  }) {
    id
    title
    irysId
    contentHash
    permanentUrl
  }
}
```

### 3. Query Your Documents

```graphql
query {
  projectDocuments(projectId: "YOUR_PROJECT_ID") {
    id
    title
    path
    published
    createdAt
  }
}
```

### 4. Search Documents

```graphql
query {
  searchDocuments(query: "hello", limit: 10) {
    documentId
    title
    highlights
    similarity
  }
}
```

### 5. Get Project Metrics

```graphql
query {
  projectMetrics(projectId: "YOUR_PROJECT_ID") {
    totalDocuments
    publishedDocuments
    recentActivity {
      type
      description
      timestamp
    }
  }
}
```

---

## Development Workflow

### Project Structure

```
irysbase/
├── apps/
│   ├── api/           # Backend API
│   └── web/           # Frontend
├── packages/
│   ├── core/          # Core orchestrator
│   ├── contracts/     # Smart contracts
│   ├── shared/        # Shared utilities
│   └── ...
└── docs/              # Documentation
```

### Common Commands

```bash
# Development
pnpm run dev              # Start basic platform
pnpm run dev:enhanced     # Start enhanced platform

# Building
pnpm run build            # Build all packages
pnpm run build:enhanced   # Build enhanced API

# Testing
pnpm test                 # Run tests
pnpm run typecheck        # Type checking
pnpm run lint             # Lint code

# Database
pnpm run db:generate      # Generate Prisma client
pnpm run db:migrate       # Run migrations
pnpm run db:studio        # Open Prisma Studio
pnpm run db:reset         # Reset database

# Workspace Management
pnpm add <package> --filter @irysbase/api
pnpm run build --filter @irysbase/web
```

### Hot Reload

Both API and frontend support hot reload:

- **API**: Automatically restarts on file changes
- **Frontend**: Next.js Fast Refresh

### Working with Services

#### Add New Service

1. Create service file:
   ```bash
   touch apps/api/src/services/my-service.ts
   ```

2. Implement service:
   ```typescript
   export class MyService {
     async initialize() {
       console.log('✅ My service initialized');
     }

     async healthCheck() {
       return true;
     }
   }
   ```

3. Register in enhanced platform:
   ```typescript
   // apps/api/src/index-enhanced.ts
   import { MyService } from './services/my-service';

   const myService = new MyService();
   await myService.initialize();
   ```

#### Add GraphQL Resolver

1. Update schema:
   ```graphql
   # apps/api/src/schema-enhanced.graphql
   type Query {
     myQuery: String!
   }
   ```

2. Implement resolver:
   ```typescript
   // apps/api/src/resolvers/enhanced-resolvers.ts
   export const resolvers = {
     Query: {
       myQuery: async () => {
         return "Hello from my query!";
       }
     }
   };
   ```

### Database Migrations

#### Create Migration

```bash
cd apps/api

# Create migration
npx prisma migrate dev --name add_new_feature

# Apply migration
pnpm db:migrate
```

#### Update Prisma Schema

1. Edit `apps/api/prisma/schema.prisma`
2. Generate client: `pnpm db:generate`
3. Create migration: `npx prisma migrate dev`

### Frontend Development

#### Add New Page

```bash
cd apps/web

# Create page
touch src/app/my-page/page.tsx
```

```typescript
// src/app/my-page/page.tsx
export default function MyPage() {
  return <div>My New Page</div>;
}
```

#### Add GraphQL Query

```typescript
// src/lib/queries.ts
export const MY_QUERY = gql`
  query MyQuery {
    myQuery
  }
`;

// Use in component
const { data, loading } = useQuery(MY_QUERY);
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check PostgreSQL is running
psql -U postgres -h localhost

# Or start Docker container
docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
```

#### 2. Redis Connection Error

**Error:** `Redis connection failed`

**Solution:**
```bash
# Check Redis is running
redis-cli ping

# Or start Docker container
docker run -p 6379:6379 redis:7
```

#### 3. Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
cd apps/api
pnpm db:generate
```

#### 4. Port Already in Use

**Error:** `Port 4000 is already in use`

**Solution:**
```bash
# Find process using port
lsof -i :4000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=4001
```

#### 5. GraphQL Schema Errors

**Error:** `Unknown type "X"`

**Solution:**
```bash
# Restart API server
# GraphQL schema is loaded on startup
```

#### 6. WebSocket Connection Failed

**Error:** `WebSocket connection failed`

**Solution:**
- Check `NEXT_PUBLIC_WS_URL` in `.env.local`
- Ensure API server is running
- Check CORS configuration

### Debug Mode

Enable detailed logging:

```env
# apps/api/.env
NODE_ENV=development
DEBUG=irysbase:*
LOG_LEVEL=debug
```

### Getting Help

1. **Check Logs:**
   - API: Console output
   - Frontend: Browser console
   - Database: PostgreSQL logs

2. **Prisma Studio:**
   ```bash
   pnpm run db:studio
   ```
   Navigate to http://localhost:5555

3. **GraphQL Playground:**
   - Test queries interactively
   - View schema documentation
   - Check for errors

4. **Health Check:**
   ```bash
   curl http://localhost:4000/health
   ```

---

## Next Steps

### Tutorials

1. [Build Your First App](./tutorials/first-app.md)
2. [Real-time Collaboration](./tutorials/realtime.md)
3. [Search Implementation](./tutorials/search.md)
4. [Deploy to Production](./DEPLOYMENT.md)

### API Documentation

- [Full API Reference](./API.md)
- [Service Documentation](./SERVICES.md)
- [Architecture Overview](./ARCHITECTURE.md)

### Examples

- [GraphQL Queries](../examples/queries.md)
- [Real-time Features](../examples/realtime.md)
- [Programmable Data](../examples/programmable-data.md)

---

## Additional Resources

### Tools

- **Prisma Studio** - Database GUI (`pnpm run db:studio`)
- **GraphQL Playground** - API explorer (http://localhost:4000/graphql)
- **Bull Board** - Queue dashboard (http://localhost:4000/admin/queues)

### VS Code Extensions

- GraphQL: GraphQL Language Support
- Prisma: Prisma ORM Support
- ESLint: Code linting
- Prettier: Code formatting

### Configuration Files

- `turbo.json` - Turborepo configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Workspace configuration
- `prisma/schema.prisma` - Database schema
- `schema-enhanced.graphql` - GraphQL schema

---

For more help, see:
- [API Documentation](./API.md)
- [Services Guide](./SERVICES.md)
- [Architecture](./ARCHITECTURE.md)
- [Deployment](./DEPLOYMENT.md)