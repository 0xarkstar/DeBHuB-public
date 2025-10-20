# DeBHuB 文档

> **语言**: [English](README.en.md) | [한국어](README.md) | [中文](README.zh.md)

---

## 💡 概述

**DeBHuB** 是全球首个完全由 Pure Irys L1 DataChain 驱动的完全去中心化 Backend-as-a-Service 平台。

**零后端。零数据库。纯区块链。**

无需传统后端服务器和数据库，仅使用区块链智能合约和永久存储即可提供所有后端功能。

---

## 🏗️ 架构

```
前端 (React + Vite)
    ↓ 直接 RPC 连接
Irys L1 DataChain (链 ID: 1270)
    ├─ 智能合约层 (6个合约)
    │  ├─ DocumentRegistry    - 文档注册与管理
    │  ├─ AccessControl        - 权限与访问控制
    │  ├─ ProvenanceChain      - 数据出处追踪
    │  ├─ EventBus             - 事件发布/订阅
    │  ├─ CacheController      - 缓存失效控制
    │  └─ SearchIndex          - 搜索索引管理
    └─ 永久存储 (Irys 原生)
        └─ 不可变永久数据存储
```

### 技术栈
- **前端**: React 18, Vite 5, TypeScript 5, TailwindCSS
- **区块链**: Irys L1 DataChain, ethers.js v6, wagmi v2
- **缓存**: IndexedDB (idb v8.0.0)
- **存储**: Irys 原生永久存储

---

## ✨ 核心功能

### 完全去中心化
- 无需后端服务器
- 无需数据库
- 所有逻辑均以智能合约实现
- 客户端直接向区块链发起 RPC 调用

### 基于智能合约的数据管理
- 6个 Solidity 合约提供所有后端功能
- 文档注册、权限管理、出处追踪、事件处理
- 直接在区块链上执行的可编程数据逻辑

### 永久存储
- 利用 Irys L1 的原生永久存储
- 保证数据不可变性
- 数据所有权完全归属用户

### 高性能缓存
- IndexedDB 客户端缓存
- 5分钟 TTL 实现快速数据访问
- 最小化网络负载

### 自动网络切换
- 自动检测 IrysVM 网络
- 使用不同网络时自动切换提示
- 提供无缝用户体验

---

## 📞 支持

- **问题**: [GitHub Issues](https://github.com/0xarkstar/DeBHuB/issues)
- **讨论**: [GitHub Discussions](https://github.com/0xarkstar/DeBHuB/discussions)

---

<div align="center">

**Made with ❤️ by DeBHuB Team**

**最后更新**: 2025-10-20

</div>
