import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VectorClient } from '../VectorClient';
import { ethers } from 'ethers';

describe('VectorClient', () => {
  let vectorClient: VectorClient;
  let mockUploader: any;
  let mockSigner: any;

  beforeEach(() => {
    // Create mock uploader
    mockUploader = {
      upload: vi.fn().mockResolvedValue({ id: 'test-irys-id-123' }),
    };

    // Create mock signer
    mockSigner = {
      getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
    };

    vectorClient = new VectorClient(mockUploader, mockSigner as any);
  });

  describe('createEmbedding', () => {
    it('should create mock embedding when OpenAI key is not set', async () => {
      const text = 'Test content';
      const embedding = await vectorClient.createEmbedding(text);

      expect(embedding).toBeInstanceOf(Array);
      expect(embedding.length).toBe(1536);
      expect(embedding.every((val) => typeof val === 'number')).toBe(true);
    });

    it('should create deterministic embeddings for same text', async () => {
      const text = 'Consistent test content';
      const embedding1 = await vectorClient.createEmbedding(text);
      const embedding2 = await vectorClient.createEmbedding(text);

      expect(embedding1).toEqual(embedding2);
    });

    it('should create different embeddings for different text', async () => {
      const embedding1 = await vectorClient.createEmbedding('First text');
      const embedding2 = await vectorClient.createEmbedding('Second text');

      expect(embedding1).not.toEqual(embedding2);
    });
  });

  describe('storeVector', () => {
    it('should store vector with correct data structure', async () => {
      const docId = 'test-doc-123';
      const content = 'Test document content for vector storage';
      const metadata = { author: 'Test Author', category: 'test' };

      const result = await vectorClient.storeVector(docId, content, metadata);

      expect(result).toHaveProperty('docId', docId);
      expect(result).toHaveProperty('irysVectorId', 'test-irys-id-123');
      expect(result).toHaveProperty('clusterId');
      expect(result).toHaveProperty('dimensions', 1536);
      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should call uploader with correct tags', async () => {
      const docId = 'doc-456';
      const content = 'Sample content';

      await vectorClient.storeVector(docId, content);

      expect(mockUploader.upload).toHaveBeenCalled();
      const uploadCall = mockUploader.upload.mock.calls[0];
      const tags = uploadCall[1].tags;

      expect(tags).toEqual(
        expect.arrayContaining([
          { name: 'Content-Type', value: 'application/json' },
          { name: 'App-Name', value: 'DeBHuB' },
          { name: 'Entity-Type', value: 'vector-embedding' },
          { name: 'Document-Id', value: docId },
          { name: 'Embedding-Model', value: 'text-embedding-3-small' },
          { name: 'Dimensions', value: '1536' },
        ])
      );
    });

    it('should include metadata in uploaded vector data', async () => {
      const metadata = { author: 'Alice', tags: ['blockchain', 'AI'] };
      await vectorClient.storeVector('doc-789', 'Content', metadata);

      const uploadCall = mockUploader.upload.mock.calls[0];
      const uploadedData = JSON.parse(uploadCall[0]);

      expect(uploadedData.metadata).toEqual(metadata);
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vector = [1, 2, 3, 4, 5];
      const similarity = vectorClient.cosineSimilarity(vector, vector);

      expect(similarity).toBeCloseTo(1.0, 10);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vector1 = [1, 0, 0];
      const vector2 = [0, 1, 0];
      const similarity = vectorClient.cosineSimilarity(vector1, vector2);

      expect(similarity).toBeCloseTo(0, 10);
    });

    it('should calculate correct similarity for known vectors', () => {
      const vector1 = [1, 2, 3];
      const vector2 = [4, 5, 6];
      const similarity = vectorClient.cosineSimilarity(vector1, vector2);

      // Dot product: 1*4 + 2*5 + 3*6 = 32
      // Magnitude1: sqrt(1 + 4 + 9) = sqrt(14)
      // Magnitude2: sqrt(16 + 25 + 36) = sqrt(77)
      // Similarity: 32 / (sqrt(14) * sqrt(77)) ≈ 0.9746
      expect(similarity).toBeCloseTo(0.9746, 4);
    });

    it('should throw error for vectors with different dimensions', () => {
      const vector1 = [1, 2, 3];
      const vector2 = [1, 2];

      expect(() => {
        vectorClient.cosineSimilarity(vector1, vector2);
      }).toThrow('Vector dimensions must match');
    });

    it('should handle zero vectors', () => {
      const vector1 = [0, 0, 0];
      const vector2 = [1, 2, 3];
      const similarity = vectorClient.cosineSimilarity(vector1, vector2);

      expect(similarity).toBe(0);
    });
  });

  describe('findSimilar', () => {
    beforeEach(() => {
      // Mock global fetch for getVector calls
      global.fetch = vi.fn((url) => {
        const vectorId = url.toString().split('/').pop();
        return Promise.resolve({
          ok: true,
          json: async () => ({
            docId: `doc-${vectorId}`,
            embedding: Array(1536).fill(0).map(() => Math.random()),
            clusterId: 'test-cluster',
            dimensions: 1536,
            model: 'text-embedding-3-small',
            contentPreview: `Content for ${vectorId}`,
            metadata: {},
            timestamp: Date.now(),
          }),
        });
      }) as any;
    });

    it('should return results sorted by similarity', async () => {
      const results = await vectorClient.findSimilar(
        'test query',
        ['vec1', 'vec2', 'vec3'],
        { limit: 10, threshold: 0 }
      );

      expect(results.length).toBeGreaterThan(0);

      // Check that results are sorted in descending order
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].similarity).toBeGreaterThanOrEqual(results[i + 1].similarity);
      }
    });

    it('should respect limit parameter', async () => {
      const results = await vectorClient.findSimilar(
        'test query',
        ['vec1', 'vec2', 'vec3', 'vec4', 'vec5'],
        { limit: 2, threshold: 0 }
      );

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should filter by threshold', async () => {
      const results = await vectorClient.findSimilar(
        'test query',
        ['vec1', 'vec2', 'vec3'],
        { threshold: 0.9 }
      );

      // All results should meet threshold
      results.forEach((result) => {
        expect(result.similarity).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should include embeddings when requested', async () => {
      const results = await vectorClient.findSimilar(
        'test query',
        ['vec1'],
        { includeEmbeddings: true, threshold: 0 }
      );

      expect(results[0]?.embedding).toBeDefined();
      expect(results[0]?.embedding).toBeInstanceOf(Array);
    });

    it('should not include embeddings by default', async () => {
      const results = await vectorClient.findSimilar(
        'test query',
        ['vec1'],
        { threshold: 0 }
      );

      expect(results[0]?.embedding).toBeUndefined();
    });
  });

  describe('batchStoreVectors', () => {
    it('should store multiple vectors in parallel', async () => {
      const documents = [
        { docId: 'doc1', content: 'Content 1' },
        { docId: 'doc2', content: 'Content 2', metadata: { author: 'Bob' } },
        { docId: 'doc3', content: 'Content 3' },
      ];

      const results = await vectorClient.batchStoreVectors(documents);

      expect(results).toHaveLength(3);
      expect(results[0].docId).toBe('doc1');
      expect(results[1].docId).toBe('doc2');
      expect(results[2].docId).toBe('doc3');
      expect(mockUploader.upload).toHaveBeenCalledTimes(3);
    });

    it('should handle empty batch', async () => {
      const results = await vectorClient.batchStoreVectors([]);
      expect(results).toHaveLength(0);
    });
  });
});
