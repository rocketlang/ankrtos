import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  from,
  ApolloLink,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { useAuthStore } from './stores/auth';

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_API_URL || 'http://localhost:4051/graphql',
  credentials: 'include',
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const { message, locations, path } of graphQLErrors) {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`,
      );
      if (message.includes('Not authenticated')) {
        useAuthStore.getState().logout();
      }
    }
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const authLink = new ApolloLink((operation, forward) => {
  const token = useAuthStore.getState().token;
  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    },
  });
  return forward(operation);
});

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
