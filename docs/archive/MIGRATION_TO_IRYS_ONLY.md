# PostgreSQL → Irys-Only 마이그레이션 계획

**목표:** 완전한 서버리스, 탈중앙화 BaaS로 전환
**기간:** 4주
**슬로건:** "Kill the Server, Keep the Data"

---

## 📋 마이그레이션 체크리스트

### ✅ Phase 1: Irys 코어 구현 (1주)

- [ ] `IrysDatabase` 클래스 완성
- [ ] CRUD 작업 구현
- [ ] 태그 전략 확정
- [ ] 엔티티 스키마 정의
- [ ] 테스트 작성

### ✅ Phase 2: 캐싱 시스템 (1주)

- [ ] IndexedDB 통합
- [ ] 캐시 전략 구현
- [ ] Prefetching 로직
- [ ] 낙관적 UI 업데이트
- [ ] 오프라인 모드

### ✅ Phase 3: Frontend 전환 (1주)

- [ ] PostgreSQL 쿼리 → Irys 쿼리로 전환
- [ ] GraphQL resolvers 제거
- [ ] API calls → 직접 Irys calls
- [ ] 스켈레톤 UI 추가
- [ ] Progressive loading

### ✅ Phase 4: 정리 및 배포 (1주)

- [ ] PostgreSQL 의존성 제거
- [ ] API 서버 제거
- [ ] Prisma 제거
- [ ] 순수 정적 사이트로 배포
- [ ] 문서 업데이트

---

## 🗑️ 제거할 것들

### Backend 완전 제거:

```bash
# 제거할 디렉토리
rm -rf apps/api

# 제거할 파일
apps/api/
├── src/
│   ├── index-enhanced.ts          ❌ 제거
│   ├── resolvers/                 ❌ 제거
│   ├── services/                  ❌ 제거
│   └── schema-enhanced.graphql    ❌ 제거
├── prisma/
│   └── schema.prisma              ❌ 제거
└── package.json                   ❌ 제거
```

### Frontend에서 제거:

```typescript
// ❌ 제거할 것들
import { ApolloClient } from '@apollo/client';      ❌
import { GraphQLClient } from 'graphql-request';   ❌
import { PrismaClient } from '@prisma/client';     ❌

// ❌ 제거할 파일
apps/web-vite/src/
├── lib/
│   ├── apollo.ts              ❌ Apollo 제거
│   ├── graphql/
│   │   ├── queries.ts         ❌ GraphQL 쿼리 제거
│   │   └── mutations.ts       ❌ GraphQL 뮤테이션 제거
│   └── api.ts                 ❌ API 클라이언트 제거
```

---

## ✅ 추가할 것들

### 새로운 Irys 클라이언트:

```bash
# 새로 생성할 파일
apps/web-vite/src/
├── lib/
│   ├── irys-database.ts       ✅ 핵심 DB 클래스
│   ├── irys-cache.ts          ✅ IndexedDB 캐싱
│   ├── irys-hooks.ts          ✅ React hooks
│   └── irys-types.ts          ✅ 타입 정의
```

---

## 🔄 코드 전환 예시

### Before (PostgreSQL + GraphQL):

```typescript
// ❌ 기존 코드
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECTS, CREATE_PROJECT } from '@/lib/graphql/queries';

function ProjectsPage() {
  // GraphQL 쿼리
  const { data, loading } = useQuery(GET_PROJECTS, {
    variables: { userId: user.id }
  });

  // GraphQL 뮤테이션
  const [createProject] = useMutation(CREATE_PROJECT);

  const handleCreate = async () => {
    await createProject({
      variables: {
        input: {
          name: 'New Project',
          slug: 'new-project'
        }
      }
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {data.projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

### After (Irys-Only):

```typescript
// ✅ 새 코드
import { useIrysQuery, useIrysMutation } from '@/lib/irys-hooks';

function ProjectsPage() {
  // Irys 쿼리 (IndexedDB 캐싱 포함)
  const { data, loading } = useIrysQuery('projects', async (db) => {
    return await db.getUserProjects(user.address);
  });

  // Irys 뮤테이션
  const createProject = useIrysMutation(async (db, input) => {
    return await db.createProject(input);
  });

  const handleCreate = async () => {
    await createProject({
      name: 'New Project',
      slug: 'new-project',
      owner: user.address
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map(project => (
        <ProjectCard key={project.entityId} project={project} />
      ))}
    </div>
  );
}
```

---

## 🛠️ 구현 상세

### 1. IrysDatabase 클래스

```typescript
// apps/web-vite/src/lib/irys-database.ts

import { Uploader } from '@irys/upload';
import { Query } from '@irys/query';
import { openDB, IDBPDatabase } from 'idb';

export class IrysDatabase {
  private uploader: Uploader;
  private query: Query;
  private cache: IDBPDatabase;

  constructor() {
    this.uploader = new Uploader({ network: 'mainnet' });
    this.query = new Query({ network: 'mainnet' });
  }

  async init() {
    this.cache = await openDB('IrysBase', 1, {
      upgrade(db) {
        db.createObjectStore('projects', { keyPath: 'entityId' });
        db.createObjectStore('documents', { keyPath: 'entityId' });
        db.createObjectStore('users', { keyPath: 'entityId' });
      }
    });
  }

  // Projects
  async createProject(data: ProjectInput): Promise<Project> { /* ... */ }
  async getProjectBySlug(slug: string): Promise<Project | null> { /* ... */ }
  async getUserProjects(ownerAddress: string): Promise<Project[]> { /* ... */ }
  async updateProject(entityId: string, updates: ProjectUpdate): Promise<Project> { /* ... */ }
  async deleteProject(entityId: string, deletedBy: string): Promise<boolean> { /* ... */ }

  // Documents
  async createDocument(data: DocumentInput): Promise<Document> { /* ... */ }
  async getDocument(entityId: string): Promise<Document | null> { /* ... */ }
  async getProjectDocuments(projectId: string): Promise<Document[]> { /* ... */ }
  async updateDocument(entityId: string, updates: DocumentUpdate): Promise<Document> { /* ... */ }
  async deleteDocument(entityId: string, deletedBy: string): Promise<boolean> { /* ... */ }

  // Search
  async searchDocuments(query: string): Promise<Document[]> { /* ... */ }
  async getDocumentVersions(entityId: string): Promise<DocumentVersion[]> { /* ... */ }
}

// Singleton instance
export const irysDb = new IrysDatabase();
```

### 2. React Hooks

```typescript
// apps/web-vite/src/lib/irys-hooks.ts

import { useState, useEffect } from 'react';
import { irysDb } from './irys-database';

export function useIrysQuery<T>(
  key: string,
  queryFn: (db: IrysDatabase) => Promise<T>,
  options?: { cacheTime?: number }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await queryFn(irysDb);

        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { data, loading, error };
}

export function useIrysMutation<TInput, TOutput>(
  mutationFn: (db: IrysDatabase, input: TInput) => Promise<TOutput>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (input: TInput) => {
    try {
      setLoading(true);
      setError(null);
      const result = await mutationFn(irysDb, input);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}

// 특화된 hooks
export function useProjects(ownerAddress: string) {
  return useIrysQuery('user-projects', async (db) => {
    return await db.getUserProjects(ownerAddress);
  });
}

export function useProject(slug: string) {
  return useIrysQuery(`project-${slug}`, async (db) => {
    return await db.getProjectBySlug(slug);
  });
}

export function useDocuments(projectId: string) {
  return useIrysQuery(`project-documents-${projectId}`, async (db) => {
    return await db.getProjectDocuments(projectId);
  });
}
```

### 3. 전역 상태 (선택적)

```typescript
// apps/web-vite/src/lib/irys-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IrysStore {
  // 캐시된 데이터
  projects: Map<string, Project>;
  documents: Map<string, Document>;

  // 액션
  setProject: (project: Project) => void;
  setDocument: (doc: Document) => void;
  invalidateProject: (entityId: string) => void;
  invalidateDocument: (entityId: string) => void;

  // 낙관적 업데이트
  optimisticProjects: Map<string, Project>;
  addOptimisticProject: (project: Project) => void;
  removeOptimisticProject: (entityId: string) => void;
}

export const useIrysStore = create<IrysStore>()(
  persist(
    (set) => ({
      projects: new Map(),
      documents: new Map(),
      optimisticProjects: new Map(),

      setProject: (project) =>
        set((state) => ({
          projects: new Map(state.projects).set(project.entityId, project)
        })),

      setDocument: (doc) =>
        set((state) => ({
          documents: new Map(state.documents).set(doc.entityId, doc)
        })),

      invalidateProject: (entityId) =>
        set((state) => {
          const newProjects = new Map(state.projects);
          newProjects.delete(entityId);
          return { projects: newProjects };
        }),

      invalidateDocument: (entityId) =>
        set((state) => {
          const newDocuments = new Map(state.documents);
          newDocuments.delete(entityId);
          return { documents: newDocuments };
        }),

      addOptimisticProject: (project) =>
        set((state) => ({
          optimisticProjects: new Map(state.optimisticProjects).set(
            project.entityId,
            project
          )
        })),

      removeOptimisticProject: (entityId) =>
        set((state) => {
          const newOptimistic = new Map(state.optimisticProjects);
          newOptimistic.delete(entityId);
          return { optimisticProjects: newOptimistic };
        })
    }),
    {
      name: 'irys-storage'
    }
  )
);
```

---

## 🎯 마이그레이션 단계별 가이드

### Step 1: Irys 클라이언트 설치

```bash
cd apps/web-vite
pnpm add @irys/query @irys/upload @irys/sdk idb zustand
```

### Step 2: IrysDatabase 구현

```bash
# 파일 생성
touch src/lib/irys-database.ts
touch src/lib/irys-hooks.ts
touch src/lib/irys-types.ts
touch src/lib/irys-cache.ts

# 구현 (위의 코드 참고)
```

### Step 3: 한 페이지씩 전환

```bash
# 예: Projects 페이지부터 시작
# 1. GraphQL 쿼리 제거
# 2. useIrysQuery로 대체
# 3. 테스트
# 4. 다음 페이지로
```

### Step 4: API 서버 제거

```bash
# 모든 페이지 전환 완료 후
rm -rf apps/api
git commit -m "Remove PostgreSQL/API server - 100% Irys-Only"
```

### Step 5: 배포 간소화

```bash
# Vercel/Netlify에 정적 사이트로 배포
# 서버 불필요!

vercel --prod
# 또는
netlify deploy --prod
```

---

## 📊 Before/After 비교

### Before (하이브리드):

```
인프라:
- PostgreSQL 서버 ($5-25/월)
- API 서버 ($10-50/월)
- Redis ($5/월)
- Irys ($0.01/월)
총: $20-85/월

코드베이스:
- apps/api/ (백엔드)
- apps/web-vite/ (프론트엔드)
- 총 라인: ~15,000 LOC

배포:
- Railway/Heroku (API)
- Vercel (Frontend)
- 2개 배포 프로세스

의존성:
- Prisma
- Apollo Server
- GraphQL
- PostgreSQL
- Redis
```

### After (Irys-Only):

```
인프라:
- Irys ($0.01/월)
총: $0.01/월 (99.9% 절감!)

코드베이스:
- apps/web-vite/ (프론트엔드만)
- 총 라인: ~8,000 LOC (47% 감소)

배포:
- Vercel/Netlify (정적 사이트)
- 1개 배포 프로세스

의존성:
- @irys/query
- @irys/upload
- idb
```

---

## ⚠️ 주의사항

### 1. 데이터 마이그레이션

기존 PostgreSQL 데이터를 Irys로 이전:

```typescript
// migration script
async function migrateToIrys() {
  const prisma = new PrismaClient();

  // 모든 프로젝트 가져오기
  const projects = await prisma.project.findMany();

  for (const project of projects) {
    // Irys에 업로드
    await irysDb.createProject({
      entityId: project.id,
      name: project.name,
      slug: project.slug,
      owner: project.ownerId,
      // ...
    });

    console.log('Migrated:', project.name);
  }

  console.log('Migration complete!');
}
```

### 2. 점진적 전환

```typescript
// 하이브리드 기간 동안 둘 다 지원
async function getProject(slug: string) {
  // Irys 먼저 시도
  try {
    const irysProject = await irysDb.getProjectBySlug(slug);
    if (irysProject) return irysProject;
  } catch (err) {
    console.warn('Irys failed, falling back to PostgreSQL');
  }

  // 실패 시 PostgreSQL
  return await prisma.project.findUnique({ where: { slug } });
}
```

### 3. 백업

```bash
# PostgreSQL 데이터 백업
pg_dump $DATABASE_URL > backup.sql

# Irys 업로드 후 검증
# 완전 전환 후 PostgreSQL 종료
```

---

## 🚀 시작하기

```bash
# 1. 브랜치 생성
git checkout -b irys-only-migration

# 2. Irys 클라이언트 구현
# (위의 코드 참고)

# 3. 한 페이지씩 전환
# Projects → Documents → Dashboard → ...

# 4. 테스트
pnpm test

# 5. API 서버 제거
rm -rf apps/api

# 6. 배포
vercel --prod

# 7. 승리! 🎉
```

---

## ✅ 완료 기준

- [ ] PostgreSQL 의존성 0개
- [ ] API 서버 제거
- [ ] 모든 CRUD 작업 Irys로 전환
- [ ] IndexedDB 캐싱 작동
- [ ] 평균 쿼리 시간 < 300ms
- [ ] 캐시 히트율 > 80%
- [ ] 오프라인 모드 작동
- [ ] 배포 성공 (정적 사이트)

---

**준비됐습니다. 시작하시겠습니까? 🚀**
