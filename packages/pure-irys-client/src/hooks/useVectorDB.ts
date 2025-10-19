import { useState, useEffect, useCallback } from "react";
import { PureIrysClient } from "../PureIrysClient";
import type {
  SemanticSearchResult,
  QAAnswer,
  DocumentSuggestion,
} from "../SemanticSearch";

/**
 * React Hook for semantic search with vector embeddings
 *
 * @param client - PureIrysClient instance or null
 * @returns Object containing search results, loading state, error state, and search function
 *
 * @remarks
 * This hook manages the state for semantic search operations.
 * It automatically handles loading states and errors.
 *
 * @example
 * ```typescript
 * function SearchComponent() {
 *   const { client } = usePureIrysClient();
 *   const { results, isSearching, error, search, clearResults } = useSemanticSearch(client);
 *
 *   const handleSearch = async () => {
 *     const results = await search('blockchain technology', {
 *       limit: 10,
 *       threshold: 0.7
 *     });
 *     console.log('Found:', results.length);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleSearch} disabled={isSearching}>
 *         Search
 *       </button>
 *       {error && <p>Error: {error.message}</p>}
 *       {results.map(r => <div key={r.docId}>{r.docId}</div>)}
 *     </div>
 *   );
 * }
 * ```
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
 * React Hook for finding documents similar to a given document
 *
 * @param client - PureIrysClient instance or null
 * @returns Object containing similar documents, loading state, error state, and findSimilar function
 *
 * @remarks
 * Useful for building "Related Documents" or "More Like This" features.
 * Uses the document's content to find semantically similar documents.
 *
 * @example
 * ```typescript
 * function RelatedDocs({ currentDocId }: { currentDocId: string }) {
 *   const { client } = usePureIrysClient();
 *   const { similarDocs, isLoading, error, findSimilar } = useSimilarDocuments(client);
 *
 *   useEffect(() => {
 *     if (currentDocId) {
 *       findSimilar(currentDocId, { limit: 5 });
 *     }
 *   }, [currentDocId]);
 *
 *   return (
 *     <div>
 *       <h3>Related Documents</h3>
 *       {isLoading && <p>Loading...</p>}
 *       {similarDocs.map(doc => (
 *         <div key={doc.docId}>
 *           {doc.docId} - {(doc.similarity * 100).toFixed(1)}% match
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
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
 * React Hook for AI-powered question answering using RAG
 *
 * @param client - PureIrysClient instance or null
 * @returns Object containing answer, loading state, error state, and ask function
 *
 * @remarks
 * Implements Retrieval-Augmented Generation (RAG) to answer questions
 * based on stored documents. Requires OpenAI API key for full functionality.
 *
 * @example
 * ```typescript
 * function QAComponent() {
 *   const { client } = usePureIrysClient();
 *   const { answer, isAsking, error, ask, clearAnswer } = useQuestionAnswer(client);
 *   const [question, setQuestion] = useState('');
 *
 *   const handleAsk = async () => {
 *     const result = await ask(question, { maxContext: 5 });
 *     if (result) {
 *       console.log('Answer:', result.answer);
 *       console.log('Sources:', result.sources);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input value={question} onChange={e => setQuestion(e.target.value)} />
 *       <button onClick={handleAsk} disabled={isAsking}>Ask</button>
 *       {answer && (
 *         <div>
 *           <p>{answer.answer}</p>
 *           <p>Confidence: {(answer.confidence * 100).toFixed(0)}%</p>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
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
 * React Hook for getting document suggestions based on content
 *
 * @param client - PureIrysClient instance or null
 * @returns Object containing suggestions, loading state, error state, and getSuggestions function
 *
 * @remarks
 * Perfect for recommendation engines and content discovery features.
 * Suggests documents that are semantically similar to the provided content.
 *
 * @example
 * ```typescript
 * function Recommendations({ currentContent }: { currentContent: string }) {
 *   const { client } = usePureIrysClient();
 *   const { suggestions, isLoading, getSuggestions } = useDocumentSuggestions(client);
 *
 *   useEffect(() => {
 *     if (currentContent) {
 *       getSuggestions(currentContent, { limit: 5 });
 *     }
 *   }, [currentContent]);
 *
 *   return (
 *     <div>
 *       <h3>You might also like</h3>
 *       {suggestions.map(s => (
 *         <div key={s.docId}>
 *           <strong>{s.docId}</strong>
 *           <p>{s.reason}</p>
 *           <p>{s.preview}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
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
 * React Hook for creating and storing document vector embeddings
 *
 * @param client - PureIrysClient instance or null
 * @returns Object containing creation state, error state, and createVector function
 *
 * @remarks
 * Use this hook when you need to vectorize and store new documents.
 * The vector is automatically uploaded to Irys DataChain.
 *
 * @example
 * ```typescript
 * function DocumentUpload() {
 *   const { client } = usePureIrysClient();
 *   const { isCreating, error, createVector } = useCreateVector(client);
 *   const [content, setContent] = useState('');
 *
 *   const handleCreate = async () => {
 *     const success = await createVector(
 *       'doc-' + Date.now(),
 *       content,
 *       { author: 'John Doe', category: 'tech' }
 *     );
 *
 *     if (success) {
 *       alert('Vector created successfully!');
 *       setContent('');
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <textarea value={content} onChange={e => setContent(e.target.value)} />
 *       <button onClick={handleCreate} disabled={isCreating}>
 *         {isCreating ? 'Creating...' : 'Create Vector'}
 *       </button>
 *       {error && <p style={{ color: 'red' }}>{error.message}</p>}
 *     </div>
 *   );
 * }
 * ```
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
 * React Hook for checking Vector DB availability status
 *
 * @param client - PureIrysClient instance or null
 * @returns Object containing availability status and checking state
 *
 * @remarks
 * Use this hook to determine if the Vector DB feature is available
 * before attempting to use vector operations. It automatically updates
 * when the client changes.
 *
 * @example
 * ```typescript
 * function VectorDBFeature() {
 *   const { client } = usePureIrysClient();
 *   const { isAvailable, isChecking } = useVectorDBStatus(client);
 *
 *   if (isChecking) {
 *     return <p>Checking Vector DB status...</p>;
 *   }
 *
 *   if (!isAvailable) {
 *     return <p>Vector DB is not available. Please connect your wallet.</p>;
 *   }
 *
 *   return <div>Vector DB is ready to use!</div>;
 * }
 * ```
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
