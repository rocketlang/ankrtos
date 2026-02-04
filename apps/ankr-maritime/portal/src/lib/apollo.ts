/**
 * Apollo Client Configuration
 */

import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4051';

const httpLink = new HttpLink({
  uri: `${BACKEND_URL}/graphql`,
  credentials: 'include',
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: BACKEND_URL.replace('http', 'ws') + '/graphql',
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
