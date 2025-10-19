import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

// IrysVM Testnet Chain Configuration
export const irysVM = {
  id: 1270,
  name: 'Irys Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'IRYS',
    symbol: 'IRYS',
  },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.irys.xyz/v1/execution-rpc'] },
    public: { http: ['https://testnet-rpc.irys.xyz/v1/execution-rpc'] },
  },
  blockExplorers: {
    default: { name: 'Irys Testnet Explorer', url: 'https://testnet-explorer.irys.xyz' },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: 'DeBHuB',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [irysVM, mainnet, sepolia],
  transports: {
    [irysVM.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: false,
});
