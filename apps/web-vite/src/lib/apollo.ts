import { ApolloClient, InMemoryCache, split, from } from '@apollo/client'
import { BatchHttpLink } from '@apollo/client/link/batch-http'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'

// Use BatchHttpLink for automatic query batching
const httpLink = new BatchHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql',
  credentials: 'same-origin',
  batchMax: 10, // Maximum 10 queries per batch
  batchInterval: 20, // Wait 20ms to batch queries together
})

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Path: ${path}`)

      // Handle authentication errors
      if (extensions?.code === 'UNAUTHORIZED' || extensions?.code === 'FORBIDDEN') {
        // Clear auth token and redirect to home
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken')
          // Optionally show a toast notification
          // toast.error('Authentication required. Please sign in again.')

          // Only redirect if not already on home page
          if (window.location.pathname !== '/') {
            window.location.href = '/'
          }
        }
      }

      // Show user-friendly error messages
      // You can integrate with a toast library here
      // toast.error(message)
    })
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`)

    // Show network error notification
    // toast.error('Network error. Please check your connection.')
  }
})

const wsLink = typeof window !== 'undefined' ? new GraphQLWsLink(
  createClient({
    url: import.meta.env.VITE_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql',
    retryAttempts: 3,
    shouldRetry: () => true,
  })
) : null

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
})

const splitLink = typeof window !== 'undefined' && wsLink ? split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  from([errorLink, authLink, httpLink])
) : from([errorLink, authLink, httpLink])

// For offline support with cache persistence:
// 1. Install: pnpm add apollo3-cache-persist
// 2. Import: import { persistCache, LocalStorageWrapper } from 'apollo3-cache-persist'
// 3. Before creating client:
// await persistCache({
//   cache,
//   storage: new LocalStorageWrapper(window.localStorage),
//   maxSize: 10 * 1024 * 1024, // 10MB
//   debug: import.meta.env.DEV,
// })

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          myProjects: {
            merge(_existing = [], incoming) {
              return incoming
            },
          },
          projectDocuments: {
            merge(_existing = [], incoming) {
              return incoming
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'network-only',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  devtools: {
    enabled: import.meta.env.DEV,
  },
})