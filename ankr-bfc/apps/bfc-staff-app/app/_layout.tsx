/**
 * Root Layout - BFC Staff App
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
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1e293b' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="customer/[id]"
          options={{
            title: 'Customer Details',
          }}
        />
        <Stack.Screen
          name="kyc/scan"
          options={{
            title: 'Document Scanner',
            presentation: 'modal',
          }}
        />
      </Stack>
    </ApolloProvider>
  );
}
