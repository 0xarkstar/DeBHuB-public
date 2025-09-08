export interface CodeGeneration {
  code: string;
  language: string;
  isValid: boolean;
  errors: string[];
  suggestions: string[];
}

export interface CodeValidation {
  isValid: boolean;
  errors: ValidationError[];
  suggestions: string[];
  complexity: number;
  maintainability: number;
}

export interface ValidationError {
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  rule?: string;
}

export interface SearchResult {
  document: any;
  score: number;
  highlights: string[];
}

export interface Improvement {
  type: 'readability' | 'seo' | 'terminology' | 'structure' | 'clarity';
  message: string;
  suggestions: string[];
  confidence?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface ReadabilityAnalysis {
  score: number;
  level: string;
  improvements: string[];
  metrics: {
    avgWordsPerSentence: number;
    avgSyllablesPerWord: number;
    complexWords: number;
    readingTime: number; // in minutes
  };
}

export interface SEOAnalysis {
  score: number;
  improvements: SEOImprovement[];
  keywords: {
    primary: string[];
    secondary: string[];
    density: { [key: string]: number };
  };
  headings: {
    h1: number;
    h2: number;
    h3: number;
    structure: boolean; // proper heading hierarchy
  };
}

export interface SEOImprovement {
  type: 'title' | 'meta' | 'headings' | 'keywords' | 'images' | 'links';
  message: string;
  suggestion: string;
  impact: 'low' | 'medium' | 'high';
}

export interface TerminologyCheck {
  inconsistencies: TerminologyInconsistency[];
  suggestions: string[];
  glossary: { [term: string]: string[] }; // term -> variations
}

export interface TerminologyInconsistency {
  term: string;
  variations: string[];
  positions: Array<{
    line: number;
    column: number;
    text: string;
  }>;
  suggestion: string;
}

export interface EmbeddingOptions {
  model?: 'text-embedding-ada-002' | 'text-embedding-3-small' | 'text-embedding-3-large';
  dimensions?: number;
  chunking?: {
    strategy: 'sentences' | 'paragraphs' | 'fixed' | 'semantic';
    maxTokens?: number;
    overlap?: number;
  };
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  scores: {
    positive: number;
    negative: number;
    neutral: number;
  };
  emotions?: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
}

export interface TopicExtraction {
  topics: Topic[];
  coherence: number;
  coverage: number;
}

export interface Topic {
  id: string;
  label: string;
  keywords: string[];
  confidence: number;
  relevance: number;
  documents?: string[]; // document IDs
}

export interface AIConfiguration {
  openai?: {
    apiKey: string;
    organization?: string;
    baseURL?: string;
  };
  cohere?: {
    apiKey: string;
  };
  huggingface?: {
    apiKey: string;
    baseURL?: string;
  };
  defaultProvider?: 'openai' | 'cohere' | 'huggingface';
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface AIUsageStats {
  provider: string;
  model: string;
  operation: string;
  tokensUsed: number;
  cost: number;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface ContentOptimization {
  originalLength: number;
  optimizedLength: number;
  improvements: Improvement[];
  readabilityImprovement: number;
  seoImprovement: number;
  engagementScore: number;
}

export interface AIModelInfo {
  provider: 'openai' | 'cohere' | 'huggingface';
  model: string;
  capabilities: string[];
  maxTokens: number;
  costPerToken: number;
  available: boolean;
}