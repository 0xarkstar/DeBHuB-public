import { useMutation } from '@apollo/client';
import { useAccount, useSignMessage } from 'wagmi';
import { REQUEST_CHALLENGE, AUTHENTICATE } from '@/lib/graphql/mutations';

export function useAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [requestChallengeMutation] = useMutation(REQUEST_CHALLENGE);
  const [authenticateMutation] = useMutation(AUTHENTICATE);

  const login = async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      // 1. Request challenge from backend
      const { data: challengeData } = await requestChallengeMutation({
        variables: { address },
      });

      if (!challengeData?.requestChallenge) {
        throw new Error('Failed to get challenge');
      }

      const { challenge } = challengeData.requestChallenge;

      // 2. Sign the challenge message with wallet
      const signature = await signMessageAsync({
        message: challenge,
      });

      // 3. Authenticate with signature
      const { data: authData } = await authenticateMutation({
        variables: { address, signature },
      });

      if (!authData?.authenticate) {
        throw new Error('Authentication failed');
      }

      const { token, user } = authData.authenticate;

      // 4. Store token in localStorage
      localStorage.setItem('authToken', token);

      return { token, user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    // Optionally: Clear Apollo cache or reload page
    window.location.href = '/';
  };

  const getToken = () => {
    return localStorage.getItem('authToken');
  };

  const isAuthenticated = () => {
    return !!getToken();
  };

  return {
    login,
    logout,
    getToken,
    isAuthenticated,
  };
}
