# DeBHuB

> **Serverless Documentation Platform with Permanent Blockchain Storage**

DeBHuB는 Irys DataChain을 사용한 **완전히 탈중앙화된 문서 플랫폼**입니다. 백엔드 서버 없이 브라우저에서 직접 블록체인에 연결하여 영구적이고 검증 가능한 문서를 생성합니다.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ 핵심 특징

### 🚀 완전한 탈중앙화
- **No Backend** - 서버 없이 프론트엔드만으로 작동
- **No Database** - PostgreSQL 불필요, Irys가 유일한 저장소
- **No API Server** - 브라우저에서 직접 Irys 연결
- **No Sign-up** - MetaMask 지갑만으로 인증

### 🔐 핵심 기능
- **영구 저장소** - Irys DataChain에 문서 영구 보관 (삭제 불가능)
- **지갑 인증** - MetaMask 연결, 비밀번호 불필요
- **버전 관리** - 모든 수정 이력이 블록체인에 기록
- **실시간 검색** - Irys Query SDK로 빠른 태그 기반 검색
- **스마트 캐싱** - IndexedDB로 5분간 로컬 캐시 (오프라인 지원)
- **협업** - 댓글, 스레드, 프로젝트 공유

### 💰 저렴한 운영 비용
- **One-time Payment** - 데이터 업로드 시 한 번만 지불
- **월 구독료 없음** - 서버 운영 비용 없음
- **영구 보관** - 추가 비용 없이 영원히 저장

---

## 🏗️ 아키텍처

DeBHuB는 **Pure Irys 아키텍처**를 사용합니다:

```
┌─────────────────────────────────────┐
│   React Frontend (Vite 5)           │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  irys-hooks.ts               │  │
│  │  - useProjects()             │  │
│  │  - useDocuments()            │  │
│  │  - useWallet()               │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  irys-database.ts            │  │
│  │  - Create/Read/Update        │  │
│  │  - Version Management        │  │
│  │  - Tag-based Search          │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
              ↓
   ┌──────────────────────┐
   │  IndexedDB (Cache)   │  ← 5분 TTL 로컬 캐시
   └──────────────────────┘
              ↓
   ┌──────────────────────┐
   │  @irys/upload SDK    │  ← 데이터 업로드
   │  @irys/query SDK     │  ← GraphQL-like 쿼리
   └──────────────────────┘
              ↓
   ┌──────────────────────┐
   │  Irys DataChain      │  ← 영구 저장소 (단일 진실의 원천)
   └──────────────────────┘
```

### 데이터 흐름

#### 1. **프로젝트 생성**
```
User Input
  ↓
IrysDatabase.createProject()
  ↓ 1. Generate UUID
  ↓ 2. Create Tags (App-Name, Entity-Type, Owner, etc.)
  ↓ 3. Upload to Irys
  ↓
Irys Receipt (irysId, permanentUrl)
  ↓
Save to IndexedDB Cache
  ↓
Return to UI
```

#### 2. **문서 조회**
```
User Request
  ↓
Check IndexedDB Cache
  ├─ Cache HIT (< 5min) → Return Immediately
  └─ Cache MISS:
       ↓
       Query Irys with Tags
       ↓
       Fetch from Irys Gateway
       ↓
       Cache in IndexedDB
       ↓
       Return to UI
```

#### 3. **버전 관리**
```
Document Update
  ↓
Create New Version (v2)
  ↓
Add Tag: Previous-Version = v1-irys-id
  ↓
Upload to Irys (New Transaction)
  ↓
Both versions permanently stored ✅
```

---

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18+
- pnpm 9+
- MetaMask 지갑 (브라우저 확장)

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/0xarkstar/DeBHuB.git
cd debhub

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
cd apps/web-vite
cp .env.example .env
# .env 파일을 열어서 필수 값 입력 (아래 참조)

# 4. 프론트엔드 실행
pnpm dev
```

`http://localhost:3000` 방문 후 MetaMask 연결!

### 환경 변수 설정

#### Frontend (apps/web-vite/.env)

```env
# -------------------- Backend Mode (Optional) --------------------
# 백엔드 없이 사용하려면 false로 설정
VITE_ENABLE_BACKEND=false

# -------------------- Wallet Connect Configuration --------------------
# WalletConnect Project ID (필수)
# 가입: https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# -------------------- Blockchain Configuration --------------------
VITE_CHAIN_ID=1270
VITE_RPC_URL=https://rpc.irys.computer

# -------------------- Irys Configuration --------------------
VITE_IRYS_NETWORK=mainnet              # mainnet or testnet
VITE_IRYS_TOKEN=ethereum               # ethereum, matic, bnb, etc.
```

#### Backend (apps/api/.env) - 선택사항

백엔드 기능을 사용하려면 설정:

```env
# ⚠️ IMPORTANT: NEVER commit real private keys!
# Use separate wallets for development and production

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/debhub

# Redis (Caching)
REDIS_URL=redis://localhost:6379

# Blockchain Private Keys (⚠️ KEEP SECRET!)
SIGNER_PRIVATE_KEY=0x...  # For blockchain transactions
IRYS_PRIVATE_KEY=0x...    # For Irys uploads

# Contract Addresses
AUTH_ROLES_CONTRACT_ADDRESS=
POSTS_CONTRACT_ADDRESS=
```

**⚠️ 보안 주의사항:**
- `.env` 파일은 절대 Git에 커밋하지 마세요
- Private Key는 테스트용 지갑만 사용하세요
- 프로덕션에서는 별도의 안전한 Key Management 사용 권장

### 첫 프로젝트 생성

1. MetaMask 연결
2. "New Project" 클릭
3. 프로젝트 정보 입력
4. "Create" → Irys에 영구 저장 ✅
5. 생성된 프로젝트에서 문서 작성 시작!

---

## 💻 기술 스택

### 프론트엔드
- **React 18** - UI 프레임워크
- **Vite 5** - 초고속 빌드 도구
- **TypeScript 5** - 타입 안전성
- **TailwindCSS** - 유틸리티 CSS
- **Radix UI** - 접근성 컴포넌트

### 블록체인 & 저장소
- **Irys DataChain** - 영구 데이터 레이어 (Arweave 기반)
- **@irys/upload** - 데이터 업로드 SDK
- **@irys/query** - GraphQL-like 쿼리 SDK
- **ethers.js** - 지갑 연결
- **wagmi** - React Ethereum hooks
- **RainbowKit** - 지갑 UI

### 로컬 저장소
- **IndexedDB** - 브라우저 내 구조화된 데이터베이스
- **idb** - Promise 기반 IndexedDB 래퍼

---

## 📦 프로젝트 구조

```
debhub/
├── apps/
│   ├── web-vite/              # Frontend (유일한 사용자 인터페이스)
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── irys-database.ts    # 핵심 DB 로직
│   │   │   │   ├── irys-hooks.ts       # React hooks
│   │   │   │   ├── irys-types.ts       # TypeScript 타입
│   │   │   │   └── wagmi.ts            # 지갑 설정
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx       # 프로젝트 목록
│   │   │   │   ├── ProjectPage.tsx     # 프로젝트 상세
│   │   │   │   └── DocumentPage.tsx    # 문서 편집기
│   │   │   └── components/
│   │   └── package.json
│   │
│   └── api/                   # Backend (선택사항, 현재 미연결)
│       ├── src/
│       └── prisma/
│
├── packages/
│   ├── shared/                # 공유 타입
│   ├── core/                  # 핵심 유틸리티
│   └── irys-integration/      # Irys SDK 래퍼
│
└── docs/                      # 문서
    ├── ARCHITECTURE.md
    ├── GETTING_STARTED.md
    └── API.md
```

---

## 🎯 사용 사례

1. **개인 블로그** - 검열 불가능한 영구 블로그
2. **기술 문서** - API 문서, 개발자 가이드
3. **법률 문서** - 계약서, 타임스탬프 증명
4. **연구 논문** - 학술 출판, 불변 인용
5. **오픈소스 문서** - 프로젝트 위키, README

---

## 🔑 핵심 개념

### Entity 기반 데이터 모델

모든 데이터는 **Entity**로 저장됩니다:

```typescript
interface Entity {
  entityType: 'project' | 'document' | 'user' | 'comment';
  entityId: string;          // UUID
  schemaVersion: string;     // 버전 관리
  createdAt: string;
  updatedAt: string;

  // 추가 필드 (Entity 타입별로 다름)
  ...
}
```

### Tag 기반 검색

Irys는 **태그**로 데이터를 검색합니다:

```typescript
const projects = await irysDb.query
  .search('irys:transactions')
  .tags([
    { name: 'App-Name', values: ['DeBHuB'] },
    { name: 'Entity-Type', values: ['project'] },
    { name: 'Owner', values: [userAddress] }
  ])
  .sort('DESC')
  .limit(50);
```

### Immutable Updates

업데이트는 **새로운 버전 생성**으로 처리됩니다:

```typescript
// v1 업로드
const v1 = await irysDb.createDocument({...});
// irysId: "abc123"

// v2 업데이트 (v1은 그대로 유지)
const v2 = await irysDb.updateDocument("doc-id", {...});
// irysId: "xyz789"
// tags: { Previous-Version: "abc123" }

// 버전 히스토리 조회 가능 ✅
```

---

## 🧪 개발

### 로컬 개발

```bash
# 프론트엔드 dev 서버
cd apps/web-vite
pnpm dev

# 타입 체크
pnpm typecheck

# 린팅
pnpm lint

# 빌드
pnpm build
```

### 프로덕션 빌드

```bash
cd apps/web-vite
pnpm build

# dist/ 폴더가 생성됨
# Vercel, Netlify 등에 배포 가능
```

---

## 🌐 배포

### Vercel / Netlify (권장)

```bash
# 1. 빌드
cd apps/web-vite
pnpm build

# 2. Vercel 배포
vercel --prod

# 환경 변수 설정:
# VITE_IRYS_NETWORK=mainnet
# VITE_WALLET_CONNECT_PROJECT_ID=xxx
```

**배포 완료!** - 서버 불필요, 정적 사이트만으로 작동 ✅

---

## ❓ FAQ

### Q: 백엔드가 정말 없나요?
**A:** 네! 프론트엔드가 브라우저에서 직접 Irys에 연결합니다. `apps/api`는 별도 프로젝트용으로 현재 미연결 상태입니다.

### Q: PostgreSQL은 왜 있나요?
**A:** `apps/api`의 백엔드용입니다. 현재 프론트엔드는 사용하지 않습니다.

### Q: 데이터 삭제가 가능한가요?
**A:** 불가능합니다. Irys는 영구 저장소입니다. 삭제 마커(deleted: true)만 추가할 수 있습니다.

### Q: 비용은 얼마나 드나요?
**A:** Irys는 데이터 크기에 비례한 일회성 비용입니다:
- 1MB ≈ $0.001
- 1GB ≈ $1.00
- 월 구독료 없음

### Q: 오프라인에서 작동하나요?
**A:** 부분적으로 가능합니다. IndexedDB 캐시에 있는 데이터는 오프라인에서 조회 가능하지만, 업로드는 인터넷 연결 필요합니다.

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
- [RainbowKit](https://www.rainbowkit.com/) - 아름다운 지갑 UI
- 오픈소스 커뮤니티

---

## 📞 지원

- **문서**: [docs/](docs/)
- **이슈**: [GitHub Issues](https://github.com/0xarkstar/DeBHuB/issues)

---

**Made with ❤️ by DeBHuB Team**

**Status**: 🟢 Beta | **Version**: 1.0.0-beta | **Updated**: 2025-01-10
