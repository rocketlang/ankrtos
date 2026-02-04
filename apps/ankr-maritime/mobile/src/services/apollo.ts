/**
 * Apollo Client for GraphQL
 */

import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = __DEV__
  ? 'http://localhost:4051'
  : 'https://mari8x.ankr.com';

// HTTP Link for queries and mutations
const httpLink = new HttpLink({
  uri: `${BACKEND_URL}/graphql`,
  credentials: 'include',
});

// WebSocket Link for subscriptions (real-time)
const wsLink = new GraphQLWsLink(
  createClient({
    url: BACKEND_URL.replace('http', 'ws') + '/graphql',
    connectionParams: async () => {
      const token = await AsyncStorage.getItem('@auth_token');
      return {
        authorization: token ? `Bearer ${token}` : '',
      };
    },
  })
);

// Split traffic: WebSocket for subscriptions, HTTP for everything else
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
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
