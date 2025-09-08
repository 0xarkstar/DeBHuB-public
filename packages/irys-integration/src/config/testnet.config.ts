export const IRYS_TESTNET_CONFIG = {
  // Irys Testnet Alpha 설정
  network: {
    chainId: 1270,
    rpcUrl: 'https://testnet-rpc.irys.xyz/v1/execution-rpc',
    name: 'Irys Testnet Alpha',
    currency: {
      name: 'Test IRYS',
      symbol: 'tIRYS',
      decimals: 18
    }
  },
  
  // IrysVM 연결
  iryvm: {
    endpoint: 'https://testnet-vm.irys.xyz',
    gasLimit: 10000000,
    maxFeePerGas: '20000000000' // 20 gwei
  },
  
  // 스토리지 설정
  storage: {
    submitLedger: 'https://testnet-submit.irys.xyz',
    publishLedger: 'https://testnet-publish.irys.xyz',
    gateway: 'https://testnet-gateway.irys.xyz'
  },
  
  // 성능 최적화 (100K TPS 활용)
  performance: {
    maxConcurrentUploads: 100,
    batchSize: 1000,
    compressionEnabled: true,
    cacheStrategy: 'aggressive'
  }
}

// Environment-specific overrides
export const getIrysConfig = (env: 'development' | 'production' | 'test' = 'development') => {
  const baseConfig = { ...IRYS_TESTNET_CONFIG };
  
  switch (env) {
    case 'production':
      // Use mainnet when available
      return {
        ...baseConfig,
        network: {
          ...baseConfig.network,
          rpcUrl: process.env.IRYS_MAINNET_RPC || baseConfig.network.rpcUrl
        }
      };
    case 'test':
      return {
        ...baseConfig,
        performance: {
          ...baseConfig.performance,
          maxConcurrentUploads: 10,
          batchSize: 100
        }
      };
    default:
      return baseConfig;
  }
};

export type IrysConfig = typeof IRYS_TESTNET_CONFIG;