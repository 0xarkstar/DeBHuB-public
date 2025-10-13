import { useState, useEffect, useCallback } from "react";
import { PureIrysClient } from "../PureIrysClient";
import {
  Document,
  CreateDocumentOptions,
  UpdateDocumentOptions,
  SearchOptions,
} from "../types";
import { Signer } from "ethers";

let clientInstance: PureIrysClient | null = null;

/**
 * Hook to access Pure Irys Client instance
 */
export function usePureIrysClient(signer?: Signer) {
  const [client, setClient] = useState<PureIrysClient | null>(clientInstance);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!signer || clientInstance) return;

    const initClient = async () => {
      try {
        setIsInitializing(true);
        const newClient = new PureIrysClient(signer);
        await newClient.init();
        clientInstance = newClient;
        setClient(newClient);
      } catch (err) {
        setError(err as Error);
        console.error("Failed to initialize Pure Irys Client:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initClient();
  }, [signer]);

  return { client, isInitializing, error };
}

/**
 * Hook to create a document
 */
export function useCreateDocument(client: PureIrysClient | null) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createDocument = useCallback(
    async (options: CreateDocumentOptions): Promise<string | null> => {
      if (!client) {
        setError(new Error("Client not initialized"));
        return null;
      }

      try {
        setIsCreating(true);
        setError(null);
        const docId = await client.createDocument(options);
        return docId;
      } catch (err) {
        setError(err as Error);
        console.error("Failed to create document:", err);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [client]
  );

  return { createDocument, isCreating, error };
}

/**
 * Hook to get a document
 */
export function useDocument(client: PureIrysClient | null, docId: string | null) {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocument = useCallback(async () => {
    if (!client || !docId) return;

    try {
      setIsLoading(true);
      setError(null);
      const doc = await client.getDocument(docId);
      setDocument(doc);
    } catch (err) {
      setError(err as Error);
      console.error("Failed to fetch document:", err);
    } finally {
      setIsLoading(false);
    }
  }, [client, docId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const refetch = useCallback(() => {
    fetchDocument();
  }, [fetchDocument]);

  return { document, isLoading, error, refetch };
}

/**
 * Hook to update a document
 */
export function useUpdateDocument(client: PureIrysClient | null) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateDocument = useCallback(
    async (
      docId: string,
      options: UpdateDocumentOptions
    ): Promise<boolean> => {
      if (!client) {
        setError(new Error("Client not initialized"));
        return false;
      }

      try {
        setIsUpdating(true);
        setError(null);
        await client.updateDocument(docId, options);
        return true;
      } catch (err) {
        setError(err as Error);
        console.error("Failed to update document:", err);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [client]
  );

  return { updateDocument, isUpdating, error };
}

/**
 * Hook to search documents
 */
export function useSearchDocuments(
  client: PureIrysClient | null,
  options: SearchOptions
) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async () => {
    if (!client) return;

    try {
      setIsSearching(true);
      setError(null);
      const results = await client.searchDocuments(options);
      setDocuments(results);
    } catch (err) {
      setError(err as Error);
      console.error("Failed to search documents:", err);
    } finally {
      setIsSearching(false);
    }
  }, [client, options]);

  useEffect(() => {
    search();
  }, [search]);

  const refetch = useCallback(() => {
    search();
  }, [search]);

  return { documents, isSearching, error, refetch };
}

/**
 * Hook to subscribe to document updates
 */
export function useDocumentSubscription(
  client: PureIrysClient | null,
  docId: string | null,
  onUpdate?: (docId: string, newVersion: string) => void
) {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !docId) return;

    const unsubscribe = client.onDocumentUpdate(docId, (id, version) => {
      setLatestVersion(version);
      onUpdate?.(id, version);
    });

    return () => {
      unsubscribe();
    };
  }, [client, docId, onUpdate]);

  return { latestVersion };
}

/**
 * Hook to get cache statistics
 */
export function useCacheStats(client: PureIrysClient | null) {
  const [stats, setStats] = useState<{
    documents: number;
    queries: number;
    totalSize: number;
  } | null>(null);

  const fetchStats = useCallback(async () => {
    if (!client) return;
    const cacheStats = await client.getCacheStats();
    setStats(cacheStats);
  }, [client]);

  useEffect(() => {
    fetchStats();
    // Refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const clearCache = useCallback(async () => {
    if (!client) return;
    await client.clearCache();
    await fetchStats();
  }, [client, fetchStats]);

  return { stats, clearCache, refetch: fetchStats };
}
