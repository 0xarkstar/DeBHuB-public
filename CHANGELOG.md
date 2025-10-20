# Changelog

All notable changes to DeBHuB will be documented in this file.

## [3.0.0-pure] - 2025-10-16

### 🎉 Major Release: Pure Irys BaaS Mode

**World's First Pure Irys Blockchain-Native BaaS Platform**

### Added

#### Pure Irys Client Package (`@debhub/pure-irys-client`)
- ✅ Complete PureIrysClient implementation with Irys L1 DataChain SDK
- ✅ IndexedDB caching layer (5min TTL, auto-invalidation)
- ✅ 7 React Hooks for easy integration:
  - `usePureIrysClient` - Client initialization
  - `useCreateDocument` - Document creation
  - `useDocument` - Document fetching
  - `useUpdateDocument` - Document updates
  - `useSearchDocuments` - Document search
  - `useDocumentSubscription` - Real-time updates
  - `useCacheStats` - Cache statistics
- ✅ TypeScript types and interfaces
- ✅ Full JSDoc documentation

#### Smart Contracts (Deployed on Irys Testnet)
- ✅ 6 Smart Contracts deployed at Chain ID 1270:
  - `DocumentRegistry` (0x937956DA...) - Document indexing
  - `AccessControl` (0xdD1ACe08...) - Permission management
  - `ProvenanceChain` (0x44755E8C...) - Version history
  - `EventBus` (0x042E4e6a...) - Real-time events
  - `CacheController` (0x8aFb8b9d...) - Cache invalidation
  - `SearchIndex` (0x2345938F...) - Search indexing
- ✅ All contract ABIs included in package
- ✅ Contract addresses auto-configured

#### Frontend Pages
- ✅ `DashboardPure.tsx` - Pure Irys dashboard
- ✅ `NewProjectPure.tsx` - Project creation page
- ✅ `PureIrysContext.tsx` - React context provider
- ✅ New routes: `/pure`, `/pure/projects/new`
- ✅ Integrated with wagmi v2 and ethers.js v6

#### Documentation
- ✅ Complete setup guide: `PURE_IRYS_SETUP.md`
- ✅ Updated main README.md
- ✅ Package-specific README for Pure Irys Client
- ✅ API reference and troubleshooting guide

### Fixed
- ✅ TypeScript errors in `blockchain.ts` (null checks for optional contracts)
- ✅ Type mismatches in `DashboardPure.tsx` (Project interface)
- ✅ Root `tsconfig.json` reference to non-existent `apps/web` directory
- ✅ All packages pass typecheck

### Changed
- 🔄 Updated architecture to support dual modes:
  - Full Stack Mode (existing)
  - Pure Irys Mode (new)
- 🔄 Version bumped to 3.0.0-pure
- 🔄 Project structure reorganized for clarity

### Technical Details
- **Chain ID**: 1270 (Irys Testnet)
- **RPC URL**: https://testnet-rpc.irys.xyz/v1/execution-rpc
- **Storage**: Permanent on Irys DataChain
- **Caching**: Client-side IndexedDB (5min TTL)
- **Real-time**: Blockchain event subscriptions
- **Zero Backend**: No PostgreSQL, Redis, or API server required

### Breaking Changes
None - Pure Irys Mode is an addition, not a replacement

### Migration Guide
See [PURE_IRYS_SETUP.md](PURE_IRYS_SETUP.md) for quick start guide.

---

## [2.0.0] - 2025-01-10

### Added
- Full Stack BaaS Platform
- PostgreSQL database with Prisma ORM
- Redis caching layer
- GraphQL API with Apollo Server
- Real-time subscriptions via WebSocket
- AI integration with OpenAI
- Smart contracts for authentication

### Technical Stack
- Backend: Fastify + Apollo Server 4
- Frontend: React 18 + Vite 5
- Database: PostgreSQL 14+
- Caching: Redis
- Blockchain: Irys DataChain (L1 independent blockchain)

---

## [1.0.0] - 2024-12-01

### Added
- Initial release
- Basic document management
- Irys integration for permanent storage
- Wallet authentication
