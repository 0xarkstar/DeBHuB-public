# Irys 아키텍처 심층 분석
**작성일**: 2025-10-20

## 🏗️ Irys의 3단계 레이어 구조

### Layer 1: Storage Layer (저장 레이어)
**역할**: 데이터의 영구 저장
**기술**: Multi-ledger system

```
┌─────────────────────────────────────┐
│     Irys Storage Layer (L1)         │
├─────────────────────────────────────┤
│  • Arweave (영구 저장)              │
│  • Filecoin (임시 저장)             │
│  • 확장 가능한 추가 레저            │
└─────────────────────────────────────┘
```

**특징**:
- ✅ **저렴한 비용**: 대용량 데이터를 경제적으로 저장
- ✅ **검증 가능한 데이터**: 모든 데이터는 크립토그래픽하게 검증 가능
- ✅ **영구성**: Arweave 기반 영구 저장
- ✅ **유연성**: 필요에 따라 다른 스토리지 레저 추가 가능

**비용**:
- Irys 네이티브 토큰 또는
- ETH, MATIC 등 다양한 토큰으로 결제 가능
- **ETH 가스비 불필요**

---

### Layer 2: IrysVM (Execution Layer) ⭐ **NEW!**
**역할**: 스마트 컨트랙트 실행 및 데이터 프로그래밍
**기술**: EVM-compatible execution layer

```
┌─────────────────────────────────────┐
│      IrysVM (Execution Layer)       │
├─────────────────────────────────────┤
│  • EVM 호환 스마트 컨트랙트        │
│  • 네이티브 데이터 액세스          │
│  • Programmable Data                │
│  • 자동화 & 로직 실행              │
└─────────────────────────────────────┘
           ↓ 직접 접근
┌─────────────────────────────────────┐
│     Irys Storage Layer              │
└─────────────────────────────────────┘
```

**특징**:
- ✅ **EVM 호환**: Solidity 스마트 컨트랙트 그대로 사용 가능
- ✅ **네이티브 데이터 액세스**: 스마트 컨트랙트가 저장된 데이터에 직접 접근
- ✅ **Programmable Data**: 데이터에 로직을 내장시켜 자동 실행
- ✅ **고성능**: 최적화된 실행 환경

**비용**:
- Irys 네트워크 가스비 (ETH 아님!)
- Irys 네이티브 토큰으로 결제

**출시 시점**:
- 🆕 **2025년 1월 테스트넷 런칭**
- 현재 테스트넷 단계

---

### Layer 3: Query Layer (GraphQL)
**역할**: 데이터 검색 및 조회
**기술**: GraphQL API

```
┌─────────────────────────────────────┐
│        GraphQL Query API            │
├─────────────────────────────────────┤
│  • 태그 기반 검색                  │
│  • 필터링 & 정렬                   │
│  • 페이지네이션                    │
│  • 실시간 쿼리                     │
└─────────────────────────────────────┘
```

**특징**:
- ✅ **무료**: 쿼리에는 비용 없음
- ✅ **강력한 필터링**: 태그, 소유자, 시간 등으로 검색
- ✅ **REST API + GraphQL**: 두 가지 방식 모두 지원

---

## 🎯 세 가지 사용 방법

### 방법 1: Storage Only (Irys L1만 사용)
**사용 케이스**: 단순 데이터 저장 및 조회

```typescript
// 업로드
const receipt = await irys.upload(data, { tags });

// 조회 (GraphQL)
const query = `{
  transactions(tags: [{name: "App-Name", values: ["MyApp"]}]) {
    edges {
      node { id tags { name value } }
    }
  }
}`;
```

**장점**:
- ✅ **ETH 불필요**
- ✅ **매우 저렴**
- ✅ **즉시 사용 가능**

**단점**:
- ❌ 스마트 컨트랙트 로직 없음
- ❌ 자동화 불가
- ❌ 복잡한 접근 제어 어려움

---

### 방법 2: Storage + External Smart Contract (현재 DeBHuB 구조)
**사용 케이스**: Irys 저장 + Ethereum 스마트 컨트랙트

```typescript
// 1. Irys에 데이터 업로드
const receipt = await irys.upload(data);

// 2. Ethereum 스마트 컨트랙트에 메타데이터 등록
await documentRegistry.registerDocument(receipt.id, metadata);
```

**장점**:
- ✅ Ethereum의 보안성
- ✅ 기존 Ethereum 생태계 활용

**단점**:
- ❌ **ETH 가스비 필요** ← 현재 문제!
- ❌ 두 개의 트랜잭션 필요 (느림)
- ❌ 복잡한 구조

---

### 방법 3: Storage + IrysVM Smart Contract (⭐ 권장)
**사용 케이스**: 완전한 Irys 네이티브 애플리케이션

```solidity
// IrysVM 스마트 컨트랙트
contract DocumentRegistry {
    // 저장된 데이터에 직접 접근 가능!
    function registerDocument(string memory irysId) public {
        // Irys storage에서 데이터 읽기
        bytes memory content = irysStorage.read(irysId);

        // 로직 실행
        documents[msg.sender].push(irysId);
        emit DocumentRegistered(msg.sender, irysId);
    }
}
```

**장점**:
- ✅ **ETH 불필요** (Irys 토큰만)
- ✅ **단일 트랜잭션**
- ✅ **네이티브 데이터 액세스**
- ✅ **Programmable Data** 지원
- ✅ **저렴한 가스비**

**단점**:
- ⚠️ 테스트넷 단계 (2025년 1월 출시)
- ⚠️ 새로운 플랫폼 (학습 필요)

---

## 🔍 현재 DeBHuB 문제 분석

### 문제: 하이브리드 구조의 비용
```
Irys Storage (✅ 작동)  +  Ethereum Smart Contract (❌ ETH 필요)
     ↓                           ↓
  저렴한 저장                  비싼 가스비
```

### 현재 코드의 문제점
```typescript
// PureIrysClient.ts - createDocument()
const receipt = await this.irysUploader.upload(content);  // ✅ 성공
console.log(`✅ Uploaded to Irys: ${receipt.id}`);

// ❌ 여기서 막힘! (ETH 0개)
const tx = await this.documentRegistry.registerDocument(...);
await tx.wait(); // ← Ethereum 가스비 필요
```

---

## 💡 솔루션: 3가지 옵션

### 옵션 1: Pure Irys (Storage + GraphQL Only) ⚡ **가장 빠름**
**목표**: 스마트 컨트랙트 완전 제거, Irys만 사용

```typescript
class PureIrysStorageClient {
  async createDocument(options) {
    // 1. Irys에 업로드 (태그에 메타데이터 포함)
    const tags = [
      { name: "App-Name", value: "DeBHuB" },
      { name: "Content-Type", value: "application/json" },
      { name: "Title", value: options.title },
      { name: "Owner", value: await this.signer.getAddress() },
      { name: "Project-Id", value: options.projectId },
      { name: "Timestamp", value: Date.now().toString() },
      ...options.tags.map(t => ({ name: "Tag", value: t }))
    ];

    const receipt = await this.irysUploader.upload(
      JSON.stringify(options.content),
      { tags }
    );

    return receipt.id; // Irys TX ID가 docId
  }

  async searchDocuments(options) {
    // 2. GraphQL로 검색
    const query = `{
      transactions(
        tags: [
          { name: "App-Name", values: ["DeBHuB"] },
          { name: "Owner", values: ["${options.owner}"] }
        ]
      ) {
        edges {
          node {
            id
            tags { name value }
            data
          }
        }
      }
    }`;

    const result = await this.queryClient.search(query);
    return result.transactions.edges.map(edge => ({
      docId: edge.node.id,
      ...this.parseTags(edge.node.tags),
      content: edge.node.data
    }));
  }
}
```

**장점**:
- ✅ **ETH 완전 불필요**
- ✅ 코드 대폭 간소화
- ✅ 즉시 프로덕션 가능
- ✅ 비용 최소화

**단점**:
- ❌ 복잡한 접근 제어 불가
- ❌ 자동화 로직 없음
- ❌ 스마트 컨트랙트 기능 없음

---

### 옵션 2: IrysVM Migration 🚀 **미래 지향적**
**목표**: Ethereum → IrysVM으로 마이그레이션

```solidity
// IrysVM 스마트 컨트랙트
contract DeBHuBRegistry {
    mapping(address => string[]) public userDocuments;

    function registerDocument(string memory irysId) public {
        // Irys storage에서 직접 읽기
        bytes memory content = IRYS_STORAGE.read(irysId);

        // 검증 및 등록
        userDocuments[msg.sender].push(irysId);
        emit DocumentRegistered(msg.sender, irysId);
    }

    function getDocuments(address owner) public view returns (string[] memory) {
        return userDocuments[owner];
    }
}
```

**장점**:
- ✅ **ETH 불필요** (Irys 토큰 사용)
- ✅ 스마트 컨트랙트 모든 기능
- ✅ Programmable Data
- ✅ 네이티브 통합
- ✅ 저렴한 가스비

**단점**:
- ⚠️ 테스트넷 (프로덕션 미출시)
- ⚠️ 새로운 개발 환경
- ⚠️ 마이그레이션 필요

---

### 옵션 3: Optional Smart Contract ⚖️ **균형잡힌 접근**
**목표**: 스마트 컨트랙트를 선택사항으로 만들기

```typescript
class HybridIrysClient {
  async createDocument(options) {
    // 1. Irys 업로드 (항상 수행)
    const receipt = await this.irysUploader.upload(content, { tags });
    console.log(`✅ Uploaded to Irys: ${receipt.id}`);

    // 2. 스마트 컨트랙트 등록 (옵션)
    if (this.config.enableSmartContract && this.hasEth()) {
      try {
        await this.documentRegistry.registerDocument(receipt.id);
        console.log(`✅ Registered on smart contract`);
      } catch (err) {
        console.warn(`⚠️ Smart contract registration failed (optional)`);
        // 계속 진행 - Irys 데이터는 이미 성공
      }
    }

    return { docId: receipt.id, irysId: receipt.id };
  }

  async getDocument(docId) {
    // 스마트 컨트랙트 확인 (옵션)
    let metadata = null;
    if (this.config.enableSmartContract) {
      try {
        metadata = await this.documentRegistry.getDocument(docId);
      } catch {
        // 실패해도 계속
      }
    }

    // Irys에서 컨텐츠 가져오기 (필수)
    const content = await fetch(`https://gateway.irys.xyz/${docId}`);

    return { ...metadata, content: await content.text() };
  }
}
```

**장점**:
- ✅ **ETH 선택사항**
- ✅ 기존 코드 재사용
- ✅ 점진적 마이그레이션
- ✅ 유연성

**단점**:
- ⚠️ 여전히 복잡한 구조
- ⚠️ 두 시스템 유지보수

---

## 📊 비교표

| 항목 | Pure Irys | IrysVM | Hybrid |
|------|-----------|--------|--------|
| ETH 필요 | ❌ | ❌ | 선택 |
| 스마트 컨트랙트 | ❌ | ✅ | 선택 |
| 개발 복잡도 | ⭐ 낮음 | ⭐⭐⭐ 중간 | ⭐⭐ 중간 |
| 비용 | 💰 최저 | 💰💰 낮음 | 💰💰💰 높음 |
| 프로덕션 준비 | ✅ | ⚠️ 테스트넷 | ✅ |
| 접근 제어 | 제한적 | 완전 | 완전 |
| 검색 기능 | GraphQL | 스마트 컨트랙트 | 둘 다 |
| 자동화 | ❌ | ✅ | 선택 |

---

## 🎯 권장 사항

### 단기 (지금 당장)
**옵션 1 또는 옵션 3 추천**
- ETH 없이도 즉시 사용 가능
- Pure Irys로 MVP 빠르게 구축
- 필요시 나중에 IrysVM 마이그레이션

### 중기 (3-6개월)
**옵션 2로 마이그레이션**
- IrysVM 메인넷 출시 대기
- Ethereum → IrysVM 스마트 컨트랙트 이전
- 완전한 Irys 네이티브 앱

### 장기 비전
```
Pure Irys BaaS = Storage Layer + IrysVM + GraphQL
                 ↓
         ETH 완전 불필요
         진정한 "Zero Backend"
```

---

## 💻 다음 단계

제가 어떤 옵션으로 코드를 리팩토링해드릴까요?

1. **Pure Irys (Storage + GraphQL Only)** - 가장 빠르고 간단
2. **IrysVM Migration Plan** - 미래 지향적 (테스트넷 대기)
3. **Hybrid (Optional Smart Contract)** - 점진적 마이그레이션

선택해주시면 해당 방향으로 코드를 작성하겠습니다!
