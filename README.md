# DeBHuB

> **Web3 Backend-as-a-Service Platform with Blockchain Storage**

DeBHuB (Decentralized Backend Hub)는 **Supabase와 유사한 BaaS 플랫폼**으로, Irys DataChain을 활용한 영구 블록체인 스토리지와 PostgreSQL을 결합한 하이브리드 아키텍처를 제공합니다.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ 핵심 특징

### 🚀 Complete BaaS Platform
- **GraphQL API** - Apollo Server 4 기반 강력한 API 레이어
- **PostgreSQL Database** - Prisma ORM으로 완벽한 데이터 관리
- **Redis Caching** - 빠른 응답을 위한 캐싱 레이어
- **Real-time Subscriptions** - WebSocket 기반 실시간 데이터 동기화
- **Authentication** - Wallet-based auth (MetaMask, WalletConnect)

### 🔗 Blockchain Integration
- **Irys DataChain** - 영구 블록체인 스토리지 (Arweave 기반)
- **Permanent Storage** - 데이터 불변성 및 영구 보관
- **Version Control** - 블록체인 기반 버전 관리
- **Smart Contracts** - Solidity 계약으로 권한 관리

### 💡 Advanced Features
- **AI Integration** - OpenAI API 연동 (문서 분석, 임베딩)
- **Vector Search** - 의미론적 검색 (Semantic Search)
- **Analytics** - 실시간 분석 대시보드
- **Programmable Data** - 데이터 트리거 및 워크플로우
- **Edge Functions** - 서버리스 함수 실행

### 🏗️ Dual Architecture
DeBHuB는 **2가지 동작 모드**를 지원합니다:

1. **Full Stack Mode** (기본)
   - Backend API + Frontend + Database + Blockchain
   - 완전한 BaaS 기능 활용

2. **Serverless Mode** (선택)
   - Frontend만으로 Irys 직접 연결
   - 백엔드 없이 탈중앙화 동작

---

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite 5)                  │
│  - Dashboard, Projects, Documents                           │
│  - Apollo Client (GraphQL)                                  │
│  - Wallet Integration (RainbowKit, wagmi)                   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WebSocket
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Fastify Backend (GraphQL API)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          DeBHuB Core Orchestrator                   │   │
│  │  - Database Service (Prisma)                        │   │
│  │  - Storage Service (Irys)                           │   │
│  │  - Realtime Service (WebSocket)                     │   │
│  │  - Vector DB Service (AI Search)                    │   │
│  │  - Analytics Service                                │   │
│  │  - Programmable Data Service                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
┌──────────────────┐    ┌──────────────────┐
│   PostgreSQL     │    │  Irys DataChain  │
│   (Prisma ORM)   │    │  (Blockchain)    │
│                  │    │                  │
│  - Users         │    │  - Permanent     │
│  - Projects      │    │    Storage       │
│  - Documents     │    │  - Version       │
│  - Analytics     │    │    History       │
└──────────────────┘    └──────────────────┘
```

### 데이터 흐름

#### 1. Document Creation (문서 생성)
```
User (Frontend)
  ↓ GraphQL Mutation: createDocument
Backend API
  ↓ 1. Validate & Save to PostgreSQL
  ↓ 2. Upload to Irys (background)
  ↓ 3. Broadcast via WebSocket
  ↓ 4. Return result
Frontend (Real-time update)
```

#### 2. Document Query (문서 조회)
```
User (Frontend)
  ↓ GraphQL Query: getDocument
Backend API
  ↓ Check Redis Cache
  ├─ Cache HIT → Return immediately
  └─ Cache MISS:
       ↓ Query PostgreSQL
       ↓ Cache result in Redis
       ↓ Return to Frontend
```

#### 3. AI-Powered Search (AI 검색)
```
User Search Query
  ↓ GraphQL Query: searchDocuments
Backend API
  ↓ Generate embedding (OpenAI)
  ↓ Vector similarity search
  ↓ Full-text search (PostgreSQL)
  ↓ Merge & rank results
  ↓ Return to Frontend
```

---

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18+
- pnpm 9+
- PostgreSQL 14+
- Redis (선택사항, 캐싱용)
- MetaMask 지갑

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/0xarkstar/DeBHuB.git
cd DeBHuB

# 2. 의존성 설치
pnpm install

# 3. PostgreSQL 데이터베이스 생성
createdb debhub

# 4. 환경 변수 설정
cp apps/api/.env.example apps/api/.env
cp apps/web-vite/.env.example apps/web-vite/.env
# .env 파일들을 열어서 필수 값 입력 (아래 참조)

# 5. 데이터베이스 마이그레이션
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate

# 6. 백엔드 + 프론트엔드 동시 실행
cd ../..
pnpm run platform:dev
```

### 접속 주소
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000/graphql
- **Health Check**: http://localhost:4000/health

---

## ⚙️ 환경 변수 설정

### Backend (apps/api/.env)

```env
# ============================================
# DeBHuB Backend API - Environment Variables
# ============================================

# -------------------- Database --------------------
DATABASE_URL=postgresql://username:password@localhost:5432/debhub

# -------------------- Redis (Optional) --------------------
REDIS_URL=redis://localhost:6379

# -------------------- Private Keys (⚠️ NEVER COMMIT) --------------------
# Blockchain transaction signing
SIGNER_PRIVATE_KEY=0x...

# Irys data uploads
IRYS_PRIVATE_KEY=0x...

# -------------------- Blockchain --------------------
CHAIN_ID=1270
RPC_URL=https://rpc.irys.computer

# -------------------- Irys Configuration --------------------
IRYS_NETWORK=mainnet
IRYS_TOKEN=ethereum

# -------------------- Smart Contracts --------------------
AUTH_ROLES_CONTRACT_ADDRESS=
POSTS_CONTRACT_ADDRESS=

# -------------------- AI Services (Optional) --------------------
OPENAI_API_KEY=

# -------------------- Server --------------------
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (apps/web-vite/.env)

```env
# ============================================
# DeBHuB Frontend - Environment Variables
# ============================================

# -------------------- Backend API --------------------
VITE_API_URL=http://localhost:4000
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_WS_URL=ws://localhost:4000/graphql

# -------------------- Wallet Connect --------------------
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# -------------------- Blockchain --------------------
VITE_CHAIN_ID=1270
VITE_RPC_URL=https://rpc.irys.computer

# -------------------- Backend Mode (Optional) --------------------
# true = Use Backend API (Full Stack Mode)
# false = Direct Irys connection (Serverless Mode)
VITE_ENABLE_BACKEND=true

# -------------------- Irys Configuration --------------------
VITE_IRYS_NETWORK=mainnet
VITE_IRYS_TOKEN=ethereum
```

**⚠️ 보안 주의사항:**
- `.env` 파일은 **절대 Git에 커밋하지 마세요**
- Private Key는 **테스트용 지갑만 사용**하세요
- 프로덕션에서는 **환경 변수 또는 Secret Manager** 사용

---

## 💻 기술 스택

### Backend
- **Fastify** - 고성능 웹 프레임워크 (Express 대비 3배 빠름)
- **Apollo Server 4** - GraphQL 서버
- **Prisma** - 타입 안전 ORM
- **PostgreSQL** - 메인 데이터베이스
- **Redis** - 캐싱 레이어
- **Bull** - 백그라운드 작업 큐

### Frontend
- **React 18** - UI 라이브러리
- **Vite 5** - 빌드 도구
- **TypeScript 5** - 타입 안전성
- **TailwindCSS** - 유틸리티 CSS
- **Radix UI** - 접근성 컴포넌트
- **Apollo Client** - GraphQL 클라이언트

### Blockchain & Storage
- **Irys DataChain** - 영구 블록체인 스토리지
- **@irys/upload** - 데이터 업로드 SDK
- **@irys/query** - GraphQL-like 쿼리 SDK
- **ethers.js** - Ethereum 라이브러리
- **wagmi** - React Ethereum hooks
- **RainbowKit** - 지갑 UI

### AI & Analytics
- **OpenAI API** - 텍스트 분석 및 임베딩
- **Vector Search** - 의미론적 검색
- **Analytics Service** - 사용자 분석

---

## 📦 프로젝트 구조

```
debhub/
├── apps/
│   ├── api/                          # 🔥 Backend API (Fastify + GraphQL)
│   │   ├── src/
│   │   │   ├── index-enhanced.ts      # Enhanced 서버 엔트리포인트
│   │   │   ├── resolvers/             # GraphQL Resolvers
│   │   │   │   ├── enhanced-resolvers.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/              # Core Services
│   │   │   │   ├── database.ts        # Prisma 연결
│   │   │   │   ├── irys.ts            # Irys 통합
│   │   │   │   ├── blockchain.ts      # 블록체인 연결
│   │   │   │   ├── auth.ts            # 인증
│   │   │   │   └── irysbase-platform.ts  # 플랫폼 Orchestrator
│   │   │   ├── workers/               # 백그라운드 Workers
│   │   │   │   ├── sync-worker.ts     # Irys 동기화
│   │   │   │   └── event-listener.ts  # 이벤트 처리
│   │   │   ├── schema-enhanced.graphql  # GraphQL 스키마
│   │   │   └── utils/
│   │   ├── prisma/
│   │   │   └── schema.prisma          # 데이터베이스 스키마
│   │   └── package.json
│   │
│   └── web-vite/                     # 🎨 Frontend (React + Vite)
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx      # 프로젝트 대시보드
│       │   │   ├── ProjectPage.tsx    # 프로젝트 상세
│       │   │   └── DocumentPage.tsx   # 문서 편집기
│       │   ├── components/
│       │   ├── lib/
│       │   │   ├── apollo-client.ts   # GraphQL 클라이언트
│       │   │   ├── irys-database.ts   # Serverless 모드용
│       │   │   └── wagmi.ts           # 지갑 설정
│       │   └── App.tsx
│       └── package.json
│
├── packages/
│   ├── core/                         # 🧠 Core Orchestrator
│   │   ├── src/
│   │   │   ├── orchestrator.ts        # 중앙 조정 시스템
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── shared/                       # 📦 Shared Types
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   └── constants.ts
│   │   └── package.json
│   │
│   ├── contracts/                    # ⚡ Smart Contracts
│   │   ├── contracts/
│   │   │   ├── AuthRoles.sol
│   │   │   └── Posts.sol
│   │   └── hardhat.config.ts
│   │
│   ├── irys-integration/             # 🌐 Irys SDK Wrapper
│   │   └── src/
│   │
│   ├── ai-integration/               # 🤖 AI Services
│   │   └── src/
│   │
│   └── testing/                      # 🧪 Testing Suite
│       └── src/
│
├── docs/                            # 📚 Documentation
│   ├── ARCHITECTURE.md
│   ├── GETTING_STARTED.md
│   └── API.md
│
├── scripts/                         # 🛠️ Utility Scripts
│   ├── setup-environment.sh
│   └── deploy-contracts.ts
│
├── docker-compose.yml               # 🐳 Docker Setup
├── turbo.json                       # Turborepo 설정
├── pnpm-workspace.yaml              # pnpm 워크스페이스
└── package.json
```

---

## 🎯 주요 기능

### 1. Document Management (문서 관리)
- CRUD 작업 (생성, 읽기, 수정, 삭제)
- 버전 관리 (블록체인 기반)
- 실시간 협업 (WebSocket)
- 파일 첨부

### 2. Project Management (프로젝트 관리)
- 프로젝트 생성 및 관리
- 팀 멤버 초대
- 역할 기반 권한 (RBAC)
- 프로젝트 대시보드

### 3. Authentication (인증)
- MetaMask 지갑 연결
- WalletConnect 지원
- 서명 기반 인증
- JWT 세션 관리

### 4. Real-time Collaboration (실시간 협업)
- WebSocket 기반 실시간 동기화
- 사용자 온라인 상태
- 실시간 커서 공유
- 변경사항 브로드캐스트

### 5. AI-Powered Features (AI 기능)
- 문서 자동 요약
- 키워드 추출
- 의미론적 검색 (Vector Search)
- AI 작성 도우미

### 6. Analytics (분석)
- 사용자 활동 추적
- 문서 조회수
- 프로젝트 통계
- 실시간 대시보드

---

## 🔧 개발

### 로컬 개발

```bash
# Backend만 실행
pnpm run dev:api

# Frontend만 실행
pnpm run dev:web

# Backend + Frontend 동시 실행 (권장)
pnpm run platform:dev

# 타입 체크
pnpm typecheck

# 린팅
pnpm lint

# 테스트
pnpm test

# 빌드
pnpm build
```

### 데이터베이스 관리

```bash
# Prisma Studio (GUI 도구)
cd apps/api
pnpm prisma studio

# 마이그레이션 생성
pnpm prisma migrate dev --name your_migration_name

# 마이그레이션 적용
pnpm prisma migrate deploy

# 데이터베이스 리셋
pnpm prisma migrate reset
```

### 스마트 컨트랙트

```bash
# 컨트랙트 컴파일
cd packages/contracts
pnpm build

# 로컬 네트워크에 배포
pnpm run deploy:local

# Irys 네트워크에 배포
pnpm run deploy
```

---

## 🌐 배포

### Backend 배포 (Railway / Render / DigitalOcean)

```bash
# 1. PostgreSQL 데이터베이스 생성

# 2. 환경 변수 설정 (DATABASE_URL, PRIVATE_KEY 등)

# 3. 마이그레이션 실행
pnpm prisma migrate deploy

# 4. 빌드 및 실행
pnpm build
pnpm start
```

### Frontend 배포 (Vercel / Netlify)

```bash
# 1. 빌드
cd apps/web-vite
pnpm build

# 2. Vercel 배포
vercel --prod

# 환경 변수 설정:
# VITE_API_URL=https://your-api.com
# VITE_GRAPHQL_URL=https://your-api.com/graphql
# VITE_WALLETCONNECT_PROJECT_ID=xxx
```

### Docker 배포

```bash
# 전체 스택 실행 (PostgreSQL + Redis + Backend + Frontend)
docker-compose up -d

# 프로덕션 빌드
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📚 API 문서

### GraphQL Endpoint
- **URL**: `http://localhost:4000/graphql`
- **Playground**: 개발 모드에서 자동 활성화
- **WebSocket**: `ws://localhost:4000/graphql`

### 주요 쿼리 예시

#### 프로젝트 조회
```graphql
query GetProjects {
  projects {
    id
    name
    description
    createdAt
    documents {
      id
      title
    }
  }
}
```

#### 문서 생성
```graphql
mutation CreateDocument($input: CreateDocumentInput!) {
  createDocument(input: $input) {
    id
    title
    content
    irysTransactionId
    permanentUrl
  }
}
```

#### 실시간 문서 업데이트 구독
```graphql
subscription OnDocumentUpdated($documentId: ID!) {
  documentUpdated(documentId: $documentId) {
    id
    title
    content
    updatedAt
  }
}
```

자세한 API 문서는 [docs/API.md](docs/API.md)를 참조하세요.

---

## 🤝 기여

기여를 환영합니다! [CONTRIBUTING.md](CONTRIBUTING.md)를 참조하세요.

---

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 참조

---

## 🙏 감사의 말

- [Irys](https://irys.xyz) - 영구 데이터 저장 솔루션
- [Arweave](https://arweave.org) - 탈중앙화 스토리지 네트워크
- [Fastify](https://www.fastify.io/) - 고성능 웹 프레임워크
- [Prisma](https://www.prisma.io/) - 차세대 ORM
- [Apollo GraphQL](https://www.apollographql.com/) - GraphQL 플랫폼
- [RainbowKit](https://www.rainbowkit.com/) - 지갑 UI
- 오픈소스 커뮤니티

---

## 📞 지원

- **문서**: [docs/](docs/)
- **이슈**: [GitHub Issues](https://github.com/0xarkstar/DeBHuB/issues)
- **토론**: [GitHub Discussions](https://github.com/0xarkstar/DeBHuB/discussions)

---

**Made with ❤️ by DeBHuB Team**

**Status**: 🟢 Beta | **Version**: 2.0.0 | **Updated**: 2025-01-10
