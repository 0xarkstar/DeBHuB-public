import { ethers } from 'ethers';

export function verifyWalletSignature(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

export function extractAuthFromHeaders(headers: Record<string, string | undefined>) {
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const [address, signature] = token.split(':');
    return { address, signature };
  } catch (error) {
    console.error('Failed to extract auth from headers:', error);
    return null;
  }
}