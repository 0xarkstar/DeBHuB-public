# DeBHuB

<div align="center">

**세계 최초 Pure Irys L1 기반 완전 탈중앙화 BaaS 플랫폼**

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.en.md)
[![한국어](https://img.shields.io/badge/lang-한국어-red.svg)](README.ko.md)
[![中文](https://img.shields.io/badge/lang-中文-green.svg)](README.zh.md)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Irys](https://img.shields.io/badge/Irys-L1%20DataChain-purple.svg)](https://irys.xyz/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

---

## 🚀 빠른 시작

```bash
# 저장소 클론
git clone https://github.com/0xarkstar/DeBHuB.git
cd DeBHuB

# 의존성 설치
pnpm install

# 프론트엔드 실행
cd apps/web-vite
pnpm dev
```

**접속:** http://localhost:5173

---

## 💡 DeBHuB란?

**Zero Backend. Zero Database. Pure Blockchain.**

DeBHuB는 Irys L1 DataChain만으로 동작하는 혁신적인 Backend-as-a-Service 플랫폼입니다.

### 핵심 특징

- ✅ **완전 탈중앙화** - 백엔드 서버, 데이터베이스 불필요
- ✅ **스마트 컨트랙트** - 6개의 Solidity 컨트랙트로 모든 데이터 관리
- ✅ **프로그래머블 데이터** - 블록체인에서 직접 실행되는 로직
- ✅ **영구 저장** - Irys L1의 불변 데이터 저장
- ✅ **빠른 성능** - IndexedDB 클라이언트 캐싱 (5분 TTL)

---

## 🏗️ 아키텍처

```
Frontend (React + Vite)
    ↓ Direct RPC
Irys L1 DataChain (Chain ID: 1270)
    ├─ Smart Contracts (6개)
    │  ├─ DocumentRegistry
    │  ├─ AccessControl
    │  ├─ ProvenanceChain
    │  ├─ EventBus
    │  ├─ CacheController
    │  └─ SearchIndex
    └─ Permanent Storage (Irys Native)
```

---

## 💻 기술 스택

- **Frontend**: React 18, Vite 5, TypeScript 5, TailwindCSS
- **Blockchain**: Irys L1 DataChain, ethers.js v6, wagmi v2
- **Caching**: IndexedDB (idb v8.0.0)
- **Storage**: Irys Native Permanent Storage

---

## 📚 문서

자세한 문서는 [`docs/`](./docs) 디렉토리를 참조하세요:

- **[아키텍처](./docs/architecture)** - 시스템 설계 및 기술 분석
- **[가이드](./docs/guides)** - 사용자 가이드 및 튜토리얼
- **[테스팅](./docs/testing)** - 테스트 보고서 및 QA 문서
- **[개발](./docs/development)** - 내부 개발 문서

**빠른 링크:**
- [시작하기](./docs/guides/USER_GUIDE_NEXT_STEPS.md)
- [아키텍처 개요](./docs/architecture/IRYS_ARCHITECTURE_ANALYSIS.md)
- [IrysVM 상태](./docs/architecture/IRYSVM_STATUS_REPORT.md)

---

## 🆚 DeBHuB vs 전통적 BaaS

| 항목 | 전통적 BaaS | DeBHuB |
|------|-------------|---------|
| 백엔드 서버 | ✅ 필수 | ❌ 불필요 |
| 데이터베이스 | ✅ PostgreSQL/MongoDB | ❌ 불필요 |
| 캐싱 서버 | ✅ Redis | ❌ IndexedDB |
| 실시간 | ✅ WebSocket | ✅ Blockchain Events |
| 운영 비용 | 💰 높음 | 💰 낮음 (트랜잭션만) |
| 데이터 소유권 | ⚠️ 플랫폼 | ✅ 사용자 완전 소유 |

---

## 📞 지원

- **이슈**: [GitHub Issues](https://github.com/0xarkstar/DeBHuB/issues)
- **토론**: [GitHub Discussions](https://github.com/0xarkstar/DeBHuB/discussions)
- **문서**: [docs/](./docs)

---

<div align="center">

**Made with ❤️ by DeBHuB Team**

**Status**: 🟢 Production Ready | **Version**: 3.0.0-pure

[English](README.en.md) | [한국어](README.ko.md) | [中文](README.zh.md)

</div>
