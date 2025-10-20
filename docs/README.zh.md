# DeBHuB 文档

> **语言**: [English](README.en.md) | [한국어](README.md) | [中文](README.zh.md)

---

## 🚀 入门

### 1. 安装

```bash
git clone https://github.com/0xarkstar/DeBHuB.git
cd DeBHuB
pnpm install
```

### 2. 环境设置

```bash
cd apps/web-vite
cp .env.example .env
```

配置 `.env` 文件:
```
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 3. 运行开发服务器

```bash
pnpm dev
```

**访问**: http://localhost:5173

---

## 🎯 核心概念

### IrysVM 测试网
- **链 ID**: 1270
- **RPC URL**: https://testnet-rpc.irys.xyz/v1/execution-rpc
- **原生代币**: IRYS
- **区块浏览器**: https://explorer.irys.xyz

### 添加 MetaMask 网络

1. 打开 MetaMask
2. 点击添加网络
3. 输入以下信息:
   - Network Name: `IrysVM Testnet`
   - RPC URL: `https://testnet-rpc.irys.xyz/v1/execution-rpc`
   - Chain ID: `1270`
   - Currency Symbol: `IRYS`

### 获取测试代币

Irys Faucet: https://irys.xyz/faucet

---

## 💡 主要功能

### 自动网络切换
- 应用访问时自动检测 IrysVM 网络
- 如果在不同网络上则提示切换网络
- 2秒后自动切换网络

### 完全去中心化
- 无需后端服务器
- 无需数据库
- 所有数据存储在 IrysVM 区块链上

---

## 📞 支持

- **问题**: [GitHub Issues](https://github.com/0xarkstar/DeBHuB/issues)
- **讨论**: [GitHub Discussions](https://github.com/0xarkstar/DeBHuB/discussions)

---

**最后更新**: 2025-10-20
