# IrysBase

> **Decentralized Backend-as-a-Service (BaaS)** - Permanent storage meets fast querying with real-time collaboration

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8+-orange.svg)](https://pnpm.io/)
[![Integration Status](https://img.shields.io/badge/Integration-80%25-yellow.svg)](#-integration-status)

## 🎯 What is IrysBase?

IrysBase combines the permanence of **Irys blockchain storage** with the speed of **PostgreSQL** to create a production-ready platform for building decentralized documentation and collaboration tools.

### Key Features

| Feature | Status | Description |
|---------|--------|-------------|
| 📚 **Document Management** | ✅ 95% | Git-like versioning, history, and rollback |
| 🔐 **Wallet Authentication** | ⚠️ 60% | Web3 wallet login (needs integration) |
| 🗄️ **Permanent Storage** | ✅ 90% | Irys DataChain integration |
| 🔍 **Search** | ✅ 85% | Full-text + AI semantic search (planned) |
| 💬 **Real-time Collaboration** | ⚠️ 70% | WebSocket + Subscriptions |
| 📊 **Analytics** | ✅ 90% | Usage metrics and insights |
| 🤖 **AI Integration** | ⚠️ 40% | Vector embeddings (planned) |
| 🌐 **Edge Functions** | ⚠️ 50% | Serverless compute (needs security audit) |

**Overall Platform Status**: 🟡 **80% Complete** - Core features operational, integration in progress

📖 **See detailed breakdown**: [INTEGRATION_TASKS.md](./INTEGRATION_TASKS.md)

---

## 🏗️ Architecture

IrysBase implements a **hybrid architecture** combining decentralized and traditional systems:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │   Document   │  │   Settings   │      │
│  │              │  │    Editor    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                  Apollo Client + WebSocket                   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                   GraphQL API (Apollo Server)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Queries (43) │ Mutations (18) │ Subscriptions (5)  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                        Service Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Irys      │  │  PostgreSQL  │  │    Redis     │      │
│  │   Service    │  │   Database   │  │    Cache     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Search     │  │   Realtime   │  │  Analytics   │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                      Data Persistence                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │     Irys     │  │    Redis     │      │
│  │  (Queries)   │  │ (Permanent)  │  │   (Cache)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Example

**User creates a document** →

1. Frontend sends `createDocument` mutation via Apollo Client
2. GraphQL resolver validates + creates DB record (PostgreSQL)
3. Background: Upload to Irys for permanent storage
4. Return document with `irysId` and `permanentUrl`
5. WebSocket broadcasts to collaborators
6. Cache updated (Redis)

---

## 🛠️ Tech Stack

### Backend
- **GraphQL**: Apollo Server 4 with subscriptions
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: Irys DataChain (permanent)
- **Cache**: Redis
- **Queue**: Bull (background jobs)
- **Blockchain**: IrysVM (Chain ID: 1270) + ethers.js

### Frontend
- **Framework**: React 18 + Vite
- **State**: Apollo Client (GraphQL), Zustand (wallet)
- **UI**: Tailwind CSS + shadcn/ui
- **Web3**: wagmi v2 + RainbowKit + viem
- **Charts**: Recharts

### Infrastructure
- **Monorepo**: Turborepo + pnpm workspaces
- **Language**: TypeScript 5.0+
- **Testing**: Vitest + Playwright

---

## 📦 Project Structure

```
irysbase/
├── apps/
│   ├── api/                          # Backend GraphQL API
│   │   ├── src/
│   │   │   ├── index-enhanced.ts     # ✅ Main server entry
│   │   │   ├── schema-enhanced.graphql   # ✅ Complete GraphQL schema
│   │   │   ├── resolvers/
│   │   │   │   ├── index.ts          # ✅ Legacy resolvers
│   │   │   │   └── enhanced-resolvers.ts # ✅ Full platform resolvers
│   │   │   ├── services/             # ✅ All services implemented
│   │   │   │   ├── irys.ts           # Irys client
│   │   │   │   ├── blockchain.ts     # Smart contract interaction
│   │   │   │   ├── database-service.ts
│   │   │   │   ├── storage-service.ts
│   │   │   │   ├── search-service.ts
│   │   │   │   ├── realtime-service.ts
│   │   │   │   ├── analytics-service.ts
│   │   │   │   └── ...
│   │   │   └── workers/              # ✅ Background workers
│   │   │       ├── sync-worker.ts    # Irys/DB sync
│   │   │       └── event-listener.ts # Blockchain events
│   │   └── prisma/
│   │       └── schema.prisma         # ✅ Complete database schema
│   │
│   └── web-vite/                     # Frontend (React + Vite)
│       └── src/
│           ├── pages/                # ✅ All pages implemented
│           │   ├── Dashboard.tsx     # Project list
│           │   ├── ProjectPage.tsx   # Project details
│           │   ├── DocumentPage.tsx  # Document editor
│           │   ├── SearchPage.tsx    # Search interface
│           │   ├── StoragePage.tsx   # Irys usage
│           │   ├── BlockchainPage.tsx # Chain status
│           │   └── UsagePage.tsx     # Analytics
│           ├── components/           # ✅ UI components
│           │   ├── dashboard/
│           │   ├── editor/
│           │   ├── storage/
│           │   ├── blockchain/
│           │   └── ui/               # shadcn/ui
│           └── lib/
│               ├── apollo.ts         # ✅ GraphQL client
│               ├── wagmi.ts          # ✅ Wallet config
│               └── graphql/          # ✅ Queries/Mutations
│
├── packages/
│   ├── core/                         # ✅ Orchestrator
│   ├── contracts/                    # ✅ Smart contracts
│   ├── irys-integration/             # ✅ Irys SDK wrapper
│   ├── shared/                       # ✅ Shared types/utils
│   └── testing/                      # ✅ Test infrastructure
│
├── docs/                             # 📚 Documentation
│   ├── ARCHITECTURE.md
│   ├── SERVICES.md
│   └── ...
│
├── INTEGRATION_TASKS.md              # 🔧 Integration guide
├── PROJECT_STATUS.md                 # 📊 Current status
└── README.md                         # 👈 You are here
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **PostgreSQL** ([Download](https://www.postgresql.org/download/))
- **Redis** ([Download](https://redis.io/download))

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/irysbase.git
cd irysbase

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web-vite/.env.example apps/web-vite/.env

# Edit .env files with your configuration
# - DATABASE_URL (PostgreSQL)
# - REDIS_URL
# - JWT_SECRET
# - IRYS_PRIVATE_KEY
# - RPC_URL (IrysVM)
```

**Backend `.env` example**:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/irysbase"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
IRYS_PRIVATE_KEY="your-irys-key"
RPC_URL="https://rpc.irys.xyz"
```

**Frontend `.env` example**:
```bash
VITE_GRAPHQL_URL="http://localhost:4000/graphql"
VITE_GRAPHQL_WS_URL="ws://localhost:4000/graphql"
VITE_WALLETCONNECT_PROJECT_ID="your-project-id"
```

### Database Setup

```bash
# Generate Prisma client
pnpm run db:generate

# Run migrations
pnpm run db:migrate

# (Optional) Seed sample data
pnpm run db:seed
```

### Start Development

```bash
# Start all services (recommended)
pnpm run dev:enhanced

# Or start separately:
pnpm run api:dev:enhanced  # Backend only (port 4000)
pnpm run web:dev           # Frontend only (port 5173)
```

### Access

- **Frontend**: http://localhost:5173
- **GraphQL Playground**: http://localhost:4000/graphql
- **Health Check**: http://localhost:4000/health

---

## 📖 Usage Examples

### Authentication Flow

```typescript
// 1. Connect wallet (RainbowKit)
import { ConnectButton } from '@rainbow-me/rainbowkit';

// 2. Request challenge
const { data } = await requestChallenge({ address });

// 3. Sign message
const signature = await signMessage(data.challenge);

// 4. Authenticate
const { token } = await authenticate({ address, signature });
localStorage.setItem('authToken', token);
```

### GraphQL Examples

**Create Project**
```graphql
mutation {
  createProject(input: {
    name: "My Documentation"
    slug: "my-docs"
    description: "Project description"
    visibility: PUBLIC
    settings: {}
  }) {
    id
    name
    irysId
    permanentUrl
  }
}
```

**Create Document**
```graphql
mutation {
  createDocument(input: {
    projectId: "project-id"
    title: "Getting Started"
    path: "/getting-started"
    content: "# Welcome\n\nYour content here"
    metadata: {}
  }) {
    id
    title
    irysId
    contentHash
  }
}
```

**Search Documents**
```graphql
query {
  searchDocuments(input: {
    query: "authentication"
    projectId: "project-id"
    type: FULLTEXT
    limit: 10
  }) {
    documentId
    title
    content
    similarity
    highlights
  }
}
```

**Real-time Subscription**
```graphql
subscription {
  documentChanged(documentId: "doc-id") {
    type
    documentId
    userId
    change
    timestamp
  }
}
```

---

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

---

## 🚢 Deployment

### Docker (Recommended)

```bash
# Build image
docker build -t irysbase:latest .

# Run with docker-compose
docker-compose up -d
```

### Vercel (Frontend)

```bash
cd apps/web-vite
vercel deploy
```

### Railway (Backend)

```bash
cd apps/api
railway up
```

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

---

## 🔧 Integration Status

### ✅ Completed (80%)

- ✅ GraphQL API (43 queries, 18 mutations, 5 subscriptions)
- ✅ Database schema (Prisma + PostgreSQL)
- ✅ Document CRUD operations
- ✅ Version management (Git-like)
- ✅ Project management
- ✅ Collaborator system
- ✅ Comment threads
- ✅ Search (full-text)
- ✅ Irys upload/storage
- ✅ Wallet connection (RainbowKit)

### ⚠️ In Progress (20%)

| Task | Status | Priority | See |
|------|--------|----------|-----|
| **Authentication** | 60% | 🔴 Critical | [INTEGRATION_TASKS.md#task-1](./INTEGRATION_TASKS.md#task-1-인증-시스템-구현) |
| **Storage Metrics** | 40% | 🟡 High | [INTEGRATION_TASKS.md#task-2](./INTEGRATION_TASKS.md#task-2-storage-메트릭-api-구현) |
| **GraphQL Schema Sync** | 70% | 🟡 Medium | [INTEGRATION_TASKS.md#task-3](./INTEGRATION_TASKS.md#task-3-graphql-스키마-동기화) |
| **Error Handling** | 50% | 🟡 Medium | [INTEGRATION_TASKS.md#task-4](./INTEGRATION_TASKS.md#task-4-에러-처리-강화) |
| **Subscriptions** | 60% | 🟢 Low | [INTEGRATION_TASKS.md#task-5](./INTEGRATION_TASKS.md#task-5-실시간-subscription-활성화) |
| **AI Search** | 20% | 🟢 Optional | [INTEGRATION_TASKS.md#task-8](./INTEGRATION_TASKS.md#task-8-ai-검색-통합) |

📋 **Complete integration roadmap**: [INTEGRATION_TASKS.md](./INTEGRATION_TASKS.md)

### Estimated Timeline

- **Week 1-2**: Authentication + Storage API (Priority 1)
- **Week 3-4**: Subscriptions + UX improvements (Priority 2)
- **Week 5+**: AI features + optimizations (Priority 3)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **TypeScript**: Strict mode enabled
- **Code Style**: ESLint + Prettier
- **Commits**: Conventional commits
- **Tests**: Write tests for new features
- **Docs**: Update documentation

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with these amazing technologies:

- [Irys](https://irys.xyz/) - Permanent data storage
- [PostgreSQL](https://www.postgresql.org/) - Relational database
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Apollo GraphQL](https://www.apollographql.com/) - GraphQL platform
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [RainbowKit](https://www.rainbowkit.com/) - Wallet connection
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

## 📞 Support & Resources

- **Documentation**: [docs/](./docs/)
- **Integration Guide**: [INTEGRATION_TASKS.md](./INTEGRATION_TASKS.md)
- **Project Status**: [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/irysbase/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/irysbase/discussions)

---

## 🗺️ Roadmap

### Phase 1: Core Platform ✅ (Current - 80% Complete)
- [x] Document management
- [x] Project organization
- [x] Version control
- [x] Basic search
- [ ] Authentication (60%)
- [ ] Storage metrics (40%)

### Phase 2: Collaboration (Q1 2025)
- [ ] Real-time editing
- [ ] Conflict resolution
- [ ] User presence
- [ ] Comment threads
- [ ] Notifications

### Phase 3: AI & Intelligence (Q2 2025)
- [ ] Semantic search
- [ ] AI Q&A
- [ ] Content generation
- [ ] Translation
- [ ] Smart suggestions

### Phase 4: Enterprise (Q3 2025)
- [ ] SSO/SAML
- [ ] RBAC
- [ ] Audit logs
- [ ] Advanced analytics
- [ ] Custom domains

---

<div align="center">

**Built with ❤️ by the IrysBase team**

[Website](https://irysbase.io) • [Documentation](./docs/) • [Discord](https://discord.gg/irysbase) • [Twitter](https://twitter.com/irysbase)

</div>
