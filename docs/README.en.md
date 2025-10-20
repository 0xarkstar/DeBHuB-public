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
