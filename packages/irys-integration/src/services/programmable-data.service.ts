import { ethers } from 'ethers'
import { IrysTestnetClient } from './irys-client'
import { 
  DocumentMetadata, 
  ProgrammableDocument, 
  ProgrammableRuleSet, 
  QueryFilters, 
  QueryResult 
} from '../types'

// Contract ABI (this would typically be generated from typechain)
const IRYSBASE_CORE_ABI = [
  // Constructor
  "constructor()",
  
  // Functions
  "function createDocument(bytes32 documentId, bytes32 irysTransactionId, bytes metadata) external",
  "function updateDocument(bytes32 documentId, bytes32 newIrysId, bytes metadata) external",
  "function storeDocumentData(bytes32 documentId, bytes32 irysTransactionId, uint256 startOffset, uint256 length, bytes data) external",
  "function addProgrammableRule(bytes32 documentId, string eventType, string condition, string action) external",
  "function grantAccess(bytes32 documentId, address user, uint8 permissionLevel) external",
  "function revokeAccess(bytes32 documentId, address user) external",
  "function setPublicAccess(bytes32 documentId, bool isPublic) external",
  "function recordAccess(bytes32 documentId) external",
  "function executeConditionalAction(bytes32 documentId, uint256 triggerIndex) external",
  
  // View functions
  "function getDocument(bytes32 documentId) external view returns (tuple(bytes32 id, address owner, bytes32 irysId, uint256 version, bytes metadata, uint256 timestamp, bool exists))",
  "function getDocumentData(bytes32 documentId) external view returns (bytes)",
  "function getDocumentTriggers(bytes32 documentId) external view returns (tuple(string eventType, string condition, string action, bool enabled, uint256 executionCount, uint256 lastExecuted)[])",
  "function getUserPermission(bytes32 documentId, address user) external view returns (uint8)",
  "function getTotalDocuments() external view returns (uint256)",
  
  // Events
  "event DocumentCreated(bytes32 indexed id, address indexed owner, bytes32 irysId)",
  "event DocumentUpdated(bytes32 indexed id, uint256 version, bytes32 newIrysId)",
  "event DataStored(bytes32 indexed documentId, uint256 size)",
  "event AccessGranted(bytes32 indexed documentId, address indexed user, uint8 permission)",
  "event AccessRevoked(bytes32 indexed documentId, address indexed user)",
  "event TriggerExecuted(bytes32 indexed documentId, string triggerType, uint256 timestamp)",
  "event ProgrammableRuleAdded(bytes32 indexed documentId, string eventType, string action)"
]

export class ProgrammableDataService {
  private contract: ethers.Contract
  private irysClient: IrysTestnetClient
  
  constructor(
    private contractAddress: string,
    private signer: ethers.Signer,
    irysClient: IrysTestnetClient
  ) {
    this.contract = new ethers.Contract(contractAddress, IRYSBASE_CORE_ABI, signer)
    this.irysClient = irysClient
  }
  
  // 문서를 Irys에 업로드하고 프로그래머블 데이터로 저장
  async createProgrammableDocument(
    content: string,
    metadata: DocumentMetadata
  ): Promise<ProgrammableDocument> {
    try {
      // 1. Irys에 콘텐츠 업로드
      const tags = [
        { name: 'App-Name', value: 'DeBHuB' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Document-Id', value: metadata.id },
        { name: 'Version', value: metadata.version.toString() }
      ]
      
      const uploadResult = await this.irysClient.upload(
        Buffer.from(JSON.stringify({ content, metadata })),
        { tags }
      )
      
      // 2. 스마트 컨트랙트에 문서 생성
      const documentIdBytes32 = ethers.id(metadata.id)
      const irysIdBytes32 = ethers.zeroPadValue(`0x${uploadResult.id}`, 32)
      const metadataBytes = ethers.toUtf8Bytes(JSON.stringify(metadata))
      
      const tx = await this.contract.createDocument(
        documentIdBytes32,
        irysIdBytes32,
        metadataBytes
      )
      
      await tx.wait()
      
      // 3. 프로그래머블 규칙 설정 (선택적)
      if (metadata.isPublic) {
        await this.contract.setPublicAccess(documentIdBytes32, true)
      }
      
      return {
        id: metadata.id,
        irysId: uploadResult.id,
        permanentUrl: `https://testnet-gateway.irys.xyz/${uploadResult.id}`,
        proof: uploadResult.receipt,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Failed to create programmable document:', error)
      throw error
    }
  }
  
  // 문서 업데이트
  async updateProgrammableDocument(
    documentId: string,
    content: string,
    metadata: DocumentMetadata
  ): Promise<ProgrammableDocument> {
    try {
      // 1. 새 버전을 Irys에 업로드
      const tags = [
        { name: 'App-Name', value: 'DeBHuB' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Document-Id', value: documentId },
        { name: 'Version', value: (metadata.version + 1).toString() },
        { name: 'Previous-Version', value: metadata.version.toString() }
      ]
      
      const uploadResult = await this.irysClient.upload(
        Buffer.from(JSON.stringify({ content, metadata })),
        { tags }
      )
      
      // 2. 스마트 컨트랙트 업데이트
      const documentIdBytes32 = ethers.id(documentId)
      const newIrysIdBytes32 = ethers.zeroPadValue(`0x${uploadResult.id}`, 32)
      const metadataBytes = ethers.toUtf8Bytes(JSON.stringify(metadata))
      
      const tx = await this.contract.updateDocument(
        documentIdBytes32,
        newIrysIdBytes32,
        metadataBytes
      )
      
      await tx.wait()
      
      return {
        id: documentId,
        irysId: uploadResult.id,
        permanentUrl: `https://testnet-gateway.irys.xyz/${uploadResult.id}`,
        proof: uploadResult.receipt,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Failed to update programmable document:', error)
      throw error
    }
  }
  
  // 프로그래머블 규칙 설정
  async setProgrammableRules(
    documentId: string, 
    rules: ProgrammableRuleSet
  ): Promise<void> {
    try {
      const documentIdBytes32 = ethers.id(documentId)
      
      // 트리거 규칙 추가
      for (const trigger of rules.triggers) {
        const tx = await this.contract.addProgrammableRule(
          documentIdBytes32,
          trigger.event,
          trigger.condition || '',
          trigger.action
        )
        await tx.wait()
      }
      
      // 접근 권한 설정
      if (rules.access.public !== 'none') {
        await this.contract.setPublicAccess(documentIdBytes32, true)
      }
      
    } catch (error) {
      console.error('Failed to set programmable rules:', error)
      throw error
    }
  }
  
  // 접근 권한 부여
  async grantAccess(
    documentId: string,
    userAddress: string,
    permissionLevel: 'read' | 'write' | 'admin'
  ): Promise<void> {
    try {
      const documentIdBytes32 = ethers.id(documentId)
      const permissionMap = { read: 1, write: 2, admin: 3 }
      
      const tx = await this.contract.grantAccess(
        documentIdBytes32,
        userAddress,
        permissionMap[permissionLevel]
      )
      
      await tx.wait()
    } catch (error) {
      console.error('Failed to grant access:', error)
      throw error
    }
  }
  
  // 접근 권한 취소
  async revokeAccess(documentId: string, userAddress: string): Promise<void> {
    try {
      const documentIdBytes32 = ethers.id(documentId)
      
      const tx = await this.contract.revokeAccess(documentIdBytes32, userAddress)
      await tx.wait()
    } catch (error) {
      console.error('Failed to revoke access:', error)
      throw error
    }
  }
  
  // 문서 접근 (접근 기록 및 트리거 실행)
  async accessDocument(documentId: string): Promise<any> {
    try {
      const documentIdBytes32 = ethers.id(documentId)
      
      // 접근 기록
      const tx = await this.contract.recordAccess(documentIdBytes32)
      await tx.wait()
      
      // 문서 데이터 조회
      const document = await this.contract.getDocument(documentIdBytes32)
      
      // Irys에서 실제 콘텐츠 가져오기
      const irysId = document.irysId.replace('0x', '').replace(/^0+/, '') || document.irysId
      const content = await this.irysClient.getData(irysId)
      
      return {
        id: documentId,
        owner: document.owner,
        version: document.version,
        timestamp: document.timestamp,
        content: JSON.parse(content.toString()),
        irysId: irysId,
        onChainData: document
      }
    } catch (error) {
      console.error('Failed to access document:', error)
      throw error
    }
  }
  
  // 프로그래머블 데이터 쿼리
  async queryProgrammableData(filters: QueryFilters): Promise<QueryResult[]> {
    try {
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
      return result.data.transactions.edges.map((edge: any) => edge.node)
    } catch (error) {
      console.error('Failed to query programmable data:', error)
      throw error
    }
  }
  
  // 트리거 실행
  async executeTrigger(documentId: string, triggerIndex: number): Promise<void> {
    try {
      const documentIdBytes32 = ethers.id(documentId)
      
      const tx = await this.contract.executeConditionalAction(
        documentIdBytes32,
        triggerIndex
      )
      
      await tx.wait()
    } catch (error) {
      console.error('Failed to execute trigger:', error)
      throw error
    }
  }
  
  // 문서 통계
  async getDocumentStats(documentId: string): Promise<any> {
    try {
      const documentIdBytes32 = ethers.id(documentId)
      
      const [document, triggers, permission] = await Promise.all([
        this.contract.getDocument(documentIdBytes32),
        this.contract.getDocumentTriggers(documentIdBytes32),
        this.contract.getUserPermission(documentIdBytes32, await this.signer.getAddress())
      ])
      
      return {
        document: {
          id: documentId,
          owner: document.owner,
          version: document.version,
          timestamp: document.timestamp,
          exists: document.exists
        },
        triggers: triggers.map((trigger: any) => ({
          eventType: trigger.eventType,
          condition: trigger.condition,
          action: trigger.action,
          enabled: trigger.enabled,
          executionCount: trigger.executionCount,
          lastExecuted: trigger.lastExecuted
        })),
        userPermission: permission,
        totalDocuments: await this.contract.getTotalDocuments()
      }
    } catch (error) {
      console.error('Failed to get document stats:', error)
      throw error
    }
  }
  
  // 이벤트 리스너 설정
  onDocumentCreated(callback: (event: any) => void) {
    this.contract.on('DocumentCreated', callback)
  }
  
  onDocumentUpdated(callback: (event: any) => void) {
    this.contract.on('DocumentUpdated', callback)
  }
  
  onTriggerExecuted(callback: (event: any) => void) {
    this.contract.on('TriggerExecuted', callback)
  }
  
  // 이벤트 리스너 제거
  removeAllListeners() {
    this.contract.removeAllListeners()
  }
}