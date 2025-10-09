# 시작하기 (Getting Started)

IrysBase를 시작하는 방법을 안내합니다. 이 가이드는 두 가지 모드(Pure Irys와 Full Stack)를 모두 다룹니다.

## 목차

- [사전 요구사항](#사전-요구사항)
- [설치](#설치)
- [환경 설정](#환경-설정)
- [실행](#실행)
- [첫 사용](#첫-사용)
- [개발 워크플로우](#개발-워크플로우)
- [문제 해결](#문제-해결)

---

## 📋 사전 요구사항

### 필수 요구사항

- **Node.js** 18 이상
- **pnpm** 9 이상
- **MetaMask** 브라우저 확장 프로그램
- **Git**

### 선택적 요구사항 (Full Stack 모드만)

- **PostgreSQL** 14 이상
- **Redis** (캐싱용, 선택사항)

---

## 🚀 설치

### 1. 저장소 클론

```bash
git clone <repository-url>
cd irysbase
```

### 2. 의존성 설치

```bash
pnpm install
```

이 명령어는 모노레포의 모든 패키지와 앱의 의존성을 설치합니다.

---

## 🔧 환경 설정

프로젝트는 두 가지 모드를 지원합니다:

### 옵션 A: Pure Irys 모드 (권장 - 백엔드 불필요)

```bash
cd apps/web-vite
cp .env.example .env
```

`.env` 파일을 열고 다음과 같이 설정:

```env
# Irys 설정
VITE_IRYS_NETWORK=mainnet
VITE_IRYS_TOKEN=ethereum

# Wallet Connect
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# 백엔드 비활성화
VITE_ENABLE_BACKEND=false

# Chain Configuration
VITE_CHAIN_ID=1270
VITE_RPC_URL=https://rpc.irys.computer
```

### 옵션 B: Full Stack 모드

#### 프론트엔드 설정:

```bash
cd apps/web-vite
cp .env.example .env
```

`.env` 파일 설정:

```env
# Irys 설정
VITE_IRYS_NETWORK=mainnet
VITE_IRYS_TOKEN=ethereum

# Wallet Connect
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# 백엔드 활성화
VITE_ENABLE_BACKEND=true
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql

# Chain Configuration
VITE_CHAIN_ID=1270
VITE_RPC_URL=https://rpc.irys.computer
```

#### 백엔드 설정:

```bash
cd apps/api
cp .env.example .env
```

`.env` 파일 설정:

```env
# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/irysbase

# Irys
IRYS_NETWORK=mainnet
IRYS_WALLET_PRIVATE_KEY=your_private_key_here

# AI 기능 (선택사항)
OPENAI_API_KEY=your_openai_key_here

# Redis (선택사항)
REDIS_URL=redis://localhost:6379
```

#### 데이터베이스 초기화:

```bash
cd apps/api

# Prisma 클라이언트 생성
pnpm prisma generate

# 마이그레이션 실행
pnpm prisma migrate dev
```

---

## 🏃 실행

### Pure Irys 모드 실행

```bash
cd apps/web-vite
pnpm dev
```

브라우저에서 `http://localhost:5173`을 열고 MetaMask 지갑을 연결하세요!

### Full Stack 모드 실행

**Terminal 1 - 백엔드 시작:**

```bash
cd apps/api

# Prisma 스키마 생성
pnpm prisma generate

# 데이터베이스 마이그레이션
pnpm prisma migrate dev

# 개발 서버 시작
pnpm dev
```

백엔드가 `http://localhost:4000`에서 실행됩니다.

**Terminal 2 - 프론트엔드 시작:**

```bash
cd apps/web-vite
pnpm dev
```

프론트엔드가 `http://localhost:5173`에서 실행됩니다.

### 설치 확인

1. **GraphQL Playground (Full Stack 모드만):**
   `http://localhost:4000/graphql` 접속

2. **프론트엔드 테스트:**
   `http://localhost:5173` 접속

---

## 🎯 첫 사용

### 1. 지갑 연결

1. MetaMask가 설치되어 있는지 확인
2. 앱 우측 상단의 "Connect Wallet" 버튼 클릭
3. MetaMask 팝업에서 연결 승인
4. 지갑 주소가 표시되면 연결 완료

### 2. 프로젝트 생성

1. 대시보드에서 "New Project" 버튼 클릭
2. 프로젝트 이름과 설명 입력
3. "Create" 클릭
4. 프로젝트가 생성되면 대시보드에 표시됨

### 3. 문서 작성

1. 프로젝트 카드 클릭하여 프로젝트 페이지 열기
2. "New Document" 버튼 클릭
3. 문서 제목과 내용 작성
4. "Save" 클릭하여 IndexedDB에 로컬 저장
5. "Publish" 클릭하여 Irys에 영구 저장

### 4. 문서 검색 및 조회

1. 상단 검색바에 키워드 입력
2. 검색 결과에서 문서 선택
3. 문서 내용 확인 및 버전 히스토리 조회
4. 댓글 작성 및 협업

### 5. GraphQL API 사용 (Full Stack 모드만)

GraphQL Playground에서 다음 쿼리 실행:

```graphql
# 프로젝트 목록 조회
query {
  projects {
    id
    name
    description
    createdAt
  }
}

# 문서 생성
mutation {
  createDocument(input: {
    projectId: "YOUR_PROJECT_ID"
    title: "Hello World"
    content: "# Hello World\n\nThis is my first document!"
  }) {
    id
    title
    irysId
  }
}
```

---

## 🔧 개발 워크플로우

### 프로젝트 구조

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
└── docs/                      # 문서
```

### 주요 명령어

```bash
# 타입 검사
pnpm typecheck

# 린팅
pnpm lint

# 빌드
pnpm build

# 프론트엔드 빌드
cd apps/web-vite
pnpm build

# API 빌드
cd apps/api
pnpm build

# 데이터베이스 (Full Stack만)
cd apps/api
pnpm prisma studio          # Prisma Studio GUI
pnpm prisma migrate dev     # 마이그레이션 생성
pnpm prisma generate        # 클라이언트 생성
```

---

## 🐛 문제 해결

### 일반적인 문제

#### 1. MetaMask 연결 실패

**문제:** "Failed to connect wallet" 오류

**해결방법:**
1. MetaMask가 최신 버전인지 확인
2. 브라우저 캐시 및 쿠키 삭제
3. MetaMask 잠금 해제 확인
4. 올바른 네트워크(Ethereum Mainnet)에 연결되어 있는지 확인

#### 2. Irys 업로드 실패

**문제:** "Upload failed" 오류

**해결방법:**
1. 지갑에 충분한 ETH가 있는지 확인 (가스비 필요)
2. Irys 네트워크 상태 확인: https://status.irys.xyz
3. 브라우저 콘솔에서 상세 오류 메시지 확인
4. `VITE_IRYS_NETWORK` 환경 변수가 올바른지 확인

#### 3. GraphQL 연결 실패 (Full Stack)

**문제:** "Failed to fetch" 또는 "Network error"

**해결방법:**
1. 백엔드 서버가 실행 중인지 확인 (`http://localhost:4000`)
2. `.env`의 `VITE_GRAPHQL_URL`이 올바른지 확인
3. CORS 설정 확인 (백엔드 `index.ts`)
4. 백엔드 로그에서 오류 확인

#### 4. PostgreSQL 연결 실패 (Full Stack)

**문제:** "Can't reach database server"

**해결방법:**
1. PostgreSQL이 실행 중인지 확인
2. `DATABASE_URL`이 올바른지 확인
3. 데이터베이스가 존재하는지 확인:
   ```bash
   psql -U postgres -c "CREATE DATABASE irysbase;"
   ```
4. 연결 권한 확인

#### 5. 타입 에러

**문제:** TypeScript 컴파일 에러

**해결방법:**
1. 의존성 재설치:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```
2. Prisma 클라이언트 재생성:
   ```bash
   cd apps/api
   pnpm prisma generate
   ```
3. 타입 캐시 삭제:
   ```bash
   find . -name "tsconfig.tsbuildinfo" -delete
   ```

#### 6. 포트 충돌

**문제:** "Port already in use"

**해결방법:**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9
```

### 디버그 모드

상세 로깅 활성화:

```env
# apps/api/.env
NODE_ENV=development
LOG_LEVEL=debug
```

### 도움 받기

1. **로그 확인:**
   - API: 콘솔 출력
   - 프론트엔드: 브라우저 콘솔
   - 데이터베이스: PostgreSQL 로그

2. **Prisma Studio (Full Stack만):**
   ```bash
   pnpm run db:studio
   ```
   `http://localhost:5555` 접속

3. **GraphQL Playground (Full Stack만):**
   - 쿼리 인터랙티브 테스트
   - 스키마 문서 확인
   - 오류 검사

---

## 📚 다음 단계

설치와 실행이 완료되었다면:

1. **[아키텍처 문서](./ARCHITECTURE.md)** - 시스템 설계와 구조 이해
2. **[API 레퍼런스](./API.md)** - GraphQL API 사용법 (Full Stack)
3. **[배포 가이드](./DEPLOYMENT_GUIDE.md)** - 프로덕션 배포 방법
4. **[프로그래머블 데이터](./PROGRAMMABLE_DATA_ARCHITECTURE.md)** - 고급 기능 활용

---

## 💡 팁

### 개발 생산성

- **Hot Reload**: Vite는 자동으로 변경사항을 반영합니다
- **GraphQL Playground**: Full Stack 모드에서 `http://localhost:4000/graphql` 접속
- **Prisma Studio**: 데이터베이스 GUI로 데이터 확인 및 수정
- **React DevTools**: 브라우저 확장 프로그램 설치 권장

### 비용 최적화

- **개발 중**: Irys devnet 사용 (`VITE_IRYS_NETWORK=devnet`)
- **테스트**: 작은 문서로 업로드 테스트
- **프로덕션**: mainnet 사용, 적절한 가스비 설정

### 보안

- **환경 변수**: `.env` 파일을 절대 커밋하지 마세요
- **Private Key**: 백엔드용 지갑은 별도로 생성하고 최소 금액만 보관
- **지갑 연결**: 신뢰할 수 있는 사이트에서만 지갑 연결

---

**문제가 계속되면 [GitHub Issues](https://github.com/your-org/irysbase/issues)에 보고해주세요!**