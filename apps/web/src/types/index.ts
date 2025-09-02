export * from '@irysbase/shared';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  provider: any;
  signer: any;
}

export interface AuthState {
  isAuthenticated: boolean;
  authToken: string | null;
  message: string | null;
  signature: string | null;
}