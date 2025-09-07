# IrysBase Enhanced - Web3 의 Supabase

완전히 새로워진 IrysBase는 계획서의 비전을 구현한 **Web3의 Supabase**이자 **IrysBook을 위한 특화된 BaaS 플랫폼**입니다.

## 🎯 주요 개선사항

### 1. 완전한 서비스 아키텍처 구현
기존의 단순한 Post 관리에서 **9개 핵심 서비스**를 가진 완전한 플랫폼으로 발전:

#### 핵심 서비스
- **Auth Service**: 지갑 기반 인증 (기존 유지)
- **Database Service**: 문서 관리 특화 데이터베이스
- **Storage Service**: 파일 및 미디어 관리
- **Realtime Service**: 실시간 협업 및 동기화
- **Functions Service**: 서버리스 함수 및 AI 처리

#### 고급 서비스
- **Vector DB Service**: 시맨틱 검색 및 AI 기능
- **Search Service**: 풀텍스트 검색
- **Analytics Service**: 사용 분석
- **Edge Service**: 글로벌 배포
- **Programmable Data Service**: 스마트 규칙 및 트리거

### 2. IrysBook을 위한 특화 기능

#### 문서 관리 시스템
```typescript
// 프로젝트 생성
const project = await irysbase.core.database.createProject({
  name: 'My Documentation',
  slug: 'my-docs',
  visibility: 'public',
  settings: {
    allowContributions: true,
    rewardContributors: true,
    languages: ['en', 'ko', 'ja']
  }
});

// 문서 생성 및 영구 저장
const document = await irysbase.core.database.createDocument({
  projectId: project.id,
  path: '/getting-started/installation',
  title: 'Installation Guide',
  content: '# Installation\n\nStep by step guide...',
  authorId: user.id
});
```

#### 실시간 협업
```typescript
// 협업 세션 시작
const session = await irysbase.core.realtime.createCollaborationSession(documentId);

// 커서 공유
await irysbase.core.realtime.shareCursor(sessionId, userId, {
  line: 42,
  column: 10
});

// 변경 사항 스트리밍
await irysbase.core.realtime.streamChange(sessionId, userId, {
  operation: 'insert',
  position: 100,
  text: 'New content here'
});
```

#### AI 기능 활용
```typescript
// 문서 개선
const result = await irysbase.core.functions.invoke('enhance-document', {
  document_id: documentId,
  tasks: ['generate_outline', 'check_grammar', 'optimize_seo']
});

// 시맨틱 검색
const similarDocs = await irysbase.advanced.vector.findSimilarDocuments(
  'How to install dependencies',
  { projectId, limit: 5 }
);

// Q&A 시스템
const answer = await irysbase.advanced.vector.askQuestion(
  'What are the system requirements?',
  ['context document 1', 'context document 2']
);
```

### 3. 완전한 GraphQL API

#### 새로운 타입들
- `Project`, `Document`, `Version`, `Collaborator`
- `Comment`, `Translation`, `SearchResult`
- `QAAnswer`, `CollaborationSession`

#### 강화된 쿼리
```graphql
# 시맨틱 검색
query SearchDocuments($input: SearchDocumentsInput!) {
  searchDocuments(input: $input) {
    documentId
    title
    similarity
    highlights
  }
}

# AI Q&A
query AskQuestion($input: AskQuestionInput!) {
  askQuestion(input: $input) {
    answer
    confidence
    sources {
      documentId
      title
      excerpt
    }
  }
}

# 실시간 협업
subscription CollaborationUpdated($documentId: String!) {
  collaborationUpdated(documentId: $documentId) {
    type
    userId
    data
  }
}
```

### 4. 블록체인 통합

#### 영구 저장 및 버전 증명
- 모든 문서가 Irys 블록체인에 영구 저장
- 각 버전의 무결성 증명
- 변경 히스토리의 불변 기록

#### 프로그래머블 데이터
```typescript
// 스마트 규칙 설정
await irysbase.advanced.programmable.setRules(documentId, {
  access: {
    public: 'read',
    collaborators: 'write'
  },
  triggers: [
    {
      event: 'publish',
      action: 'generate_pdf'
    }
  ],
  royalty: {
    enabled: true,
    percentage: 1.5,
    recipients: {
      author: 70,
      reviewers: 20,
      translators: 10
    }
  }
});
```

## 🚀 시작하기

### Enhanced 모드로 실행
```bash
# Enhanced API 서버 실행
pnpm run api:dev:enhanced

# 또는 전체 플랫폼 실행
pnpm run platform:dev
```

### API 엔드포인트
- GraphQL API: `http://localhost:4000/graphql`
- WebSocket: `ws://localhost:4000/graphql`
- Health Check: `http://localhost:4000/health`
- API Status: `http://localhost:4000/api/status`
- Documentation: `http://localhost:4000/docs`

### 서비스 상태 확인
```bash
curl http://localhost:4000/api/status
```

```json
{
  "api": "IrysBase Platform API",
  "status": "operational",
  "services": {
    "database": "online",
    "storage": "online",
    "realtime": "online",
    "functions": "online",
    "vector": "online",
    "search": "online",
    "analytics": "online",
    "programmable": "online"
  },
  "features": [
    "Document Management",
    "Real-time Collaboration",
    "Vector Search",
    "AI Functions",
    "Blockchain Storage",
    "Analytics",
    "Multi-language Support"
  ]
}
```

## 🏗️ 아키텍처

### 플랫폼 구조
```
IrysBase Enhanced Platform
├── Core Services
│   ├── Auth Service (지갑 기반 인증)
│   ├── Database Service (문서 관리 DB)
│   ├── Storage Service (파일 및 미디어)
│   ├── Realtime Service (실시간 협업)
│   └── Functions Service (AI 및 서버리스)
├── Advanced Services
│   ├── Vector DB Service (시맨틱 검색)
│   ├── Search Service (풀텍스트 검색)
│   ├── Analytics Service (사용 분석)
│   ├── Edge Service (글로벌 배포)
│   └── Programmable Data (스마트 규칙)
└── Integration Layer
    ├── GraphQL API
    ├── WebSocket (실시간)
    ├── REST Endpoints
    └── Blockchain Integration
```

### 데이터 플로우
```
Client Request → GraphQL → Service Layer → Irys Blockchain
     ↓              ↓           ↓              ↓
WebSocket ←→ Realtime ←→ PostgreSQL ←→ Permanent Storage
```

## 🔧 개발자 가이드

### 플랫폼 확장
```typescript
import { createPlatform } from './services/irysbase-platform';

const platform = createPlatform(irysService, {
  services: {
    enableVector: true,
    enableSearch: true,
    enableAnalytics: true
  }
});

// 커스텀 함수 등록
platform.core.functions.registerFunction('my-custom-function', 
  async (payload) => {
    // 커스텀 로직
    return result;
  }
);
```

### 새로운 리졸버 추가
```typescript
// resolvers/my-resolvers.ts
export const myResolvers = {
  Query: {
    myCustomQuery: async (parent, args, context) => {
      // 구현
    }
  }
};
```

## 🔮 로드맵

### Phase 1: 완료 ✅
- [x] 9개 핵심 서비스 구현
- [x] 문서 관리 시스템
- [x] 실시간 협업 기능
- [x] AI 및 벡터 검색
- [x] Enhanced GraphQL API

### Phase 2: 진행 중 🚧
- [ ] Prisma 스키마 업데이트
- [ ] 프론트엔드 대시보드 개선
- [ ] 실제 AI 모델 통합
- [ ] 벡터 데이터베이스 연결

### Phase 3: 계획 📋
- [ ] IrysBook 웹 애플리케이션
- [ ] CLI 도구
- [ ] SDK 라이브러리
- [ ] 토큰 경제 구현

## 📄 라이센스

MIT License - IrysBase Enhanced Platform

---

**IrysBase Enhanced**는 계획서의 비전을 현실로 구현한 **Web3의 Supabase**입니다. 문서화의 미래를 함께 만들어가세요! 🚀