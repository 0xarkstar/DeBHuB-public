/**
 * @debhub/pure-irys-client
 * World's first Pure Irys blockchain-native BaaS client
 *
 * Zero backend. Zero database. Pure blockchain.
 */

export { PureIrysClient } from "./PureIrysClient";
export { IndexedDBCache } from "./cache/IndexedDBCache";
export * from "./types";
export { PURE_IRYS_CONTRACTS, NETWORK } from "./contracts/addresses";

// React Hooks
export {
  usePureIrysClient,
  useCreateDocument,
  useDocument,
  useUpdateDocument,
  useSearchDocuments,
  useDocumentSubscription,
  useCacheStats,
} from "./hooks/usePureIrys";
