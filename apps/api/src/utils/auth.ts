import { ethers } from 'ethers';
import { 
  validateWalletSignature, 
  createAuthMessage, 
  createAuthToken 
} from '@debhub/shared';
import { GraphQLContext } from '../types';

export function requireAuth(context: GraphQLContext): string {
  if (!context.userAddress || !context.signature || !context.message) {
    throw new Error('Authentication required');
  }

  // Validate wallet signature
  const isValidSignature = validateWalletSignature(
    context.message,
    context.signature,
    context.userAddress
  );

  if (!isValidSignature) {
    throw new Error('Invalid wallet signature');
  }

  // Check message format and timestamp
  const messageMatch = context.message.match(/DeBHuB Authentication\nAddress: (.+)\nTimestamp: (\d+)/);
  if (!messageMatch) {
    throw new Error('Invalid authentication message format');
  }

  const [, messageAddress, timestampStr] = messageMatch;
  const timestamp = parseInt(timestampStr);
  const now = Date.now();

  // Check if address matches
  if (messageAddress.toLowerCase() !== context.userAddress.toLowerCase()) {
    throw new Error('Address mismatch in authentication message');
  }

  // Check if message is not too old (5 minutes)
  if (now - timestamp > 5 * 60 * 1000) {
    throw new Error('Authentication message expired');
  }

  return context.userAddress;
}

export function extractAuthFromHeaders(headers: any): GraphQLContext {
  const authHeader = headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {};
  }

  try {
    const token = authHeader.substring(7); // Remove 'Bearer '
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    return {
      userAddress: decoded.address,
      signature: decoded.signature,
      message: decoded.message
    };
  } catch (error) {
    console.warn('Failed to decode auth token:', error);
    return {};
  }
}

export function generateAuthChallenge(address: string): string {
  const timestamp = Date.now();
  return createAuthMessage(address, timestamp);
}

export function createUserAuthToken(address: string, signature: string, message: string): string {
  return createAuthToken(address, signature, message);
}

// Legacy function - kept for backwards compatibility
export function verifyWalletSignature(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  return validateWalletSignature(message, signature, expectedAddress);
}