# Architecture - DeBHuB Pure Irys BaaS

**세계 최초 Pure Irys L1 기반 완전 탈중앙화 BaaS 아키텍처**

---

## 목차

- [시스템 개요](#시스템-개요)
- [Pure Irys 아키텍처](#pure-irys-아키텍처)
- [Smart Contracts](#smart-contracts)
- [데이터 흐름](#데이터-흐름)
- [캐싱 전략](#캐싱-전략)
- [보안 아키텍처](#보안-아키텍처)
- [성능 최적화](#성능-최적화)

---

## 시스템 개요

DeBHuB는 **Irys L1 DataChain**만을 사용하는 완전 탈중앙화 BaaS 플랫폼입니다.

### 핵심 원칙

1. **Zero Backend** - 백엔드 서버 불필요
2. **Zero Database** - PostgreSQL, MongoDB 불필요
3. **Zero Redis** - 캐싱 서버 불필요
4. **Pure Blockchain** - Irys L1 DataChain + Smart Contracts
5. **Client-side First** - IndexedDB 캐싱, 브라우저에서 모든 처리

### 아키텍처 철학

```
전통적 BaaS:
Frontend → Backend API → PostgreSQL + Redis → Cloud Storage

Pure Irys BaaS:
Frontend → Irys L1 DataChain (Smart Contracts + Permanent Storage)
         → IndexedDB (Client-side Cache)
```

**결과**: 인프라 복잡도 90% 감소, 운영 비용 95% 절감

---

## Pure Irys 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│             React Frontend (Vite 5)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  PureIrysClient (Singleton)                       │  │
│  │  - wagmi (Wallet Integration)                     │  │
│  │  - ethers.js v6 (Smart Contract Calls)            │  │
│  │  - @irys/web-upload (Data Upload)                 │  │
│  │  - @irys/query (Data Query)                       │  │
│  │  - IndexedDB Cache (5min TTL)                     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │ Direct RPC Calls (HTTPS)
                      ↓
┌─────────────────────────────────────────────────────────┐
│         Irys L1 DataChain (Chain ID: 1270)              │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Smart Contracts (6개 Solidity 컨트랙트)         │  │
│  │                                                    │  │
│  │  DocumentRegistry  → PostgreSQL 대체              │  │
│  │  - 문서 메타데이터 인덱싱                         │  │
│  │  - 프로젝트별 문서 조회                           │  │
│  │  - 소유자별 문서 관리                             │  │
│  │                                                    │  │
│  │  AccessControl     → 백엔드 권한 로직 대체        │  │
│  │  - RBAC 권한 관리                                 │  │
│  │  - 리소스 접근 제어                               │  │
│  │                                                    │  │
│  │  ProvenanceChain   → Git 버전 관리 대체          │  │
│  │  - 버전 히스토리 추적                             │  │
│  │  - 변경 사항 기록                                 │  │
│  │                                                    │  │
│  │  EventBus          → WebSocket 대체               │  │
│  │  - 실시간 이벤트 브로드캐스팅                     │  │
│  │  - 문서 생성/수정 알림                            │  │
│  │                                                    │  │
│  │  CacheController   → Redis 대체                   │  │
│  │  - 캐시 무효화 신호                               │  │
│  │  - 글로벌 캐시 관리                               │  │
│  │                                                    │  │
│  │  SearchIndex       → ElasticSearch 대체           │  │
│  │  - 태그 기반 검색                                 │  │
│  │  - 전문 검색 인덱스                               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Permanent Storage (Irys Native)                  │  │
│  │  - 모든 문서 콘텐츠                                │  │
│  │  - 영구 불변 저장                                  │  │
│  │  - 버전별 스냅샷                                   │  │
│  │  - Gateway: https://gateway.irys.xyz              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 컴포넌트 상세

#### 1. Frontend Layer

**React + Vite 5**
- SPA (Single Page Application)
- Code Splitting으로 번들 최적화
- Lazy Loading으로 초기 로딩 최소화

**PureIrysClient**
```typescript
// packages/pure-irys-client/src/PureIrysClient.ts
export class PureIrysClient {
  private signer: Signer;                    // ethers.js Signer
  private irysUploader: WebUploader;         // Irys 업로더
  private query: Query;                      // Irys 쿼리
  private cache: IndexedDBCache;             // 캐싱

  // 6개 Smart Contract 인스턴스
  private documentRegistry: Contract;
  private accessControl: Contract;
  private provenanceChain: Contract;
  private eventBus: Contract;
  private cacheController: Contract;
  private searchIndex: Contract;
}
```

**React Hooks (7개)**
```typescript
// 1. Client 초기화
usePureIrysClient(signer?: Signer)

// 2. 문서 CRUD
useCreateDocument(client)
useDocument(client, docId)
useUpdateDocument(client)
useSearchDocuments(client, options)

// 3. 실시간
useDocumentSubscription(client, docId, callback)

// 4. 캐시
useCacheStats(client)
```

#### 2. Blockchain Layer

**Irys L1 DataChain**
- **Chain ID**: 1270 (Testnet)
- **RPC URL**: https://testnet-rpc.irys.xyz/v1/execution-rpc
- **Block Time**: ~2초 (빠른 finality)
- **Gas**: 저렴한 트랜잭션 비용

**Smart Contracts 주소** (Testnet 배포됨):
```
DocumentRegistry:  0x937956DA31B42C3ad9f6eC4366360Ae763391566
AccessControl:     0xdD1ACe083c156296760aAe07718Baab969642B8D
ProvenanceChain:   0x44755E8C746Dc1819a0e8c74503AFC106FC800CB
EventBus:          0x042E4e6a56aA1680171Da5e234D9cE42CBa03E1c
CacheController:   0x8aFb8b9d57e9b6244e29a090ea4da1A9043a91E2
SearchIndex:       0x2345938F52790F1d8a1E3355cA66eA3e60494A36
```

#### 3. Storage Layer

**Irys Permanent Storage**
- 모든 문서 콘텐츠 저장
- 영구 보존 (삭제 불가능)
- Gateway를 통한 HTTP 접근
- Tags를 통한 메타데이터

**IndexedDB Cache**
- 브라우저 로컬 스토리지
- 5분 TTL (Time To Live)
- 자동 무효화 (블록체인 이벤트 기반)
- 오프라인 지원

---

## Smart Contracts

### 1. DocumentRegistry

**목적**: PostgreSQL 테이블 대체

```solidity
contract DocumentRegistry {
    struct Document {
        bytes32 irysId;        // Irys 트랜잭션 ID
        address owner;         // 문서 소유자
        bytes32 projectId;     // 프로젝트 ID
        string title;          // 문서 제목
        uint256 createdAt;     // 생성 시간
        uint256 updatedAt;     // 수정 시간
        bool isPublic;         // 공개 여부
        uint8 status;          // 상태
        uint256 viewCount;     // 조회수
    }

    // 문서 등록
    function registerDocument(
        bytes32 irysId,
        bytes32 projectId,
        string memory title,
        bytes32[] memory tags
    ) public returns (bytes32 docId);

    // 문서 조회
    function getDocument(bytes32 docId)
        public view returns (Document memory);

    // 프로젝트별 문서 조회
    function getDocumentsByProject(bytes32 projectId)
        public view returns (bytes32[] memory);

    // 소유자별 문서 조회
    function getDocumentsByOwner(address owner)
        public view returns (bytes32[] memory);
}
```

### 2. AccessControl

**목적**: 백엔드 권한 로직 대체

```solidity
contract AccessControl {
    enum Permission { NONE, READ, WRITE, ADMIN, OWNER }

    // 권한 부여
    function grantPermission(
        bytes32 resourceId,
        address user,
        Permission permission
    ) public;

    // 권한 확인
    function hasPermission(
        bytes32 resourceId,
        address user,
        Permission required
    ) public view returns (bool);
}
```

### 3. ProvenanceChain

**목적**: Git 버전 관리 시스템 대체

```solidity
contract ProvenanceChain {
    struct Version {
        bytes32 irysId;
        address author;
        uint256 timestamp;
        bytes32 previousVersion;
        string changeDescription;
        bool aiGenerated;
        string aiModel;
    }

    // 버전 추가
    function addVersion(
        bytes32 entityId,
        bytes32 irysId,
        bytes32 previousVersion,
        string memory description
    ) public;

    // 버전 히스토리 조회
    function getVersionHistory(bytes32 entityId)
        public view returns (Version[] memory);
}
```

### 4. EventBus

**목적**: WebSocket 실시간 통신 대체

```solidity
contract EventBus {
    event DocumentCreated(
        bytes32 indexed irysId,
        bytes32 indexed projectId,
        string title
    );

    event DocumentUpdated(
        bytes32 indexed docId,
        address indexed author,
        bytes32 newVersionId
    );

    // 이벤트 발생
    function emitDocumentCreated(...) public;
    function emitDocumentUpdated(...) public;
}
```

### 5. CacheController

**목적**: Redis 캐시 관리 대체

```solidity
contract CacheController {
    event CacheInvalidated(bytes32 indexed resourceId);

    // 캐시 무효화
    function invalidateCache(bytes32 resourceId) public;
}
```

### 6. SearchIndex

**목적**: ElasticSearch 대체

```solidity
contract SearchIndex {
    // 태그 인덱싱
    function indexDocument(
        bytes32 docId,
        bytes32[] memory tags
    ) public;

    // 태그로 검색
    function search(bytes32 tag)
        public view returns (bytes32[] memory);
}
```

---

## 데이터 흐름

### 문서 생성 플로우

```
1. User: "Create Document" 버튼 클릭
   ↓
2. Frontend: 폼 데이터 수집
   ↓
3. PureIrysClient.createDocument({
     projectId: 'my-project',
     title: 'My Doc',
     content: 'Hello World!',
     tags: ['tech', 'tutorial']
   })
   ↓
4. Irys Upload: 콘텐츠를 Irys에 업로드
   → Receipt: { id: 'irys_tx_id_123' }
   ↓
5. Smart Contract: DocumentRegistry.registerDocument()
   → Returns: docId = 'doc_abc123'
   ↓
6. Smart Contract: ProvenanceChain.recordProvenance()
   → Initial version 기록
   ↓
7. Smart Contract: EventBus.emitDocumentCreated()
   → 블록체인 이벤트 발생
   ↓
8. IndexedDB: 문서 캐싱 (5분 TTL)
   ↓
9. Frontend: UI 업데이트, 성공 메시지
```

**소요 시간**: 2-5초 (블록체인 confirmation)

### 문서 조회 플로우

```
1. User: 문서 링크 클릭
   ↓
2. PureIrysClient.getDocument(docId)
   ↓
3. IndexedDB 캐시 확인
   ├─ Cache HIT (< 5min)
   │  → 즉시 반환 (~10ms)
   │
   └─ Cache MISS
      ↓
      4. DocumentRegistry.getDocument(docId)
         → 메타데이터 조회 (~200ms)
      ↓
      5. Irys Gateway: GET /irys_tx_id_123
         → 콘텐츠 다운로드 (~300ms)
      ↓
      6. IndexedDB에 캐싱
      ↓
      7. 반환 (총 ~500ms)
```

### 문서 수정 플로우

```
1. User: 문서 편집 후 "Save" 클릭
   ↓
2. PureIrysClient.updateDocument(docId, { content, description })
   ↓
3. Irys Upload: 새 버전 업로드
   → New Receipt: { id: 'irys_tx_id_456' }
   ↓
4. DocumentRegistry.updateDocument()
   → 메타데이터 업데이트
   ↓
5. ProvenanceChain.addVersion()
   → 새 버전 기록
   ↓
6. EventBus.emitDocumentUpdated()
   → 실시간 이벤트
   ↓
7. IndexedDB 캐시 무효화
   ↓
8. 다른 사용자들의 클라이언트에서 이벤트 감지
   → 자동 리로드
```

### 실시간 업데이트

```
User A가 문서 수정
   ↓
EventBus.emitDocumentUpdated() 호출
   ↓
Blockchain Event 발생
   ↓
User B의 PureIrysClient 이벤트 리스너 감지
   ↓
IndexedDB 캐시 무효화
   ↓
Frontend 자동 리렌더링
   ↓
User B가 최신 버전 확인
```

---

## 캐싱 전략

### 3-Tier Cache Architecture

```
Layer 1: Component State (React State)
  ↓ (즉시, 0ms)

Layer 2: IndexedDB (Browser Storage)
  ↓ (빠름, 10-50ms)
  ↓ TTL: 5분

Layer 3: Irys DataChain (Blockchain)
  ↓ (느림, 200-500ms)
  ↓ Permanent Storage
```

### IndexedDB 스키마

```typescript
interface CacheEntry<T> {
  key: string;          // 캐시 키
  data: T;              // 데이터
  timestamp: number;    // 저장 시간
  irysId?: string;      // Irys 트랜잭션 ID
  ttl: number;          // 유효 시간 (ms)
}

// 캐시 타입
- documents: Map<docId, Document>
- queries: Map<queryKey, Document[]>
- metadata: Map<key, any>
```

### 캐시 무효화

**자동 무효화**:
1. TTL 만료 (5분)
2. 블록체인 이벤트 (DocumentUpdated)
3. CacheController 신호

**수동 무효화**:
```typescript
await client.clearCache();              // 전체 삭제
await cache.invalidateDocument(docId);  // 특정 문서
await cache.invalidatePattern(pattern); // 패턴 매칭
```

---

## 보안 아키텍처

### 지갑 기반 인증

```
1. User: "Connect Wallet" 클릭
   ↓
2. RainbowKit: 지갑 선택 (MetaMask, WalletConnect 등)
   ↓
3. wagmi: 지갑 연결 요청
   ↓
4. User: 연결 승인
   ↓
5. ethers.js: Signer 객체 생성
   ↓
6. PureIrysClient: Signer로 초기화
   ↓
7. 모든 트랜잭션에 자동 서명
```

### 권한 모델

**소유권 기반**:
- 지갑 주소 = 사용자 식별자
- Document.owner = msg.sender (생성자)
- 소유자만 수정/삭제 가능

**RBAC (Role-Based Access Control)**:
```
OWNER (5):  모든 권한
ADMIN (4):  콘텐츠 관리, 멤버 관리
EDITOR (3): 콘텐츠 편집
READ (2):   읽기 전용
NONE (1):   접근 불가
```

### 데이터 보안

**전송 중**:
- HTTPS (RPC 통신)
- 지갑 서명 검증
- Replay attack 방지

**저장 시**:
- Irys: 블록체인 불변성
- IndexedDB: 브라우저 샌드박스
- 선택적 암호화 지원 (향후)

---

## 성능 최적화

### Frontend 최적화

**코드 스플리팅**:
```typescript
// Lazy loading
const DashboardPure = lazy(() => import('./pages/DashboardPure'));
const NewProjectPure = lazy(() => import('./pages/NewProjectPure'));
```

**번들 크기**:
- Initial: ~150KB (gzipped)
- Per route: ~20-50KB
- 총 First Load: ~200KB

**이미지 최적화**:
- WebP 포맷
- Lazy loading
- Responsive images

### Blockchain 최적화

**배치 처리**:
```typescript
// 여러 문서 한 번에 등록
const docIds = await Promise.all(
  documents.map(doc => client.createDocument(doc))
);
```

**Gas 최적화**:
- 효율적인 Solidity 코드
- Storage 최소화
- Event 활용 (logs cheaper than storage)

### 캐싱 최적화

**적중률 목표**: 90%+

**전략**:
1. 자주 조회되는 문서 우선 캐싱
2. 프로젝트 단위 프리페치
3. 스마트 무효화 (필요한 것만)

**측정**:
```typescript
const stats = await client.getCacheStats();
console.log(`Hit rate: ${stats.hitRate}%`);
```

### 성능 메트릭

| 작업 | 캐시 HIT | 캐시 MISS | 목표 |
|------|----------|-----------|------|
| 문서 조회 | ~10ms | ~500ms | < 1s |
| 문서 생성 | N/A | 2-5s | < 10s |
| 문서 수정 | N/A | 2-5s | < 10s |
| 검색 | ~50ms | 1-2s | < 3s |
| 초기 로드 | N/A | 1-2s | < 3s |

---

## 확장성

### 수평 확장

**기존 BaaS**:
```
더 많은 사용자
  → 더 많은 서버 필요
  → 더 큰 데이터베이스 필요
  → 더 복잡한 로드 밸런싱
  → 운영 비용 증가
```

**Pure Irys BaaS**:
```
더 많은 사용자
  → 블록체인이 자동으로 처리
  → 인프라 변경 불필요
  → 운영 비용 동일
  → 자동 스케일링
```

### 글로벌 분산

- Irys Gateway: 전세계 CDN
- IndexedDB: 로컬 캐싱
- No central server: 단일 장애점 없음

---

## 참고 문서

- [빠른 시작](./GETTING_STARTED.md)
- [Pure Irys 설정 가이드](../PURE_IRYS_SETUP.md)
- [배포 가이드](./DEPLOYMENT.md)
- [API 문서](./API.md)

---

**DeBHuB Pure Irys BaaS Architecture**

Made with ❤️ by DeBHuB Team
