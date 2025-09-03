export interface Post {
  id: string;
  irysTransactionId: string;
  content: string;
  authorAddress: string;
  timestamp: string;
  version: number;
  previousVersionId?: string;
}

export interface PostInput {
  content: string;
}

export interface PostUpdate {
  type: UpdateType;
  post: Post;
}

export enum UpdateType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED'
}

export interface IrysTag {
  name: 'Content-Type' | 'App-Name' | 'table' | 'author-address' | 'timestamp' | 'version' | 'previous-id';
  value: string;
}

export interface IrysTransaction {
  id: string;
  tags: IrysTag[];
  data: string;
  owner: string;
  signature: string;
  timestamp: number;
}

export interface MutableReference {
  type: string;
  previousId?: string;
  content: string;
  version: number;
}

export interface ContractEvent {
  eventName: string;
  address: string;
  blockNumber: number;
  transactionHash: string;
  args: any[];
}

export interface AuthRole {
  address: string;
  role: string;
}

export interface SyncStatus {
  lastSyncedBlock: number;
  isHealthy: boolean;
  lastSyncTime: Date;
}

export interface IrysConfig {
  url: string;
  token: string;
  key?: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface GraphQLContext {
  userAddress?: string;
  signature?: string;
  message?: string;
}

export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
}

export interface IrysBalance {
  balance: string;
  formattedBalance: string;
  symbol: string;
}