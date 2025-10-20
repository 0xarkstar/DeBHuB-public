# DeBHuB Documentation

> **Languages**: [English](README.en.md) | [한국어](README.md) | [中文](README.zh.md)

---

## 🚀 Getting Started

### 1. Installation

```bash
git clone https://github.com/0xarkstar/DeBHuB.git
cd DeBHuB
pnpm install
```

### 2. Environment Setup

```bash
cd apps/web-vite
cp .env.example .env
```

Configure `.env` file:
```
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 3. Run Development Server

```bash
pnpm dev
```

**Access**: http://localhost:5173

---

## 🎯 Core Concepts

### IrysVM Testnet
- **Chain ID**: 1270
- **RPC URL**: https://testnet-rpc.irys.xyz/v1/execution-rpc
- **Native Token**: IRYS
- **Block Explorer**: https://explorer.irys.xyz

### Add MetaMask Network

1. Open MetaMask
2. Click Add Network
3. Enter the following:
   - Network Name: `IrysVM Testnet`
   - RPC URL: `https://testnet-rpc.irys.xyz/v1/execution-rpc`
   - Chain ID: `1270`
   - Currency Symbol: `IRYS`

### Get Test Tokens

Irys Faucet: https://irys.xyz/faucet

---

## 💡 Key Features

### Automatic Network Switching
- Automatically detects IrysVM network on app access
- Prompts for network switch if on different network
- Auto-switches network after 2 seconds

### Fully Decentralized
- No backend server required
- No database required
- All data stored on IrysVM blockchain

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/0xarkstar/DeBHuB/issues)
- **Discussions**: [GitHub Discussions](https://github.com/0xarkstar/DeBHuB/discussions)

---

**Last Updated**: 2025-10-20
