# 시작하기 (Getting Started)

**Pure Irys BaaS - Zero Backend, Pure Blockchain Development**

DeBHuB Pure Irys BaaS를 시작하는 방법을 안내합니다.

---

## 목차

- [사전 요구사항](#사전-요구사항)
- [설치](#설치)
- [환경 설정](#환경-설정)
- [실행](#실행)
- [첫 사용](#첫-사용)
- [개발 워크플로우](#개발-워크플로우)
- [문제 해결](#문제-해결)
- [다음 단계](#다음-단계)

---

## 📋 사전 요구사항

### 필수 요구사항

- **Node.js** 18 이상
- **pnpm** 9 이상
- **MetaMask** 브라우저 확장 프로그램 (또는 호환 가능한 지갑)
- **Git**
- **텍스트 에디터** (VS Code 권장)

### 권장 사항

- Chrome/Firefox/Brave 브라우저 최신 버전
- React DevTools 브라우저 확장
- Git 기본 사용법 숙지

### Pure Irys의 특징

Pure Irys 모드는 **전통적인 백엔드 인프라가 필요 없습니다**:

- ✅ **PostgreSQL 불필요** - Smart Contracts로 대체
- ✅ **Redis 불필요** - IndexedDB로 캐싱
- ✅ **API 서버 불필요** - 직접 블록체인 연결
- ✅ **GraphQL 불필요** - 클라이언트 SDK 사용

---

## 🚀 설치

### 1. 저장소 클론

```bash
git clone https://github.com/0xarkstar/irysbase.git
cd irysbase
```

### 2. 의존성 설치

```bash
# 모든 패키지 의존성 설치
pnpm install
```

이 명령어는 다음을 설치합니다:
- React + Vite 프론트엔드 의존성
- Pure Irys Client 패키지
- Smart Contract 개발 도구 (선택사항)
- 기타 공유 패키지

### 3. Pure Irys Client 빌드

```bash
cd packages/pure-irys-client
pnpm build

cd ../..
```

---

## 🔧 환경 설정

### 환경 변수 설정

```bash
cd apps/web-vite
cp .env.example .env
```

`.env` 파일을 열고 다음과 같이 설정:

```env
# ==========================================
# Pure Irys BaaS Configuration
# ==========================================

# Mode (Pure Irys - 백엔드 비활성화)
VITE_ENABLE_BACKEND=false

# Irys Network Configuration
VITE_IRYS_NETWORK=testnet
VITE_IRYS_TOKEN=ethereum

# Blockchain Network
VITE_CHAIN_ID=1270
VITE_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc

# Wallet Connect (선택사항이지만 권장)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### WalletConnect Project ID 발급 (권장)

1. https://cloud.walletconnect.com 접속
2. 계정 생성 또는 로그인
3. "Create New Project" 클릭
4. Project ID 복사
5. `.env` 파일의 `VITE_WALLETCONNECT_PROJECT_ID`에 붙여넣기

**참고**: WalletConnect 없이도 작동하지만, 더 많은 지갑 옵션을 지원합니다.

### 네트워크 선택

#### 테스트넷 (개발용 - 권장)

```env
VITE_IRYS_NETWORK=testnet
VITE_CHAIN_ID=1270
VITE_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc
```

**테스트넷 토큰 받기**:
- Irys Faucet: https://irys.xyz/faucet
- 무료로 테스트용 토큰 받을 수 있습니다

#### 메인넷 (프로덕션용)

```env
VITE_IRYS_NETWORK=mainnet
VITE_CHAIN_ID=9990
VITE_RPC_URL=https://rpc.irys.xyz
```

**메인넷 사용 시 주의사항**:
- 실제 ETH가 필요합니다
- 업로드 비용이 발생합니다 (~$0.01/MB)
- 데이터는 영구적으로 저장됩니다

---

## 🏃 실행

### 개발 서버 시작

```bash
# 프론트엔드 디렉토리로 이동 (이미 web-vite에 있다면 생략)
cd apps/web-vite

# 개발 서버 시작
pnpm dev
```

서버가 시작되면:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
➜  press h to show help
```

### 앱 접속

브라우저에서 다음 URL을 엽니다:

- **Pure Irys 대시보드**: http://localhost:5173/pure
- **프로젝트 생성**: http://localhost:5173/pure/projects/new
- **테스트 페이지**: http://localhost:5173/pure-irys-test

---

## 🎯 첫 사용

### 1. 지갑 연결

1. **MetaMask 설치 확인**:
   - 브라우저에 MetaMask가 설치되어 있어야 합니다
   - 설치 링크: https://metamask.io

2. **앱에서 지갑 연결**:
   - 앱 우측 상단의 "Connect Wallet" 버튼 클릭
   - MetaMask 또는 원하는 지갑 선택
   - 연결 승인

3. **네트워크 전환** (필요시):
   - 앱이 자동으로 Irys Testnet 추가 요청
   - "Switch Network" 승인
   - Chain ID 1270으로 전환 확인

### 2. 프로젝트 생성

1. **대시보드 접속**:
   - http://localhost:5173/pure 접속

2. **새 프로젝트 생성**:
   - "Create New Project" 버튼 클릭
   - 또는 http://localhost:5173/pure/projects/new 직접 접속

3. **프로젝트 정보 입력**:
   ```
   프로젝트 이름: My First Project
   설명: Pure Irys BaaS로 만든 첫 프로젝트
   카테고리: Development
   태그: blockchain, web3, irys
   ```

4. **생성 확인**:
   - "Create Project" 버튼 클릭
   - MetaMask에서 트랜잭션 승인
   - 블록체인 확인 대기 (약 2-5초)
   - 생성 완료 후 대시보드로 리다이렉트

### 3. 문서 생성 및 관리

1. **문서 생성**:
   ```typescript
   // 프로젝트 내에서 문서 생성
   제목: Getting Started with Pure Irys
   내용: This is my first document on Irys DataChain!
   태그: tutorial, first-doc
   ```

2. **Irys에 영구 저장**:
   - "Publish to Irys" 버튼 클릭
   - MetaMask에서 서명 승인
   - 업로드 진행 상태 확인
   - Irys ID 받기 (영구 저장 증명)

3. **문서 조회 및 수정**:
   - 대시보드에서 문서 클릭
   - 내용 확인
   - "Edit" 버튼으로 수정 가능
   - 수정 사항은 새 버전으로 저장됨

### 4. 실시간 업데이트 구독

문서가 업데이트되면 자동으로 UI가 갱신됩니다:

```typescript
// 내부적으로 이렇게 작동합니다 (자동)
client.onDocumentUpdate(docId, (id, version) => {
  console.log('Document updated:', id, version);
  // UI 자동 갱신
});
```

### 5. 검색 기능 사용

1. **프로젝트별 검색**:
   - 프로젝트 ID로 필터링
   - 태그로 검색
   - 제목으로 검색

2. **검색 예시**:
   ```typescript
   // 대시보드 검색바 사용
   검색어: "tutorial"
   또는
   태그 필터: "blockchain"
   ```

---

## 🔧 개발 워크플로우

### 프로젝트 구조

```
irysbase/
├── apps/
│   ├── api/                          # 옵션 백엔드 (Pure Irys에서는 불필요)
│   │   └── src/
│   │       └── index-pure.ts         # RPC 프록시만 (옵션)
│   │
│   └── web-vite/                     # 프론트엔드 ⭐
│       ├── src/
│       │   ├── pages/
│       │   │   ├── DashboardPure.tsx     # Pure Irys 대시보드
│       │   │   ├── NewProjectPure.tsx    # 프로젝트 생성 페이지
│       │   │   └── PureIrysTestPage.tsx  # 테스트 페이지
│       │   ├── contexts/
│       │   │   └── PureIrysContext.tsx   # React Provider
│       │   └── App.tsx                    # 라우팅
│       │
│       └── package.json
│
├── packages/
│   ├── pure-irys-client/            # ⭐ 핵심 클라이언트 패키지
│   │   └── src/
│   │       ├── PureIrysClient.ts           # 메인 클라이언트
│   │       ├── cache/
│   │       │   └── IndexedDBCache.ts       # 캐싱 레이어
│   │       ├── hooks/
│   │       │   └── usePureIrys.ts          # React Hooks (7개)
│   │       └── contracts/
│   │           ├── addresses.ts            # 컨트랙트 주소
│   │           └── abis/                   # ABI 파일 (6개)
│   │
│   └── contracts/                   # Smart Contracts
│       └── contracts/
│           ├── DocumentRegistry.sol
│           ├── AccessControl.sol
│           ├── ProvenanceChain.sol
│           ├── EventBus.sol
│           ├── CacheController.sol
│           └── SearchIndex.sol
│
└── docs/                            # 문서
```

### 주요 명령어

#### 개발

```bash
# 프론트엔드 개발 서버
cd apps/web-vite
pnpm dev

# 타입 체크 (전체)
pnpm typecheck

# Pure Irys Client 개발
cd packages/pure-irys-client
pnpm dev          # Watch mode
pnpm build        # 프로덕션 빌드
```

#### 빌드

```bash
# 전체 빌드
pnpm build

# 프론트엔드만 빌드
cd apps/web-vite
pnpm build

# Pure Irys Client 빌드
cd packages/pure-irys-client
pnpm build
```

#### 코드 품질

```bash
# TypeScript 타입 체크
pnpm typecheck

# 린팅
pnpm lint

# 자동 포맷팅
pnpm format
```

#### Smart Contracts (고급)

```bash
cd packages/contracts

# 컴파일
pnpm compile

# 테스트넷 배포
pnpm deploy:pure-irys

# 컨트랙트 테스트
pnpm test
```

### 개발 팁

#### 1. Hot Reload

Vite는 파일 변경 시 자동으로 브라우저를 새로고침합니다:
- React 컴포넌트 수정 → 즉시 반영
- CSS/TailwindCSS 수정 → 즉시 반영
- 환경 변수 변경 → 서버 재시작 필요

#### 2. React DevTools 사용

```bash
# 브라우저 콘솔에서
window.__REACT_DEVTOOLS_GLOBAL_HOOK__
```

Components 탭에서:
- PureIrysContext 상태 확인
- 컴포넌트 props 디버깅
- 리렌더링 최적화

#### 3. IndexedDB 확인

브라우저 DevTools:
1. Application 탭
2. Storage → IndexedDB
3. `pure-irys-cache` 데이터베이스 확인
4. 캐시된 문서 및 쿼리 결과 조회

#### 4. 네트워크 모니터링

Network 탭에서:
- Irys RPC 호출 확인
- Smart Contract 트랜잭션 추적
- 업로드 진행 상태 모니터링

---

## 🐛 문제 해결

### 일반적인 문제

#### 1. "Client not initialized" 에러

**증상**:
```
Error: PureIrysClient is not initialized
```

**원인**: 지갑이 연결되지 않았거나 클라이언트 초기화 전에 메서드 호출

**해결방법**:
```typescript
// React 컴포넌트에서 항상 확인
const { client, isInitializing } = usePureIrys();

if (isInitializing) {
  return <div>Initializing...</div>;
}

if (!client) {
  return <div>Please connect wallet</div>;
}

// 이제 client 사용 가능
await client.createDocument(...);
```

#### 2. MetaMask 연결 실패

**증상**: "Failed to connect wallet" 또는 팝업이 안 뜸

**해결방법**:

1. **MetaMask 잠금 해제 확인**:
   - MetaMask 아이콘 클릭
   - 비밀번호 입력하여 잠금 해제

2. **브라우저 확인**:
   - Chrome/Firefox/Brave 사용 권장
   - 프라이빗 모드는 지원 안 될 수 있음

3. **HTTPS 확인**:
   - `localhost`는 HTTP 가능
   - 프로덕션은 반드시 HTTPS 필요

4. **MetaMask 재설치**:
   ```bash
   # 브라우저 확장 프로그램에서
   # MetaMask 제거 → 재설치
   ```

#### 3. "Wrong network" 에러

**증상**: 앱이 네트워크 전환 요청

**해결방법**:

1. **자동 전환 승인**:
   - MetaMask 팝업에서 "Switch Network" 클릭

2. **수동 네트워크 추가**:
   ```
   Network Name: Irys Testnet
   RPC URL: https://testnet-rpc.irys.xyz/v1/execution-rpc
   Chain ID: 1270
   Currency Symbol: ETH
   Block Explorer: (없음)
   ```

3. **환경 변수 확인**:
   ```env
   VITE_CHAIN_ID=1270  # 테스트넷
   # 또는
   VITE_CHAIN_ID=9990  # 메인넷
   ```

#### 4. Irys 업로드 실패

**증상**: "Upload failed" 또는 "Transaction failed"

**해결방법**:

1. **지갑 잔액 확인**:
   - 테스트넷: https://irys.xyz/faucet에서 토큰 받기
   - 메인넷: 충분한 ETH 보유 확인 (최소 0.01 ETH 권장)

2. **Irys 네트워크 상태 확인**:
   - https://status.irys.xyz
   - 다운타임이면 복구 대기

3. **파일 크기 확인**:
   - 너무 큰 파일은 실패할 수 있음
   - 테스트: 작은 문서부터 시작 (1KB 미만)

4. **브라우저 콘솔 확인**:
   ```typescript
   // 상세 에러 로그 확인
   console.error('Upload error:', error);
   ```

#### 5. "Contract call failed" 에러

**증상**: Smart Contract 호출 실패

**해결방법**:

1. **컨트랙트 주소 확인**:
   ```typescript
   // packages/pure-irys-client/src/contracts/addresses.ts
   export const CONTRACT_ADDRESSES = {
     testnet: {
       DocumentRegistry: '0x937956DA...',
       // ... 정확한 주소 확인
     }
   };
   ```

2. **가스비 확인**:
   - 충분한 ETH 보유 확인
   - MetaMask에서 가스비 조정 가능

3. **네트워크 일치 확인**:
   - 컨트랙트는 Irys Testnet에 배포됨
   - 지갑도 Irys Testnet에 연결되어야 함

4. **ABI 업데이트 확인**:
   ```bash
   # Pure Irys Client 재빌드
   cd packages/pure-irys-client
   pnpm build
   ```

#### 6. 타입 에러

**증상**: TypeScript 컴파일 에러

**해결방법**:

```bash
# 1. 의존성 재설치
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 2. Pure Irys Client 재빌드
cd packages/pure-irys-client
pnpm build

# 3. TypeScript 캐시 삭제
cd ../..
find . -name "tsconfig.tsbuildinfo" -delete

# 4. 타입 체크
pnpm typecheck
```

#### 7. 포트 충돌

**증상**: "Port 5173 already in use"

**해결방법**:

```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9

# 또는 다른 포트 사용
cd apps/web-vite
pnpm dev --port 3000
```

#### 8. 캐시 문제

**증상**: 오래된 데이터가 표시됨

**해결방법**:

1. **브라우저에서 캐시 삭제**:
   - 개발자 도구 → Application → Clear Storage
   - 또는 F12 → Application → Storage → Clear

2. **코드에서 캐시 삭제**:
   ```typescript
   const { client } = usePureIrys();
   await client.clearCache();
   ```

3. **캐시 통계 확인**:
   ```typescript
   const stats = await client.getCacheStats();
   console.log('Cache stats:', stats);
   ```

### 디버그 모드

#### 브라우저 콘솔 활성화

```typescript
// 개발 모드에서 자동으로 활성화됨
if (import.meta.env.DEV) {
  console.log('Development mode - verbose logging enabled');
}
```

#### Pure Irys Client 디버깅

```typescript
// 클라이언트 생성 시 로깅 활성화 (내부적으로 구현됨)
const client = new PureIrysClient(signer, {
  // ... config
});

// 모든 메서드 호출이 콘솔에 로그됨
await client.createDocument(...);
// → "Creating document with options: {...}"
```

#### React DevTools Profiler

```tsx
import { Profiler } from 'react';

<Profiler id="Dashboard" onRender={(id, phase, actualDuration) => {
  console.log(`${id} took ${actualDuration}ms`);
}}>
  <DashboardPure />
</Profiler>
```

### 도움 받기

1. **로그 확인**:
   - 브라우저 콘솔 (F12)
   - Network 탭 (API 호출 확인)
   - Application 탭 (IndexedDB 확인)

2. **문서 참조**:
   - [아키텍처](./ARCHITECTURE.md)
   - [배포 가이드](./DEPLOYMENT.md)
   - [Pure Irys 설정](../PURE_IRYS_SETUP.md)

3. **커뮤니티**:
   - GitHub Issues: https://github.com/0xarkstar/irysbase/issues
   - Irys Discord: https://discord.gg/irys

4. **예제 코드**:
   - `apps/web-vite/src/pages/PureIrysTestPage.tsx` 참고
   - 모든 Pure Irys Client 기능 테스트 가능

---

## 📚 다음 단계

기본 설정과 사용법을 익혔다면:

### 1. 아키텍처 이해

[아키텍처 문서](./ARCHITECTURE.md)를 읽고 Pure Irys BaaS의 설계를 이해하세요:
- Zero Backend 아키텍처
- Smart Contracts 역할
- IndexedDB 캐싱 전략
- 데이터 흐름

### 2. 고급 기능 활용

Pure Irys Client의 모든 기능 활용:

```typescript
import {
  usePureIrysClient,
  useCreateDocument,
  useDocument,
  useUpdateDocument,
  useSearchDocuments,
  useDocumentSubscription,
  useCacheStats,
} from '@debhub/pure-irys-client';

// 7개 Hooks 모두 사용 가능
```

### 3. Smart Contracts 커스터마이징

자신만의 Smart Contract 추가:

```bash
cd packages/contracts

# 새 컨트랙트 작성
# contracts/MyContract.sol

# 컴파일
pnpm compile

# 배포
pnpm deploy:pure-irys
```

### 4. 프로덕션 배포

[배포 가이드](./DEPLOYMENT.md) 참고:
- Vercel/Netlify로 프론트엔드 배포
- 메인넷 Smart Contracts 배포
- 도메인 설정
- 모니터링 설정

### 5. 성능 최적화

- IndexedDB 캐시 전략 최적화
- React 컴포넌트 메모이제이션
- Lazy Loading 구현
- 번들 크기 최적화

### 6. 보안 강화

- Content Security Policy 설정
- 지갑 연결 보안
- Smart Contract 권한 관리
- 프론트엔드 보안 체크리스트

---

## 💡 개발 팁

### 생산성 향상

1. **VS Code 확장 프로그램**:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - GraphQL (선택사항)

2. **코드 스니펫**:
   ```json
   {
     "Pure Irys Hook": {
       "prefix": "usePureIrys",
       "body": [
         "const { client, isInitializing } = usePureIrys();",
         "",
         "if (isInitializing) return <div>Loading...</div>;",
         "if (!client) return <div>Connect wallet</div>;"
       ]
     }
   }
   ```

3. **Git Hooks**:
   ```bash
   # .husky/pre-commit
   pnpm typecheck
   pnpm lint
   ```

### 비용 최적화

1. **개발 단계**:
   - Irys Testnet 사용 (무료)
   - 작은 문서로 테스트
   - 캐싱 최대한 활용

2. **프로덕션**:
   - 문서 압축 고려
   - 불필요한 업로드 방지
   - 캐시 TTL 적절히 설정

### 보안 체크리스트

- [ ] `.env` 파일 `.gitignore`에 추가
- [ ] Private Key는 절대 커밋하지 않기
- [ ] HTTPS만 사용 (프로덕션)
- [ ] Content Security Policy 설정
- [ ] 지갑 연결은 신뢰할 수 있는 사이트에서만
- [ ] Smart Contract 권한 최소화
- [ ] 정기적인 의존성 업데이트

---

**즐거운 개발 되세요! 문제가 있다면 [GitHub Issues](https://github.com/0xarkstar/irysbase/issues)에 보고해주세요.**

---

**DeBHuB Pure Irys BaaS** - 세계 최초 Pure Irys 플랫폼

**Status**: 🟢 Beta | **Version**: 3.0.0-pure | **Updated**: 2025-10-16
