# IrysBase - Architecture Summary

## 📋 Project Overview

**IrysBase** is a decentralized documentation platform built on Irys DataChain, combining permanent storage with programmable data capabilities.

## 🏗️ Architecture

### Current Stack (Dual Architecture)

The project currently supports **two architectures**:

1. **Traditional API Architecture** (apps/api + PostgreSQL)
2. **Pure Irys Architecture** (apps/web-vite only, no backend)

### 1. Traditional API Architecture

**Location**: `apps/api/`

**Stack**:
- Apollo GraphQL Server
- PostgreSQL + Prisma ORM
- Irys SDK for permanent storage
- Redis for caching
- WebSocket subscriptions

**Services**:
- **Core Services**:
  - Database Service (Prisma)
  - Irys Service (permanent storage)
  - Blockchain Service (smart contracts)
  - Storage Service (file management)
  - Realtime Service (subscriptions)

- **Advanced Services**:
  - Vector DB Service (AI embeddings)
  - Search Service (semantic search)
  - Analytics Service (usage metrics)
  - Edge Service (edge computing)
  - Programmable Data Service (smart rules & triggers)

**Data Flow**:
```
Frontend → GraphQL API → PostgreSQL + Irys → Permanent Storage
```

### 2. Pure Irys Architecture (Current Frontend)

**Location**: `apps/web-vite/`

**Stack**:
- React 18 + Vite 5
- React Router v6
- Irys Query + Upload SDK
- IndexedDB for local caching
- No backend server required

**Core Files**:
- `irys-database.ts` - Pure Irys database implementation
- `irys-hooks.ts` - React hooks for data operations
- `irys-types.ts` - TypeScript type definitions
- `irys-programmable.ts` - Programmable data features

**Data Flow**:
```
Frontend → Irys DataChain → IndexedDB Cache
```

**Key Features**:
- ✅ Direct Irys DataChain integration
- ✅ Wallet-based authentication (MetaMask)
- ✅ Local IndexedDB caching (5-minute TTL)
- ✅ Version control via Irys tags
- ✅ Entity-based data model (Projects, Documents, Users, Comments)

## 🗄️ Data Models

### Entity Structure

All entities follow this pattern:
```typescript
{
  entityType: 'project' | 'document' | 'user' | 'comment',
  entityId: string,           // Unique ID
  irysId?: string,           // Irys transaction ID
  permanentUrl?: string,     // Gateway URL
  schemaVersion: string,
  createdAt: string,
  updatedAt: string
}
```

### Core Entities

1. **Project**
   - Owner address
   - Collaborators
   - Settings & visibility
   - Slug-based routing

2. **Document**
   - Project relationship
   - Version control
   - Content hash verification
   - Tags & metadata

3. **User**
   - Wallet address
   - Profile & preferences
   - Activity tracking

4. **Comment**
   - Document relationship
   - Threading support
   - Position tracking
   - Resolution status

## 📊 Current State

### ✅ Working Components

**Backend (API)**:
- ✅ TypeScript compilation fixed
- ✅ All services implemented
- ✅ GraphQL schema complete
- ✅ Programmable data service
- ✅ Storage & edge services

**Frontend (Vite)**:
- ✅ Pure Irys integration
- ✅ React hooks for CRUD
- ✅ Wallet connection
- ✅ IndexedDB caching
- ⚠️ Some TypeScript errors remain (Apollo references to remove)

### ⚠️ Known Issues

1. **Frontend TypeScript Errors**:
   - Apollo Client imports still present (should be removed)
   - Some unused variables
   - `WebUploader` should be `Uploader` from `@irys/upload`

2. **Dependencies**:
   - `apps/smart-contracts` removed (had invalid dependencies)
   - `apps/web` is deprecated (Next.js version)
   - OpenAI package added for vector embeddings

3. **Integration**:
   - GraphQL mutations still referenced in some frontend files
   - Need to complete migration to pure Irys hooks

## 🔄 Frontend-Backend Connection

### Current Status

**The frontend (web-vite) is designed to work WITHOUT the backend**, using:
- Direct Irys DataChain queries
- Wallet-based authentication
- Client-side caching

**The backend (API) is optional**, providing:
- Advanced features (AI, analytics, edge functions)
- Traditional REST/GraphQL interface
- PostgreSQL persistence layer
- Real-time subscriptions

### Integration Points

If using both:
1. Frontend can use API for advanced features
2. API mirrors data to PostgreSQL
3. Irys serves as source of truth
4. GraphQL provides query interface

## 📁 Project Structure

```
irysbase/
├── apps/
│   ├── api/                 # GraphQL API (optional)
│   │   ├── src/
│   │   │   ├── resolvers/   # GraphQL resolvers
│   │   │   ├── services/    # Business logic
│   │   │   └── schema.graphql
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   ├── web-vite/           # React + Vite frontend (CURRENT)
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── irys-database.ts
│   │   │   │   ├── irys-hooks.ts
│   │   │   │   ├── irys-programmable.ts
│   │   │   │   └── irys-types.ts
│   │   │   ├── pages/
│   │   │   └── components/
│   │   └── package.json
│   │
│   └── web/                # Next.js frontend (DEPRECATED)
│
├── packages/
│   ├── shared/             # Shared types
│   ├── core/               # Core utilities
│   ├── irys-integration/   # Irys SDK wrapper
│   └── ai-integration/     # AI features
│
└── docs/                   # Documentation
```

## 🚀 Getting Started

### Option 1: Pure Irys Frontend (Recommended)

```bash
# Install dependencies
pnpm install

# Start frontend only
cd apps/web-vite
pnpm dev
```

### Option 2: Full Stack

```bash
# Setup database
cd apps/api
pnpm prisma generate
pnpm prisma migrate dev

# Start backend
pnpm dev

# Start frontend (in another terminal)
cd apps/web-vite
pnpm dev
```

## 🔧 Environment Variables

### Frontend (.env)
```env
VITE_IRYS_NETWORK=mainnet
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
```

### Backend (.env)
```env
DATABASE_URL=postgresql://...
IRYS_NETWORK=mainnet
IRYS_WALLET_PRIVATE_KEY=...
OPENAI_API_KEY=...
REDIS_URL=redis://localhost:6379
```

## 📝 Next Steps

### Immediate Priorities

1. **Clean up frontend TypeScript errors**:
   - Remove Apollo Client references
   - Fix WebUploader imports
   - Remove unused variables

2. **Documentation cleanup**:
   - Archive outdated docs
   - Create clear README
   - Update deployment guides

3. **Testing**:
   - Test wallet connection
   - Verify Irys operations
   - Check caching behavior

### Future Enhancements

1. Programmable data UI
2. Advanced search features
3. AI-powered suggestions
4. Multi-wallet support
5. Mobile responsive design

## 📚 Key Documentation

- **Architecture Decision**: `docs/ARCHITECTURE_DECISION.md`
- **Irys Integration**: `docs/IRYS_ONLY_FINAL_ARCHITECTURE.md`
- **Programmable Data**: `docs/PROGRAMMABLE_DATA_ARCHITECTURE.md`
- **Migration Guide**: `docs/MIGRATION_TO_IRYS_ONLY.md`
- **Deployment**: `docs/DEPLOYMENT_GUIDE.md`

---

**Last Updated**: 2025-10-09
**Status**: Active Development
**Primary Architecture**: Pure Irys (web-vite)
