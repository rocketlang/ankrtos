import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ApolloWrapper } from '@/lib/apollo-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { FacilityProvider } from '@/contexts/facility-context';
import { OfflineBanner } from '@/components/OfflineBanner';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <ApolloWrapper>
      <AuthProvider>
        <FacilityProvider>
          <View style={{ flex: 1 }}>
            <OfflineBanner />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: '#FFFFFF' },
                headerTintColor: '#111827',
                headerTitleStyle: { fontWeight: '600' },
              }}
            >
              <Stack.Screen name="index" options={{ title: 'ankrICD' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="gate/[id]" options={{ title: 'Transaction Detail' }} />
              <Stack.Screen name="container/[id]" options={{ title: 'Container Detail' }} />
              <Stack.Screen name="equipment/[id]" options={{ title: 'Equipment Detail' }} />
            </Stack>
            <StatusBar style="dark" />
          </View>
        </FacilityProvider>
      </AuthProvider>
    </ApolloWrapper>
  );
}
