import { ethers } from 'ethers';
import { validateWalletSignature, createAuthMessage } from '@debhub/shared';

export interface AuthContext {
  userAddress?: string;
  signature?: string;
  message?: string;
}

export function extractAuthFromHeaders(headers: any): AuthContext {
  const authHeader = headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return {};
  }

  try {
    const token = authHeader.substring(7);
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    return {
      userAddress: decoded.address,
      signature: decoded.signature,
      message: decoded.message
    };
  } catch (error) {
    console.error('Failed to extract auth from headers:', error);
    return {};
  }
}

export function validateAuth(authContext: AuthContext): boolean {
  if (!authContext.userAddress || !authContext.signature || !authContext.message) {
    return false;
  }

  return validateWalletSignature(
    authContext.message,
    authContext.signature,
    authContext.userAddress
  );
}

export function createAuthToken(address: string, signature: string, message: string): string {
  const payload = { address, signature, message };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function requireAuth(authContext: AuthContext): string {
  if (!validateAuth(authContext)) {
    throw new Error('Unauthorized: Invalid signature');
  }
  return authContext.userAddress!;
}