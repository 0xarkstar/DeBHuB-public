import { PrismaClient } from '@prisma/client';
import { prisma } from './database';
import { IrysService } from './irys';
import { createHash } from 'crypto';

/**
 * Programmable Data Service for smart rules, triggers, and data transformations
 * Implements Irys programmable data capabilities with triggers and automated workflows
 */
export class ProgrammableDataService {
  private rules = new Map<string, ProgrammableRule[]>();
  private triggers = new Map<string, TriggerFunction>();

  constructor(
    private prisma: PrismaClient = prisma,
    private irysService: IrysService
  ) {
    this.initializeBuiltinTriggers();
  }

  async initialize(): Promise<void> {
    console.log('✅ Programmable data service initialized');
    await this.loadRulesFromDatabase();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize built-in triggers
   */
  private initializeBuiltinTriggers(): void {
    // Document lifecycle triggers
    this.registerTrigger('on_document_create', this.onDocumentCreate.bind(this));
    this.registerTrigger('on_document_update', this.onDocumentUpdate.bind(this));
    this.registerTrigger('on_document_publish', this.onDocumentPublish.bind(this));
    this.registerTrigger('on_document_delete', this.onDocumentDelete.bind(this));

    // Data transformation triggers
    this.registerTrigger('auto_backup', this.autoBackup.bind(this));
    this.registerTrigger('auto_version', this.autoVersion.bind(this));
    this.registerTrigger('auto_notarize', this.autoNotarize.bind(this));

    // Analytics triggers
    this.registerTrigger('track_event', this.trackEvent.bind(this));
    this.registerTrigger('aggregate_metrics', this.aggregateMetrics.bind(this));
  }

  /**
   * Register a custom trigger function
   */
  registerTrigger(name: string, handler: TriggerFunction): void {
    this.triggers.set(name, handler);
    console.log(`📌 Registered trigger: ${name}`);
  }

  /**
   * Set programmable rules for an entity
   */
  async setRules(entityId: string, rules: ProgrammableRule[]): Promise<RuleSetResult> {
    // Validate rules
    for (const rule of rules) {
      this.validateRule(rule);
    }

    // Store rules in database
    await this.prisma.programmableDataRule.deleteMany({
      where: { entityId }
    });

    for (const rule of rules) {
      await this.prisma.programmableDataRule.create({
        data: {
          entityId,
          ruleType: rule.type,
          trigger: rule.trigger,
          conditions: JSON.stringify(rule.conditions),
          actions: JSON.stringify(rule.actions),
          enabled: rule.enabled ?? true,
        }
      });
    }

    // Update in-memory cache
    this.rules.set(entityId, rules);

    // Upload rules to Irys for permanent record
    const rulesIrysId = await this.irysService.uploadData(JSON.stringify({
      entityId,
      rules,
      timestamp: new Date().toISOString(),
    }), [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Entity-Type', value: 'programmable-rules' },
      { name: 'Entity-Id', value: entityId },
    ]);

    return {
      entityId,
      rulesCount: rules.length,
      irysId: rulesIrysId.id,
      success: true,
    };
  }

  /**
   * Get rules for an entity
   */
  async getRules(entityId: string): Promise<ProgrammableRule[]> {
    // Check cache first
    const cached = this.rules.get(entityId);
    if (cached) return cached;

    // Load from database
    const dbRules = await this.prisma.programmableDataRule.findMany({
      where: { entityId }
    });

    const rules: ProgrammableRule[] = dbRules.map(r => ({
      id: r.id,
      type: r.ruleType,
      trigger: r.trigger,
      conditions: JSON.parse(r.conditions as string),
      actions: JSON.parse(r.actions as string),
      enabled: r.enabled,
    }));

    this.rules.set(entityId, rules);
    return rules;
  }

  /**
   * Execute rules for an entity when an event occurs
   */
  async executeRules(
    entityId: string,
    event: string,
    context: RuleContext
  ): Promise<RuleExecutionResult[]> {
    const rules = await this.getRules(entityId);
    const results: RuleExecutionResult[] = [];

    for (const rule of rules) {
      if (!rule.enabled || rule.trigger !== event) continue;

      // Check conditions
      const conditionsMet = this.evaluateConditions(rule.conditions, context);
      if (!conditionsMet) continue;

      // Execute actions
      const actionResults = await this.executeActions(rule.actions, context);

      results.push({
        ruleId: rule.id!,
        success: actionResults.every(a => a.success),
        actions: actionResults,
      });
    }

    return results;
  }

  /**
   * Notarize data on blockchain
   */
  async notarize(
    entityId: string,
    data: any,
    metadata?: NotarizeMetadata
  ): Promise<NotarizeResult> {
    // Calculate content hash
    const contentHash = this.calculateHash(data);

    // Create notarization record
    const notarization = {
      entityId,
      contentHash,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };

    // Upload to Irys for permanent proof
    const irysResult = await this.irysService.uploadData(JSON.stringify({
      ...notarization,
      data: typeof data === 'string' ? data : JSON.stringify(data),
    }), [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Entity-Type', value: 'notarization' },
      { name: 'Entity-Id', value: entityId },
      { name: 'Content-Hash', value: contentHash },
      { name: 'Notarized-At', value: notarization.timestamp },
    ]);

    return {
      entityId,
      irysId: irysResult.id,
      contentHash,
      permanentUrl: `https://gateway.irys.xyz/${irysResult.id}`,
      timestamp: notarization.timestamp,
      verified: true,
    };
  }

  /**
   * Store data permanently with automatic versioning
   */
  async permanent(
    data: any,
    options: PermanentOptions = {}
  ): Promise<PermanentResult> {
    const { entityId, entityType, metadata, enableVersioning } = options;

    const contentHash = this.calculateHash(data);

    // Check if this is an update (same entity, different hash)
    let version = 1;
    let previousIrysId: string | undefined;

    if (enableVersioning && entityId) {
      const existing = await this.prisma.irysTransaction.findFirst({
        where: {
          entityId,
          entityType: entityType || 'permanent',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existing) {
        version = (existing.metadata as any)?.version ? (existing.metadata as any).version + 1 : 2;
        previousIrysId = existing.transactionId;
      }
    }

    // Upload to Irys
    const tags: Array<{ name: string; value: string }> = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Entity-Type', value: entityType || 'permanent' },
      { name: 'Content-Hash', value: contentHash },
      { name: 'Version', value: version.toString() },
      { name: 'Timestamp', value: new Date().toISOString() },
    ];

    if (entityId) {
      tags.push({ name: 'Entity-Id', value: entityId });
    }

    if (previousIrysId) {
      tags.push({ name: 'Previous-Version', value: previousIrysId });
    }

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        tags.push({ name: key, value: String(value) });
      });
    }

    const irysResult = await this.irysService.uploadData(
      typeof data === 'string' ? data : JSON.stringify(data),
      tags
    );

    // Record in database
    if (entityId) {
      await this.prisma.irysTransaction.create({
        data: {
          transactionId: irysResult.id,
          entityId,
          entityType: entityType || 'permanent',
          metadata: {
            version,
            previousIrysId,
            contentHash,
            ...metadata,
          } as any,
        }
      });
    }

    return {
      irysId: irysResult.id,
      contentHash,
      version,
      previousIrysId,
      permanentUrl: `https://gateway.irys.xyz/${irysResult.id}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verify data integrity against Irys record
   */
  async verify(irysId: string, data: any): Promise<VerificationResult> {
    try {
      // Fetch data from Irys
      const irysData = await this.irysService.getData(irysId);

      // Calculate hashes
      const localHash = this.calculateHash(data);
      const irysHash = this.calculateHash(irysData);

      const verified = localHash === irysHash;

      return {
        irysId,
        verified,
        localHash,
        irysHash,
        message: verified ? 'Data integrity verified' : 'Data mismatch detected',
      };
    } catch (error) {
      return {
        irysId,
        verified: false,
        message: `Verification failed: ${error}`,
      };
    }
  }

  /**
   * Built-in trigger implementations
   */
  private async onDocumentCreate(context: RuleContext): Promise<ActionResult> {
    console.log(`📄 Document created: ${context.entityId}`);

    // Automatically notarize new documents
    const notarizeResult = await this.notarize(context.entityId, context.data, {
      event: 'document_created',
    });

    return {
      success: true,
      action: 'notarize',
      result: notarizeResult,
    };
  }

  private async onDocumentUpdate(context: RuleContext): Promise<ActionResult> {
    console.log(`📝 Document updated: ${context.entityId}`);

    // Auto-version on update
    const permanentResult = await this.permanent(context.data, {
      entityId: context.entityId,
      entityType: 'document',
      enableVersioning: true,
    });

    return {
      success: true,
      action: 'auto_version',
      result: permanentResult,
    };
  }

  private async onDocumentPublish(context: RuleContext): Promise<ActionResult> {
    console.log(`🚀 Document published: ${context.entityId}`);
    return { success: true, action: 'publish', result: {} };
  }

  private async onDocumentDelete(context: RuleContext): Promise<ActionResult> {
    console.log(`🗑️ Document deleted: ${context.entityId}`);
    // Create deletion marker
    await this.permanent({
      type: 'deletion',
      entityId: context.entityId,
      deletedAt: new Date().toISOString(),
    }, {
      entityType: 'deletion-marker',
    });

    return { success: true, action: 'delete_marker', result: {} };
  }

  private async autoBackup(context: RuleContext): Promise<ActionResult> {
    const backupResult = await this.permanent(context.data, {
      entityId: context.entityId,
      entityType: 'backup',
      metadata: { backupType: 'automatic' },
    });

    return { success: true, action: 'backup', result: backupResult };
  }

  private async autoVersion(context: RuleContext): Promise<ActionResult> {
    const versionResult = await this.permanent(context.data, {
      entityId: context.entityId,
      entityType: 'version',
      enableVersioning: true,
    });

    return { success: true, action: 'version', result: versionResult };
  }

  private async autoNotarize(context: RuleContext): Promise<ActionResult> {
    const notarizeResult = await this.notarize(context.entityId, context.data);
    return { success: true, action: 'notarize', result: notarizeResult };
  }

  private async trackEvent(context: RuleContext): Promise<ActionResult> {
    console.log(`📊 Tracking event for ${context.entityId}`);
    return { success: true, action: 'track', result: {} };
  }

  private async aggregateMetrics(context: RuleContext): Promise<ActionResult> {
    console.log(`📈 Aggregating metrics for ${context.entityId}`);
    return { success: true, action: 'aggregate', result: {} };
  }

  /**
   * Helper methods
   */
  private async loadRulesFromDatabase(): Promise<void> {
    const allRules = await this.prisma.programmableDataRule.findMany({
      where: { enabled: true }
    });

    const rulesByEntity = new Map<string, ProgrammableRule[]>();

    for (const rule of allRules) {
      const entityRules = rulesByEntity.get(rule.entityId) || [];
      entityRules.push({
        id: rule.id,
        type: rule.ruleType,
        trigger: rule.trigger,
        conditions: JSON.parse(rule.conditions as string),
        actions: JSON.parse(rule.actions as string),
        enabled: rule.enabled,
      });
      rulesByEntity.set(rule.entityId, entityRules);
    }

    this.rules = rulesByEntity;
    console.log(`📋 Loaded ${allRules.length} rules for ${rulesByEntity.size} entities`);
  }

  private validateRule(rule: ProgrammableRule): void {
    if (!rule.type || !rule.trigger) {
      throw new Error('Rule must have type and trigger');
    }

    if (!this.triggers.has(rule.trigger)) {
      throw new Error(`Unknown trigger: ${rule.trigger}`);
    }
  }

  private evaluateConditions(conditions: any, context: RuleContext): boolean {
    // Simple condition evaluation
    // In production, implement more sophisticated condition engine

    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // No conditions = always true
    }

    // Example: { field: 'status', operator: 'equals', value: 'published' }
    // This would check context.data.status === 'published'

    return true; // Placeholder
  }

  private async executeActions(actions: any[], context: RuleContext): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    for (const action of actions) {
      const trigger = this.triggers.get(action.type);
      if (!trigger) {
        results.push({
          success: false,
          action: action.type,
          error: `Unknown action type: ${action.type}`,
        });
        continue;
      }

      try {
        const result = await trigger(context);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          action: action.type,
          error: String(error),
        });
      }
    }

    return results;
  }

  private calculateHash(data: any): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    return createHash('sha256').update(content).digest('hex');
  }
}

// Type definitions
export type TriggerFunction = (context: RuleContext) => Promise<ActionResult>;

export interface ProgrammableRule {
  id?: string;
  type: string;
  trigger: string;
  conditions: any;
  actions: any[];
  enabled?: boolean;
}

export interface RuleContext {
  entityId: string;
  event: string;
  data: any;
  metadata?: Record<string, any>;
}

export interface RuleSetResult {
  entityId: string;
  rulesCount: number;
  irysId: string;
  success: boolean;
}

export interface RuleExecutionResult {
  ruleId: string;
  success: boolean;
  actions: ActionResult[];
}

export interface ActionResult {
  success: boolean;
  action: string;
  result?: any;
  error?: string;
}

export interface NotarizeMetadata {
  event?: string;
  [key: string]: any;
}

export interface NotarizeResult {
  entityId: string;
  irysId: string;
  contentHash: string;
  permanentUrl: string;
  timestamp: string;
  verified: boolean;
}

export interface PermanentOptions {
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  enableVersioning?: boolean;
}

export interface PermanentResult {
  irysId: string;
  contentHash: string;
  version: number;
  previousIrysId?: string;
  permanentUrl: string;
  timestamp: string;
}

export interface VerificationResult {
  irysId: string;
  verified: boolean;
  localHash?: string;
  irysHash?: string;
  message: string;
}