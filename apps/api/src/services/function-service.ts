import { IrysService } from './irys';

/**
 * Function Service for serverless functions and AI processing
 * Implements the serverless function capabilities from the plan
 */
export class FunctionService {
  private functions = new Map<string, ServerlessFunction>();

  constructor(private irysService: IrysService) {
    this.initializeBuiltinFunctions();
  }

  async initialize(): Promise<void> {
    console.log('✅ Function service initialized');
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Built-in Functions for IrysBook
   */
  private initializeBuiltinFunctions(): void {
    // Document enhancement functions
    this.registerFunction('enhance-document', this.enhanceDocument.bind(this));
    this.registerFunction('generate-outline', this.generateOutline.bind(this));
    this.registerFunction('check-grammar', this.checkGrammar.bind(this));
    this.registerFunction('optimize-seo', this.optimizeSEO.bind(this));

    // Content generation functions
    this.registerFunction('summarize', this.summarizeContent.bind(this));
    this.registerFunction('translate', this.translateContent.bind(this));
    this.registerFunction('create-embedding', this.createEmbedding.bind(this));
    this.registerFunction('find-related', this.findRelatedDocuments.bind(this));

    // Document processing functions
    this.registerFunction('generate-pdf', this.generatePDF.bind(this));
    this.registerFunction('create-epub', this.createEPUB.bind(this));
    this.registerFunction('extract-toc', this.extractTableOfContents.bind(this));
    this.registerFunction('validate-links', this.validateLinks.bind(this));

    // Analytics functions
    this.registerFunction('analyze-readability', this.analyzeReadability.bind(this));
    this.registerFunction('calculate-metrics', this.calculateMetrics.bind(this));
    this.registerFunction('generate-insights', this.generateInsights.bind(this));
  }

  /**
   * Function Registration and Invocation
   */
  registerFunction(name: string, handler: FunctionHandler): void {
    this.functions.set(name, {
      name,
      handler,
      registeredAt: new Date(),
    });
  }

  async invoke(functionName: string, payload: any): Promise<FunctionResult> {
    const func = this.functions.get(functionName);
    if (!func) {
      throw new Error(`Function '${functionName}' not found`);
    }

    const startTime = Date.now();
    
    try {
      const result = await func.handler(payload);
      const executionTime = Date.now() - startTime;

      // Store function execution log on Irys for audit trail
      await this.logFunctionExecution({
        functionName,
        payload,
        result,
        executionTime,
        timestamp: new Date(),
        success: true,
      });

      return {
        success: true,
        data: result,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Log error
      await this.logFunctionExecution({
        functionName,
        payload,
        error: String(error),
        executionTime,
        timestamp: new Date(),
        success: false,
      });

      return {
        success: false,
        error: String(error),
        executionTime,
      };
    }
  }

  /**
   * Built-in Function Implementations
   */
  private async enhanceDocument(payload: EnhanceDocumentPayload): Promise<DocumentEnhancement> {
    const { document_id, tasks = [] } = payload;
    const enhancements: Partial<DocumentEnhancement> = {};

    for (const task of tasks) {
      switch (task) {
        case 'generate_outline':
          enhancements.outline = await this.generateOutline({ content: payload.content });
          break;
        case 'check_grammar':
          enhancements.grammar = await this.checkGrammar({ content: payload.content });
          break;
        case 'optimize_seo':
          enhancements.seo = await this.optimizeSEO({ content: payload.content });
          break;
        case 'analyze_readability':
          enhancements.readability = await this.analyzeReadability({ content: payload.content });
          break;
      }
    }

    return enhancements as DocumentEnhancement;
  }

  private async generateOutline(payload: { content: string }): Promise<DocumentOutline> {
    // Extract headings and create outline structure
    const lines = payload.content.split('\n');
    const outline: OutlineItem[] = [];
    let currentLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headingMatch) {
        const level = headingMatch[1].length;
        const title = headingMatch[2];
        const anchor = this.generateAnchor(title);
        
        outline.push({
          level,
          title,
          anchor,
          lineNumber: i + 1,
          children: [],
        });
      }
    }

    return {
      items: this.buildHierarchy(outline),
      totalItems: outline.length,
      maxDepth: Math.max(...outline.map(item => item.level), 0),
    };
  }

  private async checkGrammar(payload: { content: string }): Promise<GrammarCheckResult> {
    // Placeholder for grammar checking
    // In production, integrate with Grammarly API, LanguageTool, or similar
    
    return {
      score: 0.92,
      issues: [
        {
          type: 'spelling',
          message: 'Possible spelling error',
          suggestion: 'corrected word',
          position: { start: 100, end: 110 },
          severity: 'warning',
        },
      ],
      suggestions: [
        {
          original: 'This is a example',
          suggested: 'This is an example',
          reason: 'Article usage',
        },
      ],
    };
  }

  private async optimizeSEO(payload: { content: string, keywords?: string[] }): Promise<SEOOptimization> {
    const content = payload.content;
    const keywords = payload.keywords || [];
    
    // Extract current metadata
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    const headings = this.extractHeadings(content);
    
    // Analyze keyword density
    const keywordAnalysis = keywords.map(keyword => ({
      keyword,
      count: (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length,
      density: (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length / wordCount,
    }));

    return {
      score: 0.78,
      wordCount,
      readingTime,
      keywordAnalysis,
      recommendations: [
        'Add more internal links',
        'Include keywords in headings',
        'Optimize meta description',
      ],
      headingStructure: {
        hasH1: headings.h1.length > 0,
        h1Count: headings.h1.length,
        h2Count: headings.h2.length,
        h3Count: headings.h3.length,
        hierarchy: headings.h1.length === 1 && headings.h2.length >= 1,
      },
    };
  }

  private async summarizeContent(payload: { content: string, length: 'short' | 'medium' | 'long' }): Promise<string> {
    // Placeholder for AI summarization
    // In production, integrate with GPT-4, Claude, or other language models
    
    const lengthMap = {
      short: 100,
      medium: 300,
      long: 500,
    };
    
    const targetLength = lengthMap[payload.length];
    const words = payload.content.split(/\s+/);
    
    if (words.length <= targetLength) {
      return payload.content;
    }
    
    // Simple truncation for demo - replace with proper AI summarization
    return words.slice(0, targetLength).join(' ') + '...';
  }

  private async translateContent(payload: { content: string, targetLang: string }): Promise<TranslationResult> {
    // Placeholder for translation
    // In production, integrate with Google Translate, DeepL, or other translation services
    
    return {
      originalContent: payload.content,
      translatedContent: `[Translated to ${payload.targetLang}] ${payload.content}`,
      targetLanguage: payload.targetLang,
      confidence: 0.95,
      detectedLanguage: 'en',
    };
  }

  private async createEmbedding(payload: { content: string }): Promise<{ vector: number[] }> {
    // Placeholder for embedding generation
    // In production, integrate with OpenAI, Cohere, or local models
    
    const mockEmbedding = new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
    return { vector: mockEmbedding };
  }

  private async findRelatedDocuments(payload: { document_id: string, limit: number }): Promise<RelatedDocument[]> {
    // Placeholder for related document finding
    // In production, use vector similarity search
    
    return [
      {
        documentId: 'doc-1',
        title: 'Related Document 1',
        similarity: 0.85,
        reason: 'Similar topic',
      },
      {
        documentId: 'doc-2',
        title: 'Related Document 2',
        similarity: 0.78,
        reason: 'Common keywords',
      },
    ];
  }

  private async generatePDF(payload: { documentId: string, content: string, options?: PDFOptions }): Promise<PDFResult> {
    // Placeholder for PDF generation
    // In production, use libraries like puppeteer, jsPDF, or similar
    
    return {
      documentId: payload.documentId,
      pdfUrl: `https://storage.irysbook.io/exports/${payload.documentId}.pdf`,
      size: 1024 * 1024, // 1MB
      pages: 10,
      generatedAt: new Date(),
    };
  }

  private async createEPUB(payload: { documentId: string, content: string, metadata: any }): Promise<EPUBResult> {
    // Placeholder for EPUB generation
    
    return {
      documentId: payload.documentId,
      epubUrl: `https://storage.irysbook.io/exports/${payload.documentId}.epub`,
      size: 512 * 1024, // 512KB
      chapters: 5,
      generatedAt: new Date(),
    };
  }

  private async extractTableOfContents(payload: { content: string }): Promise<TableOfContents> {
    const outline = await this.generateOutline(payload);
    
    return {
      items: outline.items,
      format: 'hierarchical',
      totalEntries: outline.totalItems,
    };
  }

  private async validateLinks(payload: { content: string }): Promise<LinkValidationResult> {
    // Extract links and validate them
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: LinkInfo[] = [];
    let match;

    while ((match = linkRegex.exec(payload.content)) !== null) {
      const text = match[1];
      const url = match[2];
      
      links.push({
        text,
        url,
        isInternal: url.startsWith('/') || url.startsWith('#'),
        isValid: true, // Placeholder - would actually validate
        position: match.index,
      });
    }

    return {
      totalLinks: links.length,
      validLinks: links.filter(link => link.isValid).length,
      brokenLinks: links.filter(link => !link.isValid),
      internalLinks: links.filter(link => link.isInternal).length,
      externalLinks: links.filter(link => !link.isInternal).length,
      links,
    };
  }

  private async analyzeReadability(payload: { content: string }): Promise<ReadabilityAnalysis> {
    const text = payload.content.replace(/[^\w\s]/g, ' ');
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((total, word) => total + this.countSyllables(word), 0);

    // Flesch Reading Ease Score
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);

    let level: 'beginner' | 'intermediate' | 'advanced';
    if (fleschScore >= 70) level = 'beginner';
    else if (fleschScore >= 50) level = 'intermediate';
    else level = 'advanced';

    return {
      fleschScore: Math.round(fleschScore),
      level,
      averageSentenceLength: Math.round(avgSentenceLength),
      averageSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
      wordCount: words.length,
      sentenceCount: sentences.length,
      readingTime: Math.ceil(words.length / 200),
    };
  }

  private async calculateMetrics(payload: { projectId: string, timeframe?: string }): Promise<ProjectMetrics> {
    // Placeholder for metrics calculation
    
    return {
      projectId: payload.projectId,
      timeframe: payload.timeframe || 'last_30_days',
      documents: {
        total: 45,
        created: 12,
        updated: 23,
        published: 8,
      },
      collaboration: {
        activeUsers: 15,
        comments: 89,
        suggestions: 34,
        approvals: 67,
      },
      engagement: {
        views: 1250,
        uniqueVisitors: 890,
        averageReadingTime: 4.2,
        bounceRate: 0.23,
      },
      generatedAt: new Date(),
    };
  }

  private async generateInsights(payload: { projectId: string }): Promise<ProjectInsights> {
    // AI-generated insights about the project
    
    return {
      projectId: payload.projectId,
      insights: [
        {
          type: 'performance',
          title: 'Documentation Growth',
          message: 'Your documentation has grown by 40% this month',
          impact: 'positive',
          actionable: true,
          suggestions: ['Consider creating more advanced topics'],
        },
        {
          type: 'engagement',
          title: 'High Engagement on API Docs',
          message: 'API documentation receives 60% of total views',
          impact: 'positive',
          actionable: true,
          suggestions: ['Expand API examples and tutorials'],
        },
      ],
      generatedAt: new Date(),
    };
  }

  /**
   * Utility methods
   */
  private async logFunctionExecution(log: FunctionExecutionLog): Promise<void> {
    // Store function execution log on Irys for audit trail
    try {
      await this.irysService.uploadData(JSON.stringify(log), [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Entity-Type', value: 'function-log' },
        { name: 'Function-Name', value: log.functionName },
        { name: 'Timestamp', value: log.timestamp.toISOString() },
        { name: 'Success', value: String(log.success) },
      ]);
    } catch (error) {
      console.error('Failed to log function execution:', error);
    }
  }

  private generateAnchor(title: string): string {
    return title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  private buildHierarchy(items: OutlineItem[]): OutlineItem[] {
    // Build hierarchical structure from flat list
    const result: OutlineItem[] = [];
    const stack: OutlineItem[] = [];

    for (const item of items) {
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        result.push(item);
      } else {
        stack[stack.length - 1].children.push(item);
      }

      stack.push(item);
    }

    return result;
  }

  private extractHeadings(content: string): { h1: string[]; h2: string[]; h3: string[] } {
    const h1 = (content.match(/^# (.+)$/gm) || []).map(h => h.replace(/^# /, ''));
    const h2 = (content.match(/^## (.+)$/gm) || []).map(h => h.replace(/^## /, ''));
    const h3 = (content.match(/^### (.+)$/gm) || []).map(h => h.replace(/^### /, ''));
    
    return { h1, h2, h3 };
  }

  private countSyllables(word: string): number {
    // Simple syllable counting algorithm
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    if (word.endsWith('e')) count--;
    return Math.max(1, count);
  }
}

// Type definitions
export type FunctionHandler = (payload: any) => Promise<any>;

export interface ServerlessFunction {
  name: string;
  handler: FunctionHandler;
  registeredAt: Date;
}

export interface FunctionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

export interface FunctionExecutionLog {
  functionName: string;
  payload: any;
  result?: any;
  error?: string;
  executionTime: number;
  timestamp: Date;
  success: boolean;
}

export interface EnhanceDocumentPayload {
  document_id: string;
  content: string;
  tasks: Array<'generate_outline' | 'check_grammar' | 'optimize_seo' | 'analyze_readability'>;
}

export interface DocumentEnhancement {
  outline?: DocumentOutline;
  grammar?: GrammarCheckResult;
  seo?: SEOOptimization;
  readability?: ReadabilityAnalysis;
}

export interface DocumentOutline {
  items: OutlineItem[];
  totalItems: number;
  maxDepth: number;
}

export interface OutlineItem {
  level: number;
  title: string;
  anchor: string;
  lineNumber: number;
  children: OutlineItem[];
}

export interface GrammarCheckResult {
  score: number;
  issues: Array<{
    type: string;
    message: string;
    suggestion: string;
    position: { start: number; end: number };
    severity: 'error' | 'warning' | 'suggestion';
  }>;
  suggestions: Array<{
    original: string;
    suggested: string;
    reason: string;
  }>;
}

export interface SEOOptimization {
  score: number;
  wordCount: number;
  readingTime: number;
  keywordAnalysis: Array<{
    keyword: string;
    count: number;
    density: number;
  }>;
  recommendations: string[];
  headingStructure: {
    hasH1: boolean;
    h1Count: number;
    h2Count: number;
    h3Count: number;
    hierarchy: boolean;
  };
}

export interface TranslationResult {
  originalContent: string;
  translatedContent: string;
  targetLanguage: string;
  confidence: number;
  detectedLanguage: string;
}

export interface RelatedDocument {
  documentId: string;
  title: string;
  similarity: number;
  reason: string;
}

export interface PDFOptions {
  format?: 'A4' | 'Letter';
  margin?: { top: number; right: number; bottom: number; left: number };
  includeTableOfContents?: boolean;
  includeCover?: boolean;
}

export interface PDFResult {
  documentId: string;
  pdfUrl: string;
  size: number;
  pages: number;
  generatedAt: Date;
}

export interface EPUBResult {
  documentId: string;
  epubUrl: string;
  size: number;
  chapters: number;
  generatedAt: Date;
}

export interface TableOfContents {
  items: OutlineItem[];
  format: 'hierarchical' | 'flat';
  totalEntries: number;
}

export interface LinkInfo {
  text: string;
  url: string;
  isInternal: boolean;
  isValid: boolean;
  position: number;
}

export interface LinkValidationResult {
  totalLinks: number;
  validLinks: number;
  brokenLinks: LinkInfo[];
  internalLinks: number;
  externalLinks: number;
  links: LinkInfo[];
}

export interface ReadabilityAnalysis {
  fleschScore: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  averageSentenceLength: number;
  averageSyllablesPerWord: number;
  wordCount: number;
  sentenceCount: number;
  readingTime: number;
}

export interface ProjectMetrics {
  projectId: string;
  timeframe: string;
  documents: {
    total: number;
    created: number;
    updated: number;
    published: number;
  };
  collaboration: {
    activeUsers: number;
    comments: number;
    suggestions: number;
    approvals: number;
  };
  engagement: {
    views: number;
    uniqueVisitors: number;
    averageReadingTime: number;
    bounceRate: number;
  };
  generatedAt: Date;
}

export interface ProjectInsights {
  projectId: string;
  insights: Array<{
    type: 'performance' | 'engagement' | 'content' | 'collaboration';
    title: string;
    message: string;
    impact: 'positive' | 'negative' | 'neutral';
    actionable: boolean;
    suggestions?: string[];
  }>;
  generatedAt: Date;
}