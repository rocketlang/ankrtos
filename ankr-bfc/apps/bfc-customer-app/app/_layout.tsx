/**
 * Root Layout - BFC Customer App
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

const client = new ApolloClient({
  uri: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4020/graphql',
  cache: new InMemoryCache(),
});

export default function RootLayout() {
  return (
    <ApolloProvider client={client}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="offer/[id]"
          options={{
            title: 'Offer Details',
            presentation: 'modal',
          }}
        />
      </Stack>
    </ApolloProvider>
  );
}
