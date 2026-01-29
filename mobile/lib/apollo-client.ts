import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { getStoredToken, getStoredTenantId } from './storage';

const GRAPHQL_HTTP_URL = process.env.EXPO_PUBLIC_GRAPHQL_HTTP_URL ?? 'http://localhost:4070/graphql';
const GRAPHQL_WS_URL = process.env.EXPO_PUBLIC_GRAPHQL_WS_URL ?? 'ws://localhost:4070/graphql';

let clientInstance: ApolloClient<any> | null = null;

export function getApolloClient(): ApolloClient<any> {
  if (clientInstance) return clientInstance;

  const httpLink = new HttpLink({
    uri: GRAPHQL_HTTP_URL,
    headers: {
      'x-tenant-id': getStoredTenantId(),
    },
  });

  const wsLink = typeof WebSocket !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url: GRAPHQL_WS_URL,
          connectionParams: () => ({
            tenantId: getStoredTenantId(),
          }),
        }),
      )
    : null;

  const link = wsLink
    ? split(
        ({ query }) => {
          const def = getMainDefinition(query);
          return def.kind === 'OperationDefinition' && def.operation === 'subscription';
        },
        wsLink,
        httpLink,
      )
    : httpLink;

  clientInstance = new ApolloClient({
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  });

  return clientInstance;
}

export function resetApolloClient(): void {
  if (clientInstance) {
    clientInstance.clearStore();
    clientInstance = null;
  }
}
