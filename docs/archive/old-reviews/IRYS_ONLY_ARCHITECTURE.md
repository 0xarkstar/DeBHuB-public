# Irys-Only 아키텍처: 순수 탈중앙화 데이터베이스 설계

## 🎯 목표

**PostgreSQL 없이 Irys DataChain만을 primary database로 사용하는 완전 탈중앙화 아키텍처**

```
┌─────────────────────────────────────────────────────────────┐
│              현재 아키텍처 (하이브리드)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend → PostgreSQL (주 DB) → 즉시 응답                  │
│                  ↓                                          │
│            Irys (백업) → 비동기 업로드                       │
│                                                             │
│  문제: 중앙화된 PostgreSQL 의존성                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              원하는 아키텍처 (Irys-Only)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend → Irys DataChain (유일한 DB) → 응답               │
│                                                             │
│  장점: 완전 탈중앙화, 검열 저항성, 영구성                     │
│  도전: 쿼리 성능, 실시간 협업, 복잡한 쿼리                    │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Irys-Only가 가능한 이유

### 1. **Irys는 완전한 데이터베이스 기능 제공**

```javascript
// Irys GraphQL API를 통한 쿼리
import Query from '@irys/query';

const query = new Query();

// 모든 사용자 프로젝트 찾기
const projects = await query
  .search('irys:transactions')
  .tags([
    { name: 'App-Name', values: ['IrysBase'] },
    { name: 'Entity-Type', values: ['project'] },
    { name: 'Owner-Address', values: ['0x1234...'] }
  ])
  .sort('ASC')
  .limit(100);

// 특정 프로젝트의 문서 찾기
const documents = await query
  .search('irys:transactions')
  .tags([
    { name: 'App-Name', values: ['IrysBase'] },
    { name: 'Entity-Type', values: ['document'] },
    { name: 'Project-ID', values: ['proj-abc-123'] }
  ])
  .sort('DESC')
  .limit(50);

// 문서 버전 히스토리
const versions = await query
  .search('irys:transactions')
  .tags([
    { name: 'Entity-Type', values: ['document-version'] },
    { name: 'Document-ID', values: ['doc-xyz-456'] },
    { name: 'Version', values: ['1', '2', '3'] }
  ])
  .sort('ASC');
```

### 2. **태그 기반 쿼리 시스템**

Irys는 각 트랜잭션에 최대 20개의 태그를 붙일 수 있습니다:

```javascript
const tags = [
  { name: 'App-Name', value: 'IrysBase' },           // 앱 식별
  { name: 'Entity-Type', value: 'document' },        // 엔티티 타입
  { name: 'Entity-ID', value: 'doc-abc-123' },       // 고유 ID
  { name: 'Project-ID', value: 'proj-xyz-789' },     // 프로젝트 참조
  { name: 'Author-Address', value: '0x1234...' },    // 작성자
  { name: 'Version', value: '3' },                   // 버전
  { name: 'Created-At', value: '1705392000000' },    // 타임스탬프
  { name: 'Content-Type', value: 'application/json' },
  { name: 'Schema-Version', value: '1.0' },
  // ... 최대 20개
];

await irys.upload(data, { tags });
```

---

## 🏗️ Irys-Only 데이터 모델 설계

### Entity 구조

모든 데이터는 **JSON + Tags** 형태로 Irys에 저장됩니다.

#### 1. User Entity

```json
// Irys Transaction Data
{
  "entityType": "user",
  "entityId": "user-0x1234abcd",
  "address": "0x1234...abcd",
  "profile": {
    "displayName": "Alice",
    "bio": "Web3 developer",
    "avatar": "irys://avatar-tx-id"
  },
  "preferences": {
    "theme": "dark",
    "language": "en"
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "schemaVersion": "1.0"
}

// Irys Tags
[
  { name: "App-Name", value: "IrysBase" },
  { name: "Entity-Type", value: "user" },
  { name: "Entity-ID", value: "user-0x1234abcd" },
  { name: "Address", value: "0x1234abcd" },
  { name: "Created-At", value: "1705392000000" },
  { name: "Schema-Version", value: "1.0" }
]
```

#### 2. Project Entity

```json
// Data
{
  "entityType": "project",
  "entityId": "proj-abc123",
  "name": "Documentation Hub",
  "slug": "docs-hub",
  "description": "Technical documentation",
  "owner": "0x1234...abcd",
  "visibility": "public",
  "settings": {
    "defaultLanguage": "en",
    "enableComments": true
  },
  "collaborators": [
    {
      "address": "0x5678...efgh",
      "role": "editor",
      "addedAt": "2025-01-15T10:10:00Z"
    }
  ],
  "createdAt": "2025-01-15T10:01:00Z",
  "updatedAt": "2025-01-15T10:10:00Z",
  "schemaVersion": "1.0"
}

// Tags
[
  { name: "App-Name", value: "IrysBase" },
  { name: "Entity-Type", value: "project" },
  { name: "Entity-ID", value: "proj-abc123" },
  { name: "Slug", value: "docs-hub" },
  { name: "Owner", value: "0x1234abcd" },
  { name: "Visibility", value: "public" },
  { name: "Created-At", value: "1705392060000" },
  { name: "Updated-At", value: "1705392600000" }
]
```

#### 3. Document Entity

```json
// Data
{
  "entityType": "document",
  "entityId": "doc-xyz456",
  "projectId": "proj-abc123",
  "path": "/getting-started",
  "title": "Getting Started",
  "content": "# Getting Started\n\nWelcome to our documentation...",
  "contentHash": "sha256:7f83b165...",
  "author": "0x1234...abcd",
  "version": 1,
  "tags": ["tutorial", "beginner"],
  "metadata": {
    "wordCount": 342,
    "readingTime": "2 min"
  },
  "createdAt": "2025-01-15T10:05:00Z",
  "schemaVersion": "1.0"
}

// Tags
[
  { name: "App-Name", value: "IrysBase" },
  { name: "Entity-Type", value: "document" },
  { name: "Entity-ID", value: "doc-xyz456" },
  { name: "Project-ID", value: "proj-abc123" },
  { name: "Path", value: "/getting-started" },
  { name: "Author", value: "0x1234abcd" },
  { name: "Version", value: "1" },
  { name: "Content-Hash", value: "7f83b165..." },
  { name: "Created-At", value: "1705392300000" },
  { name: "Tag", value: "tutorial" },
  { name: "Tag", value: "beginner" }
]
```

#### 4. Document Version (업데이트 시)

**중요: Irys는 불변(immutable)이므로 업데이트 = 새 트랜잭션**

```json
// Version 2 (새로운 트랜잭션)
{
  "entityType": "document",
  "entityId": "doc-xyz456",  // 동일한 Entity-ID
  "projectId": "proj-abc123",
  "path": "/getting-started",
  "title": "Getting Started",
  "content": "# Getting Started\n\nWelcome!\n\n## Installation\n...",  // 업데이트된 내용
  "contentHash": "sha256:9a2f3c8d...",
  "author": "0x5678...efgh",  // Bob이 수정
  "version": 2,  // 버전 증가
  "previousVersion": "irys-tx-version1",  // 이전 버전 참조
  "changelog": "Added installation section",
  "createdAt": "2025-01-15T10:15:00Z",
  "schemaVersion": "1.0"
}

// Tags
[
  { name: "App-Name", value: "IrysBase" },
  { name: "Entity-Type", value: "document" },
  { name: "Entity-ID", value: "doc-xyz456" },  // 동일한 ID
  { name: "Project-ID", value: "proj-abc123" },
  { name: "Version", value: "2" },  // 버전 태그
  { name: "Previous-Version", value: "irys-tx-version1" },
  { name: "Author", value: "0x5678efgh" },
  { name: "Created-At", value: "1705392900000" }
]
```

#### 5. Comment Entity

```json
{
  "entityType": "comment",
  "entityId": "comment-123",
  "documentId": "doc-xyz456",
  "content": "Great tutorial!",
  "author": "0x5678...efgh",
  "position": {
    "line": 15,
    "column": 0
  },
  "parentId": null,  // 대댓글이면 parent comment ID
  "resolved": false,
  "createdAt": "2025-01-15T10:20:00Z",
  "schemaVersion": "1.0"
}

// Tags
[
  { name: "App-Name", value: "IrysBase" },
  { name: "Entity-Type", value: "comment" },
  { name: "Entity-ID", value: "comment-123" },
  { name: "Document-ID", value: "doc-xyz456" },
  { name: "Author", value: "0x5678efgh" },
  { name: "Created-At", value: "1705393200000" }
]
```

---

## 🔄 CRUD 작업 구현

### Create (생성)

```javascript
import Uploader from '@irys/upload';
import { v4 as uuidv4 } from 'uuid';

class IrysDatabase {
  constructor(private irys: Uploader) {}

  // 프로젝트 생성
  async createProject(data: {
    name: string;
    slug: string;
    owner: string;
  }) {
    const entityId = `proj-${uuidv4()}`;

    const projectData = {
      entityType: 'project',
      entityId,
      name: data.name,
      slug: data.slug,
      owner: data.owner,
      visibility: 'public',
      collaborators: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: '1.0'
    };

    const tags = [
      { name: 'App-Name', value: 'IrysBase' },
      { name: 'Entity-Type', value: 'project' },
      { name: 'Entity-ID', value: entityId },
      { name: 'Slug', value: data.slug },
      { name: 'Owner', value: data.owner },
      { name: 'Created-At', value: Date.now().toString() }
    ];

    const receipt = await this.irys.upload(
      JSON.stringify(projectData),
      { tags }
    );

    return {
      ...projectData,
      irysId: receipt.id,
      permanentUrl: `https://gateway.irys.xyz/${receipt.id}`
    };
  }

  // 문서 생성
  async createDocument(data: {
    projectId: string;
    path: string;
    title: string;
    content: string;
    author: string;
  }) {
    const entityId = `doc-${uuidv4()}`;
    const crypto = await import('crypto');
    const contentHash = crypto.createHash('sha256')
      .update(data.content)
      .digest('hex');

    const documentData = {
      entityType: 'document',
      entityId,
      projectId: data.projectId,
      path: data.path,
      title: data.title,
      content: data.content,
      contentHash,
      author: data.author,
      version: 1,
      tags: [],
      createdAt: new Date().toISOString(),
      schemaVersion: '1.0'
    };

    const tags = [
      { name: 'App-Name', value: 'IrysBase' },
      { name: 'Entity-Type', value: 'document' },
      { name: 'Entity-ID', value: entityId },
      { name: 'Project-ID', value: data.projectId },
      { name: 'Path', value: data.path },
      { name: 'Author', value: data.author },
      { name: 'Version', value: '1' },
      { name: 'Content-Hash', value: contentHash },
      { name: 'Created-At', value: Date.now().toString() }
    ];

    const receipt = await this.irys.upload(
      JSON.stringify(documentData),
      { tags }
    );

    return {
      ...documentData,
      irysId: receipt.id,
      permanentUrl: `https://gateway.irys.xyz/${receipt.id}`
    };
  }
}
```

### Read (조회)

```javascript
import Query from '@irys/query';

class IrysDatabase {
  constructor(
    private irys: Uploader,
    private query: Query
  ) {}

  // 프로젝트 조회 (Slug로)
  async getProjectBySlug(slug: string) {
    const results = await this.query
      .search('irys:transactions')
      .tags([
        { name: 'App-Name', values: ['IrysBase'] },
        { name: 'Entity-Type', values: ['project'] },
        { name: 'Slug', values: [slug] }
      ])
      .sort('DESC')  // 최신 버전 먼저
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

    // 각 Entity-ID의 최신 버전만 가져오기
    const latestVersions = new Map();

    for (const tx of results) {
      const entityIdTag = tx.tags.find(t => t.name === 'Entity-ID');
      const entityId = entityIdTag?.value;

      if (!latestVersions.has(entityId)) {
        const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
        const data = await response.json();
        latestVersions.set(entityId, {
          ...data,
          irysId: tx.id,
          permanentUrl: `https://gateway.irys.xyz/${tx.id}`
        });
      }
    }

    return Array.from(latestVersions.values());
  }

  // 프로젝트의 모든 문서
  async getProjectDocuments(projectId: string) {
    const results = await this.query
      .search('irys:transactions')
      .tags([
        { name: 'App-Name', values: ['IrysBase'] },
        { name: 'Entity-Type', values: ['document'] },
        { name: 'Project-ID', values: [projectId] }
      ])
      .sort('DESC')
      .limit(1000);

    // 각 문서의 최신 버전만 추출
    const latestDocs = new Map();

    for (const tx of results) {
      const entityIdTag = tx.tags.find(t => t.name === 'Entity-ID');
      const versionTag = tx.tags.find(t => t.name === 'Version');
      const entityId = entityIdTag?.value;
      const version = parseInt(versionTag?.value || '1');

      const existing = latestDocs.get(entityId);
      if (!existing || version > existing.version) {
        const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
        const data = await response.json();
        latestDocs.set(entityId, {
          ...data,
          irysId: tx.id,
          permanentUrl: `https://gateway.irys.xyz/${tx.id}`,
          version
        });
      }
    }

    return Array.from(latestDocs.values());
  }

  // 문서의 모든 버전 히스토리
  async getDocumentVersions(documentId: string) {
    const results = await this.query
      .search('irys:transactions')
      .tags([
        { name: 'App-Name', values: ['IrysBase'] },
        { name: 'Entity-Type', values: ['document'] },
        { name: 'Entity-ID', values: [documentId] }
      ])
      .sort('ASC')  // 버전 1부터 오름차순
      .limit(100);

    const versions = [];
    for (const tx of results) {
      const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
      const data = await response.json();
      versions.push({
        ...data,
        irysId: tx.id,
        permanentUrl: `https://gateway.irys.xyz/${tx.id}`
      });
    }

    return versions;
  }
}
```

### Update (업데이트)

**Irys는 불변이므로 업데이트 = 새 버전 생성**

```javascript
class IrysDatabase {
  // 문서 업데이트 (새 버전 생성)
  async updateDocument(
    documentId: string,
    updates: {
      content?: string;
      title?: string;
      author: string;
    }
  ) {
    // 1. 현재 최신 버전 조회
    const versions = await this.getDocumentVersions(documentId);
    const latest = versions[versions.length - 1];

    if (!latest) {
      throw new Error('Document not found');
    }

    // 2. 새 버전 데이터 생성
    const newVersion = latest.version + 1;
    const crypto = await import('crypto');
    const newContent = updates.content || latest.content;
    const contentHash = crypto.createHash('sha256')
      .update(newContent)
      .digest('hex');

    const documentData = {
      ...latest,
      title: updates.title || latest.title,
      content: newContent,
      contentHash,
      author: updates.author,
      version: newVersion,
      previousVersion: latest.irysId,  // 이전 버전 참조
      updatedAt: new Date().toISOString()
    };

    // 3. Irys에 새 버전 업로드
    const tags = [
      { name: 'App-Name', value: 'IrysBase' },
      { name: 'Entity-Type', value: 'document' },
      { name: 'Entity-ID', value: documentId },  // 동일한 Entity-ID
      { name: 'Project-ID', value: latest.projectId },
      { name: 'Version', value: newVersion.toString() },
      { name: 'Previous-Version', value: latest.irysId },
      { name: 'Author', value: updates.author },
      { name: 'Content-Hash', value: contentHash },
      { name: 'Created-At', value: Date.now().toString() }
    ];

    const receipt = await this.irys.upload(
      JSON.stringify(documentData),
      { tags }
    );

    return {
      ...documentData,
      irysId: receipt.id,
      permanentUrl: `https://gateway.irys.xyz/${receipt.id}`
    };
  }

  // 프로젝트 업데이트 (협업자 추가 등)
  async updateProject(
    projectId: string,
    updates: {
      name?: string;
      description?: string;
      collaborators?: Array<{ address: string; role: string }>;
    }
  ) {
    // 현재 최신 버전 조회
    const results = await this.query
      .search('irys:transactions')
      .tags([
        { name: 'App-Name', values: ['IrysBase'] },
        { name: 'Entity-Type', values: ['project'] },
        { name: 'Entity-ID', values: [projectId] }
      ])
      .sort('DESC')
      .limit(1);

    if (results.length === 0) {
      throw new Error('Project not found');
    }

    const tx = results[0];
    const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
    const current = await response.json();

    // 새 버전 생성
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const tags = [
      { name: 'App-Name', value: 'IrysBase' },
      { name: 'Entity-Type', value: 'project' },
      { name: 'Entity-ID', value: projectId },
      { name: 'Slug', value: updated.slug },
      { name: 'Owner', value: updated.owner },
      { name: 'Updated-At', value: Date.now().toString() }
    ];

    const receipt = await this.irys.upload(
      JSON.stringify(updated),
      { tags }
    );

    return {
      ...updated,
      irysId: receipt.id,
      permanentUrl: `https://gateway.irys.xyz/${receipt.id}`
    };
  }
}
```

### Delete (삭제)

**Irys는 불변이므로 진짜 삭제는 불가능 → "삭제됨" 마크만 추가**

```javascript
class IrysDatabase {
  // 문서 "삭제" (실제로는 deleted 플래그 추가)
  async deleteDocument(documentId: string, deletedBy: string) {
    const versions = await this.getDocumentVersions(documentId);
    const latest = versions[versions.length - 1];

    if (!latest) {
      throw new Error('Document not found');
    }

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
      { name: 'Deleted', value: 'true' },  // 삭제 태그
      { name: 'Deleted-By', value: deletedBy },
      { name: 'Version', value: deletionMarker.version.toString() },
      { name: 'Created-At', value: Date.now().toString() }
    ];

    const receipt = await this.irys.upload(
      JSON.stringify(deletionMarker),
      { tags }
    );

    return {
      ...deletionMarker,
      irysId: receipt.id
    };
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

### 1. **클라이언트 사이드 캐싱**

```javascript
class CachedIrysDatabase extends IrysDatabase {
  private cache = new Map<string, { data: any; expiry: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5분

  async getProjectBySlug(slug: string) {
    const cacheKey = `project:slug:${slug}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      console.log('Cache hit:', cacheKey);
      return cached.data;
    }

    const data = await super.getProjectBySlug(slug);

    this.cache.set(cacheKey, {
      data,
      expiry: Date.now() + this.CACHE_TTL
    });

    return data;
  }

  invalidateCache(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 2. **IndexedDB 로컬 스토리지**

```javascript
import { openDB } from 'idb';

class OfflineFirstIrysDatabase extends IrysDatabase {
  private db: any;

  async init() {
    this.db = await openDB('IrysBaseCache', 1, {
      upgrade(db) {
        db.createObjectStore('projects', { keyPath: 'entityId' });
        db.createObjectStore('documents', { keyPath: 'entityId' });
      }
    });
  }

  async getProjectBySlug(slug: string) {
    // 1. IndexedDB에서 먼저 확인
    const projects = await this.db.getAll('projects');
    const cached = projects.find(p => p.slug === slug);

    if (cached) {
      console.log('IndexedDB hit:', slug);

      // 백그라운드에서 Irys 동기화
      this.syncFromIrys(slug).catch(console.error);

      return cached;
    }

    // 2. Irys에서 가져오기
    const project = await super.getProjectBySlug(slug);

    // 3. IndexedDB에 저장
    if (project) {
      await this.db.put('projects', project);
    }

    return project;
  }

  private async syncFromIrys(slug: string) {
    const fresh = await super.getProjectBySlug(slug);
    if (fresh) {
      await this.db.put('projects', fresh);
    }
  }
}
```

### 3. **배치 쿼리**

```javascript
class IrysDatabase {
  // 여러 문서를 한 번에 조회
  async getDocumentsByIds(documentIds: string[]) {
    const results = await this.query
      .search('irys:transactions')
      .tags([
        { name: 'App-Name', values: ['IrysBase'] },
        { name: 'Entity-Type', values: ['document'] },
        { name: 'Entity-ID', values: documentIds }  // 여러 ID 한 번에
      ])
      .sort('DESC')
      .limit(1000);

    const docs = new Map();

    for (const tx of results) {
      const entityIdTag = tx.tags.find(t => t.name === 'Entity-ID');
      const entityId = entityIdTag?.value;

      if (!docs.has(entityId)) {
        const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
        const data = await response.json();
        docs.set(entityId, data);
      }
    }

    return Array.from(docs.values());
  }
}
```

---

## 🚀 실시간 협업 구현

Irys는 실시간 업데이트가 없으므로 **폴링(Polling)** 또는 **WebSocket 래퍼** 필요:

### 옵션 1: 폴링 방식

```javascript
class RealtimeIrysDatabase extends IrysDatabase {
  private subscriptions = new Map<string, Set<Function>>();

  // 문서 변경 구독
  subscribeToDocument(documentId: string, callback: Function) {
    if (!this.subscriptions.has(documentId)) {
      this.subscriptions.set(documentId, new Set());
      this.startPolling(documentId);
    }

    this.subscriptions.get(documentId)!.add(callback);

    // 구독 해제 함수 반환
    return () => {
      this.subscriptions.get(documentId)?.delete(callback);
    };
  }

  private async startPolling(documentId: string) {
    let lastVersion = 0;

    const poll = async () => {
      try {
        const versions = await this.getDocumentVersions(documentId);
        const latest = versions[versions.length - 1];

        if (latest && latest.version > lastVersion) {
          lastVersion = latest.version;

          // 모든 구독자에게 알림
          const subscribers = this.subscriptions.get(documentId);
          if (subscribers) {
            subscribers.forEach(callback => callback(latest));
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }

      // 5초마다 폴링
      if (this.subscriptions.has(documentId)) {
        setTimeout(poll, 5000);
      }
    };

    poll();
  }
}

// 사용 예시
const unsubscribe = db.subscribeToDocument('doc-xyz456', (latest) => {
  console.log('Document updated:', latest);
  // UI 업데이트
});
```

### 옵션 2: WebSocket 서버 (선택적)

```javascript
// 최소한의 WebSocket 서버 (중앙화됨, 하지만 데이터는 Irys에 저장)
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const { type, documentId } = JSON.parse(message);

    if (type === 'subscribe') {
      // Irys 폴링 시작
      const interval = setInterval(async () => {
        const latest = await db.getDocumentVersions(documentId);
        ws.send(JSON.stringify({ type: 'update', data: latest }));
      }, 5000);

      ws.on('close', () => clearInterval(interval));
    }
  });
});
```

---

## 💰 비용 분석

### Irys-Only 비용:

```
Alice의 Documentation Hub 프로젝트:

초기 생성:
- 프로젝트 메타데이터: 512 bytes × $2.5/GB = $0.0000013
- 문서 10개 (각 5KB): 50KB × $2.5/GB = $0.00012
─────────────────────────────────────────────────────────
총합: $0.0001213

업데이트 (1개월간):
- 문서 업데이트 30회 (각 5KB): 150KB × $2.5/GB = $0.000375
- 댓글 50개 (각 200 bytes): 10KB × $2.5/GB = $0.000025
─────────────────────────────────────────────────────────
월간 총 비용: ~$0.0005

연간 비용: ~$0.006 (매우 저렴!)
```

### PostgreSQL과 비교:

| 항목 | Irys-Only | PostgreSQL + Irys |
|------|-----------|-------------------|
| 초기 비용 | $0.0001 | $0 (DB 무료) + $0.0001 |
| 월간 비용 | $0.0005 | $0.10 (DB) + $0.0005 |
| 연간 비용 | $0.006 | $1.20 + $0.006 |
| 인프라 | 없음 | PostgreSQL 서버 필요 |
| 확장성 | 무한 | 수직 확장 필요 |

**결론: Irys-Only가 훨씬 저렴!**

---

## ⚠️ 제약사항 및 해결책

### 1. **쿼리 성능**

**문제:**
- Irys GraphQL 쿼리: 수백 ms ~ 수 초
- 복잡한 JOIN 불가능

**해결책:**
- ✅ 클라이언트 사이드 캐싱 (5분 TTL)
- ✅ IndexedDB 오프라인 퍼스트
- ✅ 서버 사이드 캐싱 (Redis)
- ✅ 배치 쿼리로 왕복 최소화

### 2. **실시간 협업**

**문제:**
- Irys는 WebSocket 지원 없음
- 폴링만 가능

**해결책:**
- ✅ 5초 폴링 (acceptable for docs)
- ✅ 선택적 WebSocket 서버 (중앙화되지만 데이터는 Irys)
- ✅ CRDT (Conflict-free Replicated Data Types) 사용

### 3. **복잡한 쿼리**

**문제:**
- "Alice와 Bob이 공동 작업한 프로젝트" 같은 쿼리 어려움

**해결책:**
- ✅ 비정규화: 프로젝트에 collaborators 배열 포함
- ✅ 클라이언트 사이드 필터링
- ✅ 인덱싱 서비스 (선택적): Irys → 로컬 검색 엔진

### 4. **데이터 크기**

**문제:**
- 대용량 파일 (이미지, 비디오) 비용 문제

**해결책:**
- ✅ 이미지: 별도 Irys 트랜잭션, 참조만 저장
- ✅ 압축: gzip 사용
- ✅ CDN: Irys 게이트웨이 + Cloudflare

---

## 🎯 Irys-Only 아키텍처의 장점

### ✅ 완전한 탈중앙화
- 중앙 서버 불필요
- 검열 저항성
- 영구 가용성

### ✅ 저렴한 비용
- 월 $0.0005 vs PostgreSQL $1.20
- 초기 투자 불필요
- 사용한 만큼만 지불

### ✅ 무한 확장성
- 사용자 수 증가해도 인프라 변경 없음
- Irys가 모든 확장 처리

### ✅ 자동 버전 관리
- 모든 변경사항 불변 기록
- Git-like 히스토리 자동
- 감사 추적 완벽

### ✅ 재해 복구 불필요
- 백업 자동 (블록체인)
- 복구 걱정 없음
- 99.99% 가용성

---

## 🚀 구현 로드맵

### Phase 1: 기본 CRUD
1. IrysDatabase 클래스 구현
2. Entity 스키마 정의
3. 태그 전략 수립
4. 기본 쿼리 구현

### Phase 2: 성능 최적화
1. 클라이언트 캐싱
2. IndexedDB 통합
3. 배치 쿼리
4. 지연 로딩

### Phase 3: 실시간 기능
1. 폴링 시스템
2. 낙관적 UI 업데이트
3. 충돌 해결 (CRDT)

### Phase 4: 고급 기능
1. 전문 검색 (클라이언트)
2. AI 통합
3. 오프라인 모드

---

## 📝 예시 코드 (전체 통합)

```typescript
// apps/api/src/services/irys-only-database.ts
import Uploader from '@irys/upload';
import Query from '@irys/query';
import { v4 as uuidv4 } from 'uuid';

export class IrysOnlyDatabase {
  constructor(
    private irys: Uploader,
    private query: Query
  ) {}

  // ... 위의 모든 메서드 구현
}

// 사용 예시
const db = new IrysOnlyDatabase(irys, query);

// 프로젝트 생성
const project = await db.createProject({
  name: 'Docs Hub',
  slug: 'docs-hub',
  owner: '0x1234...'
});

// 문서 생성
const doc = await db.createDocument({
  projectId: project.entityId,
  path: '/getting-started',
  title: 'Getting Started',
  content: '# Getting Started\n...',
  author: '0x1234...'
});

// 문서 조회
const docs = await db.getProjectDocuments(project.entityId);

// 문서 업데이트
const updated = await db.updateDocument(doc.entityId, {
  content: '# Getting Started\n\n## Updated!',
  author: '0x5678...'
});

// 버전 히스토리
const versions = await db.getDocumentVersions(doc.entityId);
console.log(`Document has ${versions.length} versions`);
```

---

## 🎯 결론

**Irys-Only 아키텍처는 완전히 가능하고 실용적입니다!**

### 추천 사항:

1. **시작은 Irys-Only로**
   - 순수한 탈중앙화 경험
   - 낮은 비용
   - 간단한 인프라

2. **필요시 하이브리드로 전환**
   - 실시간 협업이 critical하면
   - 복잡한 쿼리 많으면
   - 점진적 마이그레이션 가능

3. **또는 완전 Irys-Only 유지**
   - 클라이언트 캐싱으로 성능 해결
   - 폴링으로 실시간 구현
   - 순수 Web3 정신 유지

---

**다음 단계: 기존 코드베이스를 Irys-Only로 리팩토링할까요?**
