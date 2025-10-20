# DeBHuB

<div align="center">

**World's First Fully Decentralized BaaS Platform on Pure Irys L1**

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.en.md)
[![한국어](https://img.shields.io/badge/lang-한국어-red.svg)](README.ko.md)
[![中文](https://img.shields.io/badge/lang-中文-green.svg)](README.zh.md)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Irys](https://img.shields.io/badge/Irys-L1%20DataChain-purple.svg)](https://irys.xyz/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/0xarkstar/DeBHuB.git
cd DeBHuB

# Install dependencies
pnpm install

# Run frontend
cd apps/web-vite
pnpm dev
```

**Access:** http://localhost:5173

---

## 💡 What is DeBHuB?

**Zero Backend. Zero Database. Pure Blockchain.**

DeBHuB is an innovative Backend-as-a-Service platform powered entirely by Irys L1 DataChain.

### Key Features

- ✅ **Fully Decentralized** - No backend servers or databases required
- ✅ **Smart Contracts** - All data management through 6 Solidity contracts
- ✅ **Programmable Data** - Logic executed directly on blockchain
- ✅ **Permanent Storage** - Immutable data storage on Irys L1
- ✅ **Fast Performance** - IndexedDB client-side caching (5min TTL)

---

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓ Direct RPC
Irys L1 DataChain (Chain ID: 1270)
    ├─ Smart Contracts (6)
    │  ├─ DocumentRegistry
    │  ├─ AccessControl
    │  ├─ ProvenanceChain
    │  ├─ EventBus
    │  ├─ CacheController
    │  └─ SearchIndex
    └─ Permanent Storage (Irys Native)
```

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite 5, TypeScript 5, TailwindCSS
- **Blockchain**: Irys L1 DataChain, ethers.js v6, wagmi v2
- **Caching**: IndexedDB (idb v8.0.0)
- **Storage**: Irys Native Permanent Storage

---

## 📚 Documentation

**[View Documentation](./docs)** - Installation guide and usage

---

## 🆚 DeBHuB vs Traditional BaaS

| Feature | Traditional BaaS | DeBHuB |
|---------|------------------|---------|
| Backend Server | ✅ Required | ❌ Not Required |
| Database | ✅ PostgreSQL/MongoDB | ❌ Not Required |
| Cache Server | ✅ Redis | ❌ IndexedDB |
| Real-time | ✅ WebSocket | ✅ Blockchain Events |
| Operating Cost | 💰 High | 💰 Low (TX fees only) |
| Data Ownership | ⚠️ Platform | ✅ Full User Ownership |

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/0xarkstar/DeBHuB/issues)
- **Discussions**: [GitHub Discussions](https://github.com/0xarkstar/DeBHuB/discussions)
- **Documentation**: [docs/](./docs)

---

<div align="center">

**Made with ❤️ by DeBHuB Team**

**Status**: 🟢 Production Ready | **Version**: 3.0.0-pure

[English](README.en.md) | [한국어](README.ko.md) | [中文](README.zh.md)

</div>
