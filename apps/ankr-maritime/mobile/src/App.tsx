/**
 * Mari8X Mobile App
 * For field agents, vessel masters, and port agents
 */

import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './services/apollo';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from './screens/HomeScreen';
import { VoyagesScreen } from './screens/VoyagesScreen';
import { DocumentsScreen } from './screens/DocumentsScreen';
import { ProfileScreen } from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#0a192f' },
            headerTintColor: '#64ffda',
            tabBarStyle: { backgroundColor: '#0a192f' },
            tabBarActiveTintColor: '#64ffda',
            tabBarInactiveTintColor: '#8892b0',
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Dashboard' }}
          />
          <Tab.Screen
            name="Voyages"
            component={VoyagesScreen}
            options={{ title: 'My Voyages' }}
          />
          <Tab.Screen
            name="Documents"
            component={DocumentsScreen}
            options={{ title: 'Documents' }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </ApolloProvider>
  );
}
