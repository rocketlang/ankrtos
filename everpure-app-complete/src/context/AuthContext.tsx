import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api, User } from '../services/api';

// Cross-platform storage helper
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  sendOtp: (phone: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await storage.getItem('token');
      const storedUser = await storage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.setToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (phone: string): Promise<boolean> => {
    try {
      const result = await api.sendOtp(phone);
      return result.success;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  };

  const login = async (phone: string, otp: string): Promise<boolean> => {
    try {
      const result = await api.verifyOtp(phone, otp);
      if (result.success && result.token) {
        await storage.setItem('token', result.token);
        await storage.setItem('user', JSON.stringify(result.user));
        setToken(result.token);
        setUser(result.user);
        api.setToken(result.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
    }
  };

  const logout = async () => {
    await storage.removeItem('token');
    await storage.removeItem('user');
    setToken(null);
    setUser(null);
    api.setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, sendOtp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
