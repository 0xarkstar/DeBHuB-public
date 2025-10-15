# Pure Irys BaaS - Smart Contracts Guide

**Complete documentation for all Pure Irys Smart Contracts**

This guide documents the 6 Smart Contracts that replace traditional backend services in Pure Irys BaaS architecture.

---

## Table of Contents

- [Overview](#overview)
- [DocumentRegistry Contract](#documentregistry-contract)
- [AccessControl Contract](#accesscontrol-contract)
- [ProvenanceChain Contract](#provenancechain-contract)
- [EventBus Contract](#eventbus-contract)
- [CacheController Contract](#cachecontroller-contract)
- [SearchIndex Contract](#searchindex-contract)
- [Integration Guide](#integration-guide)
- [Best Practices](#best-practices)

---

## Overview

### Architecture Transformation

Pure Irys BaaS eliminates traditional backend infrastructure by replacing services with Smart Contracts:

| Traditional Service | Smart Contract Replacement | Purpose |
|---------------------|---------------------------|---------|
| PostgreSQL Tables | DocumentRegistry | Document metadata indexing |
| Backend Auth Logic | AccessControl | Permission management |
| Git Version Control | ProvenanceChain | Version history tracking |
| WebSocket Server | EventBus | Real-time event distribution |
| Redis Cache | CacheController | Cache invalidation signaling |
| ElasticSearch | SearchIndex | Search indexing |

### Contract Deployment

All contracts are deployed on **Irys L1 DataChain**:

#### Testnet (Chain ID: 1270)

```
RPC: https://testnet-rpc.irys.xyz/v1/execution-rpc

DocumentRegistry:  0x937956DA31B42C3ad9f6eC4366360Ae763391566
AccessControl:     0xdD1ACe083c156296760aAe07718Baab969642B8D
ProvenanceChain:   0x44755E8C746Dc1819a0e8c74503AFC106FC800CB
EventBus:          0x042E4e6a56aA1680171Da5e234D9cE42CBa03E1c
CacheController:   0x8aFb8b9d57e9b6244e29a090ea4da1A9043a91E2
SearchIndex:       0x2345938F52790F1d8a1E3355cA66eA3e60494A36

Deployed: 2025-10-13T19:32:01.637Z
```

#### Mainnet (Chain ID: 9990)

```
RPC: https://rpc.irys.xyz

To be deployed - Use testnet contracts for development
```

---

## DocumentRegistry Contract

**Replaces**: PostgreSQL `documents` table

**Purpose**: Index and query document metadata stored on Irys

### Features

- Document registration with metadata
- Owner-based queries
- Project-based queries
- Tag-based filtering
- Existence verification
- Metadata updates

### Contract Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDocumentRegistry {
    struct Document {
        bytes32 id;
        bytes32 irysId;      // Irys transaction ID
        bytes32 projectId;
        address owner;
        string title;
        bytes32[] tags;
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }

    // Register new document
    function registerDocument(
        bytes32 irysId,
        bytes32 projectId,
        string memory title,
        bytes32[] memory tags
    ) external returns (bytes32 docId);

    // Update document metadata
    function updateDocument(
        bytes32 docId,
        bytes32 newIrysId,
        string memory newTitle,
        bytes32[] memory newTags
    ) external;

    // Query functions
    function getDocument(bytes32 docId) external view returns (Document memory);
    function getDocumentsByOwner(address owner) external view returns (bytes32[] memory);
    function getDocumentsByProject(bytes32 projectId) external view returns (bytes32[] memory);
    function documentExists(bytes32 docId) external view returns (bool);

    // Events
    event DocumentRegistered(bytes32 indexed docId, bytes32 indexed irysId, address indexed owner);
    event DocumentUpdated(bytes32 indexed docId, bytes32 newIrysId);
}
```

### Usage with PureIrysClient

```typescript
import { PureIrysClient } from '@debhub/pure-irys-client';

const client = new PureIrysClient(signer);
await client.init();

// Create document (uploads to Irys + registers in contract)
const docId = await client.createDocument({
  projectId: 'my-project',
  title: 'Getting Started',
  content: 'Document content here...',
  tags: ['tutorial', 'docs'],
});

// Get document (queries contract + fetches from Irys)
const doc = await client.getDocument(docId);
console.log(doc.title, doc.irysId, doc.createdAt);

// Update document (new Irys upload + contract update)
await client.updateDocument(docId, {
  content: 'Updated content',
  changeDescription: 'Fixed typo',
});

// Query documents
const myDocs = await client.searchDocuments({
  projectId: 'my-project',
  tags: ['tutorial'],
  limit: 10,
});
```

### Direct Contract Interaction

```typescript
import { ethers } from 'ethers';
import DocumentRegistryABI from '@debhub/pure-irys-client/contracts/abis/DocumentRegistry.json';

const contract = new ethers.Contract(
  '0x937956DA31B42C3ad9f6eC4366360Ae763391566',
  DocumentRegistryABI,
  signer
);

// Register document
const tx = await contract.registerDocument(
  ethers.encodeBytes32String('irys-tx-id'),
  ethers.encodeBytes32String('project-123'),
  'Document Title',
  [ethers.encodeBytes32String('tag1'), ethers.encodeBytes32String('tag2')]
);
await tx.wait();

// Query document
const doc = await contract.getDocument(docId);
console.log(doc.title, doc.owner, doc.createdAt);
```

---

## AccessControl Contract

**Replaces**: Backend authorization logic

**Purpose**: Decentralized permission management

### Features

- Role-based access control (RBAC)
- Resource-level permissions
- Permission delegation
- Multi-role support
- Owner management

### Permission Levels

```solidity
enum Permission {
    NONE,       // 0 - No access
    READ,       // 1 - Read only
    WRITE,      // 2 - Read + Write
    ADMIN,      // 3 - Full control
    OWNER       // 4 - Ownership rights
}
```

### Contract Interface

```solidity
interface IAccessControl {
    // Grant permission
    function grantPermission(
        bytes32 resourceId,
        address user,
        Permission permission
    ) external;

    // Revoke permission
    function revokePermission(
        bytes32 resourceId,
        address user
    ) external;

    // Check permission
    function hasPermission(
        bytes32 resourceId,
        address user,
        Permission required
    ) external view returns (bool);

    // Get user permission
    function getPermission(
        bytes32 resourceId,
        address user
    ) external view returns (Permission);

    // Transfer ownership
    function transferOwnership(
        bytes32 resourceId,
        address newOwner
    ) external;

    // Events
    event PermissionGranted(bytes32 indexed resourceId, address indexed user, Permission permission);
    event PermissionRevoked(bytes32 indexed resourceId, address indexed user);
    event OwnershipTransferred(bytes32 indexed resourceId, address indexed oldOwner, address indexed newOwner);
}
```

### Usage with PureIrysClient

```typescript
// PureIrysClient handles permissions automatically

// Only owner can update
await client.updateDocument(docId, {
  content: 'Updated content'
});
// → Checks AccessControl contract first
// → Throws error if user lacks permission

// Grant permission to collaborator
await client.grantAccess(docId, collaboratorAddress, 'WRITE');

// Check permission
const canEdit = await client.checkPermission(docId, userAddress, 'WRITE');
if (canEdit) {
  // Allow editing UI
}
```

### Direct Contract Interaction

```typescript
import AccessControlABI from '@debhub/pure-irys-client/contracts/abis/AccessControl.json';

const contract = new ethers.Contract(
  '0xdD1ACe083c156296760aAe07718Baab969642B8D',
  AccessControlABI,
  signer
);

// Grant write permission
await contract.grantPermission(
  docId,
  collaboratorAddress,
  2 // Permission.WRITE
);

// Check permission
const hasWrite = await contract.hasPermission(
  docId,
  userAddress,
  2 // Permission.WRITE
);

// Transfer ownership
await contract.transferOwnership(docId, newOwnerAddress);
```

---

## ProvenanceChain Contract

**Replaces**: Git version control system

**Purpose**: Immutable version history tracking

### Features

- Complete version history
- Version linking (parent-child)
- Change descriptions
- Irys-backed immutability
- Version retrieval

### Contract Interface

```solidity
interface IProvenanceChain {
    struct Version {
        bytes32 id;
        bytes32 irysId;          // Irys transaction ID for this version
        bytes32 entityId;        // Document ID
        bytes32 previousVersion; // Previous version ID (0x0 for first version)
        address author;
        string description;      // Change description
        uint256 timestamp;
    }

    // Add new version
    function addVersion(
        bytes32 entityId,
        bytes32 irysId,
        bytes32 previousVersion,
        string memory description
    ) external returns (bytes32 versionId);

    // Get version
    function getVersion(bytes32 versionId) external view returns (Version memory);

    // Get all versions for entity
    function getVersionHistory(bytes32 entityId) external view returns (Version[] memory);

    // Get latest version
    function getLatestVersion(bytes32 entityId) external view returns (Version memory);

    // Events
    event VersionAdded(bytes32 indexed versionId, bytes32 indexed entityId, bytes32 indexed irysId, address author);
}
```

### Usage with PureIrysClient

```typescript
// Every document update creates a new version automatically
await client.updateDocument(docId, {
  content: 'Updated content',
  changeDescription: 'Fixed typo in introduction',
});
// → Uploads new version to Irys
// → Adds version to ProvenanceChain
// → Links to previous version

// Get version history
const versions = await client.getVersionHistory(docId);
versions.forEach(v => {
  console.log(v.timestamp, v.description, v.irysId);
});

// Get specific version content
const v1Content = await client.getVersionContent(docId, versions[0].irysId);
```

### Direct Contract Interaction

```typescript
import ProvenanceChainABI from '@debhub/pure-irys-client/contracts/abis/ProvenanceChain.json';

const contract = new ethers.Contract(
  '0x44755E8C746Dc1819a0e8c74503AFC106FC800CB',
  ProvenanceChainABI,
  signer
);

// Add version
const tx = await contract.addVersion(
  docId,
  ethers.encodeBytes32String('new-irys-id'),
  previousVersionId,
  'Updated formatting'
);
await tx.wait();

// Get version history
const versions = await contract.getVersionHistory(docId);
console.log(`Total versions: ${versions.length}`);

// Get latest version
const latest = await contract.getLatestVersion(docId);
console.log('Latest Irys ID:', latest.irysId);
```

---

## EventBus Contract

**Replaces**: WebSocket server for real-time updates

**Purpose**: Blockchain-native event distribution

### Features

- Event publishing
- Subscription support (off-chain)
- Event filtering by type
- Event history
- Real-time notifications

### Contract Interface

```solidity
interface IEventBus {
    struct Event {
        bytes32 id;
        string eventType;
        bytes32 resourceId;
        bytes data;
        address publisher;
        uint256 timestamp;
    }

    // Publish event
    function publishEvent(
        string memory eventType,
        bytes32 resourceId,
        bytes memory data
    ) external returns (bytes32 eventId);

    // Get event
    function getEvent(bytes32 eventId) external view returns (Event memory);

    // Get events by resource
    function getEventsByResource(
        bytes32 resourceId,
        uint256 fromTimestamp
    ) external view returns (Event[] memory);

    // Events (listened by off-chain subscribers)
    event EventPublished(
        bytes32 indexed eventId,
        string indexed eventType,
        bytes32 indexed resourceId,
        bytes data,
        address publisher,
        uint256 timestamp
    );
}
```

### Event Types

- `document.created` - New document created
- `document.updated` - Document content updated
- `document.deleted` - Document deleted
- `comment.added` - Comment added
- `permission.granted` - Permission granted
- `version.added` - New version added

### Usage with PureIrysClient

```typescript
// Subscribe to document updates (listens to EventBus contract events)
const unsubscribe = client.onDocumentUpdate(docId, (id, version) => {
  console.log(`Document ${id} updated to version ${version}`);
  // Automatically refresh UI
});

// Subscribe to all project events
const unsubscribeAll = client.onProjectEvents('my-project', (event) => {
  console.log('Event:', event.type, event.data);
});

// Cleanup
unsubscribe();
```

### Direct Contract Interaction

```typescript
import EventBusABI from '@debhub/pure-irys-client/contracts/abis/EventBus.json';

const contract = new ethers.Contract(
  '0x042E4e6a56aA1680171Da5e234D9cE42CBa03E1c',
  EventBusABI,
  signer
);

// Publish event
const data = ethers.AbiCoder.defaultAbiCoder().encode(
  ['string', 'uint256'],
  ['New content', 12345]
);
await contract.publishEvent('document.updated', docId, data);

// Listen to events (off-chain)
contract.on('EventPublished', (eventId, eventType, resourceId, data, publisher, timestamp) => {
  if (eventType === 'document.updated' && resourceId === docId) {
    console.log('Document updated!', data);
    // Refresh UI
  }
});
```

---

## CacheController Contract

**Replaces**: Redis cache invalidation

**Purpose**: Client-side cache invalidation signaling

### Features

- Cache invalidation triggers
- Resource-level invalidation
- Batch invalidation
- Invalidation history
- Subscription support

### Contract Interface

```solidity
interface ICacheController {
    // Invalidate cache for resource
    function invalidate(bytes32 resourceId) external;

    // Invalidate multiple resources
    function invalidateBatch(bytes32[] memory resourceIds) external;

    // Get last invalidation time
    function getLastInvalidation(bytes32 resourceId) external view returns (uint256);

    // Events
    event CacheInvalidated(bytes32 indexed resourceId, uint256 timestamp);
    event BatchCacheInvalidated(bytes32[] resourceIds, uint256 timestamp);
}
```

### Usage with PureIrysClient

```typescript
// Cache invalidation happens automatically
await client.updateDocument(docId, { content: 'Updated' });
// → Triggers CacheController.invalidate(docId)
// → All clients listening to this docId clear their IndexedDB cache
// → Next getDocument() fetches fresh data from Irys

// Manual cache invalidation
await client.invalidateCache(docId);

// Listen for invalidation events
client.onCacheInvalidated(docId, () => {
  console.log('Cache invalidated, refetching...');
  client.getDocument(docId); // Force refresh
});
```

### Direct Contract Interaction

```typescript
import CacheControllerABI from '@debhub/pure-irys-client/contracts/abis/CacheController.json';

const contract = new ethers.Contract(
  '0x8aFb8b9d57e9b6244e29a090ea4da1A9043a91E2',
  CacheControllerABI,
  signer
);

// Invalidate cache
await contract.invalidate(docId);

// Batch invalidation
await contract.invalidateBatch([docId1, docId2, docId3]);

// Listen for invalidation
contract.on('CacheInvalidated', (resourceId, timestamp) => {
  if (resourceId === myDocId) {
    // Clear local cache
    await indexedDB.deleteDatabase('pure-irys-cache');
  }
});
```

---

## SearchIndex Contract

**Replaces**: ElasticSearch

**Purpose**: On-chain search indexing

### Features

- Keyword indexing
- Tag-based search
- Owner-based search
- Project-based search
- Full-text search pointers

### Contract Interface

```solidity
interface ISearchIndex {
    // Index document
    function indexDocument(
        bytes32 docId,
        bytes32 projectId,
        bytes32[] memory keywords,
        bytes32[] memory tags
    ) external;

    // Update index
    function updateIndex(
        bytes32 docId,
        bytes32[] memory newKeywords,
        bytes32[] memory newTags
    ) external;

    // Search by keywords
    function searchByKeywords(
        bytes32[] memory keywords,
        bytes32 projectId
    ) external view returns (bytes32[] memory);

    // Search by tags
    function searchByTags(
        bytes32[] memory tags,
        bytes32 projectId
    ) external view returns (bytes32[] memory);

    // Events
    event DocumentIndexed(bytes32 indexed docId, bytes32 indexed projectId);
    event IndexUpdated(bytes32 indexed docId);
}
```

### Usage with PureIrysClient

```typescript
// Indexing happens automatically on document creation
await client.createDocument({
  projectId: 'my-project',
  title: 'GraphQL Tutorial',
  content: 'Learn GraphQL basics...',
  tags: ['graphql', 'tutorial'],
});
// → Indexes keywords: ['graphql', 'tutorial', 'learn', 'basics']
// → Indexes tags: ['graphql', 'tutorial']

// Search documents
const results = await client.searchDocuments({
  projectId: 'my-project',
  query: 'graphql tutorial',
  tags: ['tutorial'],
  limit: 10,
});

results.forEach(doc => {
  console.log(doc.title, doc.score);
});
```

### Direct Contract Interaction

```typescript
import SearchIndexABI from '@debhub/pure-irys-client/contracts/abis/SearchIndex.json';

const contract = new ethers.Contract(
  '0x2345938F52790F1d8a1E3355cA66eA3e60494A36',
  SearchIndexABI,
  signer
);

// Index document
await contract.indexDocument(
  docId,
  projectId,
  [
    ethers.encodeBytes32String('graphql'),
    ethers.encodeBytes32String('tutorial'),
  ],
  [
    ethers.encodeBytes32String('tutorial'),
    ethers.encodeBytes32String('docs'),
  ]
);

// Search by tags
const results = await contract.searchByTags(
  [ethers.encodeBytes32String('tutorial')],
  projectId
);
console.log(`Found ${results.length} documents`);
```

---

## Integration Guide

### Using PureIrysClient (Recommended)

The easiest way to interact with all contracts:

```typescript
import { PureIrysClient } from '@debhub/pure-irys-client';
import { ethers } from 'ethers';

// Initialize client
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const client = new PureIrysClient(signer);
await client.init();

// All contract interactions handled automatically
const docId = await client.createDocument({
  projectId: 'my-project',
  title: 'Document Title',
  content: 'Content here',
  tags: ['tag1', 'tag2'],
});
// → DocumentRegistry.registerDocument()
// → SearchIndex.indexDocument()
// → ProvenanceChain.addVersion()
// → EventBus.publishEvent()
```

### Using React Hooks

```typescript
import {
  usePureIrysClient,
  useCreateDocument,
  useDocument,
  useSearchDocuments,
} from '@debhub/pure-irys-client';

function MyComponent() {
  const { client, isInitializing } = usePureIrysClient();
  const { createDocument, isCreating } = useCreateDocument(client);
  const { document, isLoading } = useDocument(client, docId);

  const handleCreate = async () => {
    const id = await createDocument({
      projectId: 'my-project',
      title: 'New Doc',
      content: 'Content',
      tags: ['tag'],
    });
  };

  return <div>{document?.title}</div>;
}
```

### Direct Contract Usage

For advanced use cases:

```typescript
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@debhub/pure-irys-client/contracts/addresses';
import DocumentRegistryABI from '@debhub/pure-irys-client/contracts/abis/DocumentRegistry.json';

const network = 'testnet'; // or 'mainnet'
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const documentRegistry = new ethers.Contract(
  CONTRACT_ADDRESSES[network].DocumentRegistry,
  DocumentRegistryABI,
  signer
);

// Direct contract interaction
const tx = await documentRegistry.registerDocument(
  ethers.encodeBytes32String('irys-id'),
  ethers.encodeBytes32String('project-id'),
  'Document Title',
  [ethers.encodeBytes32String('tag1')]
);
await tx.wait();
```

---

## Best Practices

### Performance Optimization

1. **Use IndexedDB Caching**:
   ```typescript
   // PureIrysClient caches automatically with 5min TTL
   const doc = await client.getDocument(docId);
   // → First call: Queries contract + fetches from Irys
   // → Subsequent calls (within 5min): Returns from IndexedDB
   ```

2. **Batch Operations**:
   ```typescript
   // Instead of multiple updates
   for (const id of docIds) {
     await client.updateDocument(id, {...});
   }

   // Use batch invalidation
   await cacheController.invalidateBatch(docIds);
   ```

3. **Lazy Loading**:
   ```typescript
   // Don't fetch full content for lists
   const docs = await client.searchDocuments({
     projectId: 'my-project',
     limit: 10,
   });
   // → Only fetches metadata from contract
   // → Fetch full content on demand
   ```

### Security

1. **Permission Checks**:
   ```typescript
   // Always check permissions before operations
   const canEdit = await client.checkPermission(docId, userAddress, 'WRITE');
   if (!canEdit) {
     throw new Error('Insufficient permissions');
   }
   await client.updateDocument(docId, {...});
   ```

2. **Input Validation**:
   ```typescript
   // Validate on client side before blockchain tx
   if (!title || title.length > 256) {
     throw new Error('Invalid title');
   }
   await client.createDocument({ title, ... });
   ```

3. **Gas Optimization**:
   ```typescript
   // Estimate gas before transaction
   const gasEstimate = await contract.estimateGas.registerDocument(...);
   console.log('Estimated gas:', gasEstimate.toString());
   ```

### Error Handling

1. **Graceful Degradation**:
   ```typescript
   try {
     const doc = await client.getDocument(docId);
   } catch (error) {
     // Check if Irys is down
     if (error.message.includes('gateway')) {
       // Use cached version
       const cached = await indexedDB.get(docId);
       return cached;
     }
     throw error;
   }
   ```

2. **Transaction Retries**:
   ```typescript
   async function createWithRetry(data, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await client.createDocument(data);
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await new Promise(r => setTimeout(r, 1000 * (i + 1)));
       }
     }
   }
   ```

3. **User Feedback**:
   ```typescript
   try {
     await client.updateDocument(docId, { content });
     toast.success('Document updated successfully');
   } catch (error) {
     if (error.code === 'INSUFFICIENT_FUNDS') {
       toast.error('Insufficient ETH for gas fees');
     } else if (error.message.includes('permission')) {
       toast.error('You do not have edit access');
     } else {
       toast.error('Failed to update document');
     }
   }
   ```

### Gas Optimization

1. **Minimize Contract Calls**:
   ```typescript
   // Bad: Multiple contract reads
   for (const id of docIds) {
     const doc = await documentRegistry.getDocument(id);
   }

   // Good: Batch query (if contract supports)
   const docs = await documentRegistry.getDocumentsBatch(docIds);
   ```

2. **Use Events for Monitoring**:
   ```typescript
   // Instead of polling
   setInterval(() => {
     const doc = await client.getDocument(docId);
   }, 5000);

   // Listen to events (no gas cost)
   client.onDocumentUpdate(docId, (id, version) => {
     // Refresh only when actually updated
   });
   ```

---

## Migration from Traditional Services

### PostgreSQL → DocumentRegistry

**Before (SQL)**:
```sql
INSERT INTO documents (id, title, content, owner_id)
VALUES ('doc-123', 'Title', 'Content', 'user-456');

SELECT * FROM documents WHERE owner_id = 'user-456';
```

**After (Smart Contract)**:
```typescript
// Upload to Irys
const irysId = await irysUploader.upload(content);

// Register in contract
await documentRegistry.registerDocument(
  irysId,
  projectId,
  title,
  tags
);

// Query
const docs = await documentRegistry.getDocumentsByOwner(ownerAddress);
```

### Backend Auth → AccessControl

**Before (Backend)**:
```typescript
// Backend middleware
function checkPermission(userId, resourceId, required) {
  const permission = db.query(
    'SELECT permission FROM permissions WHERE user_id = ? AND resource_id = ?',
    [userId, resourceId]
  );
  return permission >= required;
}
```

**After (Smart Contract)**:
```typescript
const hasPermission = await accessControl.hasPermission(
  resourceId,
  userAddress,
  Permission.WRITE
);
```

### WebSocket → EventBus

**Before (WebSocket Server)**:
```typescript
// Server
io.on('connection', (socket) => {
  socket.on('document:update', (data) => {
    socket.broadcast.emit('document:updated', data);
  });
});

// Client
socket.on('document:updated', (data) => {
  updateUI(data);
});
```

**After (Smart Contract Events)**:
```typescript
// Publish event (on-chain)
await eventBus.publishEvent('document.updated', docId, data);

// Listen to event (off-chain)
eventBus.on('EventPublished', (eventId, eventType, resourceId, data) => {
  if (eventType === 'document.updated') {
    updateUI(data);
  }
});
```

---

## Troubleshooting

### Common Issues

1. **"Contract call failed"**:
   - Verify contract addresses match network (testnet vs mainnet)
   - Check user is on correct network (Chain ID 1270 or 9990)
   - Ensure sufficient ETH for gas fees

2. **"Permission denied"**:
   - Verify user has correct permission level
   - Check AccessControl contract for resource
   - Ensure transaction signer is authorized

3. **"Document not found"**:
   - Verify document exists in DocumentRegistry
   - Check Irys transaction ID is valid
   - Ensure document wasn't deleted

### Debug Tools

```typescript
// Enable verbose logging
const client = new PureIrysClient(signer, {
  debug: true // Logs all contract calls
});

// Check contract deployment
const code = await provider.getCode(CONTRACT_ADDRESSES.testnet.DocumentRegistry);
console.log('Contract deployed:', code !== '0x');

// Verify network
const network = await provider.getNetwork();
console.log('Connected to:', network.chainId);
```

---

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System architecture
- [Getting Started](./GETTING_STARTED.md) - Development setup
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Pure Irys Setup](../PURE_IRYS_SETUP.md) - Quick start

---

**DeBHuB Pure Irys BaaS** - Smart Contracts Documentation

**Zero Backend. Pure Blockchain. Maximum Decentralization.**

Made with ❤️ by the DeBHuB Team

**Status**: 🟢 Production Ready | **Version**: 3.0.0-pure | **Updated**: 2025-10-16
