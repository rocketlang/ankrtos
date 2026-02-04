import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { View, Text } from 'react-native';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/shop/HomeScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CartIconWithBadge({ color, size }: { color: string; size: number }) {
  const { totalItems } = useCart();
  return (
    <View>
      <Ionicons name="cart-outline" size={size} color={color} />
      {totalItems > 0 && (
        <View style={{
          position: 'absolute',
          right: -8,
          top: -4,
          backgroundColor: '#EF4444',
          borderRadius: 10,
          minWidth: 18,
          height: 18,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{totalItems}</Text>
        </View>
      )}
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />;
          } else if (route.name === 'Cart') {
            return <CartIconWithBadge color={color} size={size} />;
          } else if (route.name === 'Profile') {
            return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />;
          }
          return null;
        },
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Ionicons name="leaf" size={60} color="#059669" />
        <Text style={{ marginTop: 10, color: '#059669', fontSize: 18, fontWeight: 'bold' }}>Ever Pure</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={HomeTabs} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ presentation: 'modal' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
