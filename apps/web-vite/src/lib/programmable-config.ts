/**
 * Programmable Data Configuration
 * Contract addresses and network settings for IrysVM
 */

import type { ProgrammableDataConfig } from './irys-programmable';

/**
 * Get programmable data configuration from environment variables
 */
export function getProgrammableConfig(): ProgrammableDataConfig {
  const documentAccess = import.meta.env.VITE_DOCUMENT_ACCESS_CONTRACT;
  const projectGovernance = import.meta.env.VITE_PROJECT_GOVERNANCE_CONTRACT;
  const provenanceTracker = import.meta.env.VITE_PROVENANCE_TRACKER_CONTRACT;
  const rpcUrl = import.meta.env.VITE_IRYS_VM_RPC_URL || 'https://rpc-testnet.irys.xyz';
  const chainId = parseInt(import.meta.env.VITE_IRYS_CHAIN_ID || '31337');

  // Validate configuration
  if (!documentAccess || !projectGovernance || !provenanceTracker) {
    throw new Error(
      'Missing smart contract addresses. Please set VITE_DOCUMENT_ACCESS_CONTRACT, ' +
      'VITE_PROJECT_GOVERNANCE_CONTRACT, and VITE_PROVENANCE_TRACKER_CONTRACT in .env'
    );
  }

  return {
    contractAddresses: {
      documentAccess,
      projectGovernance,
      provenanceTracker
    },
    rpcUrl,
    chainId
  };
}

/**
 * Check if programmable features are configured
 */
export function isProgrammableConfigured(): boolean {
  try {
    getProgrammableConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Development/Mock configuration for testing
 */
export function getMockProgrammableConfig(): ProgrammableDataConfig {
  return {
    contractAddresses: {
      documentAccess: '0x0000000000000000000000000000000000000001',
      projectGovernance: '0x0000000000000000000000000000000000000002',
      provenanceTracker: '0x0000000000000000000000000000000000000003'
    },
    rpcUrl: 'http://localhost:8545',
    chainId: 31337
  };
}
