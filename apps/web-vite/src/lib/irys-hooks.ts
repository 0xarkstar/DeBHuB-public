/**
 * React Hooks for Irys Database
 *
 * Replace Apollo/GraphQL hooks with pure Irys hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { irysDb } from './irys-database';
import type {
  ProjectInput,
  ProjectUpdate,
  DocumentInput,
  DocumentUpdate,
  UserInput,
  CommentInput,
  SearchQuery
} from './irys-types';

// ============================================================================
// Hook State Types
// ============================================================================

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface MutationState<TInput, TOutput> {
  mutate: (input: TInput) => Promise<TOutput>;
  loading: boolean;
  error: Error | null;
  data: TOutput | null;
}

// ============================================================================
// Generic Hooks
// ============================================================================

/**
 * Generic query hook with caching and auto-refetch
 */
export function useIrysQuery<T>(
  queryFn: () => Promise<T>,
  deps: any[] = []
): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    refetch: fetch
  };
}

/**
 * Generic mutation hook
 */
export function useIrysMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>
): MutationState<TInput, TOutput> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TOutput | null>(null);

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput> => {
      try {
        setLoading(true);
        setError(null);
        const result = await mutationFn(input);
        setData(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn]
  );

  return {
    mutate,
    loading,
    error,
    data
  };
}

// ============================================================================
// Project Hooks
// ============================================================================

/**
 * Get user's projects
 */
export function useProjects(ownerAddress: string | null) {
  return useIrysQuery(
    async () => {
      if (!ownerAddress) return [];
      return await irysDb.getUserProjects(ownerAddress);
    },
    [ownerAddress]
  );
}

/**
 * Get single project by slug
 */
export function useProject(slug: string | null) {
  return useIrysQuery(
    async () => {
      if (!slug) return null;
      return await irysDb.getProjectBySlug(slug);
    },
    [slug]
  );
}

/**
 * Get single project by entity ID
 */
export function useProjectById(entityId: string | null) {
  return useIrysQuery(
    async () => {
      if (!entityId) return null;
      return await irysDb.getProjectById(entityId);
    },
    [entityId]
  );
}

/**
 * Create project mutation
 */
export function useCreateProject() {
  return useIrysMutation(async (input: ProjectInput) => {
    return await irysDb.createProject(input);
  });
}

/**
 * Update project mutation
 */
export function useUpdateProject() {
  return useIrysMutation(
    async ({ entityId, updates }: { entityId: string; updates: ProjectUpdate }) => {
      return await irysDb.updateProject(entityId, updates);
    }
  );
}

/**
 * Delete project mutation
 */
export function useDeleteProject() {
  return useIrysMutation(
    async ({ entityId, deletedBy }: { entityId: string; deletedBy: string }) => {
      return await irysDb.deleteProject(entityId, deletedBy);
    }
  );
}

// ============================================================================
// Document Hooks
// ============================================================================

/**
 * Get project documents
 */
export function useDocuments(projectId: string | null) {
  return useIrysQuery(
    async () => {
      if (!projectId) return [];
      return await irysDb.getProjectDocuments(projectId);
    },
    [projectId]
  );
}

/**
 * Get single document
 */
export function useDocument(entityId: string | null) {
  return useIrysQuery(
    async () => {
      if (!entityId) return null;
      return await irysDb.getDocument(entityId);
    },
    [entityId]
  );
}

/**
 * Create document mutation
 */
export function useCreateDocument() {
  return useIrysMutation(async (input: DocumentInput) => {
    return await irysDb.createDocument(input);
  });
}

/**
 * Update document mutation
 */
export function useUpdateDocument() {
  return useIrysMutation(
    async ({ entityId, updates }: { entityId: string; updates: DocumentUpdate }) => {
      return await irysDb.updateDocument(entityId, updates);
    }
  );
}

/**
 * Delete document mutation
 */
export function useDeleteDocument() {
  return useIrysMutation(
    async ({ entityId, deletedBy }: { entityId: string; deletedBy: string }) => {
      return await irysDb.deleteDocument(entityId, deletedBy);
    }
  );
}

// ============================================================================
// User Hooks
// ============================================================================

/**
 * Get user by address
 */
export function useUser(address: string | null) {
  return useIrysQuery(
    async () => {
      if (!address) return null;
      return await irysDb.getUser(address);
    },
    [address]
  );
}

/**
 * Create user mutation
 */
export function useCreateUser() {
  return useIrysMutation(async (input: UserInput) => {
    return await irysDb.createUser(input);
  });
}

/**
 * Update user mutation
 */
export function useUpdateUser() {
  return useIrysMutation(
    async ({ address, updates }: { address: string; updates: Partial<UserInput> }) => {
      return await irysDb.updateUser(address, updates);
    }
  );
}

// ============================================================================
// Comment Hooks
// ============================================================================

/**
 * Get document comments
 */
export function useComments(documentId: string | null) {
  return useIrysQuery(
    async () => {
      if (!documentId) return [];
      return await irysDb.getDocumentComments(documentId);
    },
    [documentId]
  );
}

/**
 * Create comment mutation
 */
export function useCreateComment() {
  return useIrysMutation(async (input: CommentInput) => {
    return await irysDb.createComment(input);
  });
}

/**
 * Resolve comment mutation
 */
export function useResolveComment() {
  return useIrysMutation(
    async ({ entityId, resolvedBy }: { entityId: string; resolvedBy: string }) => {
      return await irysDb.resolveComment(entityId, resolvedBy);
    }
  );
}

// ============================================================================
// Search Hook
// ============================================================================

/**
 * Generic search hook
 */
export function useSearch(query: SearchQuery) {
  return useIrysQuery(
    async () => {
      return await irysDb.search(query);
    },
    [JSON.stringify(query)]
  );
}

// ============================================================================
// Wallet Hook
// ============================================================================

/**
 * Connect wallet and initialize uploader
 */
export function useWallet() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const userAddress = accounts[0];
      setAddress(userAddress);

      // Connect wallet to Irys
      await irysDb.connectWallet(window.ethereum);
      setConnected(true);

      console.log('✅ Wallet connected:', userAddress);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Failed to connect wallet:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setAddress(null);
  }, []);

  return {
    connected,
    address,
    loading,
    error,
    connect,
    disconnect
  };
}

// ============================================================================
// Initialize Hook
// ============================================================================

/**
 * Initialize IrysDatabase (call once in App.tsx)
 */
export function useIrysInit() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await irysDb.init();
        setInitialized(true);
        console.log('✅ IrysDatabase initialized');
      } catch (err) {
        setError(err as Error);
        console.error('Failed to initialize IrysDatabase:', err);
      }
    }

    init();
  }, []);

  return { initialized, error };
}
