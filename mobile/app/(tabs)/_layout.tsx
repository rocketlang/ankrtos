import React from 'react';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E5E7EB' },
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#111827',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="gate"
        options={{
          title: 'Gate',
          tabBarLabel: 'Gate',
        }}
      />
      <Tabs.Screen
        name="yard"
        options={{
          title: 'Yard',
          tabBarLabel: 'Yard',
        }}
      />
      <Tabs.Screen
        name="equipment"
        options={{
          title: 'Equipment',
          tabBarLabel: 'Equipment',
        }}
      />
    </Tabs>
  );
}
