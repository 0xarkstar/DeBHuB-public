// Main exports for @irysbase/ai-integration package

// Services
export { AIService } from './services/ai.service'

// Types
export type {
  CodeGeneration,
  CodeValidation,
  ValidationError,
  SearchResult,
  Improvement,
  ReadabilityAnalysis,
  SEOAnalysis,
  SEOImprovement,
  TerminologyCheck,
  TerminologyInconsistency,
  EmbeddingOptions,
  SentimentAnalysis,
  TopicExtraction,
  Topic,
  AIConfiguration,
  AIUsageStats,
  ContentOptimization,
  AIModelInfo
} from './types'

import type { AIConfiguration } from './types'
import { AIService } from './services/ai.service'

// Utility functions
export const createAIService = (config: AIConfiguration) => new AIService(config)

// Default configurations
export const DEFAULT_AI_CONFIG = {
  defaultProvider: 'openai' as const,
  rateLimits: {
    requestsPerMinute: 60,
    tokensPerMinute: 90000
  }
}

// Common embedding options
export const EMBEDDING_PRESETS = {
  semantic_search: {
    model: 'text-embedding-3-large' as const,
    dimensions: 3072,
    chunking: {
      strategy: 'paragraphs' as const,
      maxTokens: 8000,
      overlap: 200
    }
  },
  similarity: {
    model: 'text-embedding-3-small' as const,
    dimensions: 1536,
    chunking: {
      strategy: 'sentences' as const,
      maxTokens: 4000
    }
  }
}