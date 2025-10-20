# DeBHuB Documentation

> **Languages**: [English](README.en.md) | [한국어](README.md) | [中文](README.zh.md)

---

## 💡 Overview

**DeBHuB** is the world's first fully decentralized Backend-as-a-Service platform powered entirely by Pure Irys L1 DataChain.

**Zero Backend. Zero Database. Pure Blockchain.**

Without traditional backend servers and databases, it provides all backend functionality using only blockchain smart contracts and permanent storage.

---

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓ Direct RPC Connection
Irys L1 DataChain (Chain ID: 1270)
    ├─ Smart Contracts Layer (6 Contracts)
    │  ├─ DocumentRegistry    - Document registration & management
    │  ├─ AccessControl        - Permission & access control
    │  ├─ ProvenanceChain      - Data provenance tracking
    │  ├─ EventBus             - Event publish/subscribe
    │  ├─ CacheController      - Cache invalidation control
    │  └─ SearchIndex          - Search index management
    └─ Permanent Storage (Irys Native)
        └─ Immutable permanent data storage
```

### Tech Stack
- **Frontend**: React 18, Vite 5, TypeScript 5, TailwindCSS
- **Blockchain**: Irys L1 DataChain, ethers.js v6, wagmi v2
- **Caching**: IndexedDB (idb v8.0.0)
- **Storage**: Irys Native Permanent Storage

---

## 🔄 User Flow

### 1. Wallet Connection & Network Setup
```
User Accesses App
    ↓
Auto-detect IrysVM Network
    ↓
[Using Different Network?]
    ├─ YES → Auto-switch Prompt (Auto-switch after 2s)
    └─ NO → Request Wallet Connection
        ↓
    Connect MetaMask/WalletConnect
        ↓
    Enter Dashboard
```

### 2. Document Creation Flow
```
Start Document Creation
    ↓
1. Check IndexedDB Cache (5min TTL)
    ├─ Cache Hit → Load Immediately
    └─ Cache Miss → Query Blockchain
        ↓
2. Input Document Content
    ↓
3. Call DocumentRegistry.registerDocument()
    ↓
4. Sign Transaction (User)
    ↓
5. Store Permanently on Blockchain
    ↓
6. Emit DocumentCreated Event via EventBus
    ↓
7. Auto-update SearchIndex
    ↓
8. Update IndexedDB Cache
    ↓
Document Registration Complete
```

### 3. Document Retrieval Flow
```
Request Document Retrieval
    ↓
1. Check IndexedDB Cache
    ├─ Cache Valid (< 5min) → Return from Cache
    └─ Cache Expired/Missing
        ↓
2. Call DocumentRegistry.getDocument() via RPC
    ↓
3. Query Data from Blockchain
    ↓
4. Verify Permissions via AccessControl
    ↓
5. Return Data & Cache in IndexedDB
    ↓
Display Document
```

### 4. Permission Management Flow
```
Request Permission Setup
    ↓
1. Call AccessControl.grantAccess()
    ↓
2. Verify Owner
    ↓
3. Set Permission Level (READ/WRITE/ADMIN)
    ↓
4. Sign Transaction
    ↓
5. Store Permission Info on Blockchain
    ↓
6. Emit AccessGranted Event via EventBus
    ↓
7. Invalidate Related Cache via CacheController
    ↓
Permission Setup Complete
```

---

## 📊 System Flow Chart

### Overall Data Flow
```
┌─────────────────────────────────────────────────────────────┐
│                        User (User)                            │
│                    (MetaMask/WalletConnect)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ RPC Call
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                       │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  React UI Layer  │ ←─────→ │  State Manager   │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                             │                     │
│           ↓                             ↓                     │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ ethers.js Client │         │  IndexedDB Cache │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
└───────────┼─────────────────────────────┼───────────────────┘
            │                             │
            │ Direct RPC                  │ 5min TTL
            ↓                             ↓
┌─────────────────────────────────────────────────────────────┐
│              Irys L1 DataChain (Chain ID: 1270)             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Smart Contracts Layer (6 Contracts)          │ │
│  │                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │  Document    │  │   Access     │  │ Provenance  │ │ │
│  │  │  Registry    │  │   Control    │  │   Chain     │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │ │
│  │         │                  │                  │        │ │
│  │         └──────────────────┼──────────────────┘        │ │
│  │                            ↓                           │ │
│  │         ┌──────────────────────────────────┐          │ │
│  │         │          Event Bus               │          │ │
│  │         │    (Publish/Subscribe)           │          │ │
│  │         └──────────┬───────────────────────┘          │ │
│  │                    │                                   │ │
│  │         ┌──────────┴───────────┐                      │ │
│  │         ↓                      ↓                      │ │
│  │  ┌──────────────┐      ┌──────────────┐             │ │
│  │  │    Cache     │      │    Search    │             │ │
│  │  │  Controller  │      │    Index     │             │ │
│  │  └──────────────┘      └──────────────┘             │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Irys Native Permanent Storage                │ │
│  │              (Immutable Data Layer)                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Smart Contract Interactions
```
DocumentRegistry ←→ AccessControl
        ↓                  ↓
        └────→ EventBus ←──┘
                  ↓
        ┌─────────┴─────────┐
        ↓                   ↓
  CacheController    SearchIndex
        ↓                   ↓
   ProvenanceChain ←────────┘
```

---

## ✨ Core Features

### Fully Decentralized
- No backend server required
- No database required
- All logic implemented as smart contracts
- Direct RPC calls from client to blockchain

### Smart Contract-Based Data Management
- All backend functionality provided by 6 Solidity contracts
- Document registration, permission management, provenance tracking, event handling
- Programmable data logic executed directly on blockchain

### Permanent Storage
- Utilizing Irys L1's native permanent storage
- Guaranteed data immutability
- Complete user ownership of data

### High-Performance Caching
- IndexedDB client-side caching
- Fast data access with 5-minute TTL
- Minimized network load

### Automatic Network Switching
- Automatic IrysVM network detection
- Auto-switch prompt when on different network
- Seamless user experience

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/0xarkstar/DeBHuB/issues)
- **Discussions**: [GitHub Discussions](https://github.com/0xarkstar/DeBHuB/discussions)

---

<div align="center">

**Made with ❤️ by DeBHuB Team**

**Last Updated**: 2025-10-20

</div>
