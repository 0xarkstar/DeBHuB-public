# DeBHuB Services Guide

Complete documentation for all DeBHuB platform services.

## Table of Contents

- [Search Service](#search-service)
- [Analytics Service](#analytics-service)
- [Realtime Service](#realtime-service)
- [Storage Service](#storage-service)
- [Function Service](#function-service)
- [Edge Service](#edge-service)
- [Programmable Data Service](#programmable-data-service)
- [Database Service](#database-service)

---

## Search Service

The Search Service provides full-text and semantic search capabilities across documents.

### Features

- **Full-Text Search** - Search across document titles and content
- **Advanced Filtering** - Filter by project, author, tags, and date ranges
- **Autocomplete** - Real-time search suggestions
- **Relevance Scoring** - Intelligent result ranking
- **Highlighting** - Context-aware search result snippets

### API

#### `search(query: string, options?: SearchOptions): Promise<SearchResult[]>`

Performs full-text search across documents.

```typescript
const results = await searchService.search('graphql', {
  projectId: 'project-123',
  limit: 20,
  offset: 0,
  includeContent: true
});
```

**Options:**
- `projectId?: string` - Filter by project
- `limit?: number` - Maximum results (default: 10)
- `offset?: number` - Pagination offset (default: 0)
- `includeContent?: boolean` - Include full content (default: true)

**Returns:** Array of search results with:
- `documentId: string` - Document identifier
- `title: string` - Document title
- `content: string` - Document content (truncated)
- `similarity: number` - Relevance score (0-1)
- `highlights: string[]` - Context snippets with query terms
- `metadata: object` - Additional metadata

#### `advancedSearch(params: AdvancedSearchParams): Promise<SearchResult[]>`

Advanced search with multiple filters.

```typescript
const results = await searchService.advancedSearch({
  query: 'authentication',
  projectId: 'project-123',
  authorId: 'user-456',
  tags: ['security', 'api'],
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  limit: 10
});
```

#### `getSuggestions(partialQuery: string, projectId?: string, limit?: number): Promise<string[]>`

Get autocomplete suggestions.

```typescript
const suggestions = await searchService.getSuggestions('auth', 'project-123', 5);
// Returns: ['Authentication', 'Authorization', 'Auth Tokens', ...]
```

#### `searchByTags(tags: string[], projectId?: string, limit?: number): Promise<SearchResult[]>`

Search documents by tags.

```typescript
const results = await searchService.searchByTags(['api', 'security'], 'project-123');
```

### Implementation Details

- Uses PostgreSQL LIKE queries with case-insensitive matching
- Implements relevance scoring (title matches weighted higher)
- Extracts contextual highlights around query terms
- Supports pagination for large result sets

---

## Analytics Service

The Analytics Service provides metrics, insights, and activity tracking.

### Features

- **Project Metrics** - Comprehensive project statistics
- **User Analytics** - User activity and contribution metrics
- **Document Metrics** - Individual document statistics
- **Activity Tracking** - Recent activity feeds
- **Platform Statistics** - System-wide metrics

### API

#### `getProjectMetrics(projectId: string): Promise<ProjectMetrics>`

Get comprehensive project metrics.

```typescript
const metrics = await analyticsService.getProjectMetrics('project-123');
console.log(metrics.totalDocuments);
console.log(metrics.recentActivity);
```

**Returns:**
- `totalDocuments: number` - Total document count
- `publishedDocuments: number` - Published document count
- `draftDocuments: number` - Draft document count
- `totalVersions: number` - Total version count
- `totalComments: number` - Total comment count
- `totalCollaborators: number` - Collaborator count
- `recentActivity: ActivityItem[]` - Recent activity feed

#### `getUserMetrics(userId: string): Promise<UserMetrics>`

Get user activity metrics.

```typescript
const metrics = await analyticsService.getUserMetrics('user-456');
console.log(metrics.totalDocuments);
console.log(metrics.collaboratingProjects);
```

**Returns:**
- `totalDocuments: number` - Documents created by user
- `totalComments: number` - Comments made by user
- `totalProjects: number` - Projects owned by user
- `collaboratingProjects: number` - Projects user collaborates on
- `joinedDate: Date` - User registration date

#### `getDocumentMetrics(documentId: string): Promise<DocumentMetrics>`

Get document-specific metrics.

```typescript
const metrics = await analyticsService.getDocumentMetrics('doc-789');
console.log(metrics.wordCount);
console.log(metrics.totalVersions);
```

**Returns:**
- `totalVersions: number` - Document version count
- `totalComments: number` - Comment count
- `resolvedComments: number` - Resolved comment count
- `unresolvedComments: number` - Unresolved comment count
- `wordCount: number` - Document word count

#### `getPlatformStats(): Promise<PlatformStats>`

Get platform-wide statistics.

```typescript
const stats = await analyticsService.getPlatformStats();
console.log(stats.totalUsers);
console.log(stats.totalDocuments);
```

#### `trackEvent(event: string, properties: object): Promise<void>`

Track custom analytics events.

```typescript
await analyticsService.trackEvent('document_exported', {
  userId: 'user-123',
  documentId: 'doc-456',
  format: 'pdf'
});
```

---

## Realtime Service

The Realtime Service enables WebSocket-based real-time collaboration.

### Features

- **Live Collaboration** - Real-time document editing
- **Cursor Sharing** - See other users' cursors
- **Selection Tracking** - View other users' selections
- **Presence Tracking** - Active user monitoring
- **Conflict Resolution** - CRDT-like conflict handling
- **GraphQL Subscriptions** - Real-time data updates

### API

#### `joinSession(sessionId: string, user: SessionUser, websocket: WebSocket): Promise<void>`

Join a collaboration session.

```typescript
await realtimeService.joinSession('doc:123', {
  id: 'user-456',
  name: 'John Doe',
  avatar: 'https://avatar.url'
}, websocket);
```

#### `shareCursor(sessionId: string, userId: string, position: CursorPosition): Promise<void>`

Share cursor position with other users.

```typescript
await realtimeService.shareCursor('doc:123', 'user-456', {
  line: 10,
  column: 25
});
```

#### `shareSelection(sessionId: string, userId: string, selection: Selection): Promise<void>`

Share text selection.

```typescript
await realtimeService.shareSelection('doc:123', 'user-456', {
  start: { line: 10, column: 0 },
  end: { line: 12, column: 45 }
});
```

#### `streamChange(sessionId: string, userId: string, change: DocumentChange): Promise<void>`

Stream document changes to all participants.

```typescript
await realtimeService.streamChange('doc:123', 'user-456', {
  operation: 'insert',
  position: 150,
  text: 'Hello World'
});
```

#### `getActiveUsers(documentId: string): Promise<ActiveUser[]>`

Get currently active users on a document.

```typescript
const activeUsers = await realtimeService.getActiveUsers('doc-123');
activeUsers.forEach(user => {
  console.log(user.name, user.cursor);
});
```

### WebSocket Messages

**Client → Server:**

```json
{
  "type": "cursor",
  "position": { "line": 10, "column": 25 }
}
```

```json
{
  "type": "change",
  "change": {
    "operation": "insert",
    "position": 150,
    "text": "Hello"
  }
}
```

**Server → Client:**

```json
{
  "type": "cursor",
  "userId": "user-456",
  "position": { "line": 10, "column": 25 }
}
```

```json
{
  "type": "document_change",
  "change": {
    "id": "change_123",
    "operation": "insert",
    "position": 150,
    "text": "Hello",
    "userId": "user-456",
    "timestamp": 1234567890
  }
}
```

---

## Storage Service

The Storage Service manages file uploads and storage on Irys.

### Features

- **Multiple Buckets** - Organized storage (images, attachments, exports, themes, backups)
- **File Validation** - Size and type validation
- **Image Optimization** - Automatic image processing
- **Encryption** - File encryption for sensitive data
- **CDN Integration** - Fast content delivery

### Storage Buckets

1. **images** - Public images (10MB max, CDN enabled)
2. **attachments** - Private files (100MB max, encrypted)
3. **exports** - Document exports (50MB max, 24h TTL)
4. **themes** - Custom themes (1MB max)
5. **backups** - Encrypted backups (versioning enabled)

### API

#### `uploadFile(bucket: BucketName, file: UploadFile, options?: UploadOptions): Promise<UploadResult>`

Upload file to specific bucket.

```typescript
const result = await storageService.uploadFile('images', {
  name: 'screenshot.png',
  data: buffer,
  type: 'image/png',
  size: 1024000
}, {
  metadata: { documentId: 'doc-123' }
});

console.log(result.url);
console.log(result.permanentUrl);
```

#### `uploadDocumentImage(projectId: string, documentId: string, file: UploadFile, options?: ImageUploadOptions): Promise<UploadResult>`

Upload and optimize document image.

```typescript
const result = await storageService.uploadDocumentImage(
  'project-123',
  'doc-456',
  imageFile,
  { quality: 80, sizes: [800, 1200, 1600] }
);
```

#### `uploadAttachment(projectId: string, documentId: string, file: UploadFile, options?: AttachmentUploadOptions): Promise<UploadResult>`

Upload encrypted attachment.

```typescript
const result = await storageService.uploadAttachment(
  'project-123',
  'doc-456',
  file,
  { encrypt: true, encryptionKey: 'secret-key' }
);
```

#### `createBackup(projectId: string, backupData: ProjectBackupData, options?: BackupOptions): Promise<UploadResult>`

Create encrypted project backup.

```typescript
const result = await storageService.createBackup(
  'project-123',
  {
    version: '1.0',
    projectId: 'project-123',
    documents: [...],
    settings: {...},
    collaborators: [...],
    createdAt: new Date().toISOString()
  },
  { type: 'full', encryptionKey: 'backup-key' }
);
```

---

## Function Service

The Function Service provides serverless function execution capabilities.

### Built-in Functions

#### Document Enhancement
- `enhance-document` - Multi-task document enhancement
- `generate-outline` - Extract document structure
- `check-grammar` - Grammar and spelling checks
- `optimize-seo` - SEO optimization analysis

#### Content Generation
- `summarize` - AI-powered summarization
- `translate` - Multi-language translation
- `create-embedding` - Generate vector embeddings
- `find-related` - Find related documents

#### Document Processing
- `generate-pdf` - PDF generation
- `create-epub` - EPUB ebook creation
- `extract-toc` - Table of contents extraction
- `validate-links` - Link validation

#### Analytics
- `analyze-readability` - Flesch readability score
- `calculate-metrics` - Project metrics calculation
- `generate-insights` - AI-generated insights

### API

#### `invoke(functionName: string, payload: any): Promise<FunctionResult>`

Execute a serverless function.

```typescript
const result = await functionService.invoke('analyze-readability', {
  content: 'Document content here...'
});

console.log(result.data.fleschScore);
console.log(result.data.level);
console.log(result.executionTime);
```

#### `registerFunction(name: string, handler: FunctionHandler): void`

Register custom function.

```typescript
functionService.registerFunction('custom-function', async (payload) => {
  // Custom logic here
  return { result: 'success' };
});
```

### Function Examples

**Generate Outline:**

```typescript
const result = await functionService.invoke('generate-outline', {
  content: markdownContent
});

console.log(result.data.items); // Hierarchical outline
console.log(result.data.totalItems);
console.log(result.data.maxDepth);
```

**Analyze Readability:**

```typescript
const result = await functionService.invoke('analyze-readability', {
  content: documentContent
});

console.log(result.data.fleschScore); // 0-100
console.log(result.data.level); // 'beginner', 'intermediate', 'advanced'
console.log(result.data.readingTime); // minutes
```

**Optimize SEO:**

```typescript
const result = await functionService.invoke('optimize-seo', {
  content: documentContent,
  keywords: ['graphql', 'api', 'documentation']
});

console.log(result.data.score);
console.log(result.data.keywordAnalysis);
console.log(result.data.recommendations);
```

---

## Edge Service

The Edge Service enables global edge function deployment and execution.

### Features

- **Multi-Region Deployment** - Deploy to US, EU, Asia Pacific
- **Automatic Routing** - Select optimal region based on user location
- **Function Caching** - Redis-based function code caching
- **CDN Capabilities** - Content delivery network features
- **Execution Metrics** - Performance monitoring

### Available Regions

- `us-east-1` - US East (Virginia)
- `us-west-1` - US West (California)
- `eu-west-1` - EU West (Ireland)
- `ap-southeast-1` - Asia Pacific (Singapore)

### API

#### `deploy(options: DeployOptions): Promise<DeploymentResult>`

Deploy edge function to regions.

```typescript
const result = await edgeService.deploy({
  functionName: 'process-data',
  code: `
    return {
      processed: true,
      data: payload.data.toUpperCase()
    };
  `,
  config: { timeout: 10000 },
  regions: ['us-east-1', 'eu-west-1']
});

console.log(result.irysId);
console.log(result.endpoints);
```

#### `execute(functionName: string, payload: any, options?: ExecuteOptions): Promise<ExecutionResult>`

Execute edge function.

```typescript
const result = await edgeService.execute('process-data', {
  data: 'hello world'
}, {
  region: 'us-east-1',
  timeout: 5000
});

console.log(result.data);
console.log(result.executionTime);
console.log(result.region);
```

#### `serveCachedContent(contentId: string, options?: CDNOptions): Promise<CDNResponse>`

Serve cached content from edge.

```typescript
const response = await edgeService.serveCachedContent('irys-tx-id', {
  region: 'us-east-1',
  contentType: 'text/html',
  cacheTTL: 3600
});

console.log(response.content);
console.log(response.cacheHit);
```

#### `getDeploymentStatus(functionName: string): Promise<DeploymentStatus>`

Check deployment status.

```typescript
const status = await edgeService.getDeploymentStatus('process-data');
console.log(status.activeRegions);
console.log(status.totalRegions);
```

---

## Programmable Data Service

The Programmable Data Service provides automated workflows and data transformations.

### Features

- **Custom Rules** - Define business logic rules
- **Automated Triggers** - Event-driven workflows
- **Data Notarization** - Blockchain-based verification
- **Automatic Versioning** - Version control with Irys
- **Integrity Verification** - Hash-based data validation

### Built-in Triggers

- `on_document_create` - Triggered on document creation
- `on_document_update` - Triggered on document update
- `on_document_publish` - Triggered on document publication
- `on_document_delete` - Triggered on document deletion
- `auto_backup` - Automatic backup creation
- `auto_version` - Automatic version creation
- `auto_notarize` - Automatic notarization
- `track_event` - Event tracking
- `aggregate_metrics` - Metrics aggregation

### API

#### `setRules(entityId: string, rules: ProgrammableRule[]): Promise<RuleSetResult>`

Set programmable rules for entity.

```typescript
const result = await programmableDataService.setRules('doc-123', [
  {
    type: 'backup',
    trigger: 'on_document_update',
    conditions: { version: { gt: 5 } },
    actions: [{ type: 'auto_backup' }],
    enabled: true
  },
  {
    type: 'notarization',
    trigger: 'on_document_publish',
    conditions: {},
    actions: [{ type: 'auto_notarize' }],
    enabled: true
  }
]);
```

#### `executeRules(entityId: string, event: string, context: RuleContext): Promise<RuleExecutionResult[]>`

Execute rules for an event.

```typescript
const results = await programmableDataService.executeRules(
  'doc-123',
  'on_document_update',
  {
    entityId: 'doc-123',
    event: 'on_document_update',
    data: { content: '...' }
  }
);
```

#### `notarize(entityId: string, data: any, metadata?: NotarizeMetadata): Promise<NotarizeResult>`

Notarize data on blockchain.

```typescript
const result = await programmableDataService.notarize('doc-123', {
  title: 'Document Title',
  content: 'Document content...'
}, {
  event: 'document_published'
});

console.log(result.irysId);
console.log(result.contentHash);
console.log(result.permanentUrl);
```

#### `permanent(data: any, options?: PermanentOptions): Promise<PermanentResult>`

Store data permanently with versioning.

```typescript
const result = await programmableDataService.permanent({
  title: 'Document',
  content: '...'
}, {
  entityId: 'doc-123',
  entityType: 'document',
  enableVersioning: true
});

console.log(result.version);
console.log(result.previousIrysId);
```

#### `verify(irysId: string, data: any): Promise<VerificationResult>`

Verify data integrity.

```typescript
const result = await programmableDataService.verify('irys-tx-id', localData);
console.log(result.verified);
console.log(result.localHash);
console.log(result.irysHash);
```

---

## Database Service

The Database Service provides advanced PostgreSQL operations.

### Features

- **Batch Operations** - Efficient bulk inserts/updates
- **Transaction Management** - ACID transaction support
- **Connection Pooling** - Optimized connection management
- **Query Optimization** - Efficient query execution
- **Migration Support** - Database schema migrations

### API

#### Connection Management

```typescript
await databaseService.connect();
await databaseService.disconnect();
```

#### Health Checks

```typescript
const isHealthy = await databaseService.healthCheck();
```

#### Transactions

```typescript
await databaseService.transaction(async (tx) => {
  await tx.project.create({...});
  await tx.document.create({...});
});
```

---

## Best Practices

### Performance Optimization

1. **Use Caching** - Leverage Redis for frequently accessed data
2. **Batch Operations** - Group related operations
3. **Optimize Queries** - Use proper indexes and query patterns
4. **Monitor Metrics** - Track service performance

### Security

1. **Validate Input** - Always validate user input
2. **Use Encryption** - Encrypt sensitive data
3. **Implement Auth** - Proper authentication/authorization
4. **Rate Limiting** - Prevent abuse

### Error Handling

1. **Graceful Degradation** - Handle service failures
2. **Proper Logging** - Log errors with context
3. **Retry Logic** - Implement exponential backoff
4. **User Feedback** - Provide meaningful error messages

---

For more information, see:
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [Getting Started Guide](./GETTING_STARTED.md)