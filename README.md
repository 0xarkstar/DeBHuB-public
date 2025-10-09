# IrysBase

> **Decentralized Documentation Platform with Permanent Storage**

IrysBase는 Irys DataChain을 기반으로 구축된 차세대 문서화 플랫폼입니다. 블록체인의 영구성과 프로그래머블 데이터의 유연성을 결합하여 불변적이고, 검증 가능하며, 인터랙티브한 문서를 만듭니다.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ 주요 기능

### 🔐 핵심 기능
- **영구 저장소** - Irys DataChain에 문서 영구 보관
- **지갑 인증** - MetaMask 연결, 비밀번호 불필요
- **버전 관리** - 암호화 증명이 포함된 전체 문서 히스토리
- **협업** - 댓글, 스레드, 실시간 업데이트
- **스마트 캐싱** - 즉각적인 오프라인 액세스를 위한 IndexedDB

### 🚀 고급 기능 (선택사항)
- **프로그래머블 데이터** - 규칙, 트리거, 자동화된 워크플로우
- **AI 통합** - 스마트 제안 및 시맨틱 검색
- **Edge Functions** - 엣지에서의 분산 컴퓨팅
- **벡터 검색** - AI 기반 문서 검색
- **분석 대시보드** - 사용량 메트릭 및 인사이트

---

## 🏗️ 아키텍처

IrysBase는 **이중 아키텍처**를 지원합니다:

### 옵션 1: Pure Irys (권장)
```
Frontend → Irys DataChain → IndexedDB Cache
```
- ✅ 백엔드 불필요
- ✅ 완전한 탈중앙화
- ✅ 최소 번들 크기

### 옵션 2: Full Stack
```
Frontend → GraphQL API → PostgreSQL + Irys
```
- ✅ 고급 기능 (AI, 분석)
- ✅ 실시간 구독
- ✅ 기존 데이터베이스 레이어

자세한 내용은 [아키텍처 문서](docs/ARCHITECTURE.md)를 참조하세요.

---

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18+
- pnpm 9+
- MetaMask 지갑
- (선택사항) PostgreSQL for full stack

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd irysbase

# 의존성 설치
pnpm install
```

### Pure Irys 모드 실행 (백엔드 없이)

```bash
cd apps/web-vite
cp .env.example .env
# .env에서 VITE_ENABLE_BACKEND=false 설정
pnpm dev
```

`http://localhost:5173` 방문 후 지갑 연결!

### Full Stack 모드 실행

```bash
# Terminal 1: 백엔드 시작
cd apps/api
cp .env.example .env
# 환경변수 설정
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev

# Terminal 2: 프론트엔드 시작
cd apps/web-vite
cp .env.example .env
# .env에서 VITE_ENABLE_BACKEND=true 설정
pnpm dev
```

자세한 내용은 [시작 가이드](docs/GETTING_STARTED.md)를 참조하세요.

---

## 📖 문서

### 필수 문서
- **[시작하기](docs/GETTING_STARTED.md)** - 설치 및 기본 사용법
- **[아키텍처](docs/ARCHITECTURE.md)** - 시스템 설계 및 구조
- **[API 레퍼런스](docs/API.md)** - GraphQL API 문서
- **[배포 가이드](docs/DEPLOYMENT_GUIDE.md)** - 프로덕션 배포

### 추가 문서
- **[프론트엔드 개발](docs/FRONTEND_DEVELOPMENT.md)** - UI/UX 가이드라인
- **[서비스 아키텍처](docs/SERVICES.md)** - 백엔드 서비스 설명
- **[프로그래머블 데이터](docs/PROGRAMMABLE_DATA_ARCHITECTURE.md)** - 스마트 데이터 기능

---

## 🔧 환경 설정

### 프론트엔드 (.env)

```env
# Irys 설정
VITE_IRYS_NETWORK=mainnet
VITE_IRYS_TOKEN=ethereum

# 지갑 연결
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id

# 백엔드 모드 (true/false)
VITE_ENABLE_BACKEND=false

# 백엔드 API (VITE_ENABLE_BACKEND=true일 때만)
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql
```

### 백엔드 (.env)

```env
# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/irysbase

# Irys
IRYS_NETWORK=mainnet
IRYS_WALLET_PRIVATE_KEY=your_private_key

# AI (선택사항)
OPENAI_API_KEY=your_openai_key

# Redis (선택사항)
REDIS_URL=redis://localhost:6379
```

---

## 💻 기술 스택

### 프론트엔드
- **React 18** - UI 프레임워크
- **Vite 5** - 빌드 도구
- **TypeScript** - 타입 안전성
- **TailwindCSS** - 스타일링
- **Radix UI** - 컴포넌트

### 블록체인
- **Irys SDK** - 영구 저장소
- **@irys/query** - 데이터 쿼리
- **@irys/upload** - 파일 업로드
- **ethers.js** - 지갑 상호작용

### 백엔드 (선택사항)
- **Apollo Server** - GraphQL
- **Prisma** - ORM
- **PostgreSQL** - 데이터베이스
- **OpenAI** - AI 기능

---

## 📦 프로젝트 구조

```
irysbase/
├── apps/
│   ├── api/                    # GraphQL API (선택사항)
│   │   ├── src/
│   │   │   ├── resolvers/     # GraphQL resolvers
│   │   │   ├── services/      # 비즈니스 로직
│   │   │   └── schema.graphql
│   │   └── prisma/
│   │
│   ├── web-vite/              # React + Vite (현재)
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── irys-database.ts      # Pure Irys DB
│   │   │   │   ├── irys-hooks.ts         # React hooks
│   │   │   │   └── apollo.ts             # GraphQL client
│   │   │   ├── pages/
│   │   │   └── components/
│   │   └── package.json
│   │
│   └── web/                   # Next.js (더 이상 사용 안 함)
│
├── packages/
│   ├── shared/                # 공유 타입
│   ├── core/                  # 핵심 유틸리티
│   └── irys-integration/      # Irys SDK 래퍼
│
├── docs/                      # 문서
│   ├── GETTING_STARTED.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEPLOYMENT_GUIDE.md
│
└── README.md                  # 이 파일
```

---

## 🎯 사용 사례

1. **기술 문서** - API 문서, 개발자 가이드, 아키텍처 스펙
2. **법률 문서** - 계약서, 이용약관, 타임스탬프 증명
3. **연구 논문** - 학술 출판물, 버전 관리 연구, 불변 인용
4. **지식 베이스** - 회사 위키, 제품 문서, 교육 자료

---

## 🧪 개발

### 테스트 실행

```bash
# 타입 검사
pnpm typecheck

# 린팅
pnpm lint

# 빌드
pnpm build
```

### 빌드

```bash
# 프론트엔드 빌드
cd apps/web-vite
pnpm build

# API 빌드
cd apps/api
pnpm build
```

---

## 🤝 기여

기여를 환영합니다! [CONTRIBUTING.md](CONTRIBUTING.md)를 참조하세요.

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE)를 참조하세요.

---

## 🙏 감사의 말

- [Irys](https://irys.xyz) - 영구 데이터 저장소
- [Arweave](https://arweave.org) - 탈중앙화 스토리지 네트워크
- 오픈소스 커뮤니티

---

## 📞 지원

- **문서**: [docs/](docs/)
- **이슈**: [GitHub Issues](https://github.com/your-org/irysbase/issues)
- **이메일**: support@irysbase.com

---

**IrysBase 팀이 ❤️로 만들었습니다**

**상태**: 🟢 베타 | **버전**: 1.0.0-beta | **업데이트**: 2025-10-09
