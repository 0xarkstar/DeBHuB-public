import { PrismaClient } from '@prisma/client';
import { prisma } from './database';
import { IrysService } from './irys';
import { createClient, RedisClientType } from 'redis';

/**
 * Edge Service for edge computing and global deployment
 * Implements distributed edge function processing with caching and routing
 */
export class EdgeService {
  private redis: RedisClientType;
  private edgeFunctions = new Map<string, EdgeFunction>();
  private regions: EdgeRegion[] = [
    { id: 'us-east-1', name: 'US East', location: 'Virginia', active: true },
    { id: 'us-west-1', name: 'US West', location: 'California', active: true },
    { id: 'eu-west-1', name: 'EU West', location: 'Ireland', active: true },
    { id: 'ap-southeast-1', name: 'Asia Pacific', location: 'Singapore', active: true },
  ];

  constructor(
    private prisma?: PrismaClient,
    private irysService?: IrysService
  ) {
    this.prisma = prisma || undefined;
    this.irysService = irysService || undefined;
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.redis.connect().catch(console.error);
  }

  async initialize(): Promise<void> {
    console.log('✅ Edge service initialized');
    console.log(`📍 Available regions: ${this.regions.map(r => r.id).join(', ')}`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Deploy edge function to specified regions
   */
  async deploy(options: DeployOptions): Promise<DeploymentResult> {
    const { functionName, code, config, regions } = options;
    const targetRegions = regions || this.regions.filter(r => r.active).map(r => r.id);

    // Validate function code
    this.validateFunctionCode(code);

    // Upload function code to Irys for permanent storage
    const irysResult = await this.irysService!.uploadData(code, [
      { name: 'Content-Type', value: 'application/javascript' },
      { name: 'Entity-Type', value: 'edge-function' },
      { name: 'Function-Name', value: functionName },
      { name: 'Deployed-At', value: new Date().toISOString() },
      { name: 'Regions', value: targetRegions.join(',') },
    ]);

    // Register edge function
    const edgeFunction: EdgeFunction = {
      name: functionName,
      code,
      config: config || {},
      irysId: irysResult.id,
      regions: targetRegions,
      deployedAt: new Date(),
      version: 1,
      status: 'active',
    };

    this.edgeFunctions.set(functionName, edgeFunction);

    // Cache function code in Redis for quick access
    await this.cacheFunctionCode(functionName, code, targetRegions);

    return {
      functionName,
      irysId: irysResult.id,
      regions: targetRegions,
      deployedAt: new Date(),
      status: 'deployed',
      endpoints: this.generateEndpoints(functionName, targetRegions),
    };
  }

  /**
   * Execute edge function with automatic region selection
   */
  async execute(
    functionName: string,
    payload: any,
    options: ExecuteOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const region = options.region || this.selectOptimalRegion(options.userRegion);

    // Get function from cache or storage
    const func = await this.getFunction(functionName, region);
    if (!func) {
      throw new Error(`Edge function '${functionName}' not found`);
    }

    try {
      // Execute function in isolated context
      const result = await this.executeFunctionInSandbox(func.code, payload, {
        functionName,
        region,
        timeout: options.timeout || 10000,
      });

      const executionTime = Date.now() - startTime;

      // Log execution metrics
      await this.logExecution({
        functionName,
        region,
        executionTime,
        success: true,
        timestamp: new Date(),
      });

      return {
        success: true,
        data: result,
        executionTime,
        region,
        cached: func.cached,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      await this.logExecution({
        functionName,
        region,
        executionTime,
        success: false,
        error: String(error),
        timestamp: new Date(),
      });

      return {
        success: false,
        error: String(error),
        executionTime,
        region,
      };
    }
  }

  /**
   * Cache management
   */
  async invalidateCache(functionName: string, regions?: string[]): Promise<void> {
    const targetRegions = regions || this.regions.map(r => r.id);

    for (const region of targetRegions) {
      const cacheKey = this.getCacheKey(functionName, region);
      await this.redis.del(cacheKey);
    }

    console.log(`🗑️ Cache invalidated for ${functionName} in regions: ${targetRegions.join(', ')}`);
  }

  async setEdgeCache(
    key: string,
    value: any,
    options: CacheOptions = {}
  ): Promise<void> {
    const { ttl = 3600, regions } = options;
    const targetRegions = regions || this.regions.map(r => r.id);

    for (const region of targetRegions) {
      const regionKey = `edge:${region}:${key}`;
      await this.redis.setEx(regionKey, ttl, JSON.stringify(value));
    }
  }

  async getEdgeCache(key: string, region?: string): Promise<any | null> {
    const targetRegion = region || this.selectOptimalRegion();
    const regionKey = `edge:${targetRegion}:${key}`;

    try {
      const cached = await this.redis.get(regionKey);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  /**
   * Content Delivery Network (CDN) capabilities
   */
  async serveCachedContent(
    contentId: string,
    options: CDNOptions = {}
  ): Promise<CDNResponse> {
    const region = options.region || this.selectOptimalRegion(options.userRegion);
    const cacheKey = `cdn:${contentId}`;

    // Check edge cache first
    const cached = await this.getEdgeCache(cacheKey, region);
    if (cached) {
      return {
        content: cached.content,
        contentType: cached.contentType,
        region,
        cached: true,
        cacheHit: true,
      };
    }

    // Fetch from Irys if not cached
    const content = await this.irysService!.getData(contentId);

    // Cache for future requests
    await this.setEdgeCache(cacheKey, {
      content,
      contentType: options.contentType || 'text/html',
    }, {
      ttl: options.cacheTTL || 3600,
      regions: [region],
    });

    return {
      content,
      contentType: options.contentType || 'text/html',
      region,
      cached: false,
      cacheHit: false,
    };
  }

  /**
   * Get edge function deployment status
   */
  async getDeploymentStatus(functionName: string): Promise<DeploymentStatus> {
    const func = this.edgeFunctions.get(functionName);
    if (!func) {
      throw new Error(`Function '${functionName}' not found`);
    }

    const regionStatuses = await Promise.all(
      func.regions.map(async region => {
        const cacheKey = this.getCacheKey(functionName, region);
        const cached = await this.redis.exists(cacheKey);

        return {
          region,
          status: cached ? 'active' : 'inactive',
          lastDeployed: func.deployedAt,
        };
      })
    );

    return {
      functionName,
      version: func.version,
      status: func.status,
      regions: regionStatuses,
      totalRegions: func.regions.length,
      activeRegions: regionStatuses.filter(r => r.status === 'active').length,
    };
  }

  /**
   * List all edge functions
   */
  async listFunctions(): Promise<EdgeFunctionInfo[]> {
    return Array.from(this.edgeFunctions.values()).map(func => ({
      name: func.name,
      irysId: func.irysId,
      regions: func.regions,
      version: func.version,
      status: func.status,
      deployedAt: func.deployedAt,
    }));
  }

  /**
   * Get edge metrics
   */
  async getEdgeMetrics(functionName?: string): Promise<EdgeMetrics> {
    // In production, this would aggregate from all regions
    const allFunctions = functionName
      ? [this.edgeFunctions.get(functionName)].filter(Boolean)
      : Array.from(this.edgeFunctions.values());

    const totalExecutions = 1000; // Mock data
    const totalErrors = 50;
    const avgExecutionTime = 45;

    return {
      totalExecutions,
      successRate: ((totalExecutions - totalErrors) / totalExecutions) * 100,
      avgExecutionTime,
      totalErrors,
      regionBreakdown: this.regions.map(region => ({
        region: region.id,
        executions: Math.floor(totalExecutions / this.regions.length),
        avgLatency: avgExecutionTime + Math.random() * 10,
      })),
    };
  }

  /**
   * Private helper methods
   */
  private validateFunctionCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error('Function code cannot be empty');
    }

    // Basic validation - in production, add more sophisticated checks
    if (code.includes('eval(') || code.includes('Function(')) {
      throw new Error('Function code contains unsafe operations');
    }
  }

  private async cacheFunctionCode(
    functionName: string,
    code: string,
    regions: string[]
  ): Promise<void> {
    for (const region of regions) {
      const cacheKey = this.getCacheKey(functionName, region);
      await this.redis.setEx(cacheKey, 86400, code); // Cache for 24 hours
    }
  }

  private async getFunction(
    functionName: string,
    region: string
  ): Promise<{ code: string; cached: boolean } | null> {
    // Try cache first
    const cacheKey = this.getCacheKey(functionName, region);
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return { code: cached, cached: true };
    }

    // Fallback to in-memory
    const func = this.edgeFunctions.get(functionName);
    if (func) {
      // Re-cache
      await this.redis.setEx(cacheKey, 86400, func.code);
      return { code: func.code, cached: false };
    }

    return null;
  }

  private async executeFunctionInSandbox(
    code: string,
    payload: any,
    context: ExecutionContext
  ): Promise<any> {
    // In production, use isolated VM or Worker threads
    // For now, simple function execution with timeout

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Function execution timeout after ${context.timeout}ms`));
      }, context.timeout);

      try {
        // Create function from code
        const func = new Function('payload', 'context', `
          return (async () => {
            ${code}
          })();
        `);

        // Execute with timeout protection
        func(payload, { region: context.region, functionName: context.functionName })
          .then((result: any) => {
            clearTimeout(timeout);
            resolve(result);
          })
          .catch((error: any) => {
            clearTimeout(timeout);
            reject(error);
          });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private selectOptimalRegion(userRegion?: string): string {
    // In production, use geolocation and latency-based routing
    if (userRegion && this.regions.find(r => r.id === userRegion && r.active)) {
      return userRegion;
    }

    // Default to first active region
    const activeRegion = this.regions.find(r => r.active);
    return activeRegion?.id || 'us-east-1';
  }

  private getCacheKey(functionName: string, region: string): string {
    return `edge-function:${region}:${functionName}`;
  }

  private generateEndpoints(functionName: string, regions: string[]): string[] {
    return regions.map(region =>
      `https://${region}.edge.debhub.io/fn/${functionName}`
    );
  }

  private async logExecution(log: ExecutionLog): Promise<void> {
    try {
      // Store in Redis for real-time metrics
      const logKey = `edge-logs:${log.functionName}:${Date.now()}`;
      await this.redis.setEx(logKey, 3600, JSON.stringify(log));

      // Also upload to Irys for permanent audit trail
      await this.irysService!.uploadData(JSON.stringify(log), [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Entity-Type', value: 'edge-execution-log' },
        { name: 'Function-Name', value: log.functionName },
        { name: 'Region', value: log.region },
        { name: 'Success', value: String(log.success) },
        { name: 'Timestamp', value: log.timestamp.toISOString() },
      ]);
    } catch (error) {
      console.error('Failed to log edge execution:', error);
    }
  }
}

// Type definitions
export interface EdgeRegion {
  id: string;
  name: string;
  location: string;
  active: boolean;
}

export interface EdgeFunction {
  name: string;
  code: string;
  config: Record<string, any>;
  irysId: string;
  regions: string[];
  deployedAt: Date;
  version: number;
  status: 'active' | 'inactive' | 'deploying';
}

export interface DeployOptions {
  functionName: string;
  code: string;
  config?: Record<string, any>;
  regions?: string[];
}

export interface DeploymentResult {
  functionName: string;
  irysId: string;
  regions: string[];
  deployedAt: Date;
  status: string;
  endpoints: string[];
}

export interface ExecuteOptions {
  region?: string;
  userRegion?: string;
  timeout?: number;
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  region: string;
  cached?: boolean;
}

export interface ExecutionContext {
  functionName: string;
  region: string;
  timeout: number;
}

export interface CacheOptions {
  ttl?: number;
  regions?: string[];
}

export interface CDNOptions {
  region?: string;
  userRegion?: string;
  contentType?: string;
  cacheTTL?: number;
}

export interface CDNResponse {
  content: any;
  contentType: string;
  region: string;
  cached: boolean;
  cacheHit: boolean;
}

export interface DeploymentStatus {
  functionName: string;
  version: number;
  status: string;
  regions: Array<{
    region: string;
    status: string;
    lastDeployed: Date;
  }>;
  totalRegions: number;
  activeRegions: number;
}

export interface EdgeFunctionInfo {
  name: string;
  irysId: string;
  regions: string[];
  version: number;
  status: string;
  deployedAt: Date;
}

export interface EdgeMetrics {
  totalExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  totalErrors: number;
  regionBreakdown: Array<{
    region: string;
    executions: number;
    avgLatency: number;
  }>;
}

export interface ExecutionLog {
  functionName: string;
  region: string;
  executionTime: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}