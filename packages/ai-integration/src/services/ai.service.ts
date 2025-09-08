import { OpenAI } from 'openai'
import { CohereClient } from 'cohere-ai'
import { HfInference } from '@huggingface/inference'
import {
  CodeGeneration,
  CodeValidation,
  SearchResult,
  Improvement,
  ReadabilityAnalysis,
  SEOAnalysis,
  TerminologyCheck,
  EmbeddingOptions,
  SentimentAnalysis,
  ContentOptimization,
  AIConfiguration,
  AIUsageStats,
  AIModelInfo
} from '../types'

export class AIService {
  private openai: OpenAI | null = null
  private cohere: CohereClient | null = null
  private huggingface: HfInference | null = null
  private config: AIConfiguration
  private usageStats: AIUsageStats[] = []
  
  constructor(config: AIConfiguration) {
    this.config = config
    this.initializeProviders()
  }
  
  private initializeProviders() {
    try {
      if (this.config.openai?.apiKey) {
        this.openai = new OpenAI({
          apiKey: this.config.openai.apiKey,
          organization: this.config.openai.organization,
          baseURL: this.config.openai.baseURL
        })
      }
      
      if (this.config.cohere?.apiKey) {
        this.cohere = new CohereClient({
          token: this.config.cohere.apiKey
        })
      }
      
      if (this.config.huggingface?.apiKey) {
        this.huggingface = new HfInference(this.config.huggingface.apiKey)
      }
    } catch (error) {
      console.error('Failed to initialize AI providers:', error)
    }
  }
  
  // 문서 임베딩 생성 (벡터 검색용)
  async createEmbedding(
    text: string, 
    options: EmbeddingOptions = {}
  ): Promise<Float32Array> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized')
    }
    
    const startTime = Date.now()
    
    try {
      // 텍스트 청킹 처리
      const chunks = this.chunkText(text, options.chunking)
      const embeddings: number[][] = []
      
      for (const chunk of chunks) {
        const response = await this.openai.embeddings.create({
          model: options.model || 'text-embedding-3-large',
          input: chunk,
          dimensions: options.dimensions || 3072 // 고차원 임베딩
        })
        
        embeddings.push(response.data[0].embedding)
      }
      
      // 여러 청크의 임베딩 평균 계산
      const avgEmbedding = this.averageEmbeddings(embeddings)
      
      // Usage tracking
      this.trackUsage('openai', options.model || 'text-embedding-3-large', 'embedding', 
        text.length / 4, 0.0001, Date.now() - startTime, true)
      
      return new Float32Array(avgEmbedding)
    } catch (error) {
      this.trackUsage('openai', options.model || 'text-embedding-3-large', 'embedding', 
        0, 0, Date.now() - startTime, false, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }
  
  // 문서 요약
  async summarize(
    content: string, 
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized')
    }
    
    const maxTokens = {
      short: 100,
      medium: 250,
      long: 500
    }
    
    const startTime = Date.now()
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a technical documentation expert. Create clear, concise summaries that capture the key points and main ideas. Focus on actionable insights and important concepts.`
          },
          {
            role: 'user',
            content: `Summarize this documentation in ${length} form (max ${maxTokens[length]} words):\n\n${content}`
          }
        ],
        max_tokens: maxTokens[length],
        temperature: 0.3
      })
      
      const result = completion.choices[0].message.content || ''
      
      // Track usage
      this.trackUsage('openai', 'gpt-4-turbo-preview', 'summarization',
        completion.usage?.total_tokens || 0, 0.01, Date.now() - startTime, true)
      
      return result
    } catch (error) {
      this.trackUsage('openai', 'gpt-4-turbo-preview', 'summarization',
        0, 0, Date.now() - startTime, false, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }
  
  // 코드 생성 및 개선
  async generateCode(
    prompt: string,
    language: string,
    context?: string
  ): Promise<CodeGeneration> {
    if (!this.cohere) {
      throw new Error('Cohere not initialized')
    }
    
    const startTime = Date.now()
    
    try {
      const response = await this.cohere.generate({
        model: 'command-nightly',
        prompt: `
          Generate ${language} code for: ${prompt}
          ${context ? `Context: ${context}` : ''}
          
          Requirements:
          - Write clean, well-commented code following best practices
          - Include error handling where appropriate
          - Use modern ${language} features and conventions
          - Provide brief explanations for complex logic
        `,
        maxTokens: 1000,
        temperature: 0.2,
        k: 0,
        p: 0.8,
        stopSequences: ['---END---']
      })
      
      const code = response.generations[0].text
      
      // 코드 검증
      const validation = await this.validateCode(code, language)
      
      this.trackUsage('cohere', 'command-nightly', 'code-generation',
        1000, 0.002, Date.now() - startTime, true)
      
      return {
        code,
        language,
        isValid: validation.isValid,
        errors: validation.errors.map(e => e.message),
        suggestions: validation.suggestions
      }
    } catch (error) {
      this.trackUsage('cohere', 'command-nightly', 'code-generation',
        0, 0, Date.now() - startTime, false, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }
  
  // 시맨틱 검색 쿼리 처리
  async processSemanticQuery(
    query: string,
    documents: any[],
    threshold: number = 0.7
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
    
    // 점수 기준 정렬 및 필터링
    return results
      .filter(r => r.score > threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // 상위 10개
  }
  
  // 콘텐츠 개선 제안
  async suggestImprovements(content: string): Promise<Improvement[]> {
    const improvements: Improvement[] = []
    
    try {
      // 병렬로 분석 실행
      const [readability, seo, terminology, sentiment] = await Promise.all([
        this.analyzeReadability(content),
        this.analyzeSEO(content),
        this.checkTerminology(content),
        this.analyzeSentiment(content)
      ])
      
      // 가독성 개선 제안
      if (readability.score < 60) {
        improvements.push({
          type: 'readability',
          message: `Content readability score is ${readability.score}/100. Consider simplifying sentences.`,
          suggestions: readability.improvements,
          confidence: 0.8,
          priority: 'high'
        })
      }
      
      // SEO 최적화 제안
      if (seo.score < 70) {
        improvements.push(...seo.improvements.map(imp => ({
          type: 'seo' as const,
          message: imp.message,
          suggestions: [imp.suggestion],
          confidence: 0.7,
          priority: imp.impact === 'high' ? 'high' as const : 'medium' as const
        })))
      }
      
      // 기술 용어 일관성
      if (terminology.inconsistencies.length > 0) {
        improvements.push({
          type: 'terminology',
          message: `Found ${terminology.inconsistencies.length} terminology inconsistencies`,
          suggestions: terminology.suggestions,
          confidence: 0.9,
          priority: 'medium'
        })
      }
      
      // 감정 톤 분석
      if (sentiment.sentiment === 'negative' && sentiment.confidence > 0.7) {
        improvements.push({
          type: 'clarity',
          message: 'Content tone appears negative. Consider using more positive language.',
          suggestions: ['Use more positive and encouraging language', 'Focus on solutions rather than problems'],
          confidence: sentiment.confidence,
          priority: 'medium'
        })
      }
      
    } catch (error) {
      console.error('Error in content analysis:', error)
    }
    
    return improvements
  }
  
  // 자동 완성
  async autocomplete(
    prompt: string,
    context: string,
    maxSuggestions = 5
  ): Promise<string[]> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized')
    }
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Complete the documentation text. Provide multiple natural continuations that maintain the writing style and context. Each suggestion should be concise and relevant.'
          },
          {
            role: 'user',
            content: `Context: ${context}\n\nComplete this text: "${prompt}"`
          }
        ],
        n: maxSuggestions,
        max_tokens: 50,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
      
      return response.choices
        .map(choice => choice.message.content || '')
        .filter(completion => completion.trim().length > 0)
    } catch (error) {
      console.error('Autocomplete failed:', error)
      return []
    }
  }
  
  // 감정 분석
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    if (!this.huggingface) {
      throw new Error('HuggingFace not initialized')
    }
    
    try {
      const result = await this.huggingface.textClassification({
        model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
        inputs: text
      })
      
      const scores = result as Array<{ label: string; score: number }>
      const sentimentMap: { [key: string]: 'positive' | 'negative' | 'neutral' } = {
        'LABEL_0': 'negative',
        'LABEL_1': 'neutral',
        'LABEL_2': 'positive'
      }
      
      const topResult = scores[0]
      const sentiment = sentimentMap[topResult.label] || 'neutral'
      
      return {
        sentiment,
        confidence: topResult.score,
        scores: {
          positive: scores.find(s => sentimentMap[s.label] === 'positive')?.score || 0,
          negative: scores.find(s => sentimentMap[s.label] === 'negative')?.score || 0,
          neutral: scores.find(s => sentimentMap[s.label] === 'neutral')?.score || 0
        }
      }
    } catch (error) {
      console.error('Sentiment analysis failed:', error)
      return {
        sentiment: 'neutral',
        confidence: 0,
        scores: { positive: 0, negative: 0, neutral: 1 }
      }
    }
  }
  
  // 콘텐츠 최적화
  async optimizeContent(content: string): Promise<ContentOptimization> {
    const improvements = await this.suggestImprovements(content)
    const readabilityBefore = await this.analyzeReadability(content)
    
    // AI를 사용하여 콘텐츠 개선
    const optimizedContent = await this.applyImprovements(content, improvements)
    const readabilityAfter = await this.analyzeReadability(optimizedContent)
    
    return {
      originalLength: content.length,
      optimizedLength: optimizedContent.length,
      improvements,
      readabilityImprovement: readabilityAfter.score - readabilityBefore.score,
      seoImprovement: 0, // Would calculate SEO improvement
      engagementScore: 0 // Would calculate engagement score
    }
  }
  
  // 사용량 통계
  getUsageStats(): AIUsageStats[] {
    return [...this.usageStats]
  }
  
  // 모델 정보
  getAvailableModels(): AIModelInfo[] {
    const models: AIModelInfo[] = []
    
    if (this.openai) {
      models.push(
        {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          capabilities: ['text-generation', 'summarization', 'analysis'],
          maxTokens: 128000,
          costPerToken: 0.00001,
          available: true
        },
        {
          provider: 'openai',
          model: 'text-embedding-3-large',
          capabilities: ['embedding'],
          maxTokens: 8191,
          costPerToken: 0.00000013,
          available: true
        }
      )
    }
    
    if (this.cohere) {
      models.push({
        provider: 'cohere',
        model: 'command-nightly',
        capabilities: ['text-generation', 'code-generation'],
        maxTokens: 4000,
        costPerToken: 0.000015,
        available: true
      })
    }
    
    return models
  }
  
  // 유틸리티 함수들
  private chunkText(text: string, options: EmbeddingOptions['chunking'] = { strategy: 'paragraphs' }) {
    const strategy = options.strategy || 'paragraphs'
    const maxTokens = options.maxTokens || 8000
    
    switch (strategy) {
      case 'sentences':
        return text.split(/[.!?]+/).filter(s => s.trim().length > 0)
      case 'paragraphs':
        return text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
      case 'fixed':
        const chunkSize = maxTokens * 4 // rough estimate
        const chunks = []
        for (let i = 0; i < text.length; i += chunkSize) {
          chunks.push(text.slice(i, i + chunkSize))
        }
        return chunks
      default:
        return [text]
    }
  }
  
  private averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return []
    if (embeddings.length === 1) return embeddings[0]
    
    const dimensions = embeddings[0].length
    const avg = new Array(dimensions).fill(0)
    
    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        avg[i] += embedding[i]
      }
    }
    
    for (let i = 0; i < dimensions; i++) {
      avg[i] /= embeddings.length
    }
    
    return avg
  }
  
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
  
  private async extractHighlights(query: string, content: string): Promise<string[]> {
    // Simple keyword-based highlighting
    const keywords = query.toLowerCase().split(/\s+/)
    const sentences = content.split(/[.!?]+/)
    const highlights: string[] = []
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase()
      if (keywords.some(keyword => lowerSentence.includes(keyword))) {
        highlights.push(sentence.trim())
        if (highlights.length >= 3) break
      }
    }
    
    return highlights
  }
  
  private async validateCode(code: string, language: string): Promise<CodeValidation> {
    // Simplified code validation
    // In production, use actual linters/parsers for each language
    return {
      isValid: true,
      errors: [],
      suggestions: [],
      complexity: 1,
      maintainability: 0.8
    }
  }
  
  private async analyzeReadability(content: string): Promise<ReadabilityAnalysis> {
    // Simplified readability analysis
    const words = content.split(/\s+/).length
    const sentences = content.split(/[.!?]+/).length
    const avgWordsPerSentence = words / sentences
    
    // Simple readability score based on sentence length
    const score = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 2))
    
    return {
      score,
      level: score > 80 ? 'Easy' : score > 60 ? 'Medium' : 'Hard',
      improvements: score < 60 ? ['Break down long sentences', 'Use simpler words'] : [],
      metrics: {
        avgWordsPerSentence,
        avgSyllablesPerWord: 1.5, // estimated
        complexWords: 0,
        readingTime: Math.ceil(words / 200) // 200 WPM average
      }
    }
  }
  
  private async analyzeSEO(content: string): Promise<SEOAnalysis> {
    // Simplified SEO analysis
    return {
      score: 75,
      improvements: [],
      keywords: {
        primary: [],
        secondary: [],
        density: {}
      },
      headings: {
        h1: 1,
        h2: 3,
        h3: 5,
        structure: true
      }
    }
  }
  
  private async checkTerminology(content: string): Promise<TerminologyCheck> {
    // Simplified terminology check
    return {
      inconsistencies: [],
      suggestions: [],
      glossary: {}
    }
  }
  
  private async applyImprovements(content: string, improvements: Improvement[]): Promise<string> {
    // In production, this would actually apply improvements
    return content
  }
  
  private trackUsage(
    provider: string,
    model: string,
    operation: string,
    tokensUsed: number,
    cost: number,
    duration: number,
    success: boolean,
    error?: string
  ) {
    this.usageStats.push({
      provider,
      model,
      operation,
      tokensUsed,
      cost,
      duration,
      timestamp: new Date(),
      success,
      error
    })
    
    // Keep only last 1000 entries
    if (this.usageStats.length > 1000) {
      this.usageStats.shift()
    }
  }
}