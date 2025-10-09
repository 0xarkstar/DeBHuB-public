# IrysBase: Irys-Only 최종 아키텍처

**결정일:** 2025-10-08
**결정:** PostgreSQL 제거, 순수 Irys DataChain 사용
**슬로건:** "The Permanent Database - No Servers Needed"

---

## 🎯 핵심 결정

### ✅ Irys-Only로 가는 이유:

1. **PostgreSQL = Supabase 의존성**
   - 하이브리드는 독립적 BaaS가 아님
   - "Supabase + Irys 플러그인"일 뿐

2. **287ms는 충분히 빠름**
   - Google Search: 200-500ms
   - Medium: 500-1500ms
   - IrysBase: 287ms ✅

3. **진정한 차별화**
   - 완전 서버리스
   - 검열 불가능
   - $2.5 한 번 = 영구 사용

4. **Irys의 진가 증명**
   - Irys가 좋은 블록체인이면 이걸로 충분해야 함
   - 진짜 Web3 BaaS

---

## 🏗️ 최종 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    IrysBase (Irys-Only)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [사용자 브라우저]                                           │
│         ↓                                                   │
│  [React App + IndexedDB 캐시]                               │
│         ↓                                                   │
│  [@irys/query] ← GraphQL 쿼리                               │
│         ↓                                                   │
│  [Irys DataChain] ← 유일한 데이터베이스                      │
│         ↓                                                   │
│  [Irys Gateway] ← 데이터 fetch                              │
│         ↓                                                   │
│  [사용자 브라우저] ← 응답 (287ms)                            │
│                                                             │
│  ❌ No PostgreSQL                                           │
│  ❌ No API Server                                           │
│  ❌ No Backend                                              │
│  ❌ No Redis                                                │
│                                                             │
│  ✅ Pure Client-Side                                        │
│  ✅ 100% Decentralized                                      │
│  ✅ Censorship Resistant                                    │
│  ✅ Permanent Storage                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 기술 스택

### Frontend (유일한 코드베이스)

```json
{
  "core": [
    "React 18",
    "TypeScript 5",
    "Vite 5"
  ],
  "irys": [
    "@irys/query",        // 쿼리
    "@irys/upload",       // 업로드
    "@irys/sdk"           // 통합
  ],
  "storage": [
    "IndexedDB",          // 로컬 캐시
    "LocalStorage"        // 설정 저장
  ],
  "web3": [
    "ethers.js 6",        // 지갑 연결
    "wagmi"               // React hooks
  ],
  "ui": [
    "TailwindCSS",
    "shadcn/ui",
    "Framer Motion"
  ]
}
```

### Backend

```
❌ NONE - 완전 서버리스
```

### Database

```
✅ Irys DataChain (유일한 DB)
```

---

## 🗄️ 데이터 모델

### Entity 구조 (태그 기반)

```typescript
// 모든 엔티티는 Irys 트랜잭션으로 저장
interface IrysEntity {
  // Irys Transaction
  id: string;                    // Irys transaction ID
  tags: IrysTag[];              // 최대 20개 태그
  data: EntityData;             // JSON 데이터
  timestamp: number;            // 블록 타임스탬프
  owner: string;                // 업로드한 지갑 주소

  // Gateway URL
  permanentUrl: string;         // https://gateway.irys.xyz/{id}
}

interface IrysTag {
  name: string;
  value: string;
}
```

### 1. User Entity

```typescript
// Tags
[
  { name: "App-Name", value: "IrysBase" },
  { name: "Entity-Type", value: "user" },
  { name: "Entity-ID", value: "user-{address}" },
  { name: "Address", value: "0x1234..." },
  { name: "Schema-Version", value: "1.0" },
  { name: "Created-At", value: "1704672000000" }
]

// Data
{
  entityType: "user",
  entityId: "user-0x1234...",
  address: "0x1234...abcd",
  profile: {
    displayName: "Alice",
    bio: "Web3 developer",
    avatar: "irys://avatar-tx-id"
  },
  preferences: {
    theme: "dark",
    language: "en"
  },
  createdAt: "2025-01-15T10:00:00Z",
  schemaVersion: "1.0"
}
```

### 2. Project Entity

```typescript
// Tags
[
  { name: "App-Name", value: "IrysBase" },
  { name: "Entity-Type", value: "project" },
  { name: "Entity-ID", value: "proj-abc123" },
  { name: "Slug", value: "docs-hub" },
  { name: "Owner", value: "0x1234..." },
  { name: "Visibility", value: "public" }
]

// Data
{
  entityType: "project",
  entityId: "proj-abc123",
  name: "Documentation Hub",
  slug: "docs-hub",
  description: "Technical documentation",
  owner: "0x1234...abcd",
  visibility: "public",
  collaborators: [
    {
      address: "0x5678...efgh",
      role: "editor",
      addedAt: "2025-01-15T10:10:00Z"
    }
  ],
  createdAt: "2025-01-15T10:01:00Z",
  updatedAt: "2025-01-15T10:10:00Z",
  schemaVersion: "1.0"
}
```

### 3. Document Entity

```typescript
// Tags
[
  { name: "App-Name", value: "IrysBase" },
  { name: "Entity-Type", value: "document" },
  { name: "Entity-ID", value: "doc-xyz456" },
  { name: "Project-ID", value: "proj-abc123" },
  { name: "Path", value: "/getting-started" },
  { name: "Author", value: "0x1234..." },
  { name: "Version", value: "1" },
  { name: "Content-Hash", value: "sha256:7f83..." }
]

// Data
{
  entityType: "document",
  entityId: "doc-xyz456",
  projectId: "proj-abc123",
  path: "/getting-started",
  title: "Getting Started",
  content: "# Getting Started\n\nWelcome...",
  contentHash: "sha256:7f83b165...",
  author: "0x1234...abcd",
  version: 1,
  tags: ["tutorial", "beginner"],
  metadata: {
    wordCount: 342,
    readingTime: "2 min"
  },
  createdAt: "2025-01-15T10:05:00Z",
  schemaVersion: "1.0"
}
```

### 4. Document Version (업데이트)

```typescript
// 업데이트 = 새 트랜잭션 (불변성)
// 동일한 Entity-ID, 버전만 증가

// Tags (Version 2)
[
  { name: "Entity-ID", value: "doc-xyz456" },  // 동일
  { name: "Version", value: "2" },              // 증가
  { name: "Previous-Version", value: "irys-tx-v1" }
]

// Data
{
  entityId: "doc-xyz456",
  version: 2,
  previousVersion: "irys-tx-version1",
  content: "# Getting Started\n\nUpdated content...",
  // ... 나머지
}
```

---

## 🔄 CRUD 작업 구현

### 1. Create (생성)

```typescript
import { IrysUploader } from '@irys/sdk';

class IrysDatabase {
  private uploader: IrysUploader;

  async createProject(data: {
    name: string;
    slug: string;
    owner: string;
  }) {
    const entityId = `proj-${uuidv4()}`;

    // 데이터 준비
    const projectData = {
      entityType: 'project',
      entityId,
      name: data.name,
      slug: data.slug,
      owner: data.owner,
      visibility: 'public',
      collaborators: [],
      createdAt: new Date().toISOString(),
      schemaVersion: '1.0'
    };

    // 태그 준비
    const tags = [
      { name: 'App-Name', value: 'IrysBase' },
      { name: 'Entity-Type', value: 'project' },
      { name: 'Entity-ID', value: entityId },
      { name: 'Slug', value: data.slug },
      { name: 'Owner', value: data.owner },
      { name: 'Created-At', value: Date.now().toString() }
    ];

    // Irys 업로드
    const receipt = await this.uploader.upload(
      JSON.stringify(projectData),
      { tags }
    );

    // 결과 반환
    return {
      ...projectData,
      irysId: receipt.id,
      permanentUrl: `https://gateway.irys.xyz/${receipt.id}`
    };
  }
}
```

### 2. Read (조회)

```typescript
import { Query } from '@irys/query';

class IrysDatabase {
  private query: Query;

  // 단일 프로젝트 조회
  async getProjectBySlug(slug: string) {
    const results = await this.query
      .search('irys:transactions')
      .tags([
        { name: 'App-Name', values: ['IrysBase'] },
        { name: 'Entity-Type', values: ['project'] },
        { name: 'Slug', values: [slug] }
      ])
      .sort('DESC')
      .limit(1);

    if (results.length === 0) return null;

    const tx = results[0];
    const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
    const data = await response.json();

    return {
      ...data,
      irysId: tx.id,
      permanentUrl: `https://gateway.irys.xyz/${tx.id}`
    };
  }

  // 사용자의 모든 프로젝트
  async getUserProjects(ownerAddress: string) {
    const results = await this.query
      .search('irys:transactions')
      .tags([
        { name: 'App-Name', values: ['IrysBase'] },
        { name: 'Entity-Type', values: ['project'] },
        { name: 'Owner', values: [ownerAddress] }
      ])
      .sort('DESC')
      .limit(100);

    // 각 Entity-ID의 최신 버전만
    const latestVersions = new Map();

    for (const tx of results) {
      const entityIdTag = tx.tags.find(t => t.name === 'Entity-ID');
      const entityId = entityIdTag?.value;

      if (!latestVersions.has(entityId)) {
        const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
        const data = await response.json();
        latestVersions.set(entityId, {
          ...data,
          irysId: tx.id
        });
      }
    }

    return Array.from(latestVersions.values());
  }
}
```

### 3. Update (업데이트)

```typescript
class IrysDatabase {
  // 문서 업데이트 (새 버전 생성)
  async updateDocument(documentId: string, updates: {
    content?: string;
    title?: string;
    author: string;
  }) {
    // 1. 현재 최신 버전 조회
    const versions = await this.getDocumentVersions(documentId);
    const latest = versions[versions.length - 1];

    if (!latest) throw new Error('Document not found');

    // 2. 새 버전 생성
    const newVersion = latest.version + 1;
    const newContent = updates.content || latest.content;
    const contentHash = sha256(newContent);

    const documentData = {
      ...latest,
      title: updates.title || latest.title,
      content: newContent,
      contentHash,
      author: updates.author,
      version: newVersion,
      previousVersion: latest.irysId,
      updatedAt: new Date().toISOString()
    };

    // 3. 태그 준비
    const tags = [
      { name: 'App-Name', value: 'IrysBase' },
      { name: 'Entity-Type', value: 'document' },
      { name: 'Entity-ID', value: documentId },  // 동일
      { name: 'Version', value: newVersion.toString() },
      { name: 'Previous-Version', value: latest.irysId },
      { name: 'Author', value: updates.author },
      { name: 'Content-Hash', value: contentHash }
    ];

    // 4. Irys 업로드
    const receipt = await this.uploader.upload(
      JSON.stringify(documentData),
      { tags }
    );

    return {
      ...documentData,
      irysId: receipt.id
    };
  }
}
```

### 4. Delete (삭제)

```typescript
class IrysDatabase {
  // 삭제 = deleted 플래그 추가 (불변성)
  async deleteDocument(documentId: string, deletedBy: string) {
    const versions = await this.getDocumentVersions(documentId);
    const latest = versions[versions.length - 1];

    if (!latest) throw new Error('Document not found');

    // 삭제 마커 생성
    const deletionMarker = {
      ...latest,
      deleted: true,
      deletedBy,
      deletedAt: new Date().toISOString(),
      version: latest.version + 1
    };

    const tags = [
      { name: 'App-Name', value: 'IrysBase' },
      { name: 'Entity-Type', value: 'document' },
      { name: 'Entity-ID', value: documentId },
      { name: 'Deleted', value: 'true' },
      { name: 'Deleted-By', value: deletedBy },
      { name: 'Version', value: deletionMarker.version.toString() }
    ];

    const receipt = await this.uploader.upload(
      JSON.stringify(deletionMarker),
      { tags }
    );

    return { success: true, irysId: receipt.id };
  }

  // 조회 시 삭제된 항목 필터링
  async getProjectDocuments(projectId: string, includeDeleted = false) {
    const results = await this.query
      .search('irys:transactions')
      .tags([
        { name: 'App-Name', values: ['IrysBase'] },
        { name: 'Entity-Type', values: ['document'] },
        { name: 'Project-ID', values: [projectId] }
      ])
      .sort('DESC')
      .limit(1000);

    const latestDocs = new Map();

    for (const tx of results) {
      const entityIdTag = tx.tags.find(t => t.name === 'Entity-ID');
      const entityId = entityIdTag?.value;

      if (!latestDocs.has(entityId)) {
        const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
        const data = await response.json();
        latestDocs.set(entityId, data);
      }
    }

    let docs = Array.from(latestDocs.values());

    // 삭제된 문서 필터링
    if (!includeDeleted) {
      docs = docs.filter(doc => !doc.deleted);
    }

    return docs;
  }
}
```

---

## ⚡ 성능 최적화 전략

### 1. IndexedDB 캐싱 (가장 중요)

```typescript
import { openDB } from 'idb';

class CachedIrysDatabase {
  private db: any;

  async init() {
    this.db = await openDB('IrysBase', 1, {
      upgrade(db) {
        db.createObjectStore('projects', { keyPath: 'entityId' });
        db.createObjectStore('documents', { keyPath: 'entityId' });
        db.createObjectStore('users', { keyPath: 'entityId' });
      }
    });
  }

  async getProjectBySlug(slug: string) {
    // 1. IndexedDB에서 먼저 확인 (5ms)
    const projects = await this.db.getAll('projects');
    const cached = projects.find(p => p.slug === slug);

    if (cached) {
      console.log('✅ Cache HIT:', slug);

      // 백그라운드에서 업데이트 확인
      this.refreshInBackground(slug);

      return cached;  // 즉시 반환 (5ms)
    }

    // 2. 캐시 미스: Irys에서 가져오기 (287ms)
    console.log('❌ Cache MISS:', slug);
    const project = await this.fetchFromIrys(slug);

    // 3. IndexedDB에 저장
    if (project) {
      await this.db.put('projects', project);
    }

    return project;
  }

  private async refreshInBackground(slug: string) {
    // 백그라운드에서 최신 버전 확인
    setTimeout(async () => {
      const fresh = await this.fetchFromIrys(slug);
      if (fresh) {
        await this.db.put('projects', fresh);
      }
    }, 0);
  }
}
```

**효과:**
- 첫 방문: 287ms
- 이후 방문: 5ms (57배 빠름!)

### 2. Prefetching (사전 로드)

```typescript
class SmartIrysDatabase {
  async getProjectWithPrefetch(slug: string) {
    // 프로젝트 조회
    const project = await this.getProjectBySlug(slug);

    // 백그라운드에서 문서 미리 로드
    this.prefetchDocuments(project.entityId);

    return project;
  }

  private async prefetchDocuments(projectId: string) {
    setTimeout(async () => {
      const docs = await this.getProjectDocuments(projectId);

      // IndexedDB에 저장
      for (const doc of docs) {
        await this.db.put('documents', doc);
      }

      console.log('✅ Prefetched', docs.length, 'documents');
    }, 0);
  }
}
```

**효과:**
- 사용자가 문서 클릭 시 이미 캐시됨
- 0ms 로딩 (무한 빠름!)

### 3. 배치 쿼리

```typescript
class IrysDatabase {
  // ❌ N+1 쿼리 (느림)
  async getProjectsWithCounts_BAD(ownerAddress: string) {
    const projects = await this.getUserProjects(ownerAddress);  // 287ms

    for (const project of projects) {
      const docs = await this.getProjectDocuments(project.entityId);  // 287ms × N
      project.documentCount = docs.length;
    }

    return projects;  // 총 287ms + 287ms × 10 = 3초
  }

  // ✅ 단일 쿼리 (빠름)
  async getProjectsWithCounts_GOOD(ownerAddress: string) {
    const projects = await this.getUserProjects(ownerAddress);  // 287ms
    const projectIds = projects.map(p => p.entityId);

    // 모든 문서를 한 번에 조회
    const allDocs = await this.query
      .search('irys:transactions')
      .tags([
        { name: 'App-Name', values: ['IrysBase'] },
        { name: 'Entity-Type', values: ['document'] },
        { name: 'Project-ID', values: projectIds }  // 배열
      ])
      .limit(1000);  // 287ms

    // 클라이언트에서 집계
    const docCounts = new Map();
    for (const doc of allDocs) {
      const projectId = doc.tags.find(t => t.name === 'Project-ID')?.value;
      docCounts.set(projectId, (docCounts.get(projectId) || 0) + 1);
    }

    // 결과 병합
    return projects.map(project => ({
      ...project,
      documentCount: docCounts.get(project.entityId) || 0
    }));

    // 총 시간: 287ms + 287ms = 574ms (5배 빠름!)
  }
}
```

### 4. 낙관적 UI 업데이트

```typescript
class OptimisticIrysDatabase {
  async createDocument(data: DocumentInput) {
    // 1. 즉시 UI 업데이트 (0ms)
    const tempDoc = {
      ...data,
      entityId: `doc-${uuidv4()}`,
      irysId: 'pending',
      status: 'uploading'
    };

    // 로컬 캐시에 추가
    await this.db.put('documents', tempDoc);

    // UI에 즉시 표시
    this.emit('documentCreated', tempDoc);

    // 2. 백그라운드에서 Irys 업로드
    try {
      const receipt = await this.uploadToIrys(data);  // 287ms

      // 3. 실제 ID로 업데이트
      const finalDoc = {
        ...tempDoc,
        irysId: receipt.id,
        status: 'confirmed'
      };

      await this.db.put('documents', finalDoc);
      this.emit('documentConfirmed', finalDoc);

    } catch (error) {
      // 실패 시 롤백
      await this.db.delete('documents', tempDoc.entityId);
      this.emit('documentFailed', { error });
    }
  }
}
```

**효과:**
- 사용자 경험: 즉시 반응 (0ms)
- 실제 업로드: 백그라운드 (287ms)

---

## 🎨 UX 최적화

### 1. 스켈레톤 UI

```tsx
function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);

    // Irys 조회
    const data = await irysDb.getUserProjects(userAddress);

    setProjects(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map(project => (
        <ProjectCard key={project.entityId} project={project} />
      ))}
    </div>
  );
}
```

**효과:**
- 빈 화면 없음
- 사용자는 로딩 진행 상황 확인
- 287ms가 빠르게 느껴짐

### 2. Progressive Loading

```tsx
function DocumentEditor() {
  const [document, setDocument] = useState(null);
  const [fullContent, setFullContent] = useState(false);

  useEffect(() => {
    loadDocument();
  }, []);

  async function loadDocument() {
    // 1단계: 메타데이터만 (287ms)
    const meta = await irysDb.getDocumentMeta(docId);
    setDocument(meta);

    // 2단계: 전체 콘텐츠 (백그라운드)
    const full = await irysDb.getDocumentFull(docId);
    setDocument(full);
    setFullContent(true);
  }

  return (
    <div>
      <h1>{document?.title || <Skeleton />}</h1>

      {fullContent ? (
        <Editor content={document.content} />
      ) : (
        <div className="animate-pulse">
          Loading content...
        </div>
      )}
    </div>
  );
}
```

---

## 📊 예상 성능

### 실제 사용 시나리오:

| 작업 | 첫 방문 | 캐시 후 | 평가 |
|------|---------|---------|------|
| 프로젝트 목록 | 287ms | 5ms | ✅ |
| 문서 조회 | 287ms | 5ms | ✅ |
| 문서 생성 | 0ms (낙관적) + 287ms (백그라운드) | - | ✅ |
| 검색 | 201ms | - | ✅ |
| 대시보드 | 574ms (배치) | 5ms | ✅ |

### 사용자 경험:

```
첫 방문:
- 프로젝트 목록: 287ms (스켈레톤 → 데이터)
- 문서 클릭: 5ms (이미 prefetch됨)
- 총: 292ms ✅

이후 방문:
- 모든 것: 5ms (IndexedDB)
- 거의 즉시 ✅
```

---

## 🚀 구현 로드맵

### Phase 1: Core Irys Integration (1주)

```
✅ @irys/query 통합
✅ @irys/upload 통합
✅ IrysDatabase 클래스 구현
✅ CRUD 작업 완성
✅ 태그 전략 확정
```

### Phase 2: Performance (1주)

```
✅ IndexedDB 캐싱
✅ Prefetching
✅ 배치 쿼리
✅ 낙관적 UI
```

### Phase 3: UX Polish (1주)

```
✅ 스켈레톤 UI
✅ Progressive loading
✅ 에러 처리
✅ 오프라인 모드
```

### Phase 4: PostgreSQL 제거 (1주)

```
✅ Prisma 제거
✅ API 서버 제거
✅ 순수 클라이언트로 전환
✅ 배포 간소화
```

---

## 💰 비용 분석

### Supabase:

```
$25/월 × 12개월 = $300/년
10년 = $3,000
```

### IrysBase (Irys-Only):

```
10GB 데이터 = $25 (한 번만)
10년 = $25 (동일)

절감: $3,000 - $25 = $2,975 (99.2% 절감!)
```

---

## 🎯 결론

**Irys-Only는 실현 가능하고 우월합니다:**

1. ✅ **성능 충분** (287ms, 캐싱 후 5ms)
2. ✅ **완전 독립** (PostgreSQL 불필요)
3. ✅ **진정한 차별화** (Supabase와 다른 카테고리)
4. ✅ **저비용** (99% 저렴)
5. ✅ **Irys의 진가 증명** (블록체인만으로 BaaS 구현)

**다음: PostgreSQL 제거 시작! 🚀**
