import React, { createContext, useContext, useEffect, useState } from 'react';
import { PureIrysClient } from '@debhub/pure-irys-client';
import { useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';

interface PureIrysContextType {
  client: PureIrysClient | null;
  isInitializing: boolean;
  error: Error | null;
}

const PureIrysContext = createContext<PureIrysContextType>({
  client: null,
  isInitializing: false,
  error: null,
});

export const usePureIrys = () => {
  const context = useContext(PureIrysContext);
  if (!context) {
    throw new Error('usePureIrys must be used within PureIrysProvider');
  }
  return context;
};

interface PureIrysProviderProps {
  children: React.ReactNode;
}

export const PureIrysProvider: React.FC<PureIrysProviderProps> = ({ children }) => {
  const { data: walletClient } = useWalletClient();
  const [client, setClient] = useState<PureIrysClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!walletClient) {
      setClient(null);
      return;
    }

    const initClient = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Convert wagmi WalletClient to ethers Signer
        const { account, chain, transport } = walletClient;
        const network = {
          chainId: chain.id,
          name: chain.name,
        };

        const provider = new BrowserProvider(transport as any, network);
        const signer = await provider.getSigner(account.address);

        // Initialize Pure Irys Client
        const pureIrysClient = new PureIrysClient(signer);
        await pureIrysClient.init();

        setClient(pureIrysClient);
        console.log('✅ Pure Irys Client initialized');
      } catch (err) {
        console.error('Failed to initialize Pure Irys Client:', err);
        setError(err as Error);
      } finally {
        setIsInitializing(false);
      }
    };

    initClient();
  }, [walletClient]);

  return (
    <PureIrysContext.Provider value={{ client, isInitializing, error }}>
      {children}
    </PureIrysContext.Provider>
  );
};
