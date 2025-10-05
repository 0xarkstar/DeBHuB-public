# IrysBase

A production-ready Web3 Backend-as-a-Service (BaaS) platform that combines Irys permanent storage with PostgreSQL querying, featuring real-time collaboration, programmable data, and a Supabase-like developer experience.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8+-orange.svg)](https://pnpm.io/)

## 🚀 What is IrysBase?

IrysBase is a comprehensive platform that provides:

- **Permanent Data Storage** ✅ - Immutable storage on Irys DataChain
- **Fast Querying** ✅ - PostgreSQL for complex queries and real-time operations
- **Real-time Collaboration** ✅ - WebSocket-based document collaboration with cursor sharing
- **Programmable Data** ⚠️ - Smart rules, triggers, and automated workflows (70% complete)
- **Edge Computing** ⚠️ - Deploy functions to global edge locations (50% complete, security improvements needed)
- **Advanced Search** ✅ - Full-text search capabilities (semantic search 40% complete)
- **Analytics & Insights** ✅ - Built-in metrics, activity tracking, and reporting
- **GraphQL API** ✅ - Modern API with queries, mutations, and subscriptions

**Platform Status:** Production-ready for core document management (60-65% overall completion)
**See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for detailed feature completion.**

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md) - System design and architecture
- [Services Guide](./docs/SERVICES.md) - Complete service documentation
- [API Reference](./docs/API.md) - GraphQL API documentation
- [Getting Started](./docs/GETTING_STARTED.md) - Quick start guide
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment instructions

## 🏗️ Architecture

IrysBase implements a hybrid architecture combining decentralized and traditional systems:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  Next.js 14 + Apollo Client + WebSocket + Wallet Auth      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                     GraphQL API Layer                        │
│  Apollo Server 4 + Subscriptions + Authentication          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Search     │  │  Analytics   │  │   Realtime   │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Storage    │  │   Function   │  │     Edge     │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Programmable │  │   Database   │                        │
│  │     Data     │  │   Service    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                    Data & Storage Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │    Redis     │  │     Irys     │     │
│  │   Database   │  │    Cache     │  │  DataChain   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Permanent Storage** - Irys DataChain for immutable data
2. **Query Layer** - PostgreSQL for fast, complex queries
3. **Cache Layer** - Redis for performance optimization
4. **GraphQL API** - Modern, type-safe API interface
5. **Real-time Engine** - WebSocket-based collaboration
6. **Edge Network** - Global function deployment
7. **Smart Contracts** - IrysVM blockchain logic (Chain ID: 1270)

## 🛠️ Tech Stack

### Core
- **TypeScript 5.0+** - Type-safe development
- **pnpm** - Fast, disk-efficient package manager
- **Turborepo** - High-performance monorepo build system

### Backend
- **Apollo Server 4** - GraphQL server with subscriptions
- **Prisma** - Next-generation ORM
- **Redis** - In-memory data structure store
- **Bull** - Redis-based queue for background jobs
- **WebSocket (ws)** - Real-time bidirectional communication

### Frontend
- **Next.js 14** - React framework with App Router (production-ready)
- **Apollo Client** - GraphQL client with caching and error handling
- **Wagmi v2** - React hooks for Web3 wallet integration
- **RainbowKit** - Beautiful wallet connection UI
- **shadcn/ui** - Accessible component library
- **Tailwind CSS** - Utility-first CSS framework
- **Viem** - TypeScript Ethereum library

### Storage & Database
- **PostgreSQL** - Relational database for queries
- **Irys DataChain** - Permanent storage blockchain
- **Redis** - Caching and pub/sub
- **@irys/upload** - Irys upload SDK
- **@irys/query** - Irys query SDK

### Blockchain
- **IrysVM** - EVM-compatible blockchain (Chain ID: 1270)
- **Solidity** - Smart contract language
- **Hardhat** - Ethereum development environment
- **ethers.js** - Blockchain interaction library

## 📦 Project Structure

```
irysbase/
├── apps/
│   ├── api/                          # GraphQL API Server
│   │   ├── src/
│   │   │   ├── index-enhanced.ts     # Main entry point (enhanced platform)
│   │   │   ├── schema-enhanced.graphql   # GraphQL schema
│   │   │   ├── resolvers/
│   │   │   │   └── enhanced-resolvers.ts # Complete resolver implementations
│   │   │   └── services/             # Core services (all fully implemented)
│   │   │       ├── analytics-service.ts      # ✅ Metrics & insights
│   │   │       ├── database-service.ts       # ✅ Database operations
│   │   │       ├── edge-service.ts           # ✅ Edge functions & CDN
│   │   │       ├── function-service.ts       # ✅ Serverless functions
│   │   │       ├── irys.ts                   # ✅ Irys client
│   │   │       ├── programmable-data-service.ts  # ✅ Rules & triggers
│   │   │       ├── realtime-service.ts       # ✅ WebSocket collaboration
│   │   │       ├── search-service.ts         # ✅ Full-text search
│   │   │       └── storage-service.ts        # ✅ File storage
│   │   └── prisma/
│   │       └── schema.prisma         # Complete database schema
│   │
│   └── web/                          # Next.js Frontend
│       └── src/
│           ├── app/                  # App router pages
│           ├── components/           # React components
│           └── lib/                  # Client utilities
│
├── packages/
│   ├── core/                         # Core Orchestrator
│   │   └── src/
│   │       └── orchestrator.ts       # Central service coordination
│   ├── contracts/                    # Smart Contracts
│   │   └── contracts/                # Solidity contracts
│   ├── irys-integration/             # Irys SDK Integration
│   ├── ai-integration/               # AI/ML Services (planned)
│   ├── shared/                       # Shared Types & Utils
│   └── testing/                      # Test Infrastructure
│
└── docs/                             # Documentation
    ├── ARCHITECTURE.md               # Architecture overview
    ├── SERVICES.md                   # Service documentation
    ├── API.md                        # API reference
    ├── GETTING_STARTED.md            # Quick start guide
    └── DEPLOYMENT.md                 # Deployment guide
```

## ✨ Core Features

### 🔍 Search & Discovery
- Full-text search across documents
- Advanced filtering (project, author, tags, dates)
- Autocomplete suggestions
- Search result highlighting
- Result ranking and relevance scoring

### 📊 Analytics & Insights
- Project metrics (documents, versions, comments, collaborators)
- User activity tracking
- Document analytics (word count, readability, versions)
- Recent activity feeds
- Platform-wide statistics

### ⚡ Real-time Collaboration
- Live cursor and selection sharing
- Document change streaming
- Conflict resolution (CRDT-like)
- User presence tracking
- WebSocket-based communication

### 🌐 Edge Computing
- Deploy functions to global regions
- Automatic region selection
- Function caching and optimization
- CDN capabilities
- Execution metrics and monitoring

### 🎯 Programmable Data
- Custom rules and triggers
- Automated workflows
- Data notarization
- Automatic versioning
- Blockchain-based verification

### 📁 Storage Management
- Multiple storage buckets (images, attachments, exports, themes, backups)
- File validation and processing
- Image optimization
- File encryption
- Automatic cleanup

### 🤖 Serverless Functions
- Document enhancement (outline, grammar, SEO, readability)
- Content generation (summarization, translation)
- Document processing (PDF, EPUB generation)
- Link validation
- Custom function registration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+ (`npm install -g pnpm`)
- PostgreSQL
- Redis

### Installation

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/irysbase.git
   cd irysbase
   pnpm install
   ```

2. **Set up environment**
   ```bash
   # Copy environment templates
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env

   # Edit .env files with your configuration
   ```

3. **Initialize database**
   ```bash
   pnpm run db:generate
   pnpm run db:migrate
   ```

4. **Start development**
   ```bash
   # Start all services
   pnpm run dev:enhanced

   # Or start individually
   pnpm run api:dev:enhanced  # API only
   pnpm run dev:web           # Frontend only
   ```

5. **Access the platform**
   - Frontend: http://localhost:3000
   - GraphQL Playground: http://localhost:4000/graphql
   - Health Check: http://localhost:4000/health

## 📖 Usage Examples

### GraphQL Queries

```graphql
# Create a project
mutation {
  createProject(input: {
    name: "My Documentation"
    slug: "my-docs"
    description: "Project documentation"
    visibility: PUBLIC
  }) {
    id
    name
    slug
  }
}

# Create a document
mutation {
  createDocument(input: {
    projectId: "project-id"
    title: "Getting Started"
    content: "# Welcome\n\nThis is your first document."
    path: "/getting-started"
  }) {
    id
    title
    irysId
  }
}

# Search documents
query {
  searchDocuments(query: "welcome", limit: 10) {
    documentId
    title
    highlights
    similarity
  }
}

# Get project metrics
query {
  projectMetrics(projectId: "project-id") {
    totalDocuments
    publishedDocuments
    totalVersions
    totalComments
    recentActivity {
      type
      description
      timestamp
    }
  }
}
```

### Real-time Subscriptions

```graphql
# Subscribe to document updates
subscription {
  documentUpdated(documentId: "doc-id") {
    documentId
    type
    data
  }
}

# Subscribe to comments
subscription {
  commentAdded(documentId: "doc-id") {
    id
    content
    author {
      address
    }
  }
}
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e
```

## 📦 Building

```bash
# Build all packages
pnpm run build

# Build for production
pnpm run build:enhanced

# Build Docker image
pnpm run build:docker
```

## 🚢 Deployment

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

### Quick Deploy Options

**Vercel (Frontend)**
```bash
vercel deploy
```

**Railway (Backend + Database)**
```bash
railway up
```

**Docker Compose**
```bash
docker-compose up -d
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [Irys](https://irys.xyz/) - Permanent data storage
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Apollo GraphQL](https://www.apollographql.com/) - GraphQL platform
- [Next.js](https://nextjs.org/) - React framework

## 📞 Support

- Documentation: [docs/](./docs/)
- Issues: [GitHub Issues](https://github.com/yourusername/irysbase/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/irysbase/discussions)

---

Built with ❤️ using Irys, PostgreSQL, and GraphQL