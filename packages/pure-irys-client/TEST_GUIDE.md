# Vector DB Testing Guide

This document describes the testing setup and available tests for the Pure Irys Vector DB.

## Test Framework

We use [Vitest](https://vitest.dev/) as our testing framework because:
- Fast and modern
- ESM-first design
- Compatible with Vite configuration
- Great TypeScript support
- Built-in code coverage

## Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (re-run on file changes)
pnpm test:watch

# Run tests with UI interface
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

## Test Coverage

### VectorClient (`src/__tests__/VectorClient.test.ts`)

#### Embedding Tests
- ✅ Creates mock embeddings when OpenAI key is not set
- ✅ Creates deterministic embeddings for same text
- ✅ Creates different embeddings for different text

#### Vector Storage Tests
- ✅ Stores vectors with correct data structure
- ✅ Calls uploader with correct Irys tags
- ✅ Includes metadata in uploaded vector data

#### Similarity Calculation Tests
- ✅ Returns 1 for identical vectors (perfect match)
- ✅ Returns 0 for orthogonal vectors (no similarity)
- ✅ Calculates correct similarity for known vectors
- ✅ Throws error for mismatched dimensions
- ✅ Handles zero vectors gracefully

#### Similarity Search Tests
- ✅ Returns results sorted by similarity (descending)
- ✅ Respects limit parameter
- ✅ Filters results by threshold
- ✅ Includes embeddings when requested
- ✅ Excludes embeddings by default

#### Batch Operations Tests
- ✅ Stores multiple vectors in parallel
- ✅ Handles empty batch gracefully

**Total: 18 tests passing**

## Test Structure

```
packages/pure-irys-client/
├── src/
│   ├── __tests__/
│   │   └── VectorClient.test.ts    # VectorClient unit tests
│   ├── VectorClient.ts              # Implementation
│   └── SemanticSearch.ts            # Semantic search engine
├── vitest.config.ts                 # Vitest configuration
└── package.json                     # Test scripts
```

## Writing New Tests

### Example Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VectorClient } from '../VectorClient';

describe('VectorClient', () => {
  let vectorClient: VectorClient;

  beforeEach(() => {
    // Setup mocks
    const mockUploader = {
      upload: vi.fn().mockResolvedValue({ id: 'test-id' }),
    };
    const mockSigner = {
      getAddress: vi.fn().mockResolvedValue('0x123...'),
    };

    vectorClient = new VectorClient(mockUploader, mockSigner as any);
  });

  it('should do something', async () => {
    // Arrange
    const input = 'test data';

    // Act
    const result = await vectorClient.someMethod(input);

    // Assert
    expect(result).toBeDefined();
  });
});
```

## Mocking Strategy

### Irys Uploader Mock
```typescript
const mockUploader = {
  upload: vi.fn().mockResolvedValue({ id: 'test-irys-id-123' }),
};
```

### Ethereum Signer Mock
```typescript
const mockSigner = {
  getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
};
```

### Fetch API Mock (for getVector)
```typescript
global.fetch = vi.fn((url) => {
  return Promise.resolve({
    ok: true,
    json: async () => ({
      docId: 'test-doc',
      embedding: Array(1536).fill(0).map(() => Math.random()),
      // ... other vector data
    }),
  });
}) as any;
```

## Future Test Additions

### Recommended Tests to Add

1. **SemanticSearch Tests**
   - Semantic search with various options
   - Hybrid search combining semantic + keyword
   - Question-answering (RAG)
   - Document suggestions
   - Cache behavior

2. **React Hooks Tests**
   - useSemanticSearch hook
   - useSimilarDocuments hook
   - useQuestionAnswer hook
   - useDocumentSuggestions hook
   - useCreateVector hook
   - useVectorDBStatus hook

3. **Integration Tests**
   - End-to-end vector storage and retrieval
   - Cross-component interactions
   - Error handling and recovery

4. **Performance Tests**
   - Large batch operations
   - Concurrent operations
   - Memory usage

## Coverage Goals

Current coverage target: **80%** for core functionality

Run `pnpm test:coverage` to see detailed coverage reports.

## CI/CD Integration

Tests should be run automatically on:
- Every commit (pre-commit hook)
- Pull request creation
- Before deployment

Example GitHub Actions workflow:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
```

## Troubleshooting

### Tests Failing Locally

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

2. Clear Vitest cache:
   ```bash
   pnpm vitest --clearCache
   ```

3. Check TypeScript compilation:
   ```bash
   pnpm typecheck
   ```

### Mock Issues

If mocks aren't working properly:
- Ensure `vi.fn()` is used for functions
- Check that mocks are reset in `beforeEach()`
- Verify async/await is used correctly

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)
