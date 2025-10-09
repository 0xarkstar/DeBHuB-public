# IrysBase - Development TODO List

**Last Updated:** 2025-10-02
**Priority System:** 🔴 Critical | 🟡 High | 🟢 Medium | 🔵 Low

---

## 🔴 Critical Priority (Must Fix Before Production)

### Security Issues

- [ ] **Fix Edge Service Security Vulnerability**
  - **File:** `apps/api/src/services/edge-service.ts`
  - **Issue:** Uses `new Function()` which is a remote code execution risk
  - **Solution:**
    ```bash
    pnpm add vm2
    # Replace new Function() with VM2 sandbox
    ```
  - **Estimate:** 1-2 days
  - **Blocker:** Yes - security risk

- [ ] **Add Rate Limiting**
  - **File:** `apps/api/src/index-enhanced.ts`
  - **Issue:** No rate limiting on API endpoints
  - **Solution:** Add express-rate-limit middleware
  - **Estimate:** 4 hours
  - **Blocker:** Yes - DDoS vulnerability

- [ ] **Input Validation & Sanitization**
  - **Files:** All resolver files
  - **Issue:** Limited input validation
  - **Solution:** Add class-validator for all inputs
  - **Estimate:** 2 days
  - **Blocker:** Yes - injection attacks

### Core Functionality

- [ ] **Fix IrysService Initialization**
  - **File:** `apps/api/src/services/irys.ts:13-14`
  - **Issue:** `uploader` and `query` set to `null`, unclear initialization
  - **Solution:** Proper async initialization with validation
  - **Estimate:** 4 hours
  - **Blocker:** Yes - runtime errors

- [ ] **Add Frontend Error Boundary**
  - **File:** `apps/web/src/app/layout.tsx`
  - **Issue:** Unhandled React errors crash entire app
  - **Status:** ✅ DONE (completed in previous session)
  - **Estimate:** ~~2 hours~~ COMPLETE

---

## 🟡 High Priority (Production Readiness)

### Database & Performance

- [ ] **Add PostgreSQL Full-Text Search Indexes**
  - **File:** `apps/api/prisma/schema.prisma`
  - **Issue:** Using LIKE queries (slow for large datasets)
  - **Solution:**
    ```sql
    ALTER TABLE "Document" ADD COLUMN tsv tsvector;
    CREATE INDEX document_tsv_idx ON "Document" USING GIN(tsv);
    UPDATE "Document" SET tsv = to_tsvector('english', content);
    ```
  - **Estimate:** 1 day
  - **Impact:** 10-100x search performance improvement

- [ ] **Optimize Database Queries**
  - **Files:** All service files with Prisma queries
  - **Issue:** Missing composite indexes, N+1 queries
  - **Solution:** Add indexes for common query patterns
  - **Estimate:** 2 days

- [ ] **Make Redis Required (Not Optional)**
  - **File:** `apps/api/src/services/realtime-service.ts:48`
  - **Issue:** Redis is optional, degrades performance
  - **Solution:** Require Redis for production, add health checks
  - **Estimate:** 4 hours

### Testing Infrastructure

- [ ] **Set Up Jest Testing Framework**
  - **Files:** New `*.test.ts` files
  - **Tasks:**
    ```bash
    pnpm add -D jest @types/jest ts-jest
    pnpm add -D @testing-library/react @testing-library/jest-dom
    # Create jest.config.js
    ```
  - **Estimate:** 4 hours

- [ ] **Write Unit Tests for Core Services**
  - **Target Coverage:** 70%
  - **Services to test:**
    - [ ] DatabaseService (CRUD operations)
    - [ ] StorageService (file uploads)
    - [ ] RealtimeService (presence tracking)
    - [ ] SearchService (query logic)
    - [ ] AnalyticsService (metrics calculation)
  - **Estimate:** 1 week

- [ ] **Integration Tests for GraphQL API**
  - **Files:** `apps/api/src/__tests__/integration/`
  - **Test flows:**
    - [ ] User registration & authentication
    - [ ] Project creation & management
    - [ ] Document CRUD operations
    - [ ] Real-time collaboration
  - **Estimate:** 1 week

- [ ] **E2E Tests with Playwright**
  - **Files:** `apps/web/__tests__/e2e/`
  - **Critical user flows:**
    - [ ] Wallet connection
    - [ ] Create project
    - [ ] Edit document
    - [ ] Add comment
  - **Estimate:** 3 days

### Documentation

- [ ] **Document All Environment Variables**
  - **Files:**
    - `apps/api/.env.example` (update)
    - `apps/web/.env.example` (update)
  - **Add missing vars:**
    - OpenAI API key
    - Redis connection string
    - Vector DB credentials
  - **Estimate:** 2 hours

- [ ] **Create API Documentation**
  - **Tool:** GraphQL Playground or Postman
  - **Include:**
    - All query/mutation examples
    - Authentication flow
    - Subscription setup
  - **Estimate:** 1 day

- [ ] **Write Setup Guide**
  - **File:** `docs/SETUP_GUIDE.md`
  - **Sections:**
    - Prerequisites
    - Database setup
    - Environment configuration
    - Initial data seeding
    - Troubleshooting
  - **Estimate:** 4 hours

---

## 🟢 Medium Priority (Feature Completion)

### AI Integration (40% → 90%)

- [ ] **Integrate OpenAI API**
  - **File:** Create `apps/api/src/services/ai-service.ts`
  - **Features:**
    - Text generation (GPT-4)
    - Embeddings (text-embedding-3-small)
    - Function calling
  - **Package:** `pnpm add openai`
  - **Estimate:** 2 days

- [ ] **Choose & Integrate Vector Database**
  - **Options:** pgvector (recommended), Pinecone, Weaviate
  - **Recommendation:** pgvector (PostgreSQL extension, no extra cost)
  - **Setup:**
    ```sql
    CREATE EXTENSION vector;
    ALTER TABLE "VectorEmbedding" ALTER COLUMN embedding TYPE vector(1536);
    CREATE INDEX ON "VectorEmbedding" USING ivfflat (embedding vector_cosine_ops);
    ```
  - **Estimate:** 2 days

- [ ] **Implement Real Embedding Generation**
  - **File:** `apps/api/src/services/vector-db-service.ts:42-48`
  - **Replace:** Mock random floats with OpenAI embeddings
  - **Estimate:** 4 hours

- [ ] **Complete AI Q&A System**
  - **File:** `apps/api/src/services/vector-db-service.ts:173-181`
  - **Replace:** Placeholder with real RAG implementation
  - **Flow:**
    1. Generate query embedding
    2. Vector similarity search
    3. GPT-4 generation with context
  - **Estimate:** 1 day

- [ ] **Implement Content Summarization**
  - **File:** `apps/api/src/services/function-service.ts:164-174`
  - **Replace:** Truncation with GPT-4 summarization
  - **Estimate:** 4 hours

- [ ] **Add Translation Feature**
  - **File:** `apps/api/src/services/function-service.ts:193-203`
  - **Replace:** Placeholder with GPT-4 translation
  - **Languages:** English, Spanish, French, German, Japanese, Korean
  - **Estimate:** 4 hours

- [ ] **Implement Grammar Checking**
  - **File:** `apps/api/src/services/function-service.ts:175-192`
  - **Options:** LanguageTool API or GPT-4
  - **Replace:** Mock issues with real grammar check
  - **Estimate:** 1 day

### Export Features (0% → 80%)

- [ ] **Implement PDF Generation**
  - **File:** `apps/api/src/services/storage-service.ts:262-268`
  - **Options:** puppeteer, pdfkit, or markdown-pdf
  - **Recommended:** puppeteer (best Markdown support)
  - **Package:** `pnpm add puppeteer`
  - **Estimate:** 2 days

- [ ] **Implement EPUB Generation**
  - **File:** `apps/api/src/services/storage-service.ts:269-275`
  - **Package:** `pnpm add epub-gen`
  - **Estimate:** 2 days

- [ ] **Add LaTeX Export**
  - **New feature**
  - **Convert:** Markdown → LaTeX → PDF
  - **Package:** `pnpm add markdown-it-texmath`
  - **Estimate:** 1 day

- [ ] **Add Word Document Export**
  - **Package:** `pnpm add docx`
  - **Estimate:** 1 day

### Image Processing (0% → 80%)

- [ ] **Implement Image Optimization**
  - **File:** `apps/api/src/services/storage-service.ts:180-184`
  - **Package:** `pnpm add sharp`
  - **Features:**
    - Resize images
    - Compress (WebP, AVIF)
    - Generate thumbnails
  - **Estimate:** 1 day

- [ ] **Add Format Conversion**
  - **Convert:** PNG/JPG → WebP, AVIF
  - **Estimate:** 4 hours

- [ ] **Implement Thumbnail Generation**
  - **Sizes:** 150x150, 300x300, 600x600
  - **Estimate:** 4 hours

### File Encryption (0% → 80%)

- [ ] **Implement File Encryption**
  - **File:** `apps/api/src/services/storage-service.ts:186-189, 194-197`
  - **Algorithm:** AES-256-GCM
  - **Package:** Built-in Node.js `crypto`
  - **Estimate:** 1 day

- [ ] **Add Key Management**
  - **Storage:** Separate key vault or encrypted in DB
  - **Rotation:** Support key rotation
  - **Estimate:** 2 days

### Programmable Data Enhancements (70% → 90%)

- [ ] **Implement Complex Rule Evaluation**
  - **File:** `apps/api/src/services/programmable-data-service.ts:288-293`
  - **Package:** `pnpm add json-rules-engine`
  - **Replace:** Stub with real condition evaluation
  - **Estimate:** 2 days

- [ ] **Add Advanced Action Execution**
  - **File:** `apps/api/src/services/programmable-data-service.ts:295-317`
  - **Actions:**
    - Webhook calls
    - Email notifications
    - Data transformations
    - Chained workflows
  - **Estimate:** 3 days

- [ ] **Build Workflow Orchestration**
  - **New feature**
  - **Tool:** BullMQ for job queues
  - **Estimate:** 1 week

### Blockchain Integration (60% → 85%)

- [ ] **Add Smart Contract ABIs**
  - **File:** `apps/api/src/services/blockchain.ts:19`
  - **Create:** Contract ABI JSON files
  - **Estimate:** 4 hours

- [ ] **Write Contract Deployment Scripts**
  - **Directory:** `packages/contracts/scripts/`
  - **Tool:** Hardhat
  - **Estimate:** 1 day

- [ ] **Implement Event Listening**
  - **File:** `apps/api/src/services/blockchain.ts:59-63`
  - **Events:** PostCreated, PostUpdated, RoleGranted
  - **Estimate:** 1 day

- [ ] **Add Transaction Monitoring**
  - **Feature:** Track tx confirmation, gas usage
  - **Estimate:** 1 day

- [ ] **Implement Gas Estimation**
  - **Feature:** Estimate gas before transactions
  - **Estimate:** 4 hours

---

## 🔵 Low Priority (Nice to Have)

### Code Quality

- [ ] **Add JSDoc Comments**
  - **Files:** All service files
  - **Coverage target:** 80% of public methods
  - **Estimate:** 2 days

- [ ] **Fix TypeScript `any` Types**
  - **Files:** Multiple service files
  - **Find:** `grep -r "any" apps/api/src/services/`
  - **Replace:** Proper types
  - **Estimate:** 1 day

- [ ] **Set Up ESLint Strict Rules**
  - **File:** `.eslintrc.js`
  - **Add:** @typescript-eslint/strict
  - **Estimate:** 4 hours

- [ ] **Add Prettier Auto-formatting**
  - **File:** `.prettierrc`
  - **Setup:** Pre-commit hooks
  - **Estimate:** 2 hours

### Observability

- [ ] **Add Structured Logging**
  - **Package:** `pnpm add winston`
  - **Replace:** console.log with winston
  - **Estimate:** 1 day

- [ ] **Set Up Prometheus Metrics**
  - **Package:** `pnpm add prom-client`
  - **Metrics:** Request count, latency, error rate
  - **Estimate:** 1 day

- [ ] **Add OpenTelemetry Tracing**
  - **Package:** `pnpm add @opentelemetry/api`
  - **Trace:** Request flows across services
  - **Estimate:** 2 days

- [ ] **Set Up Error Tracking (Sentry)**
  - **Package:** `pnpm add @sentry/node`
  - **Track:** Production errors
  - **Estimate:** 4 hours

### Performance Optimization

- [ ] **Add Database Connection Pooling**
  - **File:** `apps/api/prisma/schema.prisma`
  - **Config:** `connection_limit`, `pool_timeout`
  - **Estimate:** 2 hours

- [ ] **Implement Cache Warming**
  - **Feature:** Pre-populate Redis on startup
  - **Estimate:** 4 hours

- [ ] **Add CDN for Static Assets**
  - **Tool:** Cloudflare or Vercel Edge
  - **Estimate:** 1 day

- [ ] **Optimize GraphQL Queries**
  - **Tool:** DataLoader for batching
  - **Estimate:** 2 days

### Frontend Improvements

- [ ] **Add Loading Skeletons**
  - **Package:** `pnpm add react-loading-skeleton`
  - **Pages:** All dashboard pages
  - **Estimate:** 1 day

- [ ] **Improve Error Messages**
  - **Make:** User-friendly error text
  - **Estimate:** 4 hours

- [ ] **Accessibility Audit**
  - **Tool:** axe DevTools
  - **Fix:** ARIA labels, keyboard navigation
  - **Estimate:** 2 days

- [ ] **Add Dark Mode Toggle**
  - **Package:** `pnpm add next-themes`
  - **Estimate:** 4 hours

- [ ] **Implement Infinite Scroll**
  - **Pages:** Project list, document list
  - **Package:** `pnpm add react-infinite-scroll-component`
  - **Estimate:** 1 day

### DevOps

- [ ] **Set Up CI/CD Pipeline**
  - **Tool:** GitHub Actions
  - **Jobs:** Test, build, deploy
  - **Estimate:** 1 day

- [ ] **Add Database Backup Automation**
  - **Tool:** pg_dump scheduled jobs
  - **Estimate:** 4 hours

- [ ] **Create Docker Compose for Local Dev**
  - **File:** `docker-compose.yml`
  - **Services:** PostgreSQL, Redis, API, Web
  - **Estimate:** 4 hours

- [ ] **Write Kubernetes Deployment Configs**
  - **Files:** `k8s/*.yaml`
  - **Estimate:** 2 days

---

## Feature Roadmap by Phase

### Phase 1: Security & Stability (1-2 weeks)
```
Priority: 🔴 Critical
Focus: Make platform production-ready for core features

✓ Fix edge service security
✓ Add rate limiting
✓ Input validation
✓ Error handling
✓ Basic testing
✓ Database indexes
```

### Phase 2: AI Integration (3-4 weeks)
```
Priority: 🟡 High
Focus: Complete AI-powered features

✓ OpenAI integration
✓ Vector database (pgvector)
✓ Real embeddings
✓ Q&A system
✓ Summarization
✓ Translation
✓ Grammar check
```

### Phase 3: Export & Processing (2-3 weeks)
```
Priority: 🟢 Medium
Focus: Complete missing features

✓ PDF generation
✓ EPUB creation
✓ Image optimization
✓ File encryption
✓ Format conversion
```

### Phase 4: Advanced Features (3-4 weeks)
```
Priority: 🟢 Medium
Focus: Programmable data & blockchain

✓ Complex rule evaluation
✓ Workflow orchestration
✓ Smart contract deployment
✓ Event indexing
✓ Transaction monitoring
```

### Phase 5: Polish & Scale (2-3 weeks)
```
Priority: 🔵 Low
Focus: Production optimization

✓ Comprehensive testing (80% coverage)
✓ Performance optimization
✓ Monitoring & observability
✓ Documentation completion
✓ Accessibility audit
```

---

## Estimated Timeline

| Phase | Duration | Completion Target |
|-------|----------|-------------------|
| **Phase 1** | 1-2 weeks | 70% → 75% |
| **Phase 2** | 3-4 weeks | 75% → 85% |
| **Phase 3** | 2-3 weeks | 85% → 90% |
| **Phase 4** | 3-4 weeks | 90% → 95% |
| **Phase 5** | 2-3 weeks | 95% → 98% |
| **Total** | **11-16 weeks** | **60% → 98%** |

---

## Quick Wins (Can Complete in 1 Day)

1. ✅ **Add Error Boundary** (2 hours) - DONE
2. **Document environment variables** (2 hours)
3. **Set up Jest** (4 hours)
4. **Add database indexes** (4 hours)
5. **Make Redis required** (4 hours)
6. **Implement image optimization** (1 day)
7. **Add content summarization** (4 hours)
8. **Fix TypeScript any types** (1 day)

---

## Dependencies & Blockers

### External Services Needed
- [ ] **OpenAI API Key** (for AI features)
- [ ] **Vector Database** (recommend pgvector - no external service)
- [ ] **CDN** (optional: Cloudflare, Vercel Edge)
- [ ] **Error Tracking** (optional: Sentry)
- [ ] **Monitoring** (optional: DataDog, New Relic)

### Infrastructure Requirements
- [x] PostgreSQL (installed)
- [x] Redis (installed)
- [ ] Irys wallet (for uploads)
- [ ] IrysVM node (for blockchain)

---

## How to Use This TODO

1. **Start with 🔴 Critical** - Fix security issues first
2. **Move to 🟡 High Priority** - Production readiness
3. **Pick 🟢 Medium Priority** - Feature completion
4. **Finish with 🔵 Low Priority** - Polish

**Recommended approach:**
- 1-2 critical items per day
- Complete one phase before moving to next
- Write tests as you implement features
- Document as you go

---

**Last Updated:** 2025-10-02
**Maintained By:** Development Team
**Status Tracking:** See [PROJECT_STATUS.md](./PROJECT_STATUS.md)
