'use client';

import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

let _token: string | null = null;
let _tenantId: string = 'default';

export function setAuthToken(token: string | null) { _token = token; }
export function setTenantId(id: string) { _tenantId = id; }
export function getTenantId(): string { return _tenantId; }

function makeClient(): ApolloClient<any> {
  const httpUrl = process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL ?? 'http://localhost:4070/graphql';
  const wsUrl = process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ?? 'ws://localhost:4070/graphql';

  const httpLink = new HttpLink({
    uri: httpUrl,
    headers: {
      'x-tenant-id': _tenantId,
      ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
    },
  });

  const wsLink = typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url: wsUrl,
          connectionParams: () => ({
            tenantId: _tenantId,
            ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
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

  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  });
}

let clientInstance: ApolloClient<any> | null = null;

export function getApolloClient(): ApolloClient<any> {
  if (!clientInstance) {
    clientInstance = makeClient();
  }
  return clientInstance;
}

export function resetApolloClient(): void {
  if (clientInstance) {
    clientInstance.clearStore();
    clientInstance = null;
  }
}
