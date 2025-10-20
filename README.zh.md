# DeBHuB

<div align="center">

**全球首个基于纯 Irys L1 的完全去中心化 BaaS 平台**

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.en.md)
[![한국어](https://img.shields.io/badge/lang-한국어-red.svg)](README.ko.md)
[![中文](https://img.shields.io/badge/lang-中文-green.svg)](README.zh.md)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Irys](https://img.shields.io/badge/Irys-L1%20DataChain-purple.svg)](https://irys.xyz/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

---

## 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/0xarkstar/DeBHuB.git
cd DeBHuB

# 安装依赖
pnpm install

# 运行前端
cd apps/web-vite
pnpm dev
```

**访问:** http://localhost:5173

---

## 💡 什么是 DeBHuB?

**零后端。零数据库。纯区块链。**

DeBHuB 是一个完全由 Irys L1 DataChain 驱动的创新型后端即服务平台。

### 核心特性

- ✅ **完全去中心化** - 无需后端服务器或数据库
- ✅ **智能合约** - 通过 6 个 Solidity 合约管理所有数据
- ✅ **可编程数据** - 逻辑直接在区块链上执行
- ✅ **永久存储** - Irys L1 上的不可变数据存储
- ✅ **快速性能** - IndexedDB 客户端缓存（5分钟 TTL）

---

## 🏗️ 架构

```
前端 (React + Vite)
    ↓ 直接 RPC
Irys L1 DataChain (链 ID: 1270)
    ├─ 智能合约 (6个)
    │  ├─ DocumentRegistry
    │  ├─ AccessControl
    │  ├─ ProvenanceChain
    │  ├─ EventBus
    │  ├─ CacheController
    │  └─ SearchIndex
    └─ 永久存储 (Irys 原生)
```

---

## 💻 技术栈

- **前端**: React 18, Vite 5, TypeScript 5, TailwindCSS
- **区块链**: Irys L1 DataChain, ethers.js v6, wagmi v2
- **缓存**: IndexedDB (idb v8.0.0)
- **存储**: Irys 原生永久存储

---

## 📚 文档

完整文档可在 [`docs/`](./docs) 目录中找到：

- **[架构](./docs/architecture)** - 系统设计和技术分析
- **[指南](./docs/guides)** - 用户指南和教程
- **[测试](./docs/testing)** - 测试报告和 QA 文档
- **[开发](./docs/development)** - 内部开发文档

**快速链接:**
- [入门指南](./docs/guides/USER_GUIDE_NEXT_STEPS.md)
- [架构概述](./docs/architecture/IRYS_ARCHITECTURE_ANALYSIS.md)
- [IrysVM 状态](./docs/architecture/IRYSVM_STATUS_REPORT.md)

---

## 🆚 DeBHuB vs 传统 BaaS

| 功能 | 传统 BaaS | DeBHuB |
|------|-----------|---------|
| 后端服务器 | ✅ 必需 | ❌ 不需要 |
| 数据库 | ✅ PostgreSQL/MongoDB | ❌ 不需要 |
| 缓存服务器 | ✅ Redis | ❌ IndexedDB |
| 实时 | ✅ WebSocket | ✅ 区块链事件 |
| 运营成本 | 💰 高 | 💰 低（仅交易费） |
| 数据所有权 | ⚠️ 平台 | ✅ 用户完全所有 |

---

## 📞 支持

- **问题**: [GitHub Issues](https://github.com/0xarkstar/DeBHuB/issues)
- **讨论**: [GitHub Discussions](https://github.com/0xarkstar/DeBHuB/discussions)
- **文档**: [docs/](./docs)

---

<div align="center">

**Made with ❤️ by DeBHuB Team**

**状态**: 🟢 生产就绪 | **版本**: 3.0.0-pure

[English](README.en.md) | [한국어](README.ko.md) | [中文](README.zh.md)

</div>
