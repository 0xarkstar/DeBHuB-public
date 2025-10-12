// Main exports for @debhub/irys-integration package

// Configuration
export { IRYS_TESTNET_CONFIG, getIrysConfig } from './config/testnet.config'
export type { IrysConfig } from './config/testnet.config'

// Services
export { IrysTestnetClient } from './services/irys-client'
export { ProgrammableDataService } from './services/programmable-data.service'

// Types
export type {
  DocumentMetadata,
  ProgrammableDocument,
  QueryFilters,
  QueryResult,
  ProgrammableRule,
  ProgrammableRuleSet,
  UploadOptions,
  UploadResult,
  IrysBalance,
  FundingResult
} from './types'

// Re-export common utilities
export { ethers } from 'ethers'