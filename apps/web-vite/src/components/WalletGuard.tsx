import { ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { ConnectWallet } from './ConnectWallet';

interface WalletGuardProps {
  children: ReactNode;
}

export function WalletGuard({ children }: WalletGuardProps) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to access this page
          </p>
          <ConnectWallet />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
