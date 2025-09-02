# IrysBase 최종 기술 프롬프트

너는 분산 시스템, 특히 Irys 데이터체인과 EVM 스마트 컨트랙트에 매우 능숙한 시니어 풀스택 개발자야. 지금부터 **'IrysBase'**라는 프로젝트를 구축할 거야. 이 프로젝트는 Irys를 영구 저장소로 사용하고 전통적인 데이터베이스를 쿼리 레이어로 활용하는 하이브리드 GraphQL 기반 BaaS(Backend-as-a-Service) 플랫폼으로, Supabase의 개발자 경험을 벤치마킹해.

전체 프로젝트는 Turborepo 기반의 모노레포로 구성하며, 아래의 청사진에 따라 모든 코드를 작성해 줘. 클린 코드 원칙을 따르고, 모든 로직은 기술 청사진에 명시된 하이브리드 아키텍처를 따라야 해.

## 1. 핵심 아키텍처 및 Irys 개념

IrysBase는 Irys 데이터체인을 영구 저장소로, PostgreSQL을 쿼리 및 캐싱 레이어로 사용하는 하이브리드 아키텍처를 채택해. 모든 설계는 다음 Irys의 핵심 개념을 기반으로 해야 해:

**데이터 저장소**: 데이터의 '행(Row)'은 개별 Irys 트랜잭션에 해당해. '테이블(Table)' 개념은 특정 `table` **태그(Tag)**를 가진 트랜잭션들의 집합으로 구현되며, PostgreSQL에 동기화돼. 데이터 수정(Update)은 원본을 바꾸는 대신, 수정된 데이터로 새 트랜잭션을 생성하고 원본을 가리키는 '가변 참조(Mutable References)' 패턴을 사용해.

**프로그래밍 로직**: 핵심 비즈니스 로직과 권한 부여(RBAC)는 **IrysVM(EVM 호환, Chain ID: 1270)**에 배포된 Solidity 스마트 컨트랙트를 통해 온체인에서 실행돼. 스마트 컨트랙트는 `ProgrammableData` 베이스 컨트랙트를 상속받아야 해.

**쿼리 아키텍처**: Irys 게이트웨이의 태그 기반 쿼리는 메타데이터 검색에만 사용하고, 복잡한 쿼리는 PostgreSQL을 통해 처리해. 모든 사용자 인증은 중앙 JWT 서버 없이 지갑 서명을 통해 이루어져.

**동기화 메커니즘**: PostgreSQL과 Irys 간의 데이터 동기화를 위한 백그라운드 워커를 구현해. 스마트 컨트랙트 이벤트를 모니터링하여 준실시간 업데이트를 제공해.

## 2. 프로젝트 전체 구조 및 기술 스택

- **모노레포**: Turborepo
- **프론트엔드 (apps/web)**: Next.js, TypeScript, Tailwind CSS, shadcn/ui, ethers.js, WalletConnect, Apollo Client
- **백엔드 (apps/api)**: Node.js, TypeScript, Apollo Server, @irys/sdk, @irys/query, PostgreSQL, Prisma ORM, Redis, Bull Queue
- **스마트 컨트랙트 (packages/contracts)**: Solidity, Hardhat, @irys/precompile-libraries
- **공통 패키지 (packages/shared)**: 타입 정의, 유틸리티 함수

## 3. 백엔드 구현 (apps/api)

### A. GraphQL 스키마 정의 (schema.graphql)

```graphql
type Post {
  id: ID!                    # PostgreSQL ID
  irysTransactionId: String!  # Irys 트랜잭션 ID
  content: String!
  authorAddress: String!
  timestamp: String!
  version: Int!              # 가변 참조 체인의 버전
  previousVersionId: String  # 이전 버전의 Irys 트랜잭션 ID
}

type Query {
  "PostgreSQL을 통한 효율적인 쿼리"
  postsByAuthor(authorAddress: String!, limit: Int, offset: Int): [Post!]!
  
  "특정 포스트의 전체 버전 히스토리 조회"
  postHistory(id: ID!): [Post!]!
  
  "Irys에서 직접 데이터 검증 (선택적)"
  verifyPostFromIrys(irysTransactionId: String!): Post
}

type Mutation {
  "새로운 게시물을 Irys에 업로드하고 PostgreSQL에 동기화"
  createPost(content: String!): Post!
  
  "기존 게시물 업데이트 (새 버전 생성)"
  updatePost(id: ID!, content: String!): Post!
}

type Subscription {
  "블록체인 이벤트 기반 준실시간 알림"
  postUpdates: PostUpdate!
}

type PostUpdate {
  type: UpdateType!
  post: Post!
}

enum UpdateType {
  CREATED
  UPDATED
}
```

### B. 리졸버 로직 구현

**createPost 뮤테이션**:
1. 클라이언트 요청 헤더에서 지갑 서명을 검증하여 `authorAddress`를 획득
2. `AuthRoles` 스마트 컨트랙트의 `hasRole` 함수를 호출하여 해당 주소가 'creator' 역할을 가졌는지 온체인에서 권한 확인
3. 권한이 확인되면, Irys SDK를 사용하여 content를 업로드. 필수 태그:
   ```javascript
   tags: [
     { name: "Content-Type", value: "application/json" },
     { name: "App-Name", value: "IrysBase" },
     { name: "table", value: "posts" },
     { name: "author-address", value: authorAddress },
     { name: "timestamp", value: new Date().toISOString() },
     { name: "version", value: "1" }
   ]
   ```
4. 업로드 성공 후, `Posts` 스마트 컨트랙트의 `registerPost` 함수를 호출하여 Irys 트랜잭션 ID를 온체인에 기록
5. PostgreSQL에 포스트 데이터를 저장 (Prisma ORM 사용)
6. Redis 캐시를 무효화하고 업데이트
7. Bull Queue를 통해 이벤트 리스너에 알림 전송
8. 최종 Post 데이터를 클라이언트에 반환

**updatePost 뮤테이션**:
1. 기존 포스트를 PostgreSQL에서 조회
2. 가변 참조 패턴을 사용하여 새 버전 생성:
   ```javascript
   // Mutable reference 구조
   const mutableRef = {
     type: "post-update",
     previousId: existingPost.irysTransactionId,
     content: newContent,
     version: existingPost.version + 1
   }
   ```
3. 새 트랜잭션을 Irys에 업로드
4. PostgreSQL과 캐시 업데이트

**postsByAuthor 쿼리**:
1. PostgreSQL에서 효율적으로 쿼리 (인덱싱된 authorAddress 필드 사용)
2. Redis 캐시 확인 및 캐시 미스 시 DB 조회
3. 페이지네이션 지원
4. 선택적으로 Irys 게이트웨이를 통한 데이터 검증 제공

### C. 동기화 서비스 구현

**IrysSyncWorker** (별도 프로세스):
```javascript
// 주기적으로 Irys 트랜잭션을 확인하고 PostgreSQL과 동기화
// Submit 단계와 Publish 단계 간의 지연을 처리
```

**EventListener** (블록체인 이벤트 모니터링):
```javascript
// ethers.js를 사용하여 IrysVM 스마트 컨트랙트 이벤트 구독
// PostCreated, PostUpdated 이벤트를 감지하고 처리
```

## 4. 스마트 컨트랙트 구현 (packages/contracts)

### A. AuthRoles.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@irys/precompile-libraries/ProgrammableData.sol";

contract AuthRoles is ProgrammableData {
    mapping(address => string) public roles;
    address public owner;
    
    event RoleAssigned(address indexed user, string role);
    
    constructor() {
        owner = msg.sender;
    }
    
    function assignRole(address user, string memory role) external {
        require(msg.sender == owner, "Only owner can assign roles");
        roles[user] = role;
        emit RoleAssigned(user, role);
    }
    
    function hasRole(address user, string memory role) external view returns (bool) {
        return keccak256(bytes(roles[user])) == keccak256(bytes(role));
    }
}
```

### B. Posts.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@irys/precompile-libraries/ProgrammableData.sol";

contract Posts is ProgrammableData {
    event PostCreated(address indexed author, string irysTransactionId, uint256 timestamp);
    event PostUpdated(address indexed author, string newTransactionId, string previousTransactionId);
    
    AuthRoles public authContract;
    
    constructor(address _authContract) {
        authContract = AuthRoles(_authContract);
    }
    
    function registerPost(string memory irysTransactionId) external {
        require(
            authContract.hasRole(msg.sender, "creator"),
            "Unauthorized: creator role required"
        );
        
        emit PostCreated(msg.sender, irysTransactionId, block.timestamp);
    }
    
    function updatePost(
        string memory newTransactionId,
        string memory previousTransactionId
    ) external {
        emit PostUpdated(msg.sender, newTransactionId, previousTransactionId);
    }
}
```

## 5. 프론트엔드 구현 (apps/web)

### A. 핵심 컴포넌트

**ConnectWallet.tsx**: 
- WalletConnect와 MetaMask 지원
- IrysVM (Chain ID: 1270) 네트워크 자동 추가
- 연결된 주소를 Zustand 전역 상태로 관리

**PostForm.tsx**: 
- 사용자가 content를 입력하면 `irys.getPrice()` 호출하여 예상 비용 표시
- Irys 토큰 잔액 확인 및 부족 시 펀딩 옵션 제공
- 트랜잭션 제출 후 진행 상태 표시 (Submit → Publish 단계)

**PostsTable.tsx**: 
- `postsByAuthor` 쿼리를 통한 데이터 로드
- 가상 스크롤링으로 대량 데이터 처리
- 폴링 기반 준실시간 업데이트 (5초 간격)
- 버전 히스토리 보기 옵션

**DataVerifier.tsx** (새 컴포넌트):
- Irys 게이트웨이에서 직접 데이터 검증
- PostgreSQL 데이터와 Irys 원본 비교
- 데이터 무결성 상태 표시

### B. 전체 UI/UX

**대시보드 레이아웃**:
- 좌측 사이드바: 네비게이션, 지갑 연결 상태, Irys 토큰 잔액
- 중앙 메인 영역: 데이터 테이블, 폼, 차트
- 상단 헤더: 네트워크 상태, 동기화 상태 표시
- 하단 상태바: 최근 트랜잭션, 가스 비용 추정치

**테마 및 스타일링**:
- Tailwind CSS와 shadcn/ui를 사용한 일관된 디자인
- 다크/라이트 모드 지원
- 반응형 디자인으로 모바일 지원

## 6. 추가 구현 사항

### A. 모니터링 및 관리 도구

**Admin Dashboard** (apps/admin):
- Irys 트랜잭션 모니터링
- PostgreSQL 동기화 상태
- 스마트 컨트랙트 이벤트 로그
- 비용 분석 (storage costs tracking)

### B. 개발자 도구

**CLI Tool** (packages/cli):
- 데이터 마이그레이션 도구
- Irys ↔ PostgreSQL 동기화 검증
- 백업 및 복구 유틸리티

### C. 테스트 전략

- IrysVM 테스트넷 (Alpha) 사용
- 로컬 PostgreSQL과 Redis 인스턴스
- Hardhat 로컬 네트워크로 스마트 컨트랙트 테스트
- Jest와 React Testing Library로 프론트엔드 테스트

이 청사진을 바탕으로 전체 IrysBase 프로젝트의 코드를 생성해 줘. 특히 Irys의 현재 제약사항(쿼리 한계, 실시간 기능 부재)을 고려한 실용적인 해결책을 구현하는 데 중점을 둬.