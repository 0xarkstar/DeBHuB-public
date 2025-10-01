import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

// IrysVM Chain Configuration
export const irysVM = {
  id: 1270,
  name: 'IrysVM',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.irys.xyz'] },
    public: { http: ['https://rpc.irys.xyz'] },
  },
  blockExplorers: {
    default: { name: 'IrysVM Explorer', url: 'https://explorer.irys.xyz' },
  },
  testnet: false,
} as const;

export const config = getDefaultConfig({
  appName: 'IrysBase',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [irysVM, mainnet, sepolia],
  transports: {
    [irysVM.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});
