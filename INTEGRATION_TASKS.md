# IrysBase Integration Tasks

> **목적**: 프론트엔드와 백엔드를 완전히 연결하여 작동 가능한 BaaS 플랫폼 완성
> **작성일**: 2025-10-06
> **현재 통합률**: 80% → **목표**: 100%

---

## 📋 목차

1. [우선순위 1: 핵심 기능 완성 (필수)](#우선순위-1-핵심-기능-완성-필수)
2. [우선순위 2: 사용자 경험 개선 (중요)](#우선순위-2-사용자-경험-개선-중요)
3. [우선순위 3: 고급 기능 (선택)](#우선순위-3-고급-기능-선택)
4. [테스트 체크리스트](#테스트-체크리스트)

---

## 우선순위 1: 핵심 기능 완성 (필수)

### ✅ Task 1: 인증 시스템 구현
**현재 상태**: 프론트엔드는 JWT 토큰 사용 준비됨, 백엔드 리졸버 누락
**영향도**: 🔴 Critical - 로그인 없이 플랫폼 사용 불가

#### 1.1 백엔드: 챌린지-응답 인증 리졸버 추가

**파일**: `apps/api/src/resolvers/enhanced-resolvers.ts`

```typescript
// Mutation 객체에 추가
Mutation: {
  // ... 기존 뮤테이션들

  requestChallenge: async (
    _: any,
    { address }: { address: string },
    { prisma }: EnhancedContext
  ) => {
    // 1. 챌린지 문자열 생성 (nonce)
    const challenge = `Sign this message to authenticate with IrysBase: ${Date.now()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후 만료

    // 2. 임시 챌린지 저장 (Redis 또는 DB)
    // 선택 1: Redis 사용
    const redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    await redisClient.setEx(
      `challenge:${address}`,
      300, // 5분 TTL
      challenge
    );
    await redisClient.disconnect();

    // 선택 2: DB에 Challenge 테이블 생성
    // await prisma.authChallenge.create({
    //   data: { address, challenge, expiresAt }
    // })

    return {
      challenge,
      expiresAt: expiresAt.toISOString(),
    };
  },

  authenticate: async (
    _: any,
    { address, signature }: { address: string; signature: string },
    { prisma }: EnhancedContext
  ) => {
    // 1. 저장된 챌린지 조회
    const redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    const challenge = await redisClient.get(`challenge:${address}`);
    await redisClient.disconnect();

    if (!challenge) {
      throw new Error('Challenge expired or not found');
    }

    // 2. 서명 검증
    const { ethers } = await import('ethers');
    const recoveredAddress = ethers.verifyMessage(challenge, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      throw new Error('Invalid signature');
    }

    // 3. 사용자 생성 또는 조회
    const user = await prisma.user.upsert({
      where: { address: address.toLowerCase() },
      update: { updatedAt: new Date() },
      create: { address: address.toLowerCase() },
    });

    // 4. JWT 토큰 생성
    const jwt = await import('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, address: user.address },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return {
      token,
      user,
    };
  },
}
```

**필요한 추가 작업**:
- [ ] `apps/api/prisma/schema.prisma`에 AuthChallenge 모델 추가 (선택사항)
  ```prisma
  model AuthChallenge {
    id        String   @id @default(cuid())
    address   String   @unique
    challenge String
    expiresAt DateTime
    createdAt DateTime @default(now())
    @@map("auth_challenges")
  }
  ```
- [ ] `.env`에 `JWT_SECRET` 추가
- [ ] `apps/api/src/services/auth.ts`에서 `extractAuthFromHeaders` 검증 로직 확인

#### 1.2 프론트엔드: 인증 훅 구현

**파일**: `apps/web-vite/src/hooks/useAuth.ts` (새로 생성)

```typescript
import { useMutation } from '@apollo/client';
import { useSignMessage, useAccount } from 'wagmi';
import { REQUEST_CHALLENGE, AUTHENTICATE } from '@/lib/graphql/mutations';

export function useAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [requestChallenge] = useMutation(REQUEST_CHALLENGE);
  const [authenticate] = useMutation(AUTHENTICATE);

  const login = async () => {
    if (!address) throw new Error('Wallet not connected');

    // 1. 챌린지 요청
    const { data } = await requestChallenge({
      variables: { address },
    });

    // 2. 서명 요청
    const signature = await signMessageAsync({
      message: data.requestChallenge.challenge,
    });

    // 3. 인증
    const authResult = await authenticate({
      variables: { address, signature },
    });

    // 4. 토큰 저장
    localStorage.setItem('authToken', authResult.data.authenticate.token);

    return authResult.data.authenticate;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
  };

  return { login, logout };
}
```

**필요한 추가 작업**:
- [ ] `apps/web-vite/src/lib/graphql/mutations.ts`에 REQUEST_CHALLENGE, AUTHENTICATE 추가 (이미 있음)
- [ ] `ConnectWallet.tsx`에서 `useAuth().login()` 호출
- [ ] Apollo Client의 `authLink`가 localStorage에서 토큰 읽도록 확인 (이미 구현됨)

---

### ✅ Task 2: Storage 메트릭 API 구현
**현재 상태**: 프론트엔드는 Mock 데이터 사용, 백엔드 API 없음
**영향도**: 🟡 High - 사용량 추적 필수

#### 2.1 백엔드: Storage 메트릭 쿼리 추가

**파일**: `apps/api/src/resolvers/enhanced-resolvers.ts`

```typescript
Query: {
  // ... 기존 쿼리들

  projectStorage: async (
    _: any,
    { projectId }: { projectId: string },
    { prisma }: EnhancedContext
  ) => {
    // 1. 프로젝트의 모든 Irys 트랜잭션 조회
    const transactions = await prisma.irysTransaction.findMany({
      where: {
        document: {
          projectId,
        },
        status: 'confirmed',
      },
    });

    // 2. 총 사용량 계산
    const totalBytes = transactions.reduce((sum, tx) => {
      return sum + Number(tx.size);
    }, 0);

    const totalGB = totalBytes / (1024 * 1024 * 1024);

    // 3. 비용 계산 (Irys 요금표 기준)
    // 실제 비용은 Irys API에서 가져와야 함
    const costPerGB = 2.5; // USD
    const monthlyCostUSD = totalGB * costPerGB;

    // 4. 문서별 사용량
    const documentStats = await prisma.document.findMany({
      where: { projectId },
      include: {
        transactions: {
          where: { status: 'confirmed' },
        },
      },
    });

    const documents = documentStats.map(doc => ({
      documentId: doc.id,
      title: doc.title,
      sizeBytes: doc.transactions.reduce((sum, tx) =>
        sum + Number(tx.size), 0
      ),
      transactionCount: doc.transactions.length,
    }));

    return {
      projectId,
      totalBytes,
      totalGB: parseFloat(totalGB.toFixed(4)),
      monthlyCostUSD: parseFloat(monthlyCostUSD.toFixed(2)),
      transactionCount: transactions.length,
      documents,
      lastUpdated: new Date().toISOString(),
    };
  },

  userStorage: async (
    _: any,
    __: any,
    { auth, prisma }: EnhancedContext
  ) => {
    const userId = requireAuth(auth);

    // 사용자의 모든 프로젝트 조회
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId } } },
        ],
      },
      include: {
        documents: {
          include: {
            transactions: {
              where: { status: 'confirmed' },
            },
          },
        },
      },
    });

    // 전체 사용량 계산
    let totalBytes = 0;
    projects.forEach(project => {
      project.documents.forEach(doc => {
        doc.transactions.forEach(tx => {
          totalBytes += Number(tx.size);
        });
      });
    });

    const totalGB = totalBytes / (1024 * 1024 * 1024);

    return {
      userId,
      totalBytes,
      totalGB: parseFloat(totalGB.toFixed(4)),
      monthlyCostUSD: parseFloat((totalGB * 2.5).toFixed(2)),
      projectCount: projects.length,
      lastUpdated: new Date().toISOString(),
    };
  },
}
```

**GraphQL 스키마 추가**: `apps/api/src/schema-enhanced.graphql`

```graphql
type StorageMetrics {
  projectId: String!
  totalBytes: Float!
  totalGB: Float!
  monthlyCostUSD: Float!
  transactionCount: Int!
  documents: [DocumentStorage!]!
  lastUpdated: String!
}

type DocumentStorage {
  documentId: String!
  title: String!
  sizeBytes: Float!
  transactionCount: Int!
}

type UserStorageMetrics {
  userId: String!
  totalBytes: Float!
  totalGB: Float!
  monthlyCostUSD: Float!
  projectCount: Int!
  lastUpdated: String!
}

extend type Query {
  projectStorage(projectId: String!): StorageMetrics!
  userStorage: UserStorageMetrics!
}
```

#### 2.2 프론트엔드: Storage 쿼리 사용

**파일**: `apps/web-vite/src/lib/graphql/queries.ts`

```typescript
export const GET_PROJECT_STORAGE = gql`
  query GetProjectStorage($projectId: ID!) {
    projectStorage(projectId: $projectId) {
      projectId
      totalBytes
      totalGB
      monthlyCostUSD
      transactionCount
      documents {
        documentId
        title
        sizeBytes
        transactionCount
      }
      lastUpdated
    }
  }
`;

export const GET_USER_STORAGE = gql`
  query GetUserStorage {
    userStorage {
      userId
      totalBytes
      totalGB
      monthlyCostUSD
      projectCount
      lastUpdated
    }
  }
`;
```

**파일**: `apps/web-vite/src/pages/Dashboard.tsx` (수정)

```typescript
// Mock 데이터 제거하고 실제 API 사용
const { data: storageData } = useQuery(GET_USER_STORAGE);

const projectsWithStorage = projects.map((project: any) => ({
  ...project,
  storage: {
    irysGB: project.storage?.irysGB || 0,
    monthlyCostUSD: project.storage?.monthlyCostUSD || 0,
  },
  syncStatus: project.syncStatus || 'synced',
}));
```

---

### ✅ Task 3: GraphQL 스키마 동기화
**현재 상태**: 일부 타입 불일치
**영향도**: 🟡 Medium - 타입 안전성

#### 3.1 누락된 타입 추가

**파일**: `apps/api/src/schema-enhanced.graphql`

```graphql
# Authentication types (누락됨)
type AuthChallenge {
  challenge: String!
  expiresAt: String!
}

type AuthResult {
  token: String!
  user: User!
}

# Extend Mutation
extend type Mutation {
  requestChallenge(address: String!): AuthChallenge!
  authenticate(address: String!, signature: String!): AuthResult!
}
```

#### 3.2 프론트엔드 Fragment 업데이트

**파일**: `apps/web-vite/src/lib/graphql/queries.ts`

```typescript
// ProjectBasic fragment에 storage 필드 추가
export const PROJECT_BASIC = gql`
  fragment ProjectBasic on Project {
    id
    name
    slug
    description
    visibility
    documentsCount
    collaboratorsCount
    createdAt
    updatedAt
    storage {
      irysGB
      monthlyCostUSD
    }
    syncStatus
  }
`;
```

**필요한 추가 작업**:
- [ ] GraphQL 스키마에서 `documentsCount`, `collaboratorsCount` 계산 필드 추가
- [ ] Project 타입에 `storage`, `syncStatus` 필드 추가

---

### ✅ Task 4: 에러 처리 강화
**현재 상태**: 기본적인 에러 처리만 존재
**영향도**: 🟡 Medium - UX 개선

#### 4.1 백엔드: 구조화된 에러 응답

**파일**: `apps/api/src/utils/errors.ts` (새로 생성)

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  IRYS_ERROR: 'IRYS_ERROR',
  BLOCKCHAIN_ERROR: 'BLOCKCHAIN_ERROR',
};

// 사용 예시
throw new AppError('Project not found', ErrorCodes.NOT_FOUND, 404);
```

**파일**: `apps/api/src/index-enhanced.ts` (수정)

```typescript
const server = new ApolloServer({
  schema,
  plugins: [
    // ... 기존 플러그인
  ],
  formatError: (formattedError, error) => {
    // 커스텀 에러 포맷팅
    if (error instanceof AppError) {
      return {
        message: formattedError.message,
        code: error.code,
        statusCode: error.statusCode,
        path: formattedError.path,
      };
    }
    return formattedError;
  },
});
```

#### 4.2 프론트엔드: 에러 바운더리 개선

**파일**: `apps/web-vite/src/components/ErrorBoundary.tsx` (기존 파일 개선)

```typescript
import { Component, ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);

    // 에러 로깅 서비스로 전송 (Sentry 등)
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**파일**: `apps/web-vite/src/lib/apollo.ts` (에러 링크 개선)

```typescript
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Path: ${path}`);

      // 인증 에러 처리
      if (extensions?.code === 'UNAUTHORIZED') {
        localStorage.removeItem('authToken');
        window.location.href = '/';
      }

      // 사용자에게 토스트 메시지 표시
      // toast.error(message);
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    // toast.error('Network error. Please check your connection.');
  }
});
```

---

## 우선순위 2: 사용자 경험 개선 (중요)

### ✅ Task 5: 실시간 Subscription 활성화
**현재 상태**: WebSocket 서버 구성됨, 프론트엔드 미사용
**영향도**: 🟢 Low - 협업 기능 향상

#### 5.1 프론트엔드: Subscription 훅 구현

**파일**: `apps/web-vite/src/hooks/useDocumentSubscription.ts` (새로 생성)

```typescript
import { useSubscription } from '@apollo/client';
import { DOCUMENT_CHANGED } from '@/lib/graphql/subscriptions';
import { useEffect } from 'react';

export function useDocumentSubscription(documentId: string, onUpdate: (data: any) => void) {
  const { data, loading, error } = useSubscription(DOCUMENT_CHANGED, {
    variables: { documentId },
    shouldResubscribe: true,
  });

  useEffect(() => {
    if (data?.documentChanged) {
      onUpdate(data.documentChanged);
    }
  }, [data, onUpdate]);

  return { loading, error };
}
```

**파일**: `apps/web-vite/src/pages/DocumentPage.tsx` (수정)

```typescript
import { useDocumentSubscription } from '@/hooks/useDocumentSubscription';

function DocumentPage() {
  const { id } = useParams();
  const { data, refetch } = useQuery(GET_DOCUMENT, { variables: { id } });

  // 실시간 업데이트 구독
  useDocumentSubscription(id!, (update) => {
    console.log('Document changed:', update);
    refetch(); // 문서 다시 로드

    // 또는 캐시 직접 업데이트
    // client.cache.modify({ ... })
  });

  // ... 나머지 코드
}
```

#### 5.2 백엔드: Subscription 필터링 개선

**파일**: `apps/api/src/resolvers/enhanced-resolvers.ts`

```typescript
Subscription: {
  documentChanged: {
    subscribe: withFilter(
      () => pubsub.asyncIterator([DOCUMENT_CHANGED]),
      (payload, variables) => {
        // 특정 문서에 대한 이벤트만 필터링
        return payload.documentChanged.documentId === variables.documentId;
      }
    ),
  },
}
```

**필요한 추가 작업**:
- [ ] `graphql-subscriptions`에서 `withFilter` import
- [ ] WebSocket 연결 테스트
- [ ] 브라우저 개발자 도구에서 WS 연결 확인

---

### ✅ Task 6: 로딩 상태 일관성
**현재 상태**: 일부 페이지만 Skeleton UI 사용
**영향도**: 🟢 Low - UX 폴리싱

#### 6.1 공통 Skeleton 컴포넌트 생성

**파일**: `apps/web-vite/src/components/ui/skeleton.tsx` (이미 존재)

사용 예시 추가:

**파일**: `apps/web-vite/src/components/ProjectCardSkeleton.tsx` (새로 생성)

```typescript
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProjectCardSkeleton() {
  return (
    <Card className="p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </Card>
  );
}
```

**모든 페이지에 적용**:
```typescript
{loading ? (
  <div className="grid grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => <ProjectCardSkeleton key={i} />)}
  </div>
) : (
  // 실제 콘텐츠
)}
```

---

### ✅ Task 7: 오프라인 지원
**현재 상태**: 없음
**영향도**: 🟢 Low - PWA 기능

#### 7.1 Apollo Cache Persistence

**파일**: `apps/web-vite/src/lib/apollo.ts`

```typescript
import { persistCache, LocalStorageWrapper } from 'apollo3-cache-persist';

const cache = new InMemoryCache({...});

// 캐시 영속화
await persistCache({
  cache,
  storage: new LocalStorageWrapper(window.localStorage),
  maxSize: 10 * 1024 * 1024, // 10MB
  debug: import.meta.env.DEV,
});
```

**필요한 패키지**:
```bash
pnpm add apollo3-cache-persist
```

---

## 우선순위 3: 고급 기능 (선택)

### ✅ Task 8: AI 검색 통합
**현재 상태**: Placeholder 함수
**영향도**: 🟢 Optional - 고급 기능

#### 8.1 Vector DB 서비스 완성

**파일**: `apps/api/src/services/vector-db-service.ts`

OpenAI Embeddings + Pinecone 또는 Qdrant 연동:

```typescript
import { OpenAI } from 'openai';

export class VectorDBService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async createEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  }

  async searchSimilar(query: string, limit: number = 10) {
    const queryEmbedding = await this.createEmbedding(query);

    // Pinecone/Qdrant에 벡터 검색 요청
    // ... 구현
  }
}
```

**필요한 패키지**:
```bash
pnpm add openai @pinecone-database/pinecone
```

---

### ✅ Task 9: Programmable Data UI
**현재 상태**: 백엔드 서비스만 존재
**영향도**: 🟢 Optional - 차별화 기능

#### 9.1 규칙 생성 인터페이스

**파일**: `apps/web-vite/src/pages/ProgrammableDataPage.tsx` (새로 생성)

```typescript
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_RULE } from '@/lib/graphql/mutations';

export default function ProgrammableDataPage() {
  const [rule, setRule] = useState({
    type: 'access',
    condition: {},
    action: {},
  });

  const [createRule] = useMutation(CREATE_RULE);

  const handleSubmit = async () => {
    await createRule({
      variables: {
        input: {
          documentId: '...',
          ...rule,
        },
      },
    });
  };

  return (
    <div>
      <h1>Programmable Data Rules</h1>
      {/* 규칙 생성 폼 */}
    </div>
  );
}
```

---

### ✅ Task 10: 성능 최적화
**현재 상태**: 기본 설정
**영향도**: 🟢 Optional - 대규모 사용 시 필요

#### 10.1 GraphQL Query 배칭

**파일**: `apps/web-vite/src/lib/apollo.ts`

```typescript
import { BatchHttpLink } from '@apollo/client/link/batch-http';

const batchLink = new BatchHttpLink({
  uri: 'http://localhost:4000/graphql',
  batchMax: 10, // 최대 10개 쿼리 배칭
  batchInterval: 20, // 20ms 내 쿼리 그룹화
});
```

#### 10.2 이미지 Lazy Loading

**파일**: 모든 이미지 컴포넌트

```typescript
<img
  src={url}
  loading="lazy"
  decoding="async"
  alt="..."
/>
```

#### 10.3 React Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const DocumentPage = lazy(() => import('./pages/DocumentPage'));

<Suspense fallback={<LoadingSkeleton />}>
  <DocumentPage />
</Suspense>
```

---

## 테스트 체크리스트

### 통합 테스트

- [ ] **인증 플로우**
  - [ ] 지갑 연결 → 챌린지 요청 → 서명 → JWT 발급
  - [ ] localStorage에 토큰 저장 확인
  - [ ] Authorization 헤더로 API 요청 성공

- [ ] **프로젝트 CRUD**
  - [ ] 프로젝트 생성 → DB 저장 → Irys 업로드
  - [ ] 프로젝트 목록 조회 → Apollo 캐시 확인
  - [ ] 프로젝트 수정 → 실시간 업데이트 (Subscription)

- [ ] **문서 관리**
  - [ ] 문서 생성 → 버전 1 생성 → Irys 업로드
  - [ ] 문서 수정 → 버전 증가 → 히스토리 조회
  - [ ] 문서 삭제 → Cascade 삭제 확인

- [ ] **Storage 메트릭**
  - [ ] 프로젝트 Storage 조회 → 실제 Irys 사용량 반환
  - [ ] 사용자 전체 Storage → 모든 프로젝트 합산

- [ ] **실시간 기능**
  - [ ] WebSocket 연결 성공
  - [ ] 문서 변경 시 Subscription 이벤트 수신
  - [ ] 여러 사용자 동시 편집 시 충돌 처리

### E2E 테스트 시나리오

```typescript
// Playwright 예시
test('Complete user flow', async ({ page }) => {
  // 1. 지갑 연결
  await page.goto('/');
  await page.click('button:has-text("Connect Wallet")');

  // 2. 인증
  // (MetaMask 서명 시뮬레이션)

  // 3. 프로젝트 생성
  await page.click('a:has-text("New Project")');
  await page.fill('input[name="name"]', 'Test Project');
  await page.click('button:has-text("Create")');

  // 4. 문서 생성
  await page.click('button:has-text("New Document")');
  await page.fill('textarea', '# Hello World');
  await page.click('button:has-text("Save")');

  // 5. Storage 확인
  await page.goto('/storage');
  await expect(page.locator('text=Total Storage')).toBeVisible();
});
```

---

## 환경 변수 설정

### 백엔드 `.env`

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/irysbase"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"

# Irys
IRYS_PRIVATE_KEY="your-irys-private-key"
IRYS_NETWORK="mainnet" # or "testnet"

# Blockchain
RPC_URL="https://rpc.irys.xyz"
AUTH_ROLES_CONTRACT_ADDRESS="0x..."
POSTS_CONTRACT_ADDRESS="0x..."
SIGNER_PRIVATE_KEY="0x..."

# OpenAI (선택)
OPENAI_API_KEY="sk-..."

# Pinecone (선택)
PINECONE_API_KEY="..."
PINECONE_ENVIRONMENT="..."
```

### 프론트엔드 `.env`

```bash
# GraphQL
VITE_GRAPHQL_URL="http://localhost:4000/graphql"
VITE_GRAPHQL_WS_URL="ws://localhost:4000/graphql"

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID="your-project-id"

# Network
VITE_CHAIN_ID="1270" # IrysVM
```

---

## 마이그레이션 스크립트

### Prisma 마이그레이션

```bash
# 1. AuthChallenge 모델 추가 후
cd apps/api
pnpm prisma migrate dev --name add_auth_challenge

# 2. Storage 메트릭 필드 추가 후
pnpm prisma migrate dev --name add_storage_fields

# 3. 데이터베이스 리셋 (개발 환경)
pnpm prisma migrate reset
```

---

## 완료 기준

### Definition of Done

각 Task는 다음 조건을 만족해야 완료:

1. **코드 구현** ✅
2. **GraphQL 스키마 업데이트** ✅
3. **타입 정의 추가** ✅
4. **테스트 작성** ✅
5. **문서 업데이트** ✅
6. **로컬 환경 동작 확인** ✅

### 마일스톤

- **Week 1**: Task 1-4 완료 (핵심 기능)
- **Week 2**: Task 5-7 완료 (UX 개선)
- **Week 3**: Task 8-10 완료 (고급 기능)
- **Week 4**: 통합 테스트 + 버그 수정

---

## 참고 자료

- [Apollo Client Subscriptions](https://www.apollographql.com/docs/react/data/subscriptions/)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [Irys Documentation](https://docs.irys.xyz/)
- [RainbowKit Authentication](https://www.rainbowkit.com/docs/authentication)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

---

**마지막 업데이트**: 2025-10-06
**작성자**: Claude Code Assistant
**버전**: 1.0
