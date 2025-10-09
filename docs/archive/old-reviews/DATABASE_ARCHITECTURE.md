# IrysBase 데이터베이스 아키텍처 상세 분석

## 🔍 핵심 결론

**IrysBase는 하이브리드 데이터베이스 아키텍처를 사용합니다:**
- **PostgreSQL**: 빠른 쿼리, 관계형 데이터, 실시간 협업을 위한 주 데이터베이스
- **Irys DataChain**: 영구 저장소, 불변성 증명, 블록체인 보장을 위한 보조 저장소
- **Redis**: 캐시 레이어 (선택적)

**Irys만 사용하는 것이 아닙니다.** PostgreSQL이 주 데이터베이스이며, Irys는 데이터의 영구성과 불변성을 보장하기 위한 백업/증명 레이어로 사용됩니다.

---

## 📊 데이터베이스 스키마 구조

### 1. 핵심 엔티티 모델

```
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User ─┬─→ Project ─┬─→ Document ─┬─→ Version                   │
│        │            │              │                             │
│        │            │              ├─→ Comment                   │
│        │            │              │                             │
│        │            │              └─→ IrysTransaction           │
│        │            │                                            │
│        │            └─→ Collaborator                             │
│        │                                                         │
│        ├─→ Document                                              │
│        │                                                         │
│        ├─→ Comment                                               │
│        │                                                         │
│        └─→ Version                                               │
│                                                                  │
│  Additional Models:                                              │
│  - VectorEmbedding (AI 검색)                                     │
│  - AIAnalysis (AI 분석 결과)                                     │
│  - ProgrammableDataRule (자동화 규칙)                            │
│  - UserExtended (사용자 프로필)                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 비동기 업로드
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Irys DataChain                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  - 프로젝트 메타데이터 (영구 저장)                               │
│  - 문서 전체 내용 (불변 저장)                                    │
│  - 버전 스냅샷 (Git-like 히스토리)                               │
│  - 트랜잭션 ID를 통한 증명                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 실제 사용자 시나리오별 데이터 흐름

### 시나리오 1: 사용자 Alice가 새 프로젝트 생성

#### 단계별 데이터베이스 작업:

```
1️⃣ Alice가 지갑 연결 (0x1234...abcd)

   ┌─────────────────────────────────────┐
   │ PostgreSQL: users 테이블             │
   ├─────────────────────────────────────┤
   │ id: clx1...                         │
   │ address: 0x1234...abcd              │
   │ role: null                          │
   │ createdAt: 2025-01-15T10:00:00Z     │
   └─────────────────────────────────────┘

   JWT 토큰 생성 → localStorage에 저장


2️⃣ Alice가 "Documentation Hub" 프로젝트 생성

   Frontend 요청:
   mutation {
     createProject(input: {
       name: "Documentation Hub"
       slug: "docs-hub"
       description: "Technical documentation"
       visibility: "PUBLIC"
     })
   }

   Backend 처리:

   a) PostgreSQL에 프로젝트 생성
   ┌─────────────────────────────────────┐
   │ PostgreSQL: projects 테이블          │
   ├─────────────────────────────────────┤
   │ id: clx2...                         │
   │ name: Documentation Hub             │
   │ slug: docs-hub                      │
   │ description: Technical documentation│
   │ ownerId: clx1... (Alice의 user.id)  │
   │ visibility: PUBLIC                  │
   │ settings: {}                        │
   │ irysId: null ← 아직 없음             │
   │ permanentUrl: null                  │
   │ createdAt: 2025-01-15T10:01:00Z     │
   └─────────────────────────────────────┘

   b) 백그라운드에서 Irys 업로드 (비동기)

   setImmediate(() => {
     // 프로젝트 메타데이터 JSON 생성
     metadata = {
       type: 'project',
       projectId: 'clx2...',
       name: 'Documentation Hub',
       slug: 'docs-hub',
       createdAt: '2025-01-15T10:01:00Z'
     }

     // Irys에 업로드
     irysId = await irysService.uploadData(
       JSON.stringify(metadata),
       tags: [
         { name: 'Content-Type', value: 'application/json' },
         { name: 'entity-type', value: 'project' },
         { name: 'project-id', value: 'clx2...' }
       ]
     )

     // PostgreSQL 업데이트
     UPDATE projects
     SET irysId = 'irys-tx-abc123',
         permanentUrl = 'https://gateway.irys.xyz/irys-tx-abc123'
     WHERE id = 'clx2...'
   })

   결과 (업데이트 후):
   ┌─────────────────────────────────────┐
   │ PostgreSQL: projects 테이블          │
   ├─────────────────────────────────────┤
   │ id: clx2...                         │
   │ name: Documentation Hub             │
   │ irysId: irys-tx-abc123 ✅           │
   │ permanentUrl: https://...abc123 ✅  │
   └─────────────────────────────────────┘

   c) WebSocket 이벤트 발행
   pubsub.publish(PROJECT_UPDATED, {
     type: 'CREATED',
     projectId: 'clx2...',
     data: { ... }
   })


3️⃣ Alice가 "Getting Started" 문서 생성

   Frontend 요청:
   mutation {
     createDocument(input: {
       projectId: "clx2..."
       path: "/getting-started"
       title: "Getting Started"
       content: "# Getting Started\n\nWelcome to our docs..."
       tags: ["tutorial", "beginner"]
     })
   }

   Backend 처리:

   a) 콘텐츠 해시 생성
   contentHash = sha256("# Getting Started\n\nWelcome...")
                = "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"

   b) PostgreSQL에 문서 저장
   ┌─────────────────────────────────────┐
   │ PostgreSQL: documents 테이블         │
   ├─────────────────────────────────────┤
   │ id: clx3...                         │
   │ projectId: clx2...                  │
   │ path: /getting-started              │
   │ title: Getting Started              │
   │ content: # Getting Started\n...     │
   │ contentHash: 7f83b165...            │
   │ authorId: clx1... (Alice)           │
   │ version: 1                          │
   │ tags: ["tutorial", "beginner"]      │
   │ irysId: null ← 백그라운드에서 처리됨 │
   │ createdAt: 2025-01-15T10:05:00Z     │
   └─────────────────────────────────────┘

   c) 백그라운드 Irys 업로드

   setImmediate(async () => {
     // 문서 전체 데이터 생성
     docData = {
       id: 'clx3...',
       title: 'Getting Started',
       content: '# Getting Started\n\nWelcome...',
       projectId: 'clx2...',
       authorId: 'clx1...',
       createdAt: '2025-01-15T10:05:00Z'
     }

     // Irys에 업로드 (약 2KB 데이터)
     uploadResult = await storageService.uploadFile(
       'documents',
       {
         name: 'document-clx3....json',
         data: Buffer.from(JSON.stringify(docData)),
         type: 'application/json',
         size: 2048  // bytes
       }
     )

     // PostgreSQL 업데이트 (문서)
     UPDATE documents
     SET irysId = 'irys-tx-def456',
         irysProof = '{"signature": "...", "timestamp": ...}'
     WHERE id = 'clx3...'

     // PostgreSQL에 트랜잭션 기록
     INSERT INTO irys_transactions (
       transactionId: 'irys-tx-def456',
       type: 'upload',
       status: 'confirmed',
       size: 2048,
       cost: 0.0000051,  // $2.5/GB 기준 계산
       documentId: 'clx3...',
       gatewayUrl: 'https://gateway.irys.xyz/irys-tx-def456',
       receipt: { ... },
       confirmedAt: NOW()
     )
   })

   결과 (업데이트 후):
   ┌─────────────────────────────────────┐
   │ PostgreSQL: documents               │
   ├─────────────────────────────────────┤
   │ id: clx3...                         │
   │ irysId: irys-tx-def456 ✅           │
   │ irysProof: {"signature": ...} ✅    │
   └─────────────────────────────────────┘

   ┌─────────────────────────────────────┐
   │ PostgreSQL: irys_transactions       │
   ├─────────────────────────────────────┤
   │ id: clx4...                         │
   │ transactionId: irys-tx-def456       │
   │ type: upload                        │
   │ status: confirmed                   │
   │ size: 2048 bytes                    │
   │ cost: 0.0000051 USD                 │
   │ documentId: clx3...                 │
   │ gatewayUrl: https://...def456       │
   │ confirmedAt: 2025-01-15T10:05:03Z   │
   └─────────────────────────────────────┘

   d) WebSocket 이벤트
   pubsub.publish(DOCUMENT_CHANGED, {
     type: 'CREATED',
     documentId: 'clx3...',
     userId: 'clx1...'
   })
```

---

### 시나리오 2: Bob이 협업자로 추가되어 문서 수정

```
4️⃣ Alice가 Bob을 협업자로 추가

   mutation {
     addCollaborator(input: {
       projectId: "clx2..."
       userAddress: "0x5678...efgh"
       role: "EDITOR"
     })
   }

   Backend 처리:

   a) Bob의 User 레코드 생성 (없으면)
   ┌─────────────────────────────────────┐
   │ PostgreSQL: users                   │
   ├─────────────────────────────────────┤
   │ id: clx5...                         │
   │ address: 0x5678...efgh (Bob)        │
   └─────────────────────────────────────┘

   b) Collaborator 관계 생성
   ┌─────────────────────────────────────┐
   │ PostgreSQL: collaborators           │
   ├─────────────────────────────────────┤
   │ id: clx6...                         │
   │ projectId: clx2...                  │
   │ userId: clx5... (Bob)               │
   │ role: EDITOR                        │
   │ permissions: []                     │
   │ createdAt: 2025-01-15T10:10:00Z     │
   └─────────────────────────────────────┘


5️⃣ Bob이 문서를 수정

   mutation {
     updateDocument(input: {
       id: "clx3..."
       content: "# Getting Started\n\nWelcome to our docs!\n\n## Installation\n..."
     })
   }

   Backend 처리:

   a) 권한 확인
   SELECT * FROM collaborators
   WHERE projectId = 'clx2...' AND userId = 'clx5...' AND role IN ('EDITOR', 'ADMIN', 'OWNER')
   ✅ Bob은 EDITOR 권한 있음

   b) 새 콘텐츠 해시 생성
   newContentHash = sha256("# Getting Started\n\nWelcome to our docs!\n\n## Installation...")
                  = "9a2f3c8d..."

   c) PostgreSQL 문서 업데이트
   UPDATE documents
   SET content = "# Getting Started\n\nWelcome to our docs!\n\n## Installation...",
       contentHash = "9a2f3c8d...",
       version = 2,  ← 버전 증가
       updatedAt = NOW()
   WHERE id = 'clx3...'

   d) Version 레코드 생성 (Git-like 히스토리)
   ┌─────────────────────────────────────┐
   │ PostgreSQL: versions                │
   ├─────────────────────────────────────┤
   │ id: clx7...                         │
   │ documentId: clx3...                 │
   │ versionNumber: 2                    │
   │ content: # Getting Started\n...     │
   │ contentDiff: Changed from version 1 │
   │ authorId: clx5... (Bob)             │
   │ commitMessage: Update document      │
   │ irysId: null ← 백그라운드 업로드     │
   │ createdAt: 2025-01-15T10:15:00Z     │
   └─────────────────────────────────────┘

   e) 백그라운드 Irys 버전 업로드

   setImmediate(async () => {
     versionData = {
       documentId: 'clx3...',
       versionNumber: 2,
       content: '# Getting Started\n...',
       authorId: 'clx5...',
       timestamp: '2025-01-15T10:15:00Z'
     }

     // Irys에 새 버전 업로드
     irysId = await irysService.uploadData(
       JSON.stringify(versionData),
       tags: [
         { name: 'entity-type', value: 'version' },
         { name: 'document-id', value: 'clx3...' },
         { name: 'version-number', value: '2' }
       ]
     )

     // Version 레코드 업데이트
     UPDATE versions
     SET irysId = 'irys-tx-ghi789'
     WHERE id = 'clx7...'
   })

   f) 실시간 협업 이벤트
   pubsub.publish(DOCUMENT_CHANGED, {
     type: 'UPDATED',
     documentId: 'clx3...',
     userId: 'clx5...',
     change: {
       version: 2,
       updatedBy: 'Bob (0x5678...efgh)'
     }
   })

   → Alice의 브라우저에 실시간 반영 (WebSocket)
```

---

### 시나리오 3: Alice가 Usage Dashboard 확인

```
6️⃣ Alice가 Storage Metrics 조회

   query {
     userStorage {
       totalBytes
       totalGB
       monthlyCostUSD
       projectCount
       projects {
         projectId
         name
         totalGB
       }
     }
   }

   Backend 처리:

   a) Alice의 모든 프로젝트 찾기
   SELECT id FROM projects WHERE ownerId = 'clx1...'
   → ['clx2...']

   b) 각 프로젝트의 Irys 트랜잭션 조회
   SELECT * FROM irys_transactions
   WHERE documentId IN (
     SELECT id FROM documents WHERE projectId = 'clx2...'
   ) AND status = 'confirmed'

   결과:
   ┌────────────────────────────────────────────────┐
   │ transactionId    │ size (bytes) │ cost (USD)   │
   ├────────────────────────────────────────────────┤
   │ irys-tx-def456   │ 2048         │ 0.0000051    │
   │ (더 많은 문서들...)                              │
   └────────────────────────────────────────────────┘

   c) 집계 계산
   totalBytes = SUM(size) = 2048 + ... = 524,288 bytes
   totalGB = 524,288 / (1024^3) = 0.00048828125 GB
   monthlyCostUSD = 0.00048828125 * $2.5 = $0.00122

   Response:
   {
     userStorage: {
       totalBytes: 524288,
       totalGB: 0.00048828125,
       monthlyCostUSD: 0.00122,
       projectCount: 1,
       projects: [
         {
           projectId: "clx2...",
           name: "Documentation Hub",
           totalGB: 0.00048828125,
           documents: [...]
         }
       ]
     }
   }
```

---

## 📁 데이터베이스 테이블 상세

### 주요 테이블 관계도

```
┌────────────┐
│   User     │
└─────┬──────┘
      │ 1
      │
      │ N
┌─────▼──────┐         ┌─────────────┐
│  Project   ├────────►│ Collaborator│
└─────┬──────┘    N    └─────────────┘
      │ 1
      │
      │ N
┌─────▼──────┐         ┌─────────────┐
│ Document   ├────────►│  Version    │
└─────┬──────┘    1:N  └─────────────┘
      │
      ├────────────────►┌─────────────┐
      │            1:N  │  Comment    │
      │                 └─────────────┘
      │
      └────────────────►┌─────────────────────┐
                   1:N  │ IrysTransaction     │
                        └─────────────────────┘
```

### 1. **users** 테이블

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- cuid: clx1abc...
  address TEXT UNIQUE NOT NULL,           -- 지갑 주소: 0x1234...
  role TEXT,                              -- 사용자 역할
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- 예시 데이터:
┌─────────┬──────────────────┬──────┬─────────────────────┐
│ id      │ address          │ role │ created_at          │
├─────────┼──────────────────┼──────┼─────────────────────┤
│ clx1... │ 0x1234...abcd    │ null │ 2025-01-15 10:00:00 │
│ clx5... │ 0x5678...efgh    │ null │ 2025-01-15 10:10:00 │
└─────────┴──────────────────┴──────┴─────────────────────┘
```

### 2. **projects** 테이블

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  owner_id TEXT REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'private',

  -- Irys 영구 저장소 정보
  irys_id TEXT UNIQUE,                    -- Irys 트랜잭션 ID
  permanent_url TEXT,                     -- 영구 URL

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- 예시 데이터:
┌─────────┬──────────────────┬──────────┬──────────┬──────────────────┬────────────────────────┐
│ id      │ name             │ slug     │ owner_id │ irys_id          │ permanent_url          │
├─────────┼──────────────────┼──────────┼──────────┼──────────────────┼────────────────────────┤
│ clx2... │ Documentation Hub│ docs-hub │ clx1...  │ irys-tx-abc123   │ https://...abc123      │
└─────────┴──────────────────┴──────────┴──────────┴──────────────────┴────────────────────────┘
```

### 3. **documents** 테이블 (핵심!)

```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  path TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,                  -- 📝 전체 콘텐츠 (PostgreSQL에 저장)
  content_hash TEXT NOT NULL,             -- SHA-256 해시 (무결성 검증)
  order INTEGER DEFAULT 0,

  -- Irys 영구 저장소
  irys_id TEXT UNIQUE,                    -- 💾 Irys 트랜잭션 ID
  irys_proof TEXT,                        -- 블록체인 증명
  permanent_url TEXT,                     -- 영구 접근 URL

  -- 메타데이터
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- 버전 관리
  version INTEGER DEFAULT 1,

  -- 관계
  author_id TEXT REFERENCES users(id),

  -- 프로그래머블 데이터
  access_rules JSONB,
  triggers JSONB DEFAULT '[]',

  -- AI 기능
  embedding JSONB,                        -- 벡터 임베딩 (1536차원)
  summary TEXT,
  ai_suggestions JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  published_at TIMESTAMP,

  UNIQUE(project_id, path)
);

-- 예시 데이터:
┌─────────┬───────────┬──────────────────┬─────────────────┬─────────────┬──────────────────┬─────────┐
│ id      │ project_id│ path             │ title           │ content_hash│ irys_id          │ version │
├─────────┼───────────┼──────────────────┼─────────────────┼─────────────┼──────────────────┼─────────┤
│ clx3... │ clx2...   │ /getting-started │ Getting Started │ 7f83b165... │ irys-tx-def456   │ 2       │
└─────────┴───────────┴──────────────────┴─────────────────┴─────────────┴──────────────────┴─────────┘

-- 실제 content 필드 예시:
content: "# Getting Started\n\nWelcome to our docs!\n\n## Installation\n\n```bash\nnpm install\n```"
```

### 4. **versions** 테이블 (Git-like 버전 관리)

```sql
CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES documents(id),
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,                  -- 해당 버전의 전체 콘텐츠
  content_diff TEXT,                      -- 이전 버전과의 차이

  -- 블록체인 증명
  irys_id TEXT UNIQUE,                    -- 각 버전도 Irys에 저장
  block_height BIGINT,
  block_hash TEXT,
  signature TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),

  author_id TEXT REFERENCES users(id),
  commit_message TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(document_id, version_number)
);

-- 예시 데이터:
┌─────────┬─────────────┬────────────────┬───────────────────┬──────────────────┬───────────────┐
│ id      │ document_id │ version_number │ author_id         │ irys_id          │ commit_message│
├─────────┼─────────────┼────────────────┼───────────────────┼──────────────────┼───────────────┤
│ clx7... │ clx3...     │ 1              │ clx1... (Alice)   │ irys-tx-jkl101   │ Initial       │
│ clx8... │ clx3...     │ 2              │ clx5... (Bob)     │ irys-tx-ghi789   │ Add install   │
└─────────┴─────────────┴────────────────┴───────────────────┴──────────────────┴───────────────┘
```

### 5. **irys_transactions** 테이블 (Irys 업로드 추적)

```sql
CREATE TABLE irys_transactions (
  id TEXT PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL,    -- Irys 블록체인 트랜잭션 ID
  type TEXT NOT NULL,                     -- 'upload', 'programmable', 'permanent'
  status TEXT NOT NULL,                   -- 'pending', 'confirmed', 'failed'
  size BIGINT NOT NULL,                   -- 바이트 단위 크기
  cost DECIMAL,                           -- USD 비용
  tags JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- 관계
  document_id TEXT REFERENCES documents(id),

  -- Gateway 정보
  gateway_url TEXT,                       -- https://gateway.irys.xyz/{tx_id}
  receipt JSONB,                          -- Irys 영수증

  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);

-- 예시 데이터:
┌─────────┬──────────────────┬──────────┬───────────┬──────┬─────────────┬─────────────┬────────────────────────┐
│ id      │ transaction_id   │ type     │ status    │ size │ cost        │ document_id │ gateway_url            │
├─────────┼──────────────────┼──────────┼───────────┼──────┼─────────────┼─────────────┼────────────────────────┤
│ clx4... │ irys-tx-def456   │ upload   │ confirmed │ 2048 │ 0.0000051   │ clx3...     │ https://...def456      │
│ clx9... │ irys-tx-mno112   │ upload   │ confirmed │ 3584 │ 0.0000089   │ clx10...    │ https://...mno112      │
└─────────┴──────────────────┴──────────┴───────────┴──────┴─────────────┴─────────────┴────────────────────────┘

-- 비용 계산 공식:
cost = (size_in_bytes / (1024^3)) * 2.5  // $2.5 per GB
```

### 6. **collaborators** 테이블

```sql
CREATE TABLE collaborators (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  user_id TEXT REFERENCES users(id),
  role TEXT DEFAULT 'viewer',             -- 'owner', 'admin', 'editor', 'viewer'
  permissions JSONB DEFAULT '[]',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,

  UNIQUE(project_id, user_id)
);

-- 예시 데이터:
┌─────────┬────────────┬─────────┬────────┐
│ id      │ project_id │ user_id │ role   │
├─────────┼────────────┼─────────┼────────┤
│ clx6... │ clx2...    │ clx5... │ editor │
└─────────┴────────────┴─────────┴────────┘
```

### 7. **comments** 테이블

```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES documents(id),
  content TEXT NOT NULL,
  author_id TEXT REFERENCES users(id),

  -- 스레드 (대댓글)
  parent_id TEXT REFERENCES comments(id),

  -- 인라인 코멘트 위치
  position JSONB,                         -- { line: 42, column: 10 }

  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

---

## 🔄 데이터 흐름 패턴

### Pattern 1: 즉시 저장 (PostgreSQL) + 비동기 업로드 (Irys)

```javascript
// 사용자 요청 → 즉시 응답 (빠름)
async createDocument(input) {
  // 1. PostgreSQL에 즉시 저장 (< 10ms)
  const document = await prisma.document.create({
    data: { ...input }
  });

  // 2. 사용자에게 즉시 응답
  return document;  // ✅ 빠른 응답

  // 3. 백그라운드에서 Irys 업로드 (비동기, 수 초 소요)
  setImmediate(async () => {
    try {
      const irysId = await irysService.upload(document);
      await prisma.document.update({
        where: { id: document.id },
        data: { irysId, permanentUrl: `https://...${irysId}` }
      });
    } catch (error) {
      // 실패해도 PostgreSQL에는 이미 저장됨
      console.error('Irys upload failed:', error);
    }
  });
}
```

**장점:**
- ✅ 사용자 경험: 즉각적인 응답 (< 100ms)
- ✅ 데이터 안전성: PostgreSQL에 먼저 저장되므로 데이터 손실 없음
- ✅ 영구성: 백그라운드에서 Irys에 업로드하여 블록체인 증명 획득
- ✅ 복원력: Irys 실패해도 서비스 계속 동작

**단점:**
- ⚠️ 일시적 불일치: irysId가 null인 상태 존재 (몇 초간)
- ⚠️ 추가 저장소 비용: PostgreSQL + Irys 둘 다 사용

### Pattern 2: 쿼리 최적화 (PostgreSQL에서 읽기)

```javascript
// 대부분의 쿼리는 PostgreSQL만 사용
query {
  project(id: "clx2...") {
    name                    // PostgreSQL
    documents {             // PostgreSQL
      title                 // PostgreSQL
      content               // PostgreSQL
      version               // PostgreSQL
    }
  }
}

// Irys는 증명/복구 목적으로만 사용
query {
  document(id: "clx3...") {
    permanentUrl           // Irys URL (읽기 전용)
    irysProof              // 블록체인 증명
  }
}
```

### Pattern 3: 비용 추적 (IrysTransaction 테이블)

```javascript
// 모든 Irys 업로드는 추적됨
await prisma.irysTransaction.create({
  data: {
    transactionId: 'irys-tx-xyz',
    type: 'upload',
    status: 'confirmed',
    size: BigInt(2048),        // 2KB
    cost: 0.0000051,           // $0.0000051
    documentId: 'clx3...',
    confirmedAt: new Date()
  }
});

// 사용량 조회
const userStorage = await prisma.irysTransaction.aggregate({
  where: {
    document: { project: { ownerId: 'clx1...' } },
    status: 'confirmed'
  },
  _sum: { size: true, cost: true }
});

// 결과:
// totalBytes: 1,048,576 (1MB)
// totalCost: $0.00244 (1MB * $2.5/GB)
```

---

## 🔍 Irys의 역할

### Irys는 다음 용도로 사용됩니다:

1. **영구 저장소 (Permanent Storage)**
   - 모든 프로젝트/문서/버전의 스냅샷을 블록체인에 영구 저장
   - 삭제 불가능, 변조 불가능한 기록 유지

2. **불변성 증명 (Immutability Proof)**
   - 각 문서의 `irysId`와 `irysProof`를 통해 블록체인 증명 제공
   - 법적 증거, 저작권 보호, 감사 추적 가능

3. **재해 복구 (Disaster Recovery)**
   - PostgreSQL이 손상되어도 Irys에서 모든 데이터 복구 가능
   - `permanentUrl`을 통해 언제든 원본 접근

4. **분산화 보장 (Decentralization)**
   - 중앙화된 서버 없이도 데이터 접근 가능
   - Irys 게이트웨이: `https://gateway.irys.xyz/{transactionId}`

### Irys를 사용하지 않는 경우:

- ❌ 실시간 쿼리 (너무 느림)
- ❌ 복잡한 관계형 쿼리 (지원 안 됨)
- ❌ 빈번한 업데이트 (비용 문제)
- ❌ 대용량 파일 (비용 문제, 현재는 작은 JSON만)

---

## 💰 비용 분석

### 실제 예시 데이터:

```
Alice의 프로젝트 "Documentation Hub":
- 문서 10개
- 각 문서 평균 5KB
- 평균 버전 3개씩

총 데이터:
- 문서 원본: 10 × 5KB = 50KB
- 버전 히스토리: 10 × 3 × 5KB = 150KB
- 프로젝트 메타데이터: 1KB
──────────────────────────────
총합: 201KB = 0.000196 GB

월간 비용:
0.000196 GB × $2.5/GB = $0.00049 (~$0.0005)
```

### PostgreSQL vs Irys 비용 비교:

| 항목 | PostgreSQL | Irys |
|------|-----------|------|
| 스토리지 | ~$0.10/GB/월 | $2.50/GB (일회성) |
| 쿼리 속도 | < 10ms | 수백 ms ~ 수 초 |
| 영구성 | 백업 필요 | 영구 보장 |
| 비용 (1GB/1년) | $1.20 | $2.50 (한 번만) |

**결론:**
- 읽기/쓰기가 빈번한 데이터 → PostgreSQL
- 한 번 쓰고 영구 보관 → Irys

---

## 🎯 설계 철학 정리

### IrysBase는 하이브리드 접근 방식을 채택합니다:

```
┌───────────────────────────────────────────────────┐
│              IrysBase 아키텍처                     │
├───────────────────────────────────────────────────┤
│                                                   │
│  [PostgreSQL] ← 주 데이터베이스                    │
│   ✓ 빠른 CRUD 작업                                 │
│   ✓ 복잡한 쿼리 (JOIN, 집계)                       │
│   ✓ 실시간 협업                                    │
│   ✓ 버전 관리                                      │
│   ✓ 사용자 인증                                    │
│                                                   │
│  [Irys DataChain] ← 영구 보관 + 증명               │
│   ✓ 불변 저장소                                    │
│   ✓ 블록체인 증명                                  │
│   ✓ 재해 복구                                      │
│   ✓ 분산화 보장                                    │
│                                                   │
│  [Redis] ← 선택적 캐시                             │
│   ✓ 인증 챌린지 임시 저장                          │
│   ✓ Irys 쿼리 결과 캐싱                            │
│                                                   │
└───────────────────────────────────────────────────┘

데이터 흐름:
1. 사용자 요청 → PostgreSQL 저장 (즉시)
2. PostgreSQL → 사용자 응답 (빠름)
3. 백그라운드 → Irys 업로드 (비동기)
4. Irys 확인 → PostgreSQL 업데이트 (irysId 기록)
```

### 왜 Irys만 사용하지 않는가?

**기술적 제약:**
1. ⏱️ **쿼리 속도**: Irys는 GraphQL 쿼리가 느림 (수 초)
2. 🔍 **쿼리 제약**: 복잡한 JOIN, 집계 불가능
3. 💵 **비용**: 모든 업데이트마다 블록체인 비용 발생
4. 🔄 **실시간 협업**: WebSocket 지원 없음

**현실적 필요:**
- 사용자는 < 100ms 응답 기대
- 복잡한 권한 체크 (Collaborator JOIN)
- 빈번한 버전 업데이트
- 실시간 동시 편집

### 하이브리드의 장점:

✅ **최고의 두 세계**
- PostgreSQL의 속도 + Irys의 영구성
- 전통적 DB의 유연성 + 블록체인의 보안성

✅ **단계별 마이그레이션**
- 초기: PostgreSQL만 사용 (빠른 개발)
- 성장: Irys 추가 (영구성 보장)
- 확장: 선택적으로 Irys 활용도 증가

✅ **비용 최적화**
- 자주 바뀌는 데이터 → PostgreSQL (저렴)
- 영구 보관 데이터 → Irys (안전)

---

## 📊 완전한 데이터 예시

### Alice의 전체 데이터베이스 상태:

```
╔══════════════════════════════════════════════════════════════════╗
║                        PostgreSQL Database                        ║
╚══════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────┐
│ Table: users                                                     │
├─────────┬──────────────────┬──────┬─────────────────────────────┤
│ id      │ address          │ role │ created_at                  │
├─────────┼──────────────────┼──────┼─────────────────────────────┤
│ clx1abc │ 0x1234...abcd    │ null │ 2025-01-15 10:00:00         │
│ clx5def │ 0x5678...efgh    │ null │ 2025-01-15 10:10:00         │
└─────────┴──────────────────┴──────┴─────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Table: projects                                                                           │
├─────────┬──────────────────┬──────────┬──────────┬──────────────────┬───────────────────┤
│ id      │ name             │ slug     │ owner_id │ irys_id          │ permanent_url     │
├─────────┼──────────────────┼──────────┼──────────┼──────────────────┼───────────────────┤
│ clx2ghi │ Documentation Hub│ docs-hub │ clx1abc  │ irys-tx-abc123   │ https://...abc123 │
└─────────┴──────────────────┴──────────┴──────────┴──────────────────┴───────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Table: documents                                                                                │
├─────────┬───────────┬──────────────────┬─────────────────┬──────────┬──────────────────┬───────┤
│ id      │ project_id│ path             │ title           │ author_id│ irys_id          │version│
├─────────┼───────────┼──────────────────┼─────────────────┼──────────┼──────────────────┼───────┤
│ clx3jkl │ clx2ghi   │ /getting-started │ Getting Started │ clx1abc  │ irys-tx-def456   │ 2     │
│ clx10mn │ clx2ghi   │ /installation    │ Installation    │ clx1abc  │ irys-tx-mno112   │ 1     │
└─────────┴───────────┴──────────────────┴─────────────────┴──────────┴──────────────────┴───────┘

Document content (clx3jkl):
─────────────────────────────────────────────
# Getting Started

Welcome to our documentation!

## Installation

```bash
npm install @irysbase/sdk
```

## Quick Start

1. Initialize the SDK
2. Create your first project
3. Start building
─────────────────────────────────────────────

┌──────────────────────────────────────────────────────────────────────────────────┐
│ Table: versions                                                                   │
├─────────┬─────────────┬────────────────┬───────────────┬──────────────────┬──────┤
│ id      │ document_id │ version_number │ author_id     │ irys_id          │commit│
├─────────┼─────────────┼────────────────┼───────────────┼──────────────────┼──────┤
│ clx7opq │ clx3jkl     │ 1              │ clx1abc       │ irys-tx-jkl101   │ Init │
│ clx8rst │ clx3jkl     │ 2              │ clx5def (Bob) │ irys-tx-ghi789   │ +inst│
│ clx11uv │ clx10mn     │ 1              │ clx1abc       │ irys-tx-pqr113   │ Init │
└─────────┴─────────────┴────────────────┴───────────────┴──────────────────┴──────┘

┌──────────────────────────────────────────────────────────────────┐
│ Table: collaborators                                              │
├─────────┬────────────┬─────────┬────────┬─────────────────────────┤
│ id      │ project_id │ user_id │ role   │ created_at              │
├─────────┼────────────┼─────────┼────────┼─────────────────────────┤
│ clx6wxy │ clx2ghi    │ clx5def │ editor │ 2025-01-15 10:10:00     │
└─────────┴────────────┴─────────┴────────┴─────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ Table: irys_transactions                                                                   │
├─────────┬──────────────────┬──────────┬───────────┬──────┬─────────────┬─────────────┬────┤
│ id      │ transaction_id   │ type     │ status    │ size │ cost        │ document_id │conf│
├─────────┼──────────────────┼──────────┼───────────┼──────┼─────────────┼─────────────┼────┤
│ clx4zab │ irys-tx-abc123   │ upload   │ confirmed │  512 │ 0.000001275 │ null (proj) │ ✅ │
│ clx9bcd │ irys-tx-def456   │ upload   │ confirmed │ 2048 │ 0.000005100 │ clx3jkl     │ ✅ │
│ clx12ef │ irys-tx-mno112   │ upload   │ confirmed │ 3584 │ 0.000008925 │ clx10mn     │ ✅ │
│ clx13gh │ irys-tx-jkl101   │ upload   │ confirmed │ 1536 │ 0.000003825 │ clx3jkl (v1)│ ✅ │
│ clx14ij │ irys-tx-ghi789   │ upload   │ confirmed │ 2560 │ 0.000006375 │ clx3jkl (v2)│ ✅ │
└─────────┴──────────────────┴──────────┴───────────┴──────┴─────────────┴─────────────┴────┘

Total Storage for Alice:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project metadata:           512 bytes
Documents (2):           5,632 bytes
Versions (3):            4,096 bytes
────────────────────────────────────────────────────────────
Total:                  10,240 bytes = 0.00001 GB
Monthly Cost:           $0.0000255 USD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🚀 결론

### IrysBase 데이터베이스 전략:

1. **PostgreSQL = 운영 데이터베이스**
   - 모든 CRUD 작업
   - 사용자 경험 최우선
   - 빠른 쿼리 (<10ms)

2. **Irys = 영구 보관소 + 증명 레이어**
   - 백그라운드 비동기 업로드
   - 블록체인 불변성 보장
   - 재해 복구 백업

3. **하이브리드 = 최적의 균형**
   - 속도 + 보안
   - 비용 효율성
   - 단계별 확장 가능

### 질문 답변:

> "추가적인 DB가 따로 있는게 아니라 irys만을 사용하도록 설계된 것이 맞는지"

**답변: 아니요, Irys만 사용하지 않습니다.**

- **주 데이터베이스**: PostgreSQL (실시간 작업)
- **보조 저장소**: Irys (영구 보관)
- **역할 분담**: PostgreSQL (읽기/쓰기) + Irys (증명/백업)

이 설계는 **현실적이고 실용적**입니다:
- ✅ 빠른 사용자 경험
- ✅ 블록체인 영구성 보장
- ✅ 비용 효율적
- ✅ 확장 가능한 아키텍처
