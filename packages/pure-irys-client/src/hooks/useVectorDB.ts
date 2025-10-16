import { useState, useEffect, useCallback } from "react";
import { PureIrysClient } from "../PureIrysClient";
import type {
  SemanticSearchResult,
  QAAnswer,
  DocumentSuggestion,
} from "../SemanticSearch";

/**
 * React Hook for Semantic Search
 */
export function useSemanticSearch(client: PureIrysClient | null) {
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(
    async (
      query: string,
      options?: { limit?: number; threshold?: number; projectId?: string }
    ) => {
      if (!client) {
        setError(new Error("Client not initialized"));
        return [];
      }

      if (!client.isVectorDBAvailable()) {
        setError(new Error("Vector DB not available"));
        return [];
      }

      setIsSearching(true);
      setError(null);

      try {
        const searchResults = await client.semanticSearch(query, options);
        setResults(searchResults);
        return searchResults;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [client]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isSearching,
    error,
    search,
    clearResults,
  };
}

/**
 * React Hook for finding similar documents
 */
export function useSimilarDocuments(client: PureIrysClient | null) {
  const [similarDocs, setSimilarDocs] = useState<SemanticSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const findSimilar = useCallback(
    async (docId: string, options?: { limit?: number }) => {
      if (!client) {
        setError(new Error("Client not initialized"));
        return [];
      }

      if (!client.isVectorDBAvailable()) {
        setError(new Error("Vector DB not available"));
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        const similar = await client.findSimilarDocuments(docId, options);
        setSimilarDocs(similar);
        return similar;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  return {
    similarDocs,
    isLoading,
    error,
    findSimilar,
  };
}

/**
 * React Hook for AI Question-Answer
 */
export function useQuestionAnswer(client: PureIrysClient | null) {
  const [answer, setAnswer] = useState<QAAnswer | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const ask = useCallback(
    async (
      question: string,
      options?: { maxContext?: number; projectId?: string }
    ) => {
      if (!client) {
        setError(new Error("Client not initialized"));
        return null;
      }

      if (!client.isVectorDBAvailable()) {
        setError(new Error("Vector DB not available"));
        return null;
      }

      setIsAsking(true);
      setError(null);

      try {
        const qaAnswer = await client.askQuestion(question, options);
        setAnswer(qaAnswer);
        return qaAnswer;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setIsAsking(false);
      }
    },
    [client]
  );

  const clearAnswer = useCallback(() => {
    setAnswer(null);
    setError(null);
  }, []);

  return {
    answer,
    isAsking,
    error,
    ask,
    clearAnswer,
  };
}

/**
 * React Hook for document suggestions
 */
export function useDocumentSuggestions(client: PureIrysClient | null) {
  const [suggestions, setSuggestions] = useState<DocumentSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getSuggestions = useCallback(
    async (
      content: string,
      options?: { limit?: number; excludeDocId?: string }
    ) => {
      if (!client) {
        setError(new Error("Client not initialized"));
        return [];
      }

      if (!client.isVectorDBAvailable()) {
        setError(new Error("Vector DB not available"));
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        const docSuggestions = await client.getDocumentSuggestions(
          content,
          options
        );
        setSuggestions(docSuggestions);
        return docSuggestions;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  return {
    suggestions,
    isLoading,
    error,
    getSuggestions,
  };
}

/**
 * React Hook for creating document vectors
 */
export function useCreateVector(client: PureIrysClient | null) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createVector = useCallback(
    async (
      docId: string,
      content: string,
      metadata?: Record<string, any>
    ) => {
      if (!client) {
        setError(new Error("Client not initialized"));
        return false;
      }

      if (!client.isVectorDBAvailable()) {
        setError(new Error("Vector DB not available"));
        return false;
      }

      setIsCreating(true);
      setError(null);

      try {
        await client.createDocumentVector(docId, content, metadata);
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return false;
      } finally {
        setIsCreating(false);
      }
    },
    [client]
  );

  return {
    isCreating,
    error,
    createVector,
  };
}

/**
 * React Hook for Vector DB availability check
 */
export function useVectorDBStatus(client: PureIrysClient | null) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsChecking(true);

    if (client) {
      const available = client.isVectorDBAvailable();
      setIsAvailable(available);
    } else {
      setIsAvailable(false);
    }

    setIsChecking(false);
  }, [client]);

  return {
    isAvailable,
    isChecking,
  };
}
