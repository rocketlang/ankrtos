import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import MainNavigator from './src/navigation/MainNavigator';
import ChatWidget from './src/components/ChatWidget';
import { View } from 'react-native';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <View style={{ flex: 1 }}>
            <MainNavigator />
            <ChatWidget />
          </View>
          <StatusBar style="auto" />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
