import { ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './apollo';

interface ApolloWrapperProps {
  children: ReactNode;
}

/**
 * Conditional Apollo Provider wrapper
 * Only activates when VITE_ENABLE_BACKEND is true
 */
export function ApolloWrapper({ children }: ApolloWrapperProps) {
  const enableBackend = import.meta.env.VITE_ENABLE_BACKEND === 'true';

  if (!enableBackend) {
    // Backend disabled - return children without Apollo
    return <>{children}</>;
  }

  // Backend enabled - wrap with Apollo Provider
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  );
}

/**
 * Hook to check if backend is enabled
 */
export function useBackendEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_BACKEND === 'true';
}
