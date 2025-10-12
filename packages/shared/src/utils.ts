import { ethers } from 'ethers';

export const IRYS_VM_CHAIN_ID = 1270;

export const IRYS_VM_CONFIG = {
  chainId: '0x4F6',
  chainName: 'IrysVM',
  nativeCurrency: {
    name: 'Irys Token',
    symbol: 'IRYS',
    decimals: 18
  },
  rpcUrls: ['https://rpc.irys.computer'],
  blockExplorerUrls: ['https://explorer.irys.computer']
};

export const IRYS_CONFIG = {
  GATEWAY_URL: 'https://gateway.irys.xyz',
  UPLOADER_URL: 'https://uploader.irys.xyz',
  QUERY_URL: 'https://query.irys.xyz',
  TOKEN: 'ethereum'
};

export const IRYS_TAGS = {
  CONTENT_TYPE: 'Content-Type',
  APP_NAME: 'App-Name',
  TABLE: 'table',
  AUTHOR_ADDRESS: 'author-address',
  TIMESTAMP: 'timestamp',
  VERSION: 'version',
  PREVIOUS_ID: 'previous-id'
} as const;

export function createPostTags(
  authorAddress: string, 
  version: number = 1, 
  previousId?: string
) {
  const tags = [
    { name: IRYS_TAGS.CONTENT_TYPE, value: 'application/json' },
    { name: IRYS_TAGS.APP_NAME, value: 'DeBHuB' },
    { name: IRYS_TAGS.TABLE, value: 'posts' },
    { name: IRYS_TAGS.AUTHOR_ADDRESS, value: authorAddress },
    { name: IRYS_TAGS.TIMESTAMP, value: new Date().toISOString() },
    { name: IRYS_TAGS.VERSION, value: version.toString() }
  ];

  // Mutable reference pattern: link to previous version for updates
  if (previousId) {
    tags.push({ name: IRYS_TAGS.PREVIOUS_ID as any, value: previousId });
  }

  return tags;
}

export function createMutableReference(
  content: string,
  previousTransactionId: string,
  version: number
) {
  return {
    type: 'post-update',
    previousId: previousTransactionId,
    content: content,
    version: version,
    timestamp: new Date().toISOString()
  };
}

export function validateWalletSignature(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature validation failed:', error);
    return false;
  }
}

export function createAuthMessage(address: string, timestamp: number): string {
  return `DeBHuB Authentication\nAddress: ${address}\nTimestamp: ${timestamp}`;
}

export function createAuthToken(address: string, signature: string, message: string): string {
  const payload = { address, signature, message };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function formatIrysBalance(balance: string): string {
  const balanceInEther = ethers.formatEther(balance);
  const numBalance = parseFloat(balanceInEther);
  
  if (numBalance < 0.0001) {
    return '< 0.0001';
  } else if (numBalance < 1) {
    return numBalance.toFixed(6);
  } else {
    return numBalance.toFixed(4);
  }
}

export function isValidEthereumAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (!isValidEthereumAddress(address)) {
    return address;
  }
  return `${address.substring(0, 2 + chars)}...${address.substring(42 - chars)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await fn();
        resolve(result);
        return;
      } catch (error) {
        lastError = error as Error;
        if (i === maxRetries) {
          reject(lastError);
          return;
        }
        
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  });
}