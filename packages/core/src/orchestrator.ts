import { PrismaClient } from '@prisma/client'
import { EventEmitter } from 'events'
import { createClient, RedisClientType } from 'redis'

// 타입 정의
export interface IrysService {
  uploadDocument(document: any): Promise<{ id: string; permanentUrl: string }>
  executeProgrammableTrigger(trigger: any): Promise<{ success: boolean; action?: any }>
  healthCheck(): Promise<boolean>
}

export interface AIService {
  processDocument(document: any): Promise<{ summary: string; keywords: string[]; embedding: number[] }>
  createEmbedding(text: string): Promise<number[]>
  healthCheck(): Promise<boolean>
}

export interface VectorDBService {
  indexDocument(id: string, embedding: number[]): Promise<void>
  search(embedding: number[]): Promise<any[]>
  healthCheck(): Promise<boolean>
}

export interface RealtimeService {
  broadcast(channel: string, data: any): Promise<void>
  subscribeToDocument(documentId: string, callback: (update: any) => void): { unsubscribe: () => void }
  joinSession(sessionId: string, user: any, socket: any): Promise<void>
  healthCheck(): Promise<boolean>
}

export interface CreatePostInput {
  content: string
  authorAddress: string
  version?: number
  previousVersionId?: string
}

export interface Post {
  id: string
  content: string
  authorAddress: string
  irysTransactionId?: string
  version: number
  previousVersionId?: string
  timestamp: Date
}

export interface SearchResult {
  id: string
  title: string
  content: string
  score: number
  type: 'vector' | 'text'
}

export interface WorkflowResult {
  workflowId: string
  results: any[]
}

export interface HealthStatus {
  healthy: boolean
  services: {
    database: boolean
    irys: boolean
    ai: boolean
    vectorDB: boolean
    realtime: boolean
  }
  timestamp: string
}

export class IrysBaseOrchestrator extends EventEmitter {
  private static instance: IrysBaseOrchestrator
  
  private prisma: PrismaClient
  private redis: RedisClientType
  private irys?: IrysService
  private ai?: AIService
  private vectorDB?: VectorDBService
  private realtime?: RealtimeService
  private initialized = false
  
  private constructor() {
    super()
    this.prisma = new PrismaClient()
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })
  }
  
  static getInstance(): IrysBaseOrchestrator {
    if (!this.instance) {
      this.instance = new IrysBaseOrchestrator()
    }
    return this.instance
  }
  
  async initialize(services?: {
    irys?: IrysService
    ai?: AIService
    vectorDB?: VectorDBService
    realtime?: RealtimeService
  }) {
    if (this.initialized) return
    
    console.log('🚀 Initializing IrysBase Orchestrator...')
    
    try {
      // 1. 데이터베이스 연결
      await this.prisma.$connect()
      console.log('✅ Database connected')
      
      // 2. Redis 연결
      await this.redis.connect()
      console.log('✅ Redis connected')
      
      // 3. 서비스 초기화 (실제 구현체가 있을 때만)
      if (services?.irys) {
        this.irys = services.irys
        console.log('✅ Irys service initialized')
      }
      
      if (services?.ai) {
        this.ai = services.ai
        console.log('✅ AI service initialized')
      }
      
      if (services?.vectorDB) {
        this.vectorDB = services.vectorDB
        console.log('✅ Vector DB initialized')
      }
      
      if (services?.realtime) {
        this.realtime = services.realtime
        console.log('✅ Realtime service initialized')
      }
      
      // 4. 이벤트 리스너 설정
      this.setupEventListeners()
      
      this.initialized = true
      console.log('🎉 IrysBase Orchestrator ready!')
      
    } catch (error) {
      console.error('❌ Orchestrator initialization failed:', error)
      throw error
    }
  }
  
  private setupEventListeners() {
    // 포스트 생성 이벤트 처리
    this.on('post:created', async (post: Post) => {
      try {
        const tasks: Promise<any>[] = []
        
        // 1. Irys에 영구 저장
        if (this.irys) {
          tasks.push(
            this.irys.uploadDocument(post).then(async (irysResult) => {
              await this.prisma.post.update({
                where: { id: post.id },
                data: {
                  irysTransactionId: irysResult.id
                }
              })
              return { type: 'irys', result: irysResult }
            })
          )
        }
        
        // 2. AI 처리
        if (this.ai) {
          tasks.push(
            this.ai.processDocument(post).then(async (aiProcessing) => {
              // AI 메타데이터는 별도 테이블에 저장하거나 JSON으로 저장
              // 현재는 처리만 수행
              
              // 3. 벡터 인덱싱
              if (this.vectorDB && aiProcessing.embedding) {
                await this.vectorDB.indexDocument(post.id, aiProcessing.embedding)
              }
              
              return { type: 'ai', result: aiProcessing }
            })
          )
        }
        
        // 모든 처리 완료 후 브로드캐스트
        const results = await Promise.allSettled(tasks)
        
        if (this.realtime) {
          const successResults = results
            .filter(r => r.status === 'fulfilled')
            .map(r => (r as PromiseFulfilledResult<any>).value)
          
          await this.realtime.broadcast('post:processed', {
            postId: post.id,
            results: successResults
          })
        }
        
        this.emit('post:processed', { postId: post.id, results })
        
      } catch (error) {
        console.error('Post processing failed:', error)
        this.emit('error', { type: 'post:processing', error, postId: post.id })
      }
    })
    
    // 프로그래머블 데이터 트리거
    this.on('programmable:trigger', async (trigger) => {
      try {
        if (!this.irys) {
          console.warn('Irys service not available for programmable trigger')
          return
        }
        
        const result = await this.irys.executeProgrammableTrigger(trigger)
        
        // 결과에 따른 액션 실행
        if (result.success && result.action) {
          await this.handleTriggerAction(result.action)
        }
        
      } catch (error) {
        console.error('Programmable trigger failed:', error)
        this.emit('error', { type: 'programmable:trigger', error, trigger })
      }
    })
  }
  
  // 통합 API 메서드들
  async createPost(data: CreatePostInput): Promise<Post> {
    const post = await this.prisma.post.create({ 
      data: {
        irysTransactionId: `temp_${Date.now()}_${Math.random().toString(36)}`, // 임시 ID, 나중에 Irys 업로드 후 업데이트
        content: data.content,
        authorAddress: data.authorAddress,
        version: data.version || 1,
        previousVersionId: data.previousVersionId,
        timestamp: new Date()
      }
    }) as Post
    
    // 비동기 처리 시작
    setImmediate(() => {
      this.emit('post:created', post)
    })
    
    return post
  }
  
  async getPost(id: string): Promise<Post | null> {
    const post = await this.prisma.post.findUnique({
      where: { id }
    })
    return post as Post | null
  }
  
  async updatePost(id: string, data: Partial<Post>): Promise<Post> {
    const post = await this.prisma.post.update({
      where: { id },
      data
    }) as Post
    
    // 업데이트 이벤트 발생
    this.emit('post:updated', post)
    
    return post
  }
  
  async searchPosts(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    
    try {
      // 1. 시맨틱 검색 (AI 서비스가 있을 때)
      if (this.ai && this.vectorDB) {
        const embedding = await this.ai.createEmbedding(query)
        const vectorResults = await this.vectorDB.search(embedding)
        
        vectorResults.forEach(result => {
          results.push({
            id: result.id,
            title: result.title || 'Post',
            content: result.content || '',
            score: result.score || 0,
            type: 'vector'
          })
        })
      }
      
      // 2. 풀텍스트 검색
      const textResults = await this.prisma.post.findMany({
        where: {
          content: { contains: query, mode: 'insensitive' }
        },
        take: 20
      })
      
      textResults.forEach(post => {
        // 중복 제거
        if (!results.find(r => r.id === post.id)) {
          results.push({
            id: post.id,
            title: `Post by ${post.authorAddress}`,
            content: post.content,
            score: 0.5, // 기본 텍스트 검색 점수
            type: 'text'
          })
        }
      })
      
      // 3. 결과 정렬 (점수 기준)
      return results.sort((a, b) => b.score - a.score)
      
    } catch (error) {
      console.error('Search failed:', error)
      return []
    }
  }
  
  async executeWorkflow(workflowId: string, params: any): Promise<WorkflowResult> {
    // Workflow 기능은 향후 구현 예정
    console.warn('Workflow functionality not yet implemented')
    
    return { 
      workflowId, 
      results: [
        {
          stepId: 'mock-step',
          success: true,
          result: 'Workflow execution mocked'
        }
      ]
    }
  }
  
  private async executeStep(step: any, params: any): Promise<any> {
    // 스텝 실행 로직 (실제 구현은 스텝 타입에 따라 달라짐)
    return {
      stepId: step.id,
      success: true,
      result: `Step ${step.id} executed with params: ${JSON.stringify(params)}`
    }
  }
  
  private async handleTriggerAction(action: any): Promise<void> {
    switch (action.type) {
      case 'backup':
        // 백업 로직
        break
      case 'notify':
        // 알림 로직
        break
      case 'transform':
        // 데이터 변환 로직
        break
      default:
        console.warn(`Unknown trigger action type: ${action.type}`)
    }
  }
  
  // 구독 메서드들
  subscribeToPost(postId: string, callback: (update: any) => void): { unsubscribe: () => void } {
    if (this.realtime) {
      return this.realtime.subscribeToDocument(postId, callback)
    }
    
    // fallback 구현
    return { unsubscribe: () => {} }
  }
  
  // 관리 메서드들
  async getActiveConnections(): Promise<number> {
    try {
      const info = await this.redis.info('clients')
      const match = info.match(/connected_clients:(\d+)/)
      return match ? parseInt(match[1]) : 0
    } catch {
      return 0
    }
  }
  
  async getQueuedJobs(): Promise<number> {
    try {
      const length = await this.redis.lLen('job_queue')
      return length
    } catch {
      return 0
    }
  }
  
  // 헬스 체크
  async healthCheck(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.irys?.healthCheck() || Promise.resolve(false),
      this.ai?.healthCheck() || Promise.resolve(false),
      this.vectorDB?.healthCheck() || Promise.resolve(false),
      this.realtime?.healthCheck() || Promise.resolve(false)
    ])
    
    return {
      healthy: checks.every(c => c.status === 'fulfilled' && c.value),
      services: {
        database: checks[0].status === 'fulfilled' ? checks[0].value : false,
        irys: checks[1].status === 'fulfilled' ? checks[1].value : false,
        ai: checks[2].status === 'fulfilled' ? checks[2].value : false,
        vectorDB: checks[3].status === 'fulfilled' ? checks[3].value : false,
        realtime: checks[4].status === 'fulfilled' ? checks[4].value : false
      },
      timestamp: new Date().toISOString()
    }
  }
  
  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
  
  // 정리 메서드
  async cleanup(): Promise<void> {
    try {
      await this.prisma.$disconnect()
      await this.redis.disconnect()
      console.log('✅ Orchestrator cleanup completed')
    } catch (error) {
      console.error('❌ Orchestrator cleanup failed:', error)
    }
  }
}