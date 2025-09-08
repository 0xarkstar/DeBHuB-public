# IrysBase 다음 단계 완전 기획서
## Irys Testnet Alpha 통합 및 프로덕션 준비

---

## 🎯 현재 상태 분석 및 다음 목표

### 현재 달성 상황
- ✅ 9개 핵심 서비스 구현 완료
- ✅ GraphQL API 100+ 타입 및 리졸버
- ✅ 실시간 협업 시스템 (WebSocket, CRDT)
- ✅ AI 및 벡터 검색 기초 구조

### Irys 최신 기술 현황 (2025년 1월 기준)
- Irys 테스트넷이 2025년 1월 28일 런칭, 100,000 TPS 달성 (Filecoin보다 6,000배 빠름)
- IrysVM은 EVM 호환 실행 레이어로 데이터 프로그래머빌리티 실현
- 무한 스토리지 용량, Arweave보다 16배 저렴한 고정 가격
- Submit Ledger(임시)와 Publish Ledger(영구)의 이중 레저 시스템

---

## 📋 Phase 1: Irys Testnet 통합 (즉시 시작)

### 1.1 Irys Testnet 연결 설정

```typescript
// packages/irys-integration/src/config/testnet.config.ts
export const IRYS_TESTNET_CONFIG = {
  // Irys Testnet Alpha 설정
  network: {
    chainId: 1270,
    rpcUrl: 'https://testnet-rpc.irys.xyz/v1/execution-rpc',
    name: 'Irys Testnet Alpha',
    currency: {
      name: 'Test IRYS',
      symbol: 'tIRYS',
      decimals: 18
    }
  },
  
  // IrysVM 연결
  iryvm: {
    endpoint: 'https://testnet-vm.irys.xyz',
    gasLimit: 10000000,
    maxFeePerGas: '20000000000' // 20 gwei
  },
  
  // 스토리지 설정
  storage: {
    submitLedger: 'https://testnet-submit.irys.xyz',
    publishLedger: 'https://testnet-publish.irys.xyz',
    gateway: 'https://testnet-gateway.irys.xyz'
  },
  
  // 성능 최적화 (100K TPS 활용)
  performance: {
    maxConcurrentUploads: 100,
    batchSize: 1000,
    compressionEnabled: true,
    cacheStrategy: 'aggressive'
  }
}

// Irys SDK 초기화
import { IrysClient } from '@irys/sdk'
import { WebUpload } from '@irys/web-upload'
import { WebUploadEthereum } from '@irys/web-upload-ethereum'
import { ethers } from 'ethers'

export class IrysTestnetClient {
  private client: IrysClient
  private webUpload: WebUpload
  private provider: ethers.Provider
  
  async initialize(privateKey: string) {
    // Provider 설정
    this.provider = new ethers.JsonRpcProvider(IRYS_TESTNET_CONFIG.network.rpcUrl)
    
    // Wallet 생성
    const wallet = new ethers.Wallet(privateKey, this.provider)
    
    // Irys Client 초기화
    this.client = new IrysClient({
      network: 'testnet',
      token: 'ethereum',
      key: privateKey,
      config: {
        providerUrl: IRYS_TESTNET_CONFIG.network.rpcUrl
      }
    })
    
    // Web Upload 초기화 (브라우저 환경)
    this.webUpload = new WebUploadEthereum({
      url: IRYS_TESTNET_CONFIG.storage.gateway,
      wallet: { rpcUrl: IRYS_TESTNET_CONFIG.network.rpcUrl }
    })
    
    await this.client.ready()
    console.log(`Connected to Irys Testnet. Address: ${wallet.address}`)
    
    return this
  }
  
  // 펀딩 확인 및 자동 충전
  async ensureFunding(minBalance = 0.1) {
    const balance = await this.client.getLoadedBalance()
    const minRequired = this.client.utils.toAtomic(minBalance)
    
    if (balance.lt(minRequired)) {
      const fundAmount = minRequired.sub(balance)
      await this.client.fund(fundAmount)
      console.log(`Funded ${this.client.utils.fromAtomic(fundAmount)} to Irys`)
    }
  }
}
```

### 1.2 프로그래머블 데이터 구현

프로그래머블 데이터는 Solidity 스마트 컨트랙트를 통해 커스텀 precompile을 사용

```solidity
// contracts/IrysBaseProgrammableData.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@irys/precompile-libraries/libraries/ProgrammableData.sol";

contract IrysBaseCore is ProgrammableData {
    // 문서 메타데이터 구조
    struct Document {
        bytes32 id;
        address owner;
        bytes32 irysId;
        uint256 version;
        bytes metadata;
        uint256 timestamp;
    }
    
    // 접근 제어 규칙
    struct AccessRule {
        mapping(address => uint8) permissions; // 0: none, 1: read, 2: write, 3: admin
        bool isPublic;
        uint256 expiryTime;
    }
    
    mapping(bytes32 => Document) public documents;
    mapping(bytes32 => AccessRule) public accessRules;
    mapping(bytes32 => bytes) public storedData;
    
    event DocumentCreated(bytes32 indexed id, address indexed owner, bytes32 irysId);
    event DataStored(bytes32 indexed documentId, uint256 size);
    event AccessGranted(bytes32 indexed documentId, address indexed user, uint8 permission);
    
    // 프로그래머블 데이터 읽기 및 저장
    function storeDocumentData(
        bytes32 documentId,
        bytes32 irysTransactionId,
        uint256 startOffset,
        uint256 length
    ) public {
        require(hasPermission(documentId, msg.sender, 2), "Write permission required");
        
        // 프로그래머블 데이터 읽기
        (bool success, bytes memory data) = readBytesRange(
            irysTransactionId,
            startOffset,
            length
        );
        require(success, "Failed to read programmable data");
        
        // 스토리지에 저장
        storedData[documentId] = data;
        documents[documentId].irysId = irysTransactionId;
        documents[documentId].timestamp = block.timestamp;
        
        emit DataStored(documentId, data.length);
    }
    
    // 조건부 실행 (프로그래머블 트리거)
    function executeConditionalAction(
        bytes32 documentId,
        bytes memory condition,
        bytes memory action
    ) public {
        require(hasPermission(documentId, msg.sender, 1), "Read permission required");
        
        // 조건 평가
        bool conditionMet = evaluateCondition(documentId, condition);
        
        if (conditionMet) {
            // 액션 실행
            executeAction(documentId, action);
        }
    }
    
    // 접근 권한 확인
    function hasPermission(
        bytes32 documentId,
        address user,
        uint8 requiredLevel
    ) public view returns (bool) {
        AccessRule storage rule = accessRules[documentId];
        
        // 소유자는 모든 권한
        if (documents[documentId].owner == user) return true;
        
        // 공개 문서 읽기 권한
        if (rule.isPublic && requiredLevel == 1) return true;
        
        // 명시적 권한 확인
        return rule.permissions[user] >= requiredLevel;
    }
    
    // 프로그래머블 데이터 범위 읽기 (내부 함수)
    function readBytesRange(
        bytes32 transactionId,
        uint256 offset,
        uint256 length
    ) internal returns (bool, bytes memory) {
        // Irys precompile 사용
        return readBytes();
    }
}
```

### 1.3 TypeScript SDK 통합

```typescript
// packages/irys-integration/src/services/programmable-data.service.ts
import { ethers } from 'ethers'
import { IrysBaseCore__factory } from '../typechain'

export class ProgrammableDataService {
  private contract: ethers.Contract
  private irysClient: IrysTestnetClient
  
  constructor(
    private contractAddress: string,
    private signer: ethers.Signer,
    irysClient: IrysTestnetClient
  ) {
    this.contract = IrysBaseCore__factory.connect(contractAddress, signer)
    this.irysClient = irysClient
  }
  
  // 문서를 Irys에 업로드하고 프로그래머블 데이터로 저장
  async createProgrammableDocument(
    content: string,
    metadata: DocumentMetadata
  ): Promise<ProgrammableDocument> {
    // 1. Irys에 콘텐츠 업로드
    const tags = [
      { name: 'App-Name', value: 'IrysBase' },
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Document-Id', value: metadata.id },
      { name: 'Version', value: metadata.version.toString() }
    ]
    
    const uploadResult = await this.irysClient.upload(
      Buffer.from(JSON.stringify({ content, metadata })),
      { tags }
    )
    
    // 2. 프로그래머블 데이터 액세스 리스트 생성
    const accessList = await this.irysClient.programmable_data
      .read(uploadResult.id, 0, uploadResult.size)
      .toAccessList()
    
    // 3. 스마트 컨트랙트에 저장
    const tx = await this.contract.storeDocumentData(
      ethers.id(metadata.id),
      uploadResult.id,
      0,
      uploadResult.size,
      {
        accessList: [accessList],
        type: 2 // EIP-1559
      }
    )
    
    await tx.wait()
    
    // 4. 프로그래머블 규칙 설정
    await this.setProgrammableRules(metadata.id, {
      triggers: [
        {
          event: 'onAccess',
          condition: 'accessor != owner',
          action: 'incrementViewCount'
        },
        {
          event: 'onUpdate',
          action: 'createVersion'
        }
      ],
      access: {
        public: metadata.isPublic ? 'read' : 'none',
        collaborators: 'write',
        owner: 'admin'
      }
    })
    
    return {
      id: metadata.id,
      irysId: uploadResult.id,
      permanentUrl: `https://gateway.irys.xyz/${uploadResult.id}`,
      proof: uploadResult.receipt,
      timestamp: Date.now()
    }
  }
  
  // 프로그래머블 데이터 쿼리
  async queryProgrammableData(filters: QueryFilters): Promise<QueryResult[]> {
    const query = `
      query GetProgrammableData($tags: [TagFilter!]) {
        transactions(tags: $tags, first: 100) {
          edges {
            node {
              id
              tags {
                name
                value
              }
              data {
                size
                type
              }
              timestamp
            }
          }
        }
      }
    `
    
    const response = await fetch('https://testnet-gateway.irys.xyz/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: {
          tags: Object.entries(filters).map(([name, value]) => ({
            name,
            values: Array.isArray(value) ? value : [value]
          }))
        }
      })
    })
    
    const result = await response.json()
    return result.data.transactions.edges.map(edge => edge.node)
  }
}
```

---

## 📋 Phase 2: 고급 통합 구현 (주 2-4)

### 2.1 Prisma 스키마 확장

```prisma
// prisma/schema.prisma 추가 내용

// Irys 통합 테이블
model IrysTransaction {
  id              String    @id @default(cuid())
  transactionId   String    @unique // Irys transaction ID
  type            String    // 'upload', 'programmable', 'permanent'
  status          String    // 'pending', 'confirmed', 'failed'
  size            BigInt
  cost            Decimal
  tags            Json
  metadata        Json
  
  // 관계
  documentId      String?
  document        Document? @relation(fields: [documentId], references: [id])
  
  createdAt       DateTime  @default(now())
  confirmedAt     DateTime?
  
  @@index([status, createdAt])
  @@index([documentId])
}

model Document {
  id              String    @id @default(cuid())
  projectId       String
  path            String    // /docs/getting-started
  title           String
  content         String    @db.Text
  contentHash     String    // SHA-256 해시
  
  // Irys 데이터
  irysId          String?   @unique
  irysProof       String?   @db.Text
  permanentUrl    String?
  transactions    IrysTransaction[]
  
  // 메타데이터
  metadata        Json
  tags            String[]
  
  // 버전 관리
  version         Int       @default(1)
  versions        Version[]
  
  // 관계
  project         Project   @relation(fields: [projectId], references: [id])
  authorId        String
  author          User      @relation(fields: [authorId], references: [id])
  comments        Comment[]
  
  // 프로그래머블 데이터
  accessRules     Json?
  triggers        Json?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  publishedAt     DateTime?
  
  @@unique([projectId, path])
  @@index([projectId, publishedAt])
}

model Version {
  id              String    @id @default(cuid())
  documentId      String
  document        Document  @relation(fields: [documentId], references: [id])
  versionNumber   Int
  content         String    @db.Text
  contentDiff     String?   @db.Text // 이전 버전과의 차이
  
  // 블록체인 증명
  irysId          String?   @unique
  blockHeight     BigInt?
  blockHash       String?
  signature       String?   // 작성자 서명
  
  authorId        String
  author          User      @relation(fields: [authorId], references: [id])
  commitMessage   String
  
  createdAt       DateTime  @default(now())
  
  @@unique([documentId, versionNumber])
  @@index([authorId, createdAt])
}

model ProgrammableDataRule {
  id              String    @id @default(cuid())
  documentId      String
  name            String
  type            String    // 'access', 'trigger', 'royalty'
  
  // 규칙 정의
  condition       Json?     // 실행 조건
  action          Json      // 실행 액션
  parameters      Json?     // 추가 파라미터
  
  // 실행 통계
  executionCount  Int       @default(0)
  lastExecutedAt  DateTime?
  
  enabled         Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([documentId, type])
  @@index([enabled, type])
}
```

### 2.2 AI 모델 실제 통합

```typescript
// packages/ai-integration/src/services/ai.service.ts
import { OpenAI } from 'openai'
import { CohereClient } from 'cohere-ai'
import { HfInference } from '@huggingface/inference'

export class AIService {
  private openai: OpenAI
  private cohere: CohereClient
  private huggingface: HfInference
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    this.cohere = new CohereClient({
      token: process.env.COHERE_API_KEY
    })
    
    this.huggingface = new HfInference(
      process.env.HUGGINGFACE_API_KEY
    )
  }
  
  // 문서 임베딩 생성 (벡터 검색용)
  async createEmbedding(text: string): Promise<Float32Array> {
    // OpenAI의 최신 임베딩 모델 사용
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 3072 // 고차원 임베딩
    })
    
    return new Float32Array(response.data[0].embedding)
  }
  
  // 문서 요약
  async summarize(content: string, length: 'short' | 'medium' | 'long'): Promise<string> {
    const maxTokens = {
      short: 100,
      medium: 250,
      long: 500
    }
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a technical documentation expert. Create clear, concise summaries.'
        },
        {
          role: 'user',
          content: `Summarize this documentation in ${length} form:\n\n${content}`
        }
      ],
      max_tokens: maxTokens[length],
      temperature: 0.3
    })
    
    return completion.choices[0].message.content || ''
  }
  
  // 코드 생성 및 개선
  async generateCode(
    prompt: string,
    language: string,
    context?: string
  ): Promise<CodeGeneration> {
    // Cohere의 Command 모델 사용
    const response = await this.cohere.generate({
      model: 'command-nightly',
      prompt: `
        Generate ${language} code for: ${prompt}
        ${context ? `Context: ${context}` : ''}
        
        Provide clean, well-commented code following best practices.
      `,
      max_tokens: 1000,
      temperature: 0.2
    })
    
    const code = response.generations[0].text
    
    // 코드 검증
    const validation = await this.validateCode(code, language)
    
    return {
      code,
      language,
      isValid: validation.isValid,
      errors: validation.errors,
      suggestions: validation.suggestions
    }
  }
  
  // 시맨틱 검색 쿼리 처리
  async processSemanticQuery(
    query: string,
    documents: Document[]
  ): Promise<SearchResult[]> {
    // 쿼리 임베딩 생성
    const queryEmbedding = await this.createEmbedding(query)
    
    // 문서와의 유사도 계산
    const results = await Promise.all(
      documents.map(async (doc) => {
        const docEmbedding = await this.createEmbedding(doc.content)
        const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding)
        
        return {
          document: doc,
          score: similarity,
          highlights: await this.extractHighlights(query, doc.content)
        }
      })
    )
    
    // 점수 기준 정렬
    return results
      .filter(r => r.score > 0.7) // 임계값
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // 상위 10개
  }
  
  // 콘텐츠 개선 제안
  async suggestImprovements(content: string): Promise<Improvement[]> {
    const suggestions = []
    
    // 1. 가독성 분석
    const readability = await this.analyzeReadability(content)
    if (readability.score < 60) {
      suggestions.push({
        type: 'readability',
        message: 'Content is complex. Consider simplifying sentences.',
        suggestions: readability.improvements
      })
    }
    
    // 2. SEO 최적화
    const seo = await this.analyzeSEO(content)
    suggestions.push(...seo.improvements.map(imp => ({
      type: 'seo',
      message: imp.message,
      suggestions: [imp.suggestion]
    })))
    
    // 3. 기술 용어 일관성
    const terminology = await this.checkTerminology(content)
    if (terminology.inconsistencies.length > 0) {
      suggestions.push({
        type: 'terminology',
        message: 'Inconsistent terminology detected',
        suggestions: terminology.suggestions
      })
    }
    
    return suggestions
  }
  
  // 자동 완성
  async autocomplete(
    prompt: string,
    context: string,
    maxSuggestions = 5
  ): Promise<string[]> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Complete the documentation text. Provide multiple options.'
        },
        {
          role: 'user',
          content: `Context: ${context}\nComplete: ${prompt}`
        }
      ],
      n: maxSuggestions,
      max_tokens: 50,
      temperature: 0.8
    })
    
    return response.choices.map(choice => choice.message.content || '')
  }
  
  // 유틸리티 함수
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}
```

### 2.3 벡터 데이터베이스 통합

```typescript
// packages/vector-db/src/services/vector.service.ts
import { PineconeClient } from '@pinecone-database/pinecone'
import { QdrantClient } from '@qdrant/js-client-rest'
import weaviate from 'weaviate-ts-client'

export class VectorDBService {
  private pinecone: PineconeClient
  private qdrant: QdrantClient
  private weaviate: any
  private activeProvider: 'pinecone' | 'qdrant' | 'weaviate'
  
  async initialize() {
    // Pinecone 초기화
    this.pinecone = new PineconeClient()
    await this.pinecone.init({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!
    })
    
    // Qdrant 초기화 (자체 호스팅 가능)
    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY
    })
    
    // Weaviate 초기화
    this.weaviate = weaviate.client({
      scheme: 'https',
      host: process.env.WEAVIATE_HOST!,
      apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!)
    })
    
    // 기본 프로바이더 설정
    this.activeProvider = (process.env.VECTOR_DB_PROVIDER as any) || 'pinecone'
  }
  
  // 문서 인덱싱
  async indexDocument(
    document: Document,
    embedding: Float32Array
  ): Promise<void> {
    const metadata = {
      id: document.id,
      title: document.title,
      path: document.path,
      projectId: document.projectId,
      tags: document.tags,
      createdAt: document.createdAt.toISOString()
    }
    
    switch (this.activeProvider) {
      case 'pinecone':
        await this.indexToPinecone(document.id, embedding, metadata)
        break
      case 'qdrant':
        await this.indexToQdrant(document.id, embedding, metadata)
        break
      case 'weaviate':
        await this.indexToWeaviate(document.id, embedding, metadata)
        break
    }
  }
  
  // Pinecone 인덱싱
  private async indexToPinecone(
    id: string,
    embedding: Float32Array,
    metadata: any
  ) {
    const index = this.pinecone.Index('irysbase-documents')
    
    await index.upsert({
      upsertRequest: {
        vectors: [
          {
            id,
            values: Array.from(embedding),
            metadata
          }
        ]
      }
    })
  }
  
  // Qdrant 인덱싱
  private async indexToQdrant(
    id: string,
    embedding: Float32Array,
    metadata: any
  ) {
    await this.qdrant.upsert('documents', {
      wait: true,
      points: [
        {
          id,
          vector: Array.from(embedding),
          payload: metadata
        }
      ]
    })
  }
  
  // 시맨틱 검색
  async search(
    queryEmbedding: Float32Array,
    topK = 10,
    filter?: any
  ): Promise<SearchResult[]> {
    switch (this.activeProvider) {
      case 'pinecone':
        return this.searchPinecone(queryEmbedding, topK, filter)
      case 'qdrant':
        return this.searchQdrant(queryEmbedding, topK, filter)
      case 'weaviate':
        return this.searchWeaviate(queryEmbedding, topK, filter)
      default:
        throw new Error(`Unknown provider: ${this.activeProvider}`)
    }
  }
  
  // Pinecone 검색
  private async searchPinecone(
    embedding: Float32Array,
    topK: number,
    filter?: any
  ): Promise<SearchResult[]> {
    const index = this.pinecone.Index('irysbase-documents')
    
    const queryResponse = await index.query({
      queryRequest: {
        vector: Array.from(embedding),
        topK,
        includeMetadata: true,
        filter
      }
    })
    
    return queryResponse.matches?.map(match => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata
    })) || []
  }
  
  // 하이브리드 검색 (벡터 + 키워드)
  async hybridSearch(
    query: string,
    queryEmbedding: Float32Array,
    options: HybridSearchOptions
  ): Promise<SearchResult[]> {
    // 벡터 검색 결과
    const vectorResults = await this.search(
      queryEmbedding,
      options.topK * 2
    )
    
    // 키워드 검색 결과 (Elasticsearch 연동)
    const keywordResults = await this.keywordSearch(query, options)
    
    // 결과 병합 및 재랭킹
    return this.rerank(vectorResults, keywordResults, {
      vectorWeight: options.vectorWeight || 0.7,
      keywordWeight: options.keywordWeight || 0.3
    })
  }
  
  // 관련 문서 추천
  async findSimilar(
    documentId: string,
    topK = 5
  ): Promise<Document[]> {
    // 문서의 임베딩 가져오기
    const embedding = await this.getEmbedding(documentId)
    
    // 유사 문서 검색 (자기 자신 제외)
    const results = await this.search(embedding, topK + 1)
    
    return results
      .filter(r => r.id !== documentId)
      .slice(0, topK)
      .map(r => r.metadata as Document)
  }
}
```

---

## 📋 Phase 3: 프론트엔드 대시보드 (주 4-6)

### 3.1 Next.js 14 App Router 구조

```typescript
// apps/dashboard/app/layout.tsx
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Navigation } from '@/components/navigation'
import { IrysBaseProvider } from '@/lib/irysbase'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <IrysBaseProvider>
            <div className="flex h-screen">
              <Navigation />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </IrysBaseProvider>
        </Providers>
      </body>
    </html>
  )
}
```

### 3.2 대시보드 핵심 페이지

```typescript
// apps/dashboard/app/dashboard/page.tsx
'use client'

import { useIrysBase } from '@/hooks/use-irysbase'
import { StatsCards } from '@/components/stats-cards'
import { RecentActivity } from '@/components/recent-activity'
import { StorageUsage } from '@/components/storage-usage'
import { NetworkStatus } from '@/components/network-status'

export default function DashboardPage() {
  const { stats, isLoading } = useIrysBase()
  
  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">IrysBase Dashboard</h1>
        <NetworkStatus />
      </div>
      
      {/* 통계 카드 */}
      <StatsCards
        totalDocuments={stats?.totalDocuments || 0}
        totalStorage={stats?.totalStorage || 0}
        totalTransactions={stats?.totalTransactions || 0}
        activeUsers={stats?.activeUsers || 0}
      />
      
      {/* 차트 및 그래프 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StorageUsage />
        <TransactionChart />
      </div>
      
      {/* 최근 활동 */}
      <RecentActivity />
      
      {/* 프로그래머블 데이터 모니터 */}
      <ProgrammableDataMonitor />
    </div>
  )
}

// 프로그래머블 데이터 모니터 컴포넌트
function ProgrammableDataMonitor() {
  const { programmableData, executeTrigger } = useProgrammableData()
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Programmable Data Rules</h2>
      
      <div className="space-y-4">
        {programmableData?.rules.map((rule) => (
          <div key={rule.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{rule.name}</h3>
                <p className="text-sm text-gray-500">Type: {rule.type}</p>
                <p className="text-sm text-gray-500">
                  Executions: {rule.executionCount}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => executeTrigger(rule.id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Test
                </button>
                <Switch
                  checked={rule.enabled}
                  onChange={(enabled) => updateRule(rule.id, { enabled })}
                />
              </div>
            </div>
            
            {/* 규칙 상세 */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
              <pre className="text-xs">
                {JSON.stringify(rule.condition, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
      
      {/* 새 규칙 추가 */}
      <button className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400">
        + Add Programmable Rule
      </button>
    </div>
  )
}
```

### 3.3 실시간 모니터링 대시보드

```typescript
// apps/dashboard/app/monitoring/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useIrysBaseRealtime } from '@/hooks/use-irysbase-realtime'
import { LineChart, BarChart, PieChart } from '@/components/charts'

export default function MonitoringPage() {
  const { subscribe, unsubscribe } = useIrysBaseRealtime()
  const [metrics, setMetrics] = useState<Metrics>()
  
  useEffect(() => {
    // 실시간 메트릭 구독
    const subscription = subscribe('metrics', (data) => {
      setMetrics(prev => ({
        ...prev,
        ...data
      }))
    })
    
    return () => unsubscribe(subscription)
  }, [])
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Real-time Monitoring</h1>
      
      {/* Irys 네트워크 상태 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="TPS (Transactions/sec)"
          value={metrics?.tps || 0}
          max={100000} // Irys의 100K TPS
          unit="tx/s"
        />
        <MetricCard
          title="Storage Rate"
          value={metrics?.storageRate || 0}
          unit="MB/s"
        />
        <MetricCard
          title="Network Latency"
          value={metrics?.latency || 0}
          unit="ms"
          threshold={100}
        />
      </div>
      
      {/* 실시간 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TPS 추이 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Transaction Throughput</h2>
          <LineChart
            data={metrics?.tpsHistory || []}
            xKey="timestamp"
            yKey="value"
            color="#3B82F6"
          />
        </div>
        
        {/* 레저 상태 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Ledger Status</h2>
          <div className="space-y-4">
            <LedgerStatus
              name="Submit Ledger"
              transactions={metrics?.submitLedger || 0}
              size={metrics?.submitLedgerSize || 0}
            />
            <LedgerStatus
              name="Publish Ledger"
              transactions={metrics?.publishLedger || 0}
              size={metrics?.publishLedgerSize || 0}
            />
          </div>
        </div>
        
        {/* 프로그래머블 데이터 실행 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Programmable Data Executions
          </h2>
          <BarChart
            data={metrics?.programmableExecutions || []}
            xKey="rule"
            yKey="count"
          />
        </div>
        
        {/* 비용 분석 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Cost Breakdown</h2>
          <PieChart
            data={[
              { name: 'Storage', value: metrics?.storageCost || 0 },
              { name: 'Computation', value: metrics?.computeCost || 0 },
              { name: 'Bandwidth', value: metrics?.bandwidthCost || 0 }
            ]}
          />
          <div className="mt-4 text-sm text-gray-600">
            Total: ${(metrics?.totalCost || 0).toFixed(4)} / month
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 📋 Phase 4: 프로덕션 준비 (주 6-8)

### 4.1 테스트 전략

```typescript
// packages/testing/src/e2e/irysbase.test.ts
import { test, expect } from '@playwright/test'
import { IrysBaseTestUtils } from './utils'

test.describe('IrysBase E2E Tests', () => {
  let testUtils: IrysBaseTestUtils
  
  test.beforeAll(async () => {
    testUtils = new IrysBaseTestUtils()
    await testUtils.setup()
  })
  
  test('Complete document lifecycle with Irys', async ({ page }) => {
    // 1. 문서 생성
    const document = await testUtils.createDocument({
      title: 'Test Document',
      content: 'Test content for Irys integration'
    })
    
    // 2. Irys에 업로드 확인
    expect(document.irysId).toBeTruthy()
    expect(document.permanentUrl).toContain('gateway.irys.xyz')
    
    // 3. 프로그래머블 데이터 설정
    await testUtils.setProgrammableRules(document.id, {
      access: { public: 'read' },
      triggers: [{ event: 'onView', action: 'log' }]
    })
    
    // 4. 대시보드에서 확인
    await page.goto('/dashboard')
    await expect(page.locator(`[data-document-id="${document.id}"]`))
      .toBeVisible()
    
    // 5. 실시간 업데이트 테스트
    const updatePromise = page.waitForResponse('**/api/realtime')
    await testUtils.updateDocument(document.id, {
      content: 'Updated content'
    })
    await updatePromise
    
    // 6. 버전 확인
    const versions = await testUtils.getVersions(document.id)
    expect(versions).toHaveLength(2)
    expect(versions[1].irysId).toBeTruthy()
  })
  
  test('Performance test - 100K TPS simulation', async () => {
    const results = await testUtils.performanceTest({
      duration: 60, // 60초
      targetTPS: 1000, // 로컬 테스트용
      operations: ['create', 'read', 'update']
    })
    
    expect(results.actualTPS).toBeGreaterThan(900)
    expect(results.p99Latency).toBeLessThan(100) // ms
    expect(results.errorRate).toBeLessThan(0.01) // 1%
  })
})
```

### 4.2 보안 강화

```typescript
// packages/security/src/middleware/security.middleware.ts
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { ethers } from 'ethers'

export class SecurityMiddleware {
  // API 레이트 리미팅
  static rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 요청 수
    message: 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false
  })
  
  // 서명 검증
  static async verifySignature(req: Request, res: Response, next: NextFunction) {
    const signature = req.headers['x-irysbase-signature'] as string
    const timestamp = req.headers['x-irysbase-timestamp'] as string
    const nonce = req.headers['x-irysbase-nonce'] as string
    
    if (!signature || !timestamp || !nonce) {
      return res.status(401).json({ error: 'Missing authentication headers' })
    }
    
    // 타임스탬프 검증 (5분 이내)
    const now = Date.now()
    if (Math.abs(now - parseInt(timestamp)) > 5 * 60 * 1000) {
      return res.status(401).json({ error: 'Request expired' })
    }
    
    // Nonce 중복 체크
    if (await this.isNonceUsed(nonce)) {
      return res.status(401).json({ error: 'Nonce already used' })
    }
    
    // 서명 검증
    const message = `${req.method}${req.path}${timestamp}${nonce}${JSON.stringify(req.body)}`
    const messageHash = ethers.id(message)
    const recoveredAddress = ethers.verifyMessage(messageHash, signature)
    
    // 주소 검증
    const user = await getUserByAddress(recoveredAddress)
    if (!user) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
    
    req.user = user
    await this.markNonceUsed(nonce)
    next()
  }
  
  // CORS 설정
  static cors = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
  }
  
  // CSP 헤더
  static contentSecurityPolicy = {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://testnet-rpc.irys.xyz', 'wss://testnet-ws.irys.xyz']
    }
  }
}
```

### 4.3 CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml
name: Deploy IrysBase

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run tests
        run: |
          pnpm test:unit
          pnpm test:integration
        env:
          IRYS_TESTNET_RPC: ${{ secrets.IRYS_TESTNET_RPC }}
          IRYS_PRIVATE_KEY: ${{ secrets.IRYS_PRIVATE_KEY }}
      
      - name: Build
        run: pnpm build
      
      - name: Deploy contracts to Irys Testnet
        if: github.ref == 'refs/heads/main'
        run: |
          pnpm hardhat deploy --network irys-testnet
        env:
          DEPLOYER_KEY: ${{ secrets.DEPLOYER_KEY }}
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to Vercel
        uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          
      - name: Deploy to IPFS via Irys
        run: |
          node scripts/deploy-to-irys.js
        env:
          IRYS_DEPLOY_KEY: ${{ secrets.IRYS_DEPLOY_KEY }}
```

---

## 📊 KPIs 및 성공 지표

### 기술적 지표
| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| **TPS** | 10,000+ | Irys 테스트넷 모니터링 |
| **레이턴시** | <50ms | P99 응답 시간 |
| **가용성** | 99.9% | 업타임 모니터링 |
| **스토리지 비용** | <$0.01/GB | 실제 사용량 추적 |
| **프로그래머블 실행** | <100ms | 트리거 실행 시간 |

### 비즈니스 지표
| 지표 | 3개월 | 6개월 | 12개월 |
|------|--------|--------|---------|
| **개발자 등록** | 100 | 500 | 2,000 |
| **활성 프로젝트** | 50 | 250 | 1,000 |
| **저장 데이터** | 1TB | 10TB | 100TB |
| **월간 API 호출** | 1M | 10M | 100M |
| **MRR** | $1,000 | $10,000 | $50,000 |

---

## 🚀 즉시 실행 가능한 액션 아이템

### Week 1 (즉시)
1. **Irys Testnet 연결**
   - [ ] Testnet RPC 연결 설정
   - [ ] 테스트 토큰 획득 (Faucet)
   - [ ] 첫 번째 트랜잭션 전송

2. **프로그래머블 데이터 POC**
   - [ ] 스마트 컨트랙트 배포
   - [ ] 프로그래머블 데이터 읽기/쓰기 테스트
   - [ ] 트리거 실행 검증

### Week 2-3
3. **Prisma 스키마 마이그레이션**
   - [ ] 새로운 테이블 추가
   - [ ] Irys 관련 필드 추가
   - [ ] 인덱스 최적화

4. **AI 통합**
   - [ ] OpenAI API 연결
   - [ ] 임베딩 생성 파이프라인
   - [ ] 요약 및 개선 제안 구현

### Week 4-5
5. **벡터 DB 설정**
   - [ ] Pinecone 계정 생성
   - [ ] 인덱스 생성 및 설정
   - [ ] 검색 API 구현

6. **대시보드 MVP**
   - [ ] Next.js 프로젝트 설정
   - [ ] 기본 UI 구현
   - [ ] 실시간 모니터링 추가

---

## 💡 차별화 전략

### IrysBase만의 독특한 가치
1. **100K TPS 활용** - 대규모 실시간 애플리케이션 지원
2. **프로그래머블 데이터** - 데이터에 로직 임베드
3. **영구 저장 보장** - 한 번 저장하면 영원히
4. **AI 네이티브** - 모든 데이터에 AI 기능 내장
5. **Web3 + Web2 UX** - 블록체인 복잡성 완전 추상화

이 기획서는 IrysBase가 단순한 Supabase 클론이 아닌, **Irys의 혁신적인 기술을 완전히 활용하는 차세대 백엔드 플랫폼**으로 포지셔닝합니다. 

특히 100,000 TPS와 무한 스토리지 용량, 그리고 프로그래머블 데이터 기능을 핵심 차별화 요소로 활용하여, 기존 Web2 백엔드 서비스가 제공할 수 없는 가치를 창출합니다.