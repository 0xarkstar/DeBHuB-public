import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { PureIrysProvider } from './contexts/PureIrysContext';

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

  // Before wallet providers load, show loading
  if (!mounted || !walletComponents) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f172a'
      }}>
        <div>Loading...</div>
      </div>
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
          <PureIrysProvider>
            <Toaster position="top-right" richColors />
            {children}
          </PureIrysProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
