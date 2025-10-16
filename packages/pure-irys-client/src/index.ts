/**
 * @debhub/pure-irys-client
 * World's first Pure Irys blockchain-native BaaS client
 *
 * Zero backend. Zero database. Pure blockchain.
 * Now with AI-powered Vector DB & Semantic Search!
 */

export { PureIrysClient } from "./PureIrysClient.js";
export { IndexedDBCache } from "./cache/IndexedDBCache.js";
export * from "./types.js";
export { PURE_IRYS_CONTRACTS, NETWORK } from "./contracts/addresses.js";

// Vector DB & Semantic Search
export { VectorClient } from "./VectorClient.js";
export { SemanticSearch } from "./SemanticSearch.js";
export type {
  VectorData,
  VectorRecord,
  SimilaritySearchOptions,
  SimilarityResult,
} from "./VectorClient.js";
export type {
  SemanticSearchOptions,
  SemanticSearchResult,
  HybridSearchOptions,
  HybridSearchResult,
  QAOptions,
  QAAnswer,
  SuggestionOptions,
  DocumentSuggestion,
} from "./SemanticSearch.js";

// React Hooks - Document Management
export {
  usePureIrysClient,
  useCreateDocument,
  useDocument,
  useUpdateDocument,
  useSearchDocuments,
  useDocumentSubscription,
  useCacheStats,
} from "./hooks/usePureIrys.js";

// React Hooks - Vector DB & AI
export {
  useSemanticSearch,
  useSimilarDocuments,
  useQuestionAnswer,
  useDocumentSuggestions,
  useCreateVector,
  useVectorDBStatus,
} from "./hooks/useVectorDB.js";
