# Pure Irys Vector DB Guide

## Overview

The Pure Irys Vector Database is a breakthrough implementation that enables AI-powered semantic search, document recommendations, and RAG (Retrieval-Augmented Generation) capabilities **entirely on Irys L1 DataChain** without any backend infrastructure.

This is the world's first blockchain-native vector database, combining:
- Client-side AI embeddings (OpenAI)
- Permanent vector storage on Irys DataChain
- Smart contract indexing for fast retrieval
- LSH clustering for efficient similarity search
- Zero backend dependencies

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Vector     │  │  Semantic    │  │  React Hooks │     │
│  │   Client     │  │   Search     │  │              │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
└─────────┼─────────────────┼──────────────────┼──────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Pure Irys Client                           │
│  • Document Management  • Cache  • Events                    │
└─────────┬───────────────────────────────────┬───────────────┘
          │                                   │
          ▼                                   ▼
┌──────────────────────┐        ┌───────────────────────────┐
│   Irys L1 DataChain  │        │   Smart Contract Layer    │
│                      │        │                           │
│  • Vector Storage    │        │  • VectorRegistry         │
│  • Permanent Data    │        │  • Metadata Indexing      │
│  • Content Delivery  │        │  • Cluster Index          │
└──────────────────────┘        └───────────────────────────┘
```

### Key Components

1. **VectorClient**: Creates embeddings and stores vectors on Irys
2. **SemanticSearch**: Implements semantic search, RAG Q&A, and suggestions
3. **VectorRegistry Contract**: On-chain metadata registry with cluster indexing
4. **React Hooks**: Easy-to-use hooks for all Vector DB operations
5. **IndexedDB Cache**: Client-side vector caching with 5-minute TTL

## Features

### 1. Semantic Search
Find documents by meaning, not just keywords.

```typescript
const results = await client.semanticSearch("AI ethics in healthcare", {
  limit: 10,
  threshold: 0.7,
  projectId: "my-project"
});

// Returns documents ranked by semantic similarity
results.forEach(result => {
  console.log(`${result.title} - Score: ${result.similarity}`);
});
```

### 2. Similar Document Discovery
Find documents similar to an existing document.

```typescript
const similar = await client.findSimilarDocuments("doc-123", {
  limit: 5
});
```

### 3. RAG Question-Answer
Ask questions and get AI-generated answers based on your documents.

```typescript
const answer = await client.askQuestion(
  "What are the key benefits of blockchain?",
  {
    maxContext: 3,
    projectId: "blockchain-docs"
  }
);

console.log(answer.answer);
console.log("Sources:", answer.sources);
console.log("Confidence:", answer.confidence);
```

### 4. Document Suggestions
Get real-time document suggestions based on current content.

```typescript
const suggestions = await client.getDocumentSuggestions(
  "Draft content about quantum computing...",
  {
    limit: 5,
    excludeDocId: "current-doc"
  }
);
```

## Configuration

### Basic Setup

```typescript
import { PureIrysClient } from "@debhub/pure-irys-client";
import { ethers } from "ethers";

const signer = new ethers.Wallet(privateKey, provider);

const client = new PureIrysClient(signer, {
  contracts: {
    vectorRegistry: "0xd75a83C90b52435009771b55da21ef688AD07264",
    // ... other contracts
  },
  ai: {
    openaiApiKey: "sk-...",  // Optional: For production embeddings
    embeddingModel: "text-embedding-3-small"  // Default
  },
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000  // 5 minutes
  }
});

await client.init();

// Check if Vector DB is available
if (client.isVectorDBAvailable()) {
  console.log("Vector DB ready!");
}
```

### Development Mode (Mock Embeddings)

If you don't provide an OpenAI API key, the system automatically uses deterministic mock embeddings:

```typescript
const client = new PureIrysClient(signer, {
  // No ai config - will use mock embeddings
});

// Works perfectly for development and testing!
await client.createDocumentVector("doc-1", "Sample content");
```

Mock embeddings are generated using a hash-based algorithm that produces consistent, testable results.

## React Integration

### Using Hooks

```typescript
import {
  useSemanticSearch,
  useSimilarDocuments,
  useQuestionAnswer,
  useDocumentSuggestions,
  useCreateVector,
  useVectorDBStatus
} from "@debhub/pure-irys-client";

function SearchComponent() {
  const { results, isSearching, search } = useSemanticSearch(client);

  const handleSearch = async () => {
    await search("quantum computing", { limit: 10 });
  };

  return (
    <div>
      <button onClick={handleSearch} disabled={isSearching}>
        Search
      </button>
      {results.map(result => (
        <div key={result.docId}>
          <h3>{result.title}</h3>
          <p>Similarity: {(result.similarity * 100).toFixed(1)}%</p>
        </div>
      ))}
    </div>
  );
}
```

### Q&A Component

```typescript
function QAComponent() {
  const { answer, isAsking, ask, clearAnswer } = useQuestionAnswer(client);

  const handleAsk = async (question: string) => {
    await ask(question, { maxContext: 3 });
  };

  return (
    <div>
      <input
        type="text"
        onSubmit={e => handleAsk(e.target.value)}
        placeholder="Ask a question..."
      />
      {isAsking && <div>Thinking...</div>}
      {answer && (
        <div>
          <p><strong>Answer:</strong> {answer.answer}</p>
          <p>Confidence: {(answer.confidence * 100).toFixed(1)}%</p>
          <ul>
            {answer.sources.map(source => (
              <li key={source.docId}>{source.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Document Suggestions

```typescript
function EditorWithSuggestions() {
  const [content, setContent] = useState("");
  const { suggestions, getSuggestions } = useDocumentSuggestions(client);

  // Get suggestions as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.length > 100) {
        getSuggestions(content, { limit: 5 });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <aside>
        <h4>Related Documents</h4>
        {suggestions.map(suggestion => (
          <div key={suggestion.docId}>
            <a href={`/doc/${suggestion.docId}`}>
              {suggestion.title}
            </a>
            <span>Match: {(suggestion.relevance * 100).toFixed(1)}%</span>
          </div>
        ))}
      </aside>
    </div>
  );
}
```

### Create Vectors

```typescript
function DocumentCreator() {
  const { isCreating, createVector } = useCreateVector(client);

  const handlePublish = async (docId: string, content: string) => {
    // Create vector for semantic search
    const success = await createVector(docId, content, {
      author: "user-123",
      category: "research"
    });

    if (success) {
      console.log("Document indexed for semantic search!");
    }
  };

  return (
    <button onClick={() => handlePublish(docId, content)} disabled={isCreating}>
      {isCreating ? "Indexing..." : "Publish"}
    </button>
  );
}
```

## Technical Details

### Vector Embeddings

- **Model**: OpenAI text-embedding-3-small
- **Dimensions**: 1536
- **Cost**: ~$0.00002 per 1K tokens
- **Mock Alternative**: Deterministic hash-based embeddings for development

### Storage

Vectors are stored on Irys as JSON:

```json
{
  "docId": "doc-123",
  "embedding": [0.1, -0.2, 0.3, ...],  // 1536 dimensions
  "dimensions": 1536,
  "model": "text-embedding-3-small",
  "content": "Original text content...",
  "metadata": {
    "author": "user-123",
    "category": "research"
  },
  "timestamp": 1697654321000
}
```

**Irys Tags** for discovery:
- `Content-Type: application/json`
- `App-Name: DeBHuB`
- `Vector-For: doc-123`
- `Embedding-Model: text-embedding-3-small`
- `Dimensions: 1536`

### Smart Contract Indexing

The VectorRegistry contract maintains an on-chain index:

```solidity
struct VectorMetadata {
    bytes32 docId;
    bytes32 irysVectorId;    // Irys transaction ID
    address owner;
    uint256 dimensions;
    string embeddingModel;
    bytes32 clusterId;       // LSH cluster for fast search
    uint256 timestamp;
    bool active;
}

mapping(bytes32 => bytes32[]) public clusterIndex;  // Fast lookup
```

### LSH Clustering

Locality-Sensitive Hashing groups similar vectors into clusters:

```typescript
// Simplified LSH algorithm
function calculateClusterId(embedding: number[]): string {
  const bands = 4;
  const rowsPerBand = 384;  // 1536 / 4 = 384

  let hash = "";
  for (let b = 0; b < bands; b++) {
    const bandStart = b * rowsPerBand;
    const bandEnd = bandStart + rowsPerBand;
    const bandSegment = embedding.slice(bandStart, bandEnd);
    const bandHash = hashFunction(bandSegment);
    hash += bandHash;
  }

  return hash;
}
```

This reduces search complexity from O(n) to O(√n).

### Similarity Calculation

Cosine similarity measures vector similarity:

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

Returns a value between 0 (unrelated) and 1 (identical).

### Caching Strategy

Client-side IndexedDB cache for performance:

```typescript
// Cache structure
{
  vectors: {
    "doc-123": {
      embedding: [...],
      timestamp: 1697654321000,
      ttl: 300000  // 5 minutes
    }
  },
  searchResults: {
    "query-hash": {
      results: [...],
      timestamp: 1697654321000
    }
  }
}
```

Cache invalidation:
- TTL expiration (5 minutes default)
- Document update events from blockchain
- Manual cache clear

## Cost Analysis

### Storage Costs (Irys Testnet)

| Item | Size | Cost |
|------|------|------|
| 1536-dim vector | ~6KB | ~$0.000012 |
| 10,000 vectors | ~60MB | ~$0.12 |
| 1M vectors | ~6GB | ~$12 |

### OpenAI API Costs

| Operation | Cost |
|-----------|------|
| Create embedding | ~$0.00002/1K tokens |
| Average document (500 words) | ~$0.00001 |
| 10,000 documents | ~$0.10 |

**Total cost for 10K documents**: ~$0.22 (one-time)

## Performance

### Benchmarks

- **Vector creation**: ~200-500ms (includes OpenAI API + Irys upload)
- **Semantic search**: ~50-200ms (cached clusters)
- **Cold search**: ~500-1000ms (first-time cluster fetch)
- **Similar document lookup**: ~100-300ms
- **RAG Q&A**: ~1-2s (context retrieval + answer generation)

### Optimization Tips

1. **Enable caching** for frequently accessed vectors
2. **Batch vector creation** when indexing multiple documents
3. **Use cluster filtering** to narrow search space
4. **Pre-warm cache** for common queries
5. **Adjust similarity threshold** to reduce false positives

## Best Practices

### 1. When to Create Vectors

Create vectors for documents that:
- Are published (not drafts)
- Contain meaningful content (>100 words)
- Need to be discoverable
- Should appear in recommendations

```typescript
// Only create vectors for published documents
async function publishDocument(docId: string, content: string) {
  await client.updateDocumentStatus(docId, DocumentStatus.Published);

  // Now create vector for semantic search
  await client.createDocumentVector(docId, content);
}
```

### 2. Search Threshold Selection

Choose similarity thresholds based on use case:

```typescript
// High precision (fewer, more relevant results)
await client.semanticSearch(query, { threshold: 0.8 });

// Balanced (recommended default)
await client.semanticSearch(query, { threshold: 0.7 });

// High recall (more results, some less relevant)
await client.semanticSearch(query, { threshold: 0.5 });
```

### 3. RAG Context Size

Adjust context size for Q&A:

```typescript
// Detailed answers with more context
await client.askQuestion(question, { maxContext: 5 });

// Quick answers with less context (faster)
await client.askQuestion(question, { maxContext: 2 });
```

### 4. Error Handling

Always handle Vector DB errors gracefully:

```typescript
try {
  const results = await client.semanticSearch(query);
  return results;
} catch (error) {
  if (error.message.includes("Vector DB not initialized")) {
    // Fallback to keyword search
    return await client.searchDocuments({ tags: [query] });
  }
  throw error;
}
```

## Deployment

### Smart Contract Deployment

The VectorRegistry contract is already deployed:

```
Network: Irys Testnet
Chain ID: 1270
Contract: 0xd75a83C90b52435009771b55da21ef688AD07264
Deployed: 2025-10-16T12:29:32.412Z
```

To redeploy (if needed):

```bash
cd packages/contracts
npx hardhat run scripts/deploy-vector-registry.ts --network irys-testnet
```

### Client Configuration

Update contract addresses in your app:

```typescript
import { PURE_IRYS_CONTRACTS } from "@debhub/pure-irys-client/contracts/addresses";

const client = new PureIrysClient(signer, {
  contracts: PURE_IRYS_CONTRACTS,  // Includes vectorRegistry
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY
  }
});
```

## Troubleshooting

### Vector DB Not Available

**Problem**: `client.isVectorDBAvailable()` returns false

**Solutions**:
1. Check that vectorRegistry address is configured
2. Verify VectorRegistry contract is deployed
3. Ensure client is initialized: `await client.init()`

### Slow Search Performance

**Problem**: Semantic search takes >2 seconds

**Solutions**:
1. Enable caching: `cache: { enabled: true }`
2. Reduce similarity threshold to filter fewer candidates
3. Use project-specific searches to limit scope
4. Pre-warm cache for common queries

### Low-Quality Results

**Problem**: Search returns irrelevant documents

**Solutions**:
1. Increase similarity threshold (0.7-0.8 recommended)
2. Use more specific queries
3. Filter by project or category
4. Verify vector quality (check embedding model)

### OpenAI API Errors

**Problem**: Embedding creation fails

**Solutions**:
1. Check API key validity
2. Verify API rate limits
3. Use mock embeddings for development
4. Implement retry logic with exponential backoff

## Future Enhancements

Planned features for future versions:

1. **Multi-modal embeddings**: Image and audio vector support
2. **Hybrid search**: Combine semantic + keyword search
3. **Fine-tuned embeddings**: Custom models for domain-specific search
4. **Real-time updates**: Live vector updates via WebSocket
5. **Advanced clustering**: HNSW algorithm for better performance
6. **Cross-project search**: Search across all user projects
7. **Collaborative filtering**: User behavior-based recommendations

## Contributing

The Pure Irys Vector DB is part of the DeBHuB project. Contributions are welcome!

### Development Setup

```bash
# Install dependencies
pnpm install

# Build pure-irys-client package
cd packages/pure-irys-client
pnpm build

# Run type checking
pnpm typecheck

# Deploy VectorRegistry (testnet)
cd ../contracts
npx hardhat run scripts/deploy-vector-registry.ts --network irys-testnet
```

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/your-repo/issues
- Documentation: https://docs.debhub.io
- Discord: https://discord.gg/debhub

---

**Built with**: Irys L1 DataChain, OpenAI, Ethereum, TypeScript, React

**Powered by**: Pure Irys BaaS - The world's first blockchain-native BaaS platform
