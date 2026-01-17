/**
 * BFC Apollo Client Setup
 * URLs are derived from centralized port configuration
 */

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
  from,
  type NormalizedCacheObject,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import { createClient } from 'graphql-ws';
import { PORTS, URLS } from '@ankr-bfc/config';

export interface BFCClientConfig {
  apiUrl: string;
  wsUrl?: string;
  getToken?: () => string | null;
  onAuthError?: () => void;
}

// Generate URLs from centralized config
const host = typeof window !== 'undefined'
  ? window.location.hostname
  : (process.env.API_HOST || 'localhost');

const DEFAULT_CONFIG: BFCClientConfig = {
  apiUrl: `http://${host}:${PORTS.bfc.api}/graphql`,
  wsUrl: `ws://${host}:${PORTS.bfc.api}/graphql`,
};

/**
 * Create BFC Apollo Client
 */
export function createBFCClient(
  config: Partial<BFCClientConfig> = {}
): ApolloClient<NormalizedCacheObject> {
  const { apiUrl, wsUrl, getToken, onAuthError } = { ...DEFAULT_CONFIG, ...config };

  // HTTP Link
  const httpLink = createHttpLink({
    uri: apiUrl,
    credentials: 'include',
    headers: {
      'x-client': 'bfc-web',
    },
  });

  // Auth link
  const authLink = {
    request: (operation: any) => {
      const token = getToken?.();
      if (token) {
        operation.setContext({
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
      }
    },
  };

  // Error handling
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        if (err.extensions?.code === 'UNAUTHENTICATED') {
          onAuthError?.();
        }
        console.error(`[GraphQL error]: ${err.message}`);
      }
    }
    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
    }
  });

  // WebSocket link for subscriptions
  const wsLink = wsUrl
    ? new GraphQLWsLink(
        createClient({
          url: wsUrl,
          connectionParams: () => ({
            authorization: getToken?.() ? `Bearer ${getToken!()}` : '',
          }),
        })
      )
    : null;

  // Split between HTTP and WebSocket
  const splitLink = wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          );
        },
        wsLink,
        httpLink
      )
    : httpLink;

  // Cache configuration
  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          customers: {
            keyArgs: ['filter'],
            merge(existing = { items: [] }, incoming) {
              return {
                ...incoming,
                items: [...existing.items, ...incoming.items],
              };
            },
          },
        },
      },
      Customer: {
        keyFields: ['id'],
      },
      CreditApplication: {
        keyFields: ['id'],
      },
      Offer: {
        keyFields: ['id'],
      },
    },
  });

  return new ApolloClient({
    link: from([errorLink, splitLink]),
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });
}

// Singleton client for web
let webClient: ApolloClient<NormalizedCacheObject> | null = null;

export function getBFCClient(config?: Partial<BFCClientConfig>) {
  if (!webClient) {
    webClient = createBFCClient(config);
  }
  return webClient;
}
