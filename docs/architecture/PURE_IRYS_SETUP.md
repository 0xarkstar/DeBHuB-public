# 🚀 Pure Irys BaaS - Setup & Usage Guide

**World's First Pure Irys Blockchain-Native BaaS Platform**

Zero backend. Zero database. Pure blockchain.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Smart Contracts](#smart-contracts)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### What is Pure Irys BaaS?

DeBHuB Pure Irys BaaS is a revolutionary backend-as-a-service platform that eliminates the need for traditional backend infrastructure:

- ✅ **No PostgreSQL** - All data on Irys DataChain
- ✅ **No Redis** - Client-side IndexedDB caching
- ✅ **No Backend Server** - Direct blockchain interaction
- ✅ **100% Decentralized** - Zero single points of failure
- ✅ **Permanent Storage** - Data lives forever on Irys
- ✅ **Smart Contract Indexing** - On-chain data structures
- ✅ **Real-time Events** - Blockchain event subscriptions

### How It Works

```
┌─────────────────────────────────────────────┐
│   React Frontend (Vite 5)                   │
│   - Pure Irys Client                        │
│   - IndexedDB Cache                         │
│   - wagmi + ethers.js                       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Irys L1 DataChain + Smart Contracts      │
│                                              │
│   ┌──────────────────┬──────────────────┐  │
│   │  Irys DataChain  │  6 Contracts     │  │
│   │  - Upload SDK    │  - Registry      │  │
│   │  - Query SDK     │  - Access        │  │
│   │  - Gateway       │  - Provenance    │  │
│   │                  │  - Events        │  │
│   │                  │  - Cache         │  │
│   │                  │  - Search        │  │
│   └──────────────────┴──────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
# Clone the repository
git clone https://github.com/0xarkstar/irysbase.git
cd irysbase

# Install dependencies
pnpm install
```

### 2. Configure Environment

```bash
cd apps/web-vite
cp .env.example .env
```

Edit `.env`:

```env
# Pure Irys Mode
VITE_ENABLE_BACKEND=false

# Wallet Connect
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Irys Configuration
VITE_IRYS_NETWORK=testnet
VITE_IRYS_TOKEN=ethereum

# Chain Configuration
VITE_CHAIN_ID=1270
VITE_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc
```

### 3. Run the App

```bash
pnpm dev
```

Navigate to `http://localhost:5173/pure` to access Pure Irys mode!

---

## 🏗️ Architecture

### Core Components

#### 1. PureIrysClient (`@debhub/pure-irys-client`)

The heart of the system. Handles all blockchain operations:

```typescript
import { PureIrysClient } from '@debhub/pure-irys-client';
import { ethers } from 'ethers';

// Initialize
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const client = new PureIrysClient(signer);
await client.init();

// Create document
const docId = await client.createDocument({
  projectId: 'my-project',
  title: 'Hello World',
  content: 'This is stored permanently on Irys!',
  tags: ['blockchain', 'web3'],
});

// Get document (with caching)
const doc = await client.getDocument(docId);
```

#### 2. Smart Contracts (Deployed on Irys Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **DocumentRegistry** | `0x937956DA...` | Document indexing (replaces PostgreSQL) |
| **AccessControl** | `0xdD1ACe08...` | Permission management |
| **ProvenanceChain** | `0x44755E8C...` | Version history |
| **EventBus** | `0x042E4e6a...` | Real-time events (replaces WebSocket) |
| **CacheController** | `0x8aFb8b9d...` | Cache invalidation (replaces Redis) |
| **SearchIndex** | `0x2345938F...` | Search indexing |

#### 3. IndexedDB Cache

Client-side caching for performance:

- **TTL**: 5 minutes
- **Storage**: Browser IndexedDB
- **Auto-invalidation**: Via blockchain events
- **Persistence**: Survives page reloads

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- pnpm 9+
- MetaMask or compatible wallet
- Irys testnet tokens (get from faucet)

### Step-by-Step

```bash
# 1. Install monorepo dependencies
pnpm install

# 2. Build packages
pnpm build

# 3. Build Pure Irys Client
cd packages/pure-irys-client
pnpm build

# 4. Configure frontend
cd ../../apps/web-vite
cp .env.example .env
# Edit .env (see Configuration section)

# 5. Run development server
pnpm dev
```

---

## ⚙️ Configuration

### Environment Variables

#### Frontend (`apps/web-vite/.env`)

```env
# ==========================================
# Pure Irys BaaS Configuration
# ==========================================

# Mode Selection
VITE_ENABLE_BACKEND=false  # Pure Irys mode

# Wallet Integration
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Irys Configuration
VITE_IRYS_NETWORK=testnet  # or 'mainnet'
VITE_IRYS_TOKEN=ethereum

# Blockchain Network
VITE_CHAIN_ID=1270  # Irys Testnet
VITE_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc

# Contract Addresses (Auto-configured)
# Located in packages/pure-irys-client/src/contracts/addresses.ts
```

#### Smart Contract Addresses

Contracts are already deployed on Irys Testnet. Addresses are located in:

```
packages/pure-irys-client/src/contracts/addresses.ts
```

Current deployment (2025-10-13):
- Network: Irys Testnet (Chain ID: 1270)
- 6 contracts deployed and verified
- ABIs included in package

---

## 🚀 Usage

### React Context Provider

Wrap your app with `PureIrysProvider`:

```typescript
// App.tsx
import { PureIrysProvider } from '@/contexts/PureIrysContext';

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider>
        <PureIrysProvider>
          {/* Your app */}
        </PureIrysProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
```

### Using React Hooks

```typescript
import {
  usePureIrysClient,
  useCreateDocument,
  useDocument,
  useUpdateDocument,
  useSearchDocuments,
  useDocumentSubscription,
  useCacheStats,
} from '@debhub/pure-irys-client';

function MyComponent() {
  const { client, isInitializing } = usePureIrysClient();
  const { createDocument, isCreating } = useCreateDocument(client);
  const { document, isLoading, refetch } = useDocument(client, 'doc-id');

  const handleCreate = async () => {
    const docId = await createDocument({
      projectId: 'my-project',
      title: 'New Document',
      content: 'Content here',
      tags: ['tag1', 'tag2'],
    });
    console.log('Created:', docId);
  };

  if (isInitializing) return <div>Initializing...</div>;
  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{document?.title}</h1>
      <p>{document?.content}</p>
      <button onClick={handleCreate} disabled={isCreating}>
        Create Document
      </button>
    </div>
  );
}
```

### Direct Client Usage

```typescript
import { usePureIrys } from '@/contexts/PureIrysContext';

function MyComponent() {
  const { client } = usePureIrys();

  const handleOperation = async () => {
    // Create
    const docId = await client.createDocument({
      projectId: 'project-1',
      title: 'My Doc',
      content: 'Hello Irys!',
      tags: ['test'],
    });

    // Read
    const doc = await client.getDocument(docId);

    // Update
    await client.updateDocument(docId, {
      content: 'Updated content',
      changeDescription: 'Fixed typo',
    });

    // Search
    const results = await client.searchDocuments({
      projectId: 'project-1',
      tags: ['test'],
      limit: 10,
    });

    // Version history
    const versions = await client.getVersionHistory(docId);

    // Subscribe to updates
    const unsubscribe = client.onDocumentUpdate(docId, (id, version) => {
      console.log('Document updated:', id, version);
    });

    // Cache stats
    const stats = await client.getCacheStats();

    // Clear cache
    await client.clearCache();
  };
}
```

---

## 🔗 Smart Contracts

### Contract Functions

#### DocumentRegistry

```solidity
// Register a new document
function registerDocument(
  bytes32 irysId,
  bytes32 projectId,
  string memory title,
  bytes32[] memory tags
) public returns (bytes32 docId)

// Get document metadata
function getDocument(bytes32 docId)
  public view returns (Document memory)

// Query documents
function getDocumentsByOwner(address owner)
  public view returns (bytes32[] memory)

function getDocumentsByProject(bytes32 projectId)
  public view returns (bytes32[] memory)
```

#### AccessControl

```solidity
// Grant permission
function grantPermission(
  bytes32 resourceId,
  address user,
  Permission permission
) public onlyOwner(resourceId)

// Check permission
function hasPermission(
  bytes32 resourceId,
  address user,
  Permission required
) public view returns (bool)
```

#### ProvenanceChain

```solidity
// Add version
function addVersion(
  bytes32 entityId,
  bytes32 irysId,
  bytes32 previousVersion,
  string memory description
) public

// Get version history
function getVersionHistory(bytes32 entityId)
  public view returns (Version[] memory)
```

### ABIs

All contract ABIs are located in:
```
packages/pure-irys-client/src/contracts/abis/
```

Files:
- `DocumentRegistry.json`
- `AccessControl.json`
- `ProvenanceChain.json`
- `EventBus.json`
- `CacheController.json`
- `SearchIndex.json`

---

## 📖 API Reference

### PureIrysClient API

#### Constructor

```typescript
new PureIrysClient(signer: Signer, config?: Partial<PureIrysClientConfig>)
```

#### Methods

**Document Operations:**
- `createDocument(options: CreateDocumentOptions): Promise<string>`
- `getDocument(docId: string): Promise<Document | null>`
- `updateDocument(docId: string, options: UpdateDocumentOptions): Promise<void>`
- `searchDocuments(options: SearchOptions): Promise<Document[]>`

**Version Control:**
- `getVersionHistory(docId: string): Promise<Version[]>`

**Real-time:**
- `onDocumentUpdate(docId: string, callback: Function): () => void`

**Cache:**
- `getCacheStats(): Promise<CacheStats>`
- `clearCache(): Promise<void>`

### React Hooks API

**Client:**
- `usePureIrysClient(signer?: Signer)`

**Documents:**
- `useCreateDocument(client)`
- `useDocument(client, docId)`
- `useUpdateDocument(client)`
- `useSearchDocuments(client, options)`

**Real-time:**
- `useDocumentSubscription(client, docId, onUpdate)`

**Cache:**
- `useCacheStats(client)`

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Client not initialized"

**Problem:** PureIrysClient not ready

**Solution:**
```typescript
const { client, isInitializing } = usePureIrys();

if (isInitializing) {
  return <div>Initializing...</div>;
}

if (!client) {
  return <div>Please connect wallet</div>;
}
```

#### 2. "Failed to upload to Irys"

**Problem:** Insufficient funds or network issue

**Solution:**
1. Check wallet balance (need ETH for gas)
2. Get testnet tokens from faucet: https://irys.xyz/faucet
3. Verify RPC URL in `.env`
4. Check network status: https://status.irys.xyz

#### 3. "Contract call failed"

**Problem:** Smart contract interaction error

**Solution:**
1. Verify contract addresses in `packages/pure-irys-client/src/contracts/addresses.ts`
2. Check you're on correct network (Chain ID 1270)
3. Ensure wallet is connected
4. Check browser console for detailed error

#### 4. "Cache not working"

**Problem:** IndexedDB not initializing

**Solution:**
1. Check browser supports IndexedDB
2. Clear browser data and try again
3. Check browser console for errors
4. Ensure HTTPS (IndexedDB requires secure context)

#### 5. Type Errors

**Problem:** TypeScript compilation errors

**Solution:**
```bash
# Rebuild Pure Irys Client
cd packages/pure-irys-client
pnpm build

# Reinstall dependencies
cd ../..
pnpm install

# Clear TypeScript cache
find . -name "tsconfig.tsbuildinfo" -delete
```

### Debug Mode

Enable detailed logging:

```typescript
// Add to PureIrysClient initialization
const client = new PureIrysClient(signer, {
  // ... config
});

// All operations will log to console
client.init();
```

### Getting Help

1. **Check docs**: `docs/` directory
2. **GitHub Issues**: https://github.com/0xarkstar/irysbase/issues
3. **Irys Discord**: https://discord.gg/irys
4. **Browser Console**: Check for error messages

---

## 📊 Performance

### Expected Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Document Read (cached) | < 100ms | IndexedDB |
| Document Read (uncached) | < 500ms | Irys Gateway |
| Document Create | 2-5s | Blockchain confirmation |
| Document Update | 2-5s | New version on-chain |
| Search | 1-2s | Smart contract query |
| Cache Hit Rate | > 90% | With 5min TTL |

### Optimization Tips

1. **Use Caching**: Let IndexedDB handle frequent reads
2. **Batch Operations**: Group multiple creates/updates
3. **Lazy Loading**: Load documents on-demand
4. **Prefetch**: Load likely-needed documents early
5. **Pagination**: Limit search results

---

## 🎉 Next Steps

Now that you have Pure Irys BaaS running:

1. **Create Projects**: Navigate to `/pure` and create your first project
2. **Explore Code**: Check `packages/pure-irys-client/` for implementation
3. **Read Docs**: See `docs/PURE_IRYS_BAAS_BLUEPRINT.md` for architecture
4. **Deploy Contracts**: Use `packages/contracts/scripts/deploy-pure-irys.ts`
5. **Build Features**: Extend PureIrysClient with custom logic

---

## 📝 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

- [Irys](https://irys.xyz) - L1 DataChain for permanent storage
- [ethers.js](https://ethers.org) - Ethereum interactions
- [wagmi](https://wagmi.sh) - React Ethereum hooks
- [RainbowKit](https://rainbowkit.com) - Wallet UI

---

**DeBHuB Pure Irys BaaS** - World's First Pure Irys Platform

Made with ❤️ by the DeBHuB Team

**Status**: 🟢 Beta | **Version**: 3.0.0-pure | **Updated**: 2025-10-16
