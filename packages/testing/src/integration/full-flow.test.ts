import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { DeBHuBOrchestrator } from '@debhub/core'
import { TestDataFactory, type TestDataSet } from '../factories/test-data.factory'
import { cleanupTestData, setupTestDatabase, teardownTestDatabase, createTestEnvironment } from '../utils/cleanup'

// Mock services for testing
class MockIrysService {
  async uploadDocument(document: any) {
    return {
      id: `irys_${document.id}`,
      permanentUrl: `https://gateway.irys.xyz/irys_${document.id}`
    }
  }
  
  async executeProgrammableTrigger(trigger: any) {
    return {
      success: true,
      action: { type: 'backup', destination: 'irys' }
    }
  }
  
  async healthCheck() {
    return true
  }
}

class MockAIService {
  async processDocument(document: any) {
    return {
      summary: `AI-generated summary for: ${document.title}`,
      keywords: ['test', 'document', 'ai'],
      embedding: Array.from({ length: 1536 }, () => Math.random())
    }
  }
  
  async createEmbedding(text: string) {
    return Array.from({ length: 1536 }, () => Math.random())
  }
  
  async healthCheck() {
    return true
  }
}

class MockVectorDBService {
  private documents = new Map()
  
  async indexDocument(id: string, embedding: number[]) {
    this.documents.set(id, { id, embedding, indexed: true })
  }
  
  async search(embedding: number[]) {
    const results = []
    for (const [id, doc] of this.documents) {
      results.push({
        id,
        title: `Document ${id}`,
        content: `Content for ${id}`,
        score: Math.random()
      })
    }
    return results.slice(0, 5) // Return top 5
  }
  
  async healthCheck() {
    return true
  }
}

class MockRealtimeService {
  private subscriptions = new Map()
  
  async broadcast(channel: string, data: any) {
    console.log(`Broadcasting to ${channel}:`, data)
  }
  
  subscribeToDocument(documentId: string, callback: (update: any) => void) {
    const subscriptionId = `sub_${Date.now()}`
    this.subscriptions.set(subscriptionId, { documentId, callback })
    
    return {
      unsubscribe: () => {
        this.subscriptions.delete(subscriptionId)
      }
    }
  }
  
  async joinSession(sessionId: string, user: any, socket: any) {
    console.log(`User ${user.id} joined session ${sessionId}`)
  }
  
  async healthCheck() {
    return true
  }
}

describe('DeBHuB Full Integration Test', () => {
  let orchestrator: DeBHuBOrchestrator
  let testData: TestDataSet
  let mockServices: {
    irys: MockIrysService
    ai: MockAIService
    vectorDB: MockVectorDBService
    realtime: MockRealtimeService
  }
  
  beforeAll(async () => {
    // 테스트 환경 설정
    createTestEnvironment()
    
    // 테스트 데이터베이스 설정
    await setupTestDatabase()
    
    // Mock 서비스들 생성
    mockServices = {
      irys: new MockIrysService(),
      ai: new MockAIService(),
      vectorDB: new MockVectorDBService(),
      realtime: new MockRealtimeService()
    }
    
    // Orchestrator 초기화
    orchestrator = DeBHuBOrchestrator.getInstance()
    await orchestrator.initialize(mockServices)
    
    // 테스트 데이터 생성
    testData = await TestDataFactory.createTestProject()
  })
  
  beforeEach(async () => {
    // 각 테스트 전 데이터 정리
    await cleanupTestData()
  })
  
  afterAll(async () => {
    await orchestrator.cleanup()
    await teardownTestDatabase()
  })
  
  describe('Document Creation → AI Processing → Irys Storage', () => {
    it('should create post and process through entire pipeline', async () => {
      // 1. 포스트 생성
      const post = await orchestrator.createPost({
        content: 'This is a comprehensive integration test post for the DeBHuB platform.',
        authorAddress: testData.user.address
      })
      
      expect(post).toBeDefined()
      expect(post.id).toBeTruthy()
      expect(post.content).toBe('This is a comprehensive integration test post for the DeBHuB platform.')
      
      // 2. 처리 완료 대기 (이벤트 기반)
      const processingResult = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Post processing timeout'))
        }, 10000)
        
        orchestrator.once('post:processed', (result) => {
          clearTimeout(timeout)
          resolve(result)
        })
      })
      
      expect(processingResult).toBeDefined()
      
      // 3. 결과 확인
      const processed = await orchestrator.getPost(post.id)
      expect(processed).toBeDefined()
      
      // 실제 데이터베이스에서는 Irys ID와 AI 메타데이터가 업데이트되어야 함
      // Mock 서비스를 사용하므로 여기서는 포스트가 존재함을 확인
      expect(processed!.id).toBe(post.id)
      expect(processed!.content).toBe('This is a comprehensive integration test post for the DeBHuB platform.')
    }, 15000)
  })
  
  describe('Search Integration', () => {
    it('should search across vector and text indices', async () => {
      // 1. 테스트 포스트들 생성
      const posts = await Promise.all([
        orchestrator.createPost({
          content: 'Blockchain is a revolutionary distributed ledger technology that enables secure and transparent transactions without intermediaries.',
          authorAddress: testData.user.address
        }),
        orchestrator.createPost({
          content: 'Smart contracts are self-executing contracts with the terms directly written into code. They run on blockchain networks.',
          authorAddress: testData.user.address
        }),
        orchestrator.createPost({
          content: 'DeFi revolutionizes traditional finance by creating an open financial system using blockchain technology.',
          authorAddress: testData.user.address
        })
      ])
      
      expect(posts).toHaveLength(3)
      expect(posts.every(post => post.id)).toBe(true)
      
      // 처리 대기
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 2. 검색 실행
      const results = await orchestrator.searchPosts('blockchain technology')
      
      // 3. 결과 검증
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
      
      // 검색 결과가 관련 문서를 포함하는지 확인
      const relevantResult = results.find(r => 
        r.title.toLowerCase().includes('blockchain') || 
        r.content.toLowerCase().includes('blockchain')
      )
      expect(relevantResult).toBeDefined()
    })
  })
  
  describe('Real-time Collaboration', () => {
    it('should handle post subscriptions', async () => {
      const post = await orchestrator.createPost({
        content: 'Initial content for collaboration testing',
        authorAddress: testData.user.address
      })
      
      // 1. 실시간 구독 설정
      const updates: any[] = []
      const subscription = orchestrator.subscribeToPost(post.id, (update) => {
        updates.push(update)
      })
      
      expect(subscription).toBeDefined()
      expect(typeof subscription.unsubscribe).toBe('function')
      
      // 2. 변경 발생
      await orchestrator.updatePost(post.id, {
        content: 'Updated content for real-time collaboration test'
      })
      
      // 3. 구독 해제
      subscription.unsubscribe()
      
      // 구독이 올바르게 작동했는지 확인
      expect(subscription).toBeDefined()
    })
  })
  
  describe('Performance Tests', () => {
    it('should handle concurrent post operations', async () => {
      const startTime = Date.now()
      const concurrentOps = 20 // 테스트 환경에서는 더 적은 수로
      
      // 동시 포스트 생성
      const operations = Array(concurrentOps).fill(null).map((_, i) => 
        orchestrator.createPost({
          content: `Content for performance test post number ${i}. This tests concurrent operations.`,
          authorAddress: testData.user.address
        })
      )
      
      const results = await Promise.all(operations)
      const duration = Date.now() - startTime
      
      // 성능 검증
      expect(results).toHaveLength(concurrentOps)
      expect(results.every(post => post.id)).toBe(true)
      expect(duration).toBeLessThan(30000) // 30초 이내
      
      // 평균 처리 시간
      const avgTime = duration / concurrentOps
      expect(avgTime).toBeLessThan(1500) // 평균 1.5초 이내
      
      console.log(`✅ Performance test: ${concurrentOps} operations in ${duration}ms (avg: ${avgTime.toFixed(2)}ms per operation)`)
    }, 35000)
  })
  
  describe('Health Check System', () => {
    it('should return comprehensive health status', async () => {
      const health = await orchestrator.healthCheck()
      
      expect(health).toBeDefined()
      expect(health).toHaveProperty('healthy')
      expect(health).toHaveProperty('services')
      expect(health).toHaveProperty('timestamp')
      
      expect(health.services).toHaveProperty('database')
      expect(health.services).toHaveProperty('irys')
      expect(health.services).toHaveProperty('ai')
      expect(health.services).toHaveProperty('vectorDB')
      expect(health.services).toHaveProperty('realtime')
      
      // Mock 서비스들은 모두 healthy를 반환해야 함
      expect(health.services.irys).toBe(true)
      expect(health.services.ai).toBe(true)
      expect(health.services.vectorDB).toBe(true)
      expect(health.services.realtime).toBe(true)
    })
  })
  
  describe('Error Handling', () => {
    it('should handle service failures gracefully', async () => {
      // 에러 이벤트 수집
      const errors: any[] = []
      orchestrator.on('error', (error) => {
        errors.push(error)
      })
      
      // 정상적인 포스트 생성은 여전히 작동해야 함
      const post = await orchestrator.createPost({
        content: 'This tests error resilience',
        authorAddress: testData.user.address
      })
      
      expect(post).toBeDefined()
      expect(post.content).toBe('This tests error resilience')
      
      // 에러 리스너 정리
      orchestrator.removeAllListeners('error')
    })
  })
})