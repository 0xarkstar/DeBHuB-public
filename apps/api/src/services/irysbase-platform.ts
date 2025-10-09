import { IrysService } from './irys';
import { DatabaseService } from './database-service';
import { StorageService } from './storage-service';
import { RealtimeService } from './realtime-service';
import { FunctionService } from './function-service';
import { VectorDBService } from './vector-db-service';
import { SearchService } from './search-service';
import { AnalyticsService } from './analytics-service';
import { EdgeService } from './edge-service';
import { ProgrammableDataService } from './programmable-data-service';

/**
 * IrysBase Platform - Core service architecture as defined in the plan
 * Implements the complete Supabase-like BaaS functionality
 */
export interface IrysBasePlatform {
  // Core services
  core: {
    auth: any; // Will use existing AuthService
    database: DatabaseService;
    storage: StorageService;
    realtime: RealtimeService;
    functions: FunctionService;
  };
  
  // Advanced services for IrysBook integration
  advanced: {
    vector: VectorDBService;
    search: SearchService;
    analytics: AnalyticsService;
    edge: EdgeService;
    programmable: ProgrammableDataService;
  };
  
  // Developer tools
  tools: {
    cli: any; // Future CLI implementation
    sdk: any; // Future SDK libraries
    dashboard: any; // Future admin dashboard
    playground: any; // Future API playground
    monitoring: any; // Future monitoring tools
  };
}

/**
 * Main IrysBase Platform implementation
 */
export class IrysBasePlatformImpl implements IrysBasePlatform {
  public core: IrysBasePlatform['core'];
  public advanced: IrysBasePlatform['advanced'];
  public tools: IrysBasePlatform['tools'];

  constructor(
    private irysService: IrysService,
    private config: PlatformConfig = {}
  ) {
    // Initialize services in constructor
    this.core = {} as IrysBasePlatform['core'];
    this.advanced = {} as IrysBasePlatform['advanced'];
    this.tools = {} as IrysBasePlatform['tools'];
    
    this.initializeServices();
  }

  private initializeServices(): void {
    // Initialize core services
    this.core = {
      auth: null, // Will use existing auth service
      database: new DatabaseService(this.irysService),
      storage: new StorageService(this.irysService),
      realtime: new RealtimeService(),
      functions: new FunctionService(this.irysService),
    };

    // Initialize advanced services for IrysBook
    this.advanced = {
      vector: new VectorDBService(this.core.database as any),
      search: new SearchService(this.core.database as any),
      analytics: new AnalyticsService(this.core.database as any),
      edge: new EdgeService(),
      programmable: new ProgrammableDataService(this.core.database as any, this.irysService),
    };

    // Tools will be implemented in future iterations
    this.tools = {
      cli: null,
      sdk: null,
      dashboard: null,
      playground: null,
      monitoring: null,
    };
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.core.database.initialize(),
      this.core.storage.initialize(),
      this.core.realtime.initialize(),
      this.core.functions.initialize(),
      this.advanced.vector.initialize(),
      this.advanced.search.initialize(),
      this.advanced.analytics.initialize(),
      this.advanced.programmable.initialize(),
    ]);
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<ServiceHealthStatus> {
    const checks = await Promise.allSettled([
      this.core.database.healthCheck(),
      this.core.storage.healthCheck(),
      this.core.realtime.healthCheck(),
      this.core.functions.healthCheck(),
      this.advanced.vector.healthCheck(),
      this.advanced.search.healthCheck(),
      this.advanced.analytics.healthCheck(),
      this.advanced.programmable.healthCheck(),
    ]);

    return {
      healthy: checks.every(c => c.status === 'fulfilled' && c.value),
      services: {
        database: checks[0].status === 'fulfilled' ? checks[0].value : false,
        storage: checks[1].status === 'fulfilled' ? checks[1].value : false,
        realtime: checks[2].status === 'fulfilled' ? checks[2].value : false,
        functions: checks[3].status === 'fulfilled' ? checks[3].value : false,
        vector: checks[4].status === 'fulfilled' ? checks[4].value : false,
        search: checks[5].status === 'fulfilled' ? checks[5].value : false,
        analytics: checks[6].status === 'fulfilled' ? checks[6].value : false,
        programmable: checks[7].status === 'fulfilled' ? checks[7].value : false,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export interface PlatformConfig {
  services?: {
    enableVector?: boolean;
    enableSearch?: boolean;
    enableAnalytics?: boolean;
    enableEdge?: boolean;
    enableProgrammable?: boolean;
  };
  irys?: {
    network?: string;
    token?: string;
  };
  database?: {
    url?: string;
    poolSize?: number;
  };
}

export interface ServiceHealthStatus {
  healthy: boolean;
  services: {
    database: boolean;
    storage: boolean;
    realtime: boolean;
    functions: boolean;
    vector: boolean;
    search: boolean;
    analytics: boolean;
    programmable: boolean;
  };
  timestamp: string;
}

// Export singleton instance factory
let platformInstance: IrysBasePlatformImpl | null = null;

export function createPlatform(
  irysService: IrysService,
  config?: PlatformConfig
): IrysBasePlatformImpl {
  if (!platformInstance) {
    platformInstance = new IrysBasePlatformImpl(irysService, config);
  }
  return platformInstance;
}

export function getPlatform(): IrysBasePlatformImpl {
  if (!platformInstance) {
    throw new Error('Platform not initialized. Call createPlatform() first.');
  }
  return platformInstance;
}