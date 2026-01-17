/**
 * BFC Customer App API Client
 */

import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4020/graphql';

// Error handling
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      console.error(`[GraphQL Error]: ${message}`);
      if (extensions?.code === 'UNAUTHENTICATED') {
        AsyncStorage.removeItem('bfc_token');
      }
    });
  }
  if (networkError) {
    console.error(`[Network Error]: ${networkError}`);
  }
});

// HTTP link with auth
const httpLink = createHttpLink({
  uri: API_URL,
  credentials: 'include',
});

// Create client
export const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Customer: { keyFields: ['id'] },
      Account: { keyFields: ['id'] },
      Transaction: { keyFields: ['id'] },
      Offer: { keyFields: ['id'] },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

/**
 * Set auth token
 */
export async function setAuthToken(token: string) {
  await AsyncStorage.setItem('bfc_token', token);
}

/**
 * Get auth token
 */
export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem('bfc_token');
}

/**
 * Clear auth
 */
export async function clearAuth() {
  await AsyncStorage.removeItem('bfc_token');
  await apolloClient.clearStore();
}

export default apolloClient;
