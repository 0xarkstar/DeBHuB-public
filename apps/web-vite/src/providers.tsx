import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApolloWrapper } from './apollo-wrapper';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [walletComponents, setWalletComponents] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    // Import wallet providers dynamically
    Promise.all([
      import('wagmi'),
      import('@rainbow-me/rainbowkit'),
      import('@/lib/wagmi'),
    ]).then(([wagmi, rainbowkit, wagmiConfig]) => {
      setWalletComponents({
        WagmiProvider: wagmi.WagmiProvider,
        RainbowKitProvider: rainbowkit.RainbowKitProvider,
        darkTheme: rainbowkit.darkTheme,
        config: wagmiConfig.config,
      });
    }).catch((error) => {
      console.error('Failed to load wallet providers:', error);
    });
  }, []);

  // Before wallet providers load, render without them
  if (!mounted || !walletComponents) {
    return (
      <QueryClientProvider client={queryClient}>
        <ApolloWrapper>
          {children}
        </ApolloWrapper>
      </QueryClientProvider>
    );
  }

  // After wallet providers are loaded
  const { WagmiProvider, RainbowKitProvider, darkTheme, config } = walletComponents;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#6366f1',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
