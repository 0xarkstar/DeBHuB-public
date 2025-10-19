# DeBHuB (IrysBase)

> **세계 최초 Pure Irys L1 기반 완전 탈중앙화 BaaS 플랫폼**

**Zero Backend. Zero Database. Pure Blockchain.**

Irys L1 DataChain만으로 동작하는 혁신적인 Backend-as-a-Service 플랫폼입니다.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Irys](https://img.shields.io/badge/Irys-L1%20DataChain-purple.svg)](https://irys.xyz/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🚀 핵심 특징

### ⚡ Pure Irys Architecture

**데이터베이스 없음. 백엔드 서버 없음. 오직 블록체인.**

- **Irys L1 DataChain** - 독립 레이어1 블록체인으로 완전히 전환 (Arweave 네트워크로부터 분리됨)
- **Smart Contracts** - 6개의 Solidity 컨트랙트로 모든 데이터 관리
- **Programmable Data** - 블록체인에서 직접 실행되는 로직
- **IndexedDB Caching** - 클라이언트 사이드 캐싱 (5분 TTL)
- **Permanent Storage** - 영구 불변 데이터 저장

### 🎯 왜 Pure Irys인가?

**전통적인 BaaS 문제점:**
```
❌ PostgreSQL - 중앙화된 데이터베이스, 단일 장애점
❌ Redis - 별도 캐싱 서버 필요, 복잡도 증가
❌ Backend API - 서버 운영 비용, 스케일링 문제
❌ Arweave - 영구 저장만 가능, 쿼리/검색 불가
```

**Pure Irys 솔루션:**
```
✅ Smart Contracts - 데이터 인덱싱, 검색, 권한 관리
✅ Programmable Data - 백엔드 로직을 블록체인에서 실행
✅ IndexedDB - 클라이언트 캐싱, 서버 불필요
✅ Event System - 실시간 업데이트, WebSocket 대체
✅ Irys L1 - 빠른 블록 생성, 저렴한 트랜잭션
```

---

## 🏗️ Pure Irys 아키텍처

### 시스템 구조

```
┌──────────────────────────────────────────────────────────┐
│             React Frontend (Vite 5)                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  PureIrysClient (Singleton)                        │  │
│  │  - wagmi (Wallet Connection)                       │  │
│  │  - ethers.js v6 (Contract Interaction)             │  │
│  │  - IndexedDB Cache (TTL 5min)                      │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────┘
                     │ Direct RPC Calls
                     ↓
┌──────────────────────────────────────────────────────────┐
│         Irys L1 DataChain (Chain ID: 1270)               │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Smart Contracts (6개)                             │  │
│  │  ├─ DocumentRegistry  - 문서 인덱싱 & 메타데이터   │  │
│  │  ├─ AccessControl     - 권한 관리 (RBAC)          │  │
│  │  ├─ ProvenanceChain   - 버전 히스토리             │  │
│  │  ├─ EventBus          - 실시간 이벤트             │  │
│  │  ├─ CacheController   - 캐시 무효화 신호          │  │
│  │  └─ SearchIndex       - 태그 기반 검색            │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Permanent Storage (Irys Native)                   │  │
│  │  - 모든 문서 콘텐츠                                 │  │
│  │  - 영구 불변 저장                                   │  │
│  │  - 버전별 스냅샷                                    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 데이터 흐름

#### 문서 생성
```
User (Frontend)
  ↓ 1. 지갑 연결 (wagmi + RainbowKit)
PureIrysClient
  ↓ 2. Irys에 콘텐츠 업로드 (WebUploader)
  ↓ 3. Smart Contract에 등록 (DocumentRegistry.registerDocument)
  ↓ 4. 프로비넌스 기록 (ProvenanceChain.recordProvenance)
  ↓ 5. 이벤트 발생 (EventBus.emitDocumentCreated)
  ↓ 6. IndexedDB 캐시 저장
Frontend (즉시 UI 업데이트)
```

#### 문서 조회
```
User (Frontend)
  ↓ 요청
PureIrysClient
  ├─ IndexedDB 캐시 확인
  │   └─ HIT → 즉시 반환 (1ms)
  └─ MISS:
      ↓ 1. Smart Contract에서 메타데이터 조회
      ↓ 2. Irys Gateway에서 콘텐츠 가져오기
      ↓ 3. IndexedDB에 캐시 저장
      └─ 반환 (~200ms)
```

#### 실시간 업데이트
```
Document Updated (다른 사용자)
  ↓ EventBus.emitDocumentUpdated
Blockchain Event
  ↓ PureIrysClient 리스너 감지
  ↓ IndexedDB 캐시 무효화
Frontend (자동 리렌더링)
```

---

## 🚀 빠른 시작

### 사전 요구사항

**필수:**
- Node.js 18+
- pnpm 9+
- MetaMask (또는 호환 지갑)

**선택:**
- Irys Testnet ETH (테스트용 - [Faucet](https://irys.xyz/faucet))

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/0xarkstar/irysbase.git
cd irysbase

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정 (선택사항)
cp apps/web-vite/.env.example apps/web-vite/.env
# VITE_WALLETCONNECT_PROJECT_ID만 설정하면 됩니다

# 4. 프론트엔드 실행
cd apps/web-vite
pnpm dev
```

**접속:** http://localhost:5173/pure

✨ **5분 안에 시작 가능! 백엔드 설정 완전히 불필요!**

---

## 📦 프로젝트 구조

```
irysbase/
├── apps/
│   └── web-vite/                     # React Frontend
│       ├── src/
│       │   ├── pages/
│       │   │   ├── DashboardPure.tsx      # Pure Irys 대시보드
│       │   │   └── NewProjectPure.tsx     # 프로젝트 생성
│       │   ├── contexts/
│       │   │   └── PureIrysContext.tsx    # Irys Client Provider
│       │   └── lib/
│       │       └── wagmi.ts               # 지갑 설정
│       └── package.json
│
├── packages/
│   ├── pure-irys-client/            # ⭐ Pure Irys BaaS Client
│   │   ├── src/
│   │   │   ├── PureIrysClient.ts         # 메인 클라이언트
│   │   │   ├── cache/
│   │   │   │   └── IndexedDBCache.ts     # IndexedDB 캐싱
│   │   │   ├── hooks/
│   │   │   │   └── usePureIrys.ts        # React Hooks (7개)
│   │   │   ├── contracts/
│   │   │   │   ├── addresses.ts          # 배포된 컨트랙트 주소
│   │   │   │   └── abis/                 # 6개 컨트랙트 ABI
│   │   │   │       ├── DocumentRegistry.json
│   │   │   │       ├── AccessControl.json
│   │   │   │       ├── ProvenanceChain.json
│   │   │   │       ├── EventBus.json
│   │   │   │       ├── CacheController.json
│   │   │   │       └── SearchIndex.json
│   │   │   └── types/
│   │   └── README.md
│   │
│   └── contracts/                    # Smart Contracts
│       ├── contracts/pure-irys/      # 6개 Solidity 컨트랙트
│       └── scripts/
│           └── deploy-pure-irys.ts   # 배포 스크립트
│
├── docs/
│   ├── PURE_IRYS_SETUP.md           # 완전한 설정 가이드
│   └── archive/
└── CHANGELOG.md                      # 버전 히스토리
```

---

## 💻 기술 스택

### Frontend
- **React 18** - UI 라이브러리
- **Vite 5** - 빌드 도구 (HMR, 빠른 빌드)
- **TypeScript 5** - 타입 안전성 (strict mode)
- **TailwindCSS** - 유틸리티 CSS
- **Radix UI** - 접근성 컴포넌트

### Blockchain & Web3
- **Irys L1 DataChain** - 독립 레이어1 블록체인
- **@irys/web-upload** - 브라우저 업로더 (v0.0.15)
- **@irys/query** - 블록체인 쿼리 SDK (v0.0.13)
- **ethers.js v6** - Smart Contract 상호작용
- **wagmi v2** - React Ethereum hooks
- **RainbowKit** - 지갑 연결 UI

### Storage & Caching
- **IndexedDB** - 클라이언트 사이드 캐싱 (idb v8.0.0)
- **Irys Native Storage** - 영구 불변 저장소

### Smart Contracts (Deployed)
```
Chain: Irys Testnet (Chain ID: 1270)
RPC: https://testnet-rpc.irys.xyz/v1/execution-rpc

DocumentRegistry:  0x937956DA31B42C3ad9f6eC4366360Ae763391566
AccessControl:     0xdD1ACe083c156296760aAe07718Baab969642B8D
ProvenanceChain:   0x44755E8C746Dc1819a0e8c74503AFC106FC800CB
EventBus:          0x042E4e6a56aA1680171Da5e234D9cE42CBa03E1c
CacheController:   0x8aFb8b9d57e9b6244e29a090ea4da1A9043a91E2
SearchIndex:       0x2345938F52790F1d8a1E3355cA66eA3e60494A36

Deployed: 2025-10-13T19:32:01.637Z
```

---

## 🎯 주요 기능

### 1. Document Management
- ✅ 문서 생성, 조회, 수정, 삭제
- ✅ 버전 관리 (ProvenanceChain)
- ✅ 태그 기반 분류
- ✅ 공개/비공개 설정

### 2. Project Management
- ✅ 프로젝트 생성 및 관리
- ✅ 권한 관리 (RBAC via AccessControl)
- ✅ 프로젝트별 문서 그룹화

### 3. Real-time Updates
- ✅ 블록체인 이벤트 구독
- ✅ 자동 캐시 무효화
- ✅ 실시간 UI 업데이트

### 4. Caching Strategy
- ✅ IndexedDB 자동 캐싱 (5분 TTL)
- ✅ 스마트 캐시 무효화
- ✅ 오프라인 지원

---

## 📚 React Hooks API

```typescript
// 1. Client 초기화
const { client, isInitializing, error } = usePureIrys();

// 2. 문서 생성
const { createDocument, isCreating, error } = useCreateDocument(client);
const docId = await createDocument({
  projectId: 'my-project',
  title: 'My Document',
  content: 'Hello Irys!',
  tags: ['type:doc', 'category:tech'],
  isPublic: true
});

// 3. 문서 조회
const { document, loading, error } = useDocument(client, docId);

// 4. 문서 수정
const { updateDocument, isUpdating } = useUpdateDocument(client);
await updateDocument(docId, {
  content: 'Updated content',
  changeDescription: 'Fixed typo'
});

// 5. 문서 검색
const { documents, loading } = useSearchDocuments(client, {
  owner: address,
  tags: ['type:doc'],
  limit: 10
});

// 6. 실시간 구독
useDocumentSubscription(client, docId, (updatedDoc) => {
  console.log('Document updated!', updatedDoc);
});

// 7. 캐시 통계
const { stats, refresh } = useCacheStats(client);
console.log(`Cache: ${stats.documentCount} docs, ${stats.hitRate}% hit rate`);
```

---

## 🔧 개발

### 로컬 개발

```bash
# Frontend만 실행 (Pure Irys Mode)
pnpm run dev:frontend

# 타입 체크
pnpm typecheck

# 빌드
pnpm build

# Pure Irys Client 패키지 빌드
pnpm build --filter @debhub/pure-irys-client
```

### Smart Contracts

```bash
# 컨트랙트 컴파일
cd packages/contracts
npx hardhat compile

# Pure Irys Contracts 배포
npx hardhat run scripts/deploy-pure-irys.ts --network irys-testnet
```

---

## 🌐 배포

### Frontend 배포 (Vercel / Netlify)

```bash
# 1. 빌드
cd apps/web-vite
pnpm build

# 2. Vercel 배포
vercel --prod

# 환경 변수:
# VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

**배포 후 즉시 사용 가능! 백엔드 인프라 불필요!**

---

## 🆚 Pure Irys vs 전통적 BaaS

| 항목 | 전통적 BaaS | Pure Irys BaaS |
|------|-------------|----------------|
| **백엔드** | Node.js/Python 서버 필요 | ❌ 불필요 |
| **데이터베이스** | PostgreSQL/MongoDB | ❌ 불필요 (Smart Contracts) |
| **캐싱** | Redis 서버 | ✅ IndexedDB (클라이언트) |
| **실시간** | WebSocket 서버 | ✅ Blockchain Events |
| **검색** | ElasticSearch | ✅ SearchIndex Contract |
| **권한 관리** | 백엔드 로직 | ✅ AccessControl Contract |
| **버전 관리** | Git/DB | ✅ ProvenanceChain Contract |
| **운영 비용** | 서버 + DB + 캐시 | ✅ 트랜잭션 수수료만 |
| **스케일링** | 수평 확장 복잡 | ✅ 자동 스케일링 |
| **데이터 소유권** | 플랫폼 소유 | ✅ 사용자 완전 소유 |

---

## 📖 문서

- **[PURE_IRYS_SETUP.md](PURE_IRYS_SETUP.md)** - 완전한 설정 가이드
- **[CHANGELOG.md](CHANGELOG.md)** - 버전 히스토리
- **[packages/pure-irys-client/README.md](packages/pure-irys-client/README.md)** - Client API 문서

---

## 🙏 감사의 말

- **[Irys](https://irys.xyz)** - 혁신적인 L1 DataChain 플랫폼
- **[RainbowKit](https://www.rainbowkit.com/)** - 아름다운 지갑 UI
- **[wagmi](https://wagmi.sh/)** - React Ethereum hooks
- **오픈소스 커뮤니티**

---

## 📞 지원

- **문서**: [docs/](docs/)
- **이슈**: [GitHub Issues](https://github.com/0xarkstar/irysbase/issues)
- **토론**: [GitHub Discussions](https://github.com/0xarkstar/irysbase/discussions)

---

**Made with ❤️ by DeBHuB Team**

**Status**: 🟢 Production Ready | **Version**: 3.0.0-pure | **Updated**: 2025-10-16

---

## 🆕 v3.0.0-pure 릴리스

### 핵심 변경사항

**완전한 아키텍처 전환:**
- ❌ PostgreSQL 제거
- ❌ Redis 제거
- ❌ Backend API 제거
- ❌ Arweave 의존성 제거
- ✅ **Irys L1 DataChain으로 완전 전환**

### 새로운 기능

- ✅ **PureIrysClient** - 완전한 클라이언트 라이브러리
- ✅ **6개 Smart Contracts** - 모든 백엔드 로직을 블록체인으로
- ✅ **7개 React Hooks** - 쉬운 통합
- ✅ **IndexedDB Caching** - 빠른 성능
- ✅ **Real-time Events** - WebSocket 없이 실시간 업데이트
- ✅ **Zero Infrastructure** - 인프라 운영 불필요

**세계 최초 Pure Irys L1 기반 완전 탈중앙화 BaaS!** 🎉

---

## 📚 Documentation

Complete documentation is available in the [`docs/`](./docs) directory:

- **[Architecture](./docs/architecture)** - System design and technical analysis
- **[Guides](./docs/guides)** - User guides and tutorials
- **[Testing](./docs/testing)** - Test reports and QA documentation
- **[Development](./docs/development)** - Internal development docs

**Quick Links:**
- [Getting Started](./docs/guides/USER_GUIDE_NEXT_STEPS.md)
- [Architecture Overview](./docs/architecture/IRYS_ARCHITECTURE_ANALYSIS.md)
- [IrysVM Status](./docs/architecture/IRYSVM_STATUS_REPORT.md)
- [Frontend Testing Report](./docs/testing/FRONTEND_TESTING_REPORT.md)
