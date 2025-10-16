/**
 * @debhub/pure-irys-client
 * World's first Pure Irys blockchain-native BaaS client
 *
 * Zero backend. Zero database. Pure blockchain.
 * Now with AI-powered Vector DB & Semantic Search!
 */

export { PureIrysClient } from "./PureIrysClient";
export { IndexedDBCache } from "./cache/IndexedDBCache";
export * from "./types";
export { PURE_IRYS_CONTRACTS, NETWORK } from "./contracts/addresses";

// Vector DB & Semantic Search
export { VectorClient } from "./VectorClient";
export { SemanticSearch } from "./SemanticSearch";
export type {
  VectorData,
  VectorRecord,
  SimilaritySearchOptions,
  SimilarityResult,
} from "./VectorClient";
export type {
  SemanticSearchOptions,
  SemanticSearchResult,
  HybridSearchOptions,
  HybridSearchResult,
  QAOptions,
  QAAnswer,
  SuggestionOptions,
  DocumentSuggestion,
} from "./SemanticSearch";

// React Hooks - Document Management
export {
  usePureIrysClient,
  useCreateDocument,
  useDocument,
  useUpdateDocument,
  useSearchDocuments,
  useDocumentSubscription,
  useCacheStats,
} from "./hooks/usePureIrys";

// React Hooks - Vector DB & AI
export {
  useSemanticSearch,
  useSimilarDocuments,
  useQuestionAnswer,
  useDocumentSuggestions,
  useCreateVector,
  useVectorDBStatus,
} from "./hooks/useVectorDB";
