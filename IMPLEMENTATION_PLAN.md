# 🚀 DeBHuB Pure Irys BaaS - Implementation Plan

> **세계 최초 Pure Irys 기반 완전 탈중앙화 BaaS 구현 계획**

## 📋 Overview

**목표**: PostgreSQL + Redis를 완전히 제거하고 Irys DataChain 하나로 모든 기능 구현

**핵심 전략**:
1. ✅ Smart Contracts로 데이터 인덱싱 (PostgreSQL 대체)
2. ✅ IndexedDB로 클라이언트 캐싱 (Redis 대체)
3. ✅ Blockchain Events로 실시간 통신 (WebSocket 대체)
4. ✅ Programmable Data로 로직 실행 (Backend API 대체)

---

## 🎯 Phase 1: Smart Contract Foundation (Week 1-2)

### 목표
핵심 스마트 컨트랙트 개발 및 배포

### 1.1 개발할 컨트랙트

#### Priority 1 (필수)
```
packages/contracts/contracts/
├── DocumentRegistry.sol      ⭐ 문서 등록 및 인덱싱 (가장 중요)
├── AccessControl.sol          ⭐ 권한 관리
└── ProvenanceChain.sol        ⭐ 버전 관리
```

#### Priority 2 (중요)
```
├── EventBus.sol              📢 이벤트 시스템
├── CacheController.sol       💾 캐시 무효화
└── SearchIndex.sol           🔍 검색 인덱스
```

#### Priority 3 (추후)
```
├── ProjectGovernance.sol     🏛️ 프로젝트 거버넌스
└── Analytics.sol             📊 분석 (나중에)
```

### 1.2 작업 순서

#### Step 1: 환경 설정
```bash
cd packages/contracts

# 의존성 설치
pnpm add @irys/precompile-libraries hardhat @nomiclabs/hardhat-ethers ethers

# Hardhat 설정 업데이트
```

**파일**: `packages/contracts/hardhat.config.ts`
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    irysTestnet: {
      url: "https://testnet-rpc.irys.xyz",
      chainId: 1270,
      accounts: [process.env.IRYS_PRIVATE_KEY || ""]
    },
    irysMainnet: {
      url: "https://rpc.irys.computer",
      chainId: 1270,
      accounts: [process.env.IRYS_PRIVATE_KEY || ""]
    }
  }
};

export default config;
```

#### Step 2: DocumentRegistry.sol 작성
**위치**: `packages/contracts/contracts/DocumentRegistry.sol`

**핵심 기능**:
- [x] 문서 등록 (registerDocument)
- [x] Owner별 문서 조회 (getDocumentsByOwner)
- [x] Project별 문서 조회 (getDocumentsByProject)
- [x] Tag별 문서 조회 (getDocumentsByTag)
- [x] 문서 상태 업데이트 (updateDocument)

**코드 스니펫**:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@irys/precompile-libraries/libraries/ProgrammableData.sol";

contract DocumentRegistry is ProgrammableData {
    struct Document {
        bytes32 irysId;
        address owner;
        uint256 createdAt;
        uint256 updatedAt;
        bytes32 projectId;
        string title;
        bool isPublic;
        uint8 status;
    }

    mapping(bytes32 => Document) public documents;
    mapping(address => bytes32[]) public documentsByOwner;
    mapping(bytes32 => bytes32[]) public documentsByProject;
    mapping(bytes32 => bytes32[]) public documentsByTag;

    event DocumentRegistered(bytes32 indexed docId, bytes32 indexed irysId, address indexed owner);
    event DocumentUpdated(bytes32 indexed docId, uint256 timestamp);

    function registerDocument(
        bytes32 irysId,
        bytes32 projectId,
        string memory title,
        bytes32[] memory tags
    ) public returns (bytes32) {
        bytes32 docId = keccak256(abi.encodePacked(irysId, msg.sender, block.timestamp));

        documents[docId] = Document({
            irysId: irysId,
            owner: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            projectId: projectId,
            title: title,
            isPublic: false,
            status: 0
        });

        documentsByOwner[msg.sender].push(docId);
        documentsByProject[projectId].push(docId);

        for (uint i = 0; i < tags.length; i++) {
            documentsByTag[tags[i]].push(docId);
        }

        emit DocumentRegistered(docId, irysId, msg.sender);
        return docId;
    }

    function getDocumentsByOwner(address owner) public view returns (bytes32[] memory) {
        return documentsByOwner[owner];
    }

    function getDocumentsByProject(bytes32 projectId) public view returns (bytes32[] memory) {
        return documentsByProject[projectId];
    }

    function getDocument(bytes32 docId) public view returns (Document memory) {
        return documents[docId];
    }
}
```

#### Step 3: AccessControl.sol 작성
**위치**: `packages/contracts/contracts/AccessControl.sol`

#### Step 4: ProvenanceChain.sol 작성
**위치**: `packages/contracts/contracts/ProvenanceChain.sol`

#### Step 5: 테스트 작성
**위치**: `packages/contracts/test/DocumentRegistry.test.ts`

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("DocumentRegistry", function () {
  it("Should register a document", async function () {
    const [owner] = await ethers.getSigners();
    const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
    const registry = await DocumentRegistry.deploy();
    await registry.deployed();

    const irysId = ethers.utils.formatBytes32String("test-irys-id");
    const projectId = ethers.utils.formatBytes32String("project-1");
    const title = "Test Document";
    const tags = [ethers.utils.id("blockchain"), ethers.utils.id("web3")];

    const tx = await registry.registerDocument(irysId, projectId, title, tags);
    const receipt = await tx.wait();

    const docId = receipt.events[0].args.docId;
    const doc = await registry.getDocument(docId);

    expect(doc.title).to.equal(title);
    expect(doc.owner).to.equal(owner.address);
  });

  it("Should query documents by owner", async function () {
    // ... test implementation
  });
});
```

#### Step 6: 배포 스크립트
**위치**: `packages/contracts/scripts/deploy-pure-irys.ts`

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Pure Irys BaaS Contracts...");

  // 1. DocumentRegistry
  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const registry = await DocumentRegistry.deploy();
  await registry.deployed();
  console.log("✅ DocumentRegistry deployed to:", registry.address);

  // 2. AccessControl
  const AccessControl = await ethers.getContractFactory("AccessControl");
  const access = await AccessControl.deploy();
  await access.deployed();
  console.log("✅ AccessControl deployed to:", access.address);

  // 3. ProvenanceChain
  const ProvenanceChain = await ethers.getContractFactory("ProvenanceChain");
  const provenance = await ProvenanceChain.deploy();
  await provenance.deployed();
  console.log("✅ ProvenanceChain deployed to:", provenance.address);

  // Save addresses
  const addresses = {
    documentRegistry: registry.address,
    accessControl: access.address,
    provenanceChain: provenance.address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
  };

  console.log("\n📝 Contract Addresses:");
  console.log(JSON.stringify(addresses, null, 2));

  // Save to file
  const fs = require("fs");
  fs.writeFileSync(
    "./deployed-addresses.json",
    JSON.stringify(addresses, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

#### Step 7: 배포 실행
```bash
# Testnet 배포
pnpm hardhat run scripts/deploy-pure-irys.ts --network irysTestnet

# Mainnet 배포 (준비되면)
pnpm hardhat run scripts/deploy-pure-irys.ts --network irysMainnet
```

### 1.3 체크리스트

- [ ] Hardhat 환경 설정 완료
- [ ] DocumentRegistry.sol 작성
- [ ] AccessControl.sol 작성
- [ ] ProvenanceChain.sol 작성
- [ ] EventBus.sol 작성
- [ ] CacheController.sol 작성
- [ ] SearchIndex.sol 작성
- [ ] 모든 컨트랙트 테스트 작성
- [ ] 테스트 통과 (100% coverage)
- [ ] Testnet 배포 완료
- [ ] Contract verification 완료
- [ ] deployed-addresses.json 생성

---

## 🎨 Phase 2: Frontend Client (Week 3-4)

### 목표
Pure Irys Client 라이브러리 구현

### 2.1 파일 구조

```
packages/
└── pure-irys-client/
    ├── src/
    │   ├── index.ts                  # Main export
    │   ├── PureIrysClient.ts         # Core client
    │   ├── contracts/
    │   │   ├── abis/                 # Contract ABIs
    │   │   └── addresses.ts          # Deployed addresses
    │   ├── cache/
    │   │   ├── IndexedDBCache.ts     # IndexedDB manager
    │   │   └── CacheStrategy.ts      # Cache policies
    │   ├── queries/
    │   │   ├── DocumentQueries.ts
    │   │   └── ProjectQueries.ts
    │   └── types/
    │       └── index.ts              # TypeScript types
    ├── package.json
    └── tsconfig.json
```

### 2.2 작업 순서

#### Step 1: Package 생성
```bash
mkdir -p packages/pure-irys-client
cd packages/pure-irys-client
pnpm init
```

**package.json**:
```json
{
  "name": "@debhub/pure-irys-client",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@irys/upload": "^0.0.15",
    "@irys/query": "^0.0.13",
    "ethers": "^6.7.1",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

#### Step 2: IndexedDB Cache 구현
**위치**: `packages/pure-irys-client/src/cache/IndexedDBCache.ts`

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DeBHuBCache extends DBSchema {
  documents: {
    key: string;
    value: {
      docId: string;
      data: any;
      timestamp: number;
      irysId: string;
    };
    indexes: { 'by-timestamp': number };
  };
  queries: {
    key: string;
    value: {
      query: string;
      result: any;
      timestamp: number;
    };
  };
}

export class IndexedDBCache {
  private db: IDBPDatabase<DeBHuBCache>;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async init() {
    this.db = await openDB<DeBHuBCache>('debhub-pure-irys', 1, {
      upgrade(db) {
        const docStore = db.createObjectStore('documents', { keyPath: 'docId' });
        docStore.createIndex('by-timestamp', 'timestamp');

        db.createObjectStore('queries', { keyPath: 'query' });
      },
    });
  }

  async getDocument(docId: string) {
    const cached = await this.db.get('documents', docId);
    if (!cached) return null;

    // Check TTL
    if (Date.now() - cached.timestamp > this.TTL) {
      await this.db.delete('documents', docId);
      return null;
    }

    return cached.data;
  }

  async setDocument(docId: string, data: any, irysId: string) {
    await this.db.put('documents', {
      docId,
      data,
      timestamp: Date.now(),
      irysId,
    });
  }

  async invalidate(docId: string) {
    await this.db.delete('documents', docId);
  }

  async clear() {
    await this.db.clear('documents');
    await this.db.clear('queries');
  }
}
```

#### Step 3: Core Client 구현
**위치**: `packages/pure-irys-client/src/PureIrysClient.ts`

핵심 메서드:
- `createDocument()`
- `getDocument()`
- `updateDocument()`
- `searchDocuments()`
- `subscribeToDocument()`

(전체 코드는 PURE_IRYS_BAAS_BLUEPRINT.md 참조)

#### Step 4: Frontend 통합
**위치**: `apps/web-vite/src/lib/pure-irys.ts`

```typescript
import { PureIrysClient } from '@debhub/pure-irys-client';
import { useWallet } from './wagmi';

let client: PureIrysClient | null = null;

export async function usePureIrys() {
  const { signer } = useWallet();

  if (!client && signer) {
    client = new PureIrysClient(signer);
    await client.init();
  }

  return client;
}
```

### 2.3 체크리스트

- [ ] @debhub/pure-irys-client 패키지 생성
- [ ] IndexedDBCache 구현
- [ ] PureIrysClient 기본 구조
- [ ] createDocument() 구현
- [ ] getDocument() with cache
- [ ] updateDocument() with versioning
- [ ] searchDocuments() 구현
- [ ] Event subscription 구현
- [ ] Frontend hooks 작성
- [ ] 통합 테스트

---

## 🚀 Phase 3: Migration & Testing (Week 5-6)

### 목표
기존 하이브리드 시스템에서 Pure Irys로 마이그레이션

### 3.1 마이그레이션 전략

#### Option 1: Parallel Mode (권장)
```typescript
// .env
VITE_MODE=hybrid  // 또는 pure-irys

// 런타임에 선택
const client = mode === 'pure-irys'
  ? new PureIrysClient(signer)
  : new GraphQLClient(apiUrl);
```

#### Option 2: Progressive Migration
1. Week 1: Read operations → Pure Irys
2. Week 2: Write operations → Pure Irys
3. Week 3: Search → Pure Irys
4. Week 4: Real-time → Pure Irys
5. Week 5: 완전 전환

### 3.2 데이터 마이그레이션

```typescript
// scripts/migrate-to-pure-irys.ts
async function migrateDatabase() {
  console.log("🚀 Starting migration to Pure Irys...");

  // 1. PostgreSQL에서 모든 문서 조회
  const documents = await prisma.document.findMany();

  // 2. 각 문서를 Irys에 업로드 & 스마트 컨트랙트 등록
  for (const doc of documents) {
    // Upload to Irys (이미 업로드된 경우 skip)
    if (!doc.irysTransactionId) {
      const receipt = await uploader.upload(doc.content, { tags });
      doc.irysTransactionId = receipt.id;
    }

    // Register in smart contract
    await registry.registerDocument(
      ethers.utils.formatBytes32String(doc.irysTransactionId),
      ethers.utils.formatBytes32String(doc.projectId),
      doc.title,
      doc.tags.map(t => ethers.utils.id(t))
    );

    console.log(`✅ Migrated: ${doc.id}`);
  }

  console.log("🎉 Migration complete!");
}
```

### 3.3 성능 테스트

```typescript
// tests/performance/pure-irys-benchmark.ts
describe("Pure Irys Performance", () => {
  it("Document creation < 2s", async () => {
    const start = Date.now();
    await client.createDocument({...});
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });

  it("Document read with cache < 100ms", async () => {
    // First read (populate cache)
    await client.getDocument(docId);

    // Second read (from cache)
    const start = Date.now();
    await client.getDocument(docId);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it("Search < 500ms", async () => {
    const start = Date.now();
    await client.searchDocuments("blockchain");
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
```

### 3.4 체크리스트

- [ ] Parallel mode 구현
- [ ] 데이터 마이그레이션 스크립트
- [ ] PostgreSQL → Irys 데이터 이전
- [ ] A/B 테스트 (Hybrid vs Pure)
- [ ] 성능 벤치마크
- [ ] 부하 테스트
- [ ] 사용자 피드백 수집
- [ ] 문제 해결 및 최적화

---

## 📊 Success Criteria

### Technical Metrics
- [ ] ✅ Zero PostgreSQL dependencies
- [ ] ✅ Zero Redis dependencies
- [ ] ✅ Zero backend server (frontend only)
- [ ] ✅ Document read < 200ms (cached < 100ms)
- [ ] ✅ Document write < 2s
- [ ] ✅ Search < 500ms
- [ ] ✅ 100% data immutability
- [ ] ✅ 99.99% uptime (blockchain guaranteed)

### Business Metrics
- [ ] ✅ 90%+ cost reduction
- [ ] ✅ 100% decentralization
- [ ] ✅ Zero vendor lock-in
- [ ] ✅ Community approval

---

## 🎯 Next Steps

### Immediate Actions (This Week)

1. **Day 1-2**: Smart Contract Development
   - [ ] Setup Hardhat environment
   - [ ] Write DocumentRegistry.sol
   - [ ] Write AccessControl.sol

2. **Day 3-4**: Testing & Deployment
   - [ ] Write comprehensive tests
   - [ ] Deploy to testnet
   - [ ] Verify contracts

3. **Day 5-7**: Client Library Foundation
   - [ ] Create @debhub/pure-irys-client
   - [ ] Implement IndexedDBCache
   - [ ] Basic CRUD operations

### Week 2
- [ ] Complete all 6 core contracts
- [ ] Frontend integration
- [ ] Demo application

### Week 3-4
- [ ] Full feature implementation
- [ ] Migration tools
- [ ] Documentation

---

## 💬 Questions & Decisions

### Open Questions
1. **Gas Optimization**: 어느 정도까지 on-chain 저장? (vs off-chain tags)
2. **Search Performance**: On-chain index vs Irys Query SDK 비중?
3. **Cache TTL**: 5분이 적절한가? 사용자별 설정 가능?

### Decisions Made
- ✅ Primary storage: Irys DataChain
- ✅ Indexing: Smart Contracts
- ✅ Caching: IndexedDB (client-side)
- ✅ Real-time: Blockchain events
- ✅ Search: Hybrid (on-chain + Irys Query)

---

## 🎉 Vision

**"세계 최초의 Pure Irys BaaS 플랫폼"**

이것은 단순한 프로젝트가 아닙니다.
이것은 **블록체인 기반 인프라의 새로운 패러다임**입니다.

**DeBHuB는 증명할 것입니다:**
- ✅ 서버 없이도 완전한 BaaS 가능
- ✅ 블록체인이 데이터베이스보다 나을 수 있다
- ✅ 탈중앙화가 실용적이다
- ✅ 영구 스토리지가 미래다

**Let's build the impossible.** 🚀

---

**Ready to start?**
Phase 1을 지금 바로 시작하시겠습니까?
