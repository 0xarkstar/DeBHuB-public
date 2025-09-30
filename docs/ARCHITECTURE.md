# IrysBase Architecture

Complete architectural overview of the IrysBase platform.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Layers](#architecture-layers)
- [Data Flow](#data-flow)
- [Service Architecture](#service-architecture)
- [Storage Architecture](#storage-architecture)
- [Real-time Architecture](#real-time-architecture)
- [Security Architecture](#security-architecture)
- [Scalability & Performance](#scalability--performance)

---

## System Overview

IrysBase is a hybrid Web3 Backend-as-a-Service platform that combines:

- **Decentralized Storage** - Irys DataChain for permanent, immutable data
- **Centralized Querying** - PostgreSQL for fast, complex queries
- **Real-time Collaboration** - WebSocket-based live updates
- **Edge Computing** - Global function deployment and execution
- **Smart Contracts** - EVM blockchain logic on IrysVM

### Design Principles

1. **Hybrid Architecture** - Best of both worlds (decentralized + centralized)
2. **Event-Driven** - Asynchronous, scalable event processing
3. **Service-Oriented** - Modular, independent services
4. **Type-Safe** - Full TypeScript coverage
5. **Real-time First** - Built for live collaboration
6. **Performance-Focused** - Optimized for speed and scale

---

## Architecture Layers

```
┌────────────────────────────────────────────────────────────────┐
│                      Presentation Layer                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js 14 Frontend                                     │  │
│  │  - React Components                                      │  │
│  │  - Apollo Client (GraphQL)                               │  │
│  │  - WebSocket Client                                      │  │
│  │  - Wallet Integration (MetaMask)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                        API Gateway Layer                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Apollo Server 4                                         │  │
│  │  - GraphQL Schema & Resolvers                            │  │
│  │  - Authentication & Authorization                        │  │
│  │  - Rate Limiting                                         │  │
│  │  - Request Validation                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐     │
│  │    Search     │  │   Analytics   │  │   Realtime    │     │
│  │   Service     │  │    Service    │  │   Service     │     │
│  └───────────────┘  └───────────────┘  └───────────────┘     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐     │
│  │    Storage    │  │   Function    │  │     Edge      │     │
│  │   Service     │  │    Service    │  │   Service     │     │
│  └───────────────┘  └───────────────┘  └───────────────┘     │
│  ┌───────────────┐  ┌───────────────┐                         │
│  │ Programmable  │  │   Database    │                         │
│  │     Data      │  │   Service     │                         │
│  └───────────────┘  └───────────────┘                         │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    Data & Storage Layer                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐     │
│  │  PostgreSQL   │  │     Redis     │  │     Irys      │     │
│  │  - Prisma ORM │  │  - Caching    │  │  DataChain    │     │
│  │  - Migrations │  │  - Pub/Sub    │  │  - Permanent  │     │
│  │  - Queries    │  │  - Sessions   │  │    Storage    │     │
│  └───────────────┘  └───────────────┘  └───────────────┘     │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Blockchain Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  IrysVM (Chain ID: 1270)                                 │  │
│  │  - Smart Contracts (Solidity)                            │  │
│  │  - Role-Based Access Control                             │  │
│  │  - Event Emission                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Write Path (Document Creation)

```
User → Frontend → GraphQL Mutation → Enhanced Resolver
                                           │
                                           ├─→ 1. Validate Input
                                           │
                                           ├─→ 2. Check Authorization
                                           │
                                           ├─→ 3. Create DB Record (PostgreSQL)
                                           │
                                           ├─→ 4. Background: Upload to Irys
                                           │     │
                                           │     ├─→ Storage Service
                                           │     │
                                           │     ├─→ Irys DataChain
                                           │     │
                                           │     └─→ Update DB with Irys ID
                                           │
                                           ├─→ 5. Execute Programmable Rules
                                           │     │
                                           │     └─→ Auto-notarize/backup
                                           │
                                           ├─→ 6. Broadcast via Realtime
                                           │     │
                                           │     └─→ WebSocket subscribers
                                           │
                                           └─→ 7. Return Response
```

### Read Path (Document Query)

```
User → Frontend → GraphQL Query → Enhanced Resolver
                                        │
                                        ├─→ 1. Parse Query
                                        │
                                        ├─→ 2. Check Cache (Redis)
                                        │     │
                                        │     ├─→ Hit: Return cached
                                        │     │
                                        │     └─→ Miss: Continue
                                        │
                                        ├─→ 3. Query Database (PostgreSQL)
                                        │     │
                                        │     └─→ Prisma ORM
                                        │
                                        ├─→ 4. Enrich with Irys Data (if needed)
                                        │
                                        ├─→ 5. Cache Result (Redis)
                                        │
                                        └─→ 6. Return Response
```

### Search Path

```
User → Search Query → Search Service
                           │
                           ├─→ 1. Parse Search Query
                           │
                           ├─→ 2. Build WHERE Conditions
                           │
                           ├─→ 3. Execute PostgreSQL Query
                           │     │
                           │     └─→ Full-text search (LIKE)
                           │
                           ├─→ 4. Calculate Relevance Scores
                           │
                           ├─→ 5. Extract Highlights
                           │
                           └─→ 6. Return Ranked Results
```

---

## Service Architecture

### Service Communication Patterns

#### 1. Direct Service Calls
Services communicate directly for synchronous operations:

```typescript
// GraphQL Resolver calls Service
const results = await searchService.search(query, options);
```

#### 2. Event-Driven Communication
Services emit events for asynchronous operations:

```typescript
// Emit event
realtimeService.publishDocumentUpdate(docId, 'updated', data);

// Subscribe to event
realtimeService.subscribeToDocumentChanges(docId, (change) => {
  // Handle change
});
```

#### 3. Message Queue (Future)
Background jobs through Bull Queue:

```typescript
queue.add('sync-to-irys', { documentId, data });
```

### Service Dependencies

```
GraphQL Resolvers
    ├─→ Database Service (core dependency)
    ├─→ Search Service
    │   └─→ Database Service
    ├─→ Analytics Service
    │   └─→ Database Service
    ├─→ Storage Service
    │   └─→ Irys Service
    ├─→ Function Service
    │   └─→ Irys Service
    ├─→ Edge Service
    │   ├─→ Irys Service
    │   └─→ Redis
    ├─→ Programmable Data Service
    │   ├─→ Database Service
    │   └─→ Irys Service
    └─→ Realtime Service
        ├─→ Redis (pub/sub)
        └─→ WebSocket Server
```

---

## Storage Architecture

### Hybrid Storage Model

IrysBase uses a hybrid storage approach:

#### PostgreSQL (Mutable Query Layer)
**Purpose:** Fast queries, relationships, indexing

**Stores:**
- Project metadata
- Document metadata
- User profiles
- Comments & collaborations
- Search indexes
- Activity logs

**Benefits:**
- Fast complex queries
- Relational data
- ACID transactions
- Real-time updates

#### Irys DataChain (Immutable Permanent Layer)
**Purpose:** Permanent, verifiable storage

**Stores:**
- Full document content
- Document versions
- File attachments
- Backup data
- Notarization proofs

**Benefits:**
- Immutable history
- Blockchain verification
- Permanent availability
- No storage limits

#### Redis (Ephemeral Cache Layer)
**Purpose:** Performance optimization

**Stores:**
- Query results (TTL: 5 minutes)
- User sessions
- Pub/Sub channels
- Edge function code
- Presence data

**Benefits:**
- Ultra-fast reads
- Pub/Sub messaging
- Session management
- Rate limiting

### Data Synchronization

```
Document Update Flow:
1. User edits document
2. Save to PostgreSQL immediately (fast)
3. Background job uploads to Irys
4. Update PostgreSQL with Irys ID
5. Cache invalidation
```

**Consistency Model:** Eventual consistency between PostgreSQL and Irys

---

## Real-time Architecture

### WebSocket Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      WebSocket Server                    │
│                        (ws package)                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─→ Connection Manager
                 │   └─→ User presence tracking
                 │
                 ├─→ Session Manager
                 │   ├─→ Collaboration sessions
                 │   ├─→ Cursor tracking
                 │   └─→ Selection tracking
                 │
                 ├─→ Message Router
                 │   ├─→ Cursor updates
                 │   ├─→ Selection updates
                 │   ├─→ Document changes
                 │   └─→ Heartbeats
                 │
                 └─→ Broadcast Engine
                     ├─→ Room-based messaging
                     └─→ Selective broadcasting
```

### GraphQL Subscriptions

```
Apollo Server Subscriptions (GraphQL-WS)
    │
    ├─→ documentUpdated(documentId)
    │   └─→ PubSub: DOCUMENT_UPDATED
    │
    ├─→ commentAdded(documentId)
    │   └─→ PubSub: NEW_COMMENT
    │
    └─→ reviewRequested(userId)
        └─→ PubSub: REVIEW_REQUEST_{userId}
```

### Conflict Resolution

IrysBase uses CRDT-like conflict resolution:

1. **Timestamp-based ordering** - Changes sorted by timestamp
2. **Operational transforms** - Apply changes in sequence
3. **Conflict detection** - Identify concurrent edits
4. **Automatic merge** - Resolve conflicts automatically
5. **Manual review** - Flag complex conflicts for user review

---

## Security Architecture

### Authentication Flow

```
1. User connects wallet (MetaMask)
2. Frontend requests challenge message
3. User signs challenge with private key
4. Backend verifies signature
5. Generate JWT token
6. Store session in Redis
7. Return token to client
```

### Authorization Model

#### Role-Based Access Control (RBAC)

**Project Roles:**
- `OWNER` - Full control
- `ADMIN` - Manage content & collaborators
- `EDITOR` - Edit documents
- `VIEWER` - Read-only access

**Permission Matrix:**

| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| Create Document | ✅ | ✅ | ✅ | ❌ |
| Edit Document | ✅ | ✅ | ✅ | ❌ |
| Delete Document | ✅ | ✅ | ❌ | ❌ |
| Manage Collaborators | ✅ | ✅ | ❌ | ❌ |
| Delete Project | ✅ | ❌ | ❌ | ❌ |
| View Document | ✅ | ✅ | ✅ | ✅ |

### Data Security

1. **At Rest:**
   - PostgreSQL encryption
   - Redis encryption (optional)
   - File encryption for sensitive attachments

2. **In Transit:**
   - TLS/SSL for all connections
   - WSS for WebSockets
   - HTTPS for API

3. **Irys Storage:**
   - Immutable by design
   - Cryptographic verification
   - Optional encryption before upload

---

## Scalability & Performance

### Horizontal Scaling

```
Load Balancer
    │
    ├─→ API Server 1 ──┐
    ├─→ API Server 2 ──┼─→ PostgreSQL (Primary)
    └─→ API Server N ──┘
                        │
                        ├─→ PostgreSQL (Replica 1)
                        └─→ PostgreSQL (Replica 2)

Redis Cluster
    ├─→ Master
    └─→ Replicas

Edge Network
    ├─→ US East
    ├─→ US West
    ├─→ EU West
    └─→ Asia Pacific
```

### Caching Strategy

**Multi-Level Cache:**

1. **Browser Cache** - Static assets
2. **CDN Cache** - Public content
3. **Redis Cache** - API responses
4. **Query Cache** - Database queries

**Cache Invalidation:**

- Time-based expiration (TTL)
- Event-based invalidation
- Manual invalidation

### Performance Optimizations

1. **Database:**
   - Proper indexing
   - Query optimization
   - Connection pooling
   - Read replicas

2. **API:**
   - GraphQL DataLoader
   - Query batching
   - Response compression
   - Rate limiting

3. **Storage:**
   - Lazy loading
   - Pagination
   - Background uploads
   - CDN integration

4. **Real-time:**
   - Message batching
   - Selective broadcasting
   - Presence debouncing
   - Connection pooling

### Monitoring & Observability

**Metrics:**
- API response times
- Database query performance
- Cache hit rates
- WebSocket connections
- Service health status

**Logging:**
- Structured logging (JSON)
- Log levels (DEBUG, INFO, WARN, ERROR)
- Request tracing
- Error tracking

**Alerting:**
- Service downtime
- High error rates
- Performance degradation
- Resource exhaustion

---

## Deployment Architecture

### Development Environment

```
Local Machine
    ├─→ PostgreSQL (Docker)
    ├─→ Redis (Docker)
    ├─→ API Server (localhost:4000)
    └─→ Frontend (localhost:3000)
```

### Production Environment

```
Frontend (Vercel/Netlify)
    ↓
Load Balancer
    ↓
API Servers (Railway/Render)
    ↓
┌─────────────┬──────────────┬────────────┐
│ PostgreSQL  │    Redis     │    Irys    │
│  (Supabase) │   (Upstash)  │ DataChain  │
└─────────────┴──────────────┴────────────┘
```

### Docker Deployment

```yaml
services:
  api:
    image: irysbase-api
    ports: ["4000:4000"]
    depends_on: [postgres, redis]

  postgres:
    image: postgres:15
    ports: ["5432:5432"]

  redis:
    image: redis:7
    ports: ["6379:6379"]

  web:
    image: irysbase-web
    ports: ["3000:3000"]
```

---

## Technology Decisions

### Why PostgreSQL?

- **Pros:** Mature, reliable, excellent query capabilities, strong ecosystem
- **Cons:** Not decentralized
- **Tradeoff:** Use Irys for permanent storage, PostgreSQL for queries

### Why Irys?

- **Pros:** Permanent storage, blockchain verification, no storage limits
- **Cons:** Slower queries, no complex query capabilities
- **Tradeoff:** Use for immutable data, PostgreSQL for mutable queries

### Why GraphQL?

- **Pros:** Type-safe, flexible queries, strong tooling
- **Cons:** More complex than REST
- **Tradeoff:** Better developer experience worth the complexity

### Why Monorepo (Turborepo)?

- **Pros:** Code sharing, atomic changes, unified tooling
- **Cons:** Larger repository, more complex setup
- **Tradeoff:** Better for multi-package projects

---

## Future Architecture Improvements

### Planned Enhancements

1. **Microservices** - Split services into independent deployments
2. **Message Queue** - Bull Queue for background jobs
3. **Service Mesh** - Istio for service communication
4. **API Gateway** - Kong or Traefik for routing
5. **Kubernetes** - Container orchestration
6. **Observability** - Full tracing with OpenTelemetry

### Scalability Roadmap

1. **Phase 1** (Current) - Monolithic with service separation
2. **Phase 2** - Independent service deployment
3. **Phase 3** - Full microservices architecture
4. **Phase 4** - Multi-region deployment
5. **Phase 5** - Global edge network

---

For more details, see:
- [Services Guide](./SERVICES.md)
- [API Reference](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)