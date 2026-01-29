'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type AuthUser, type UserRole, decodeJWT, hasRole as checkRole, hasPermission } from '@/lib/auth';
import { setAuthToken, resetApolloClient } from '@/lib/apollo-client';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  canMutate: (domain: string) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  hasRole: () => true,
  canMutate: () => true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('icd-auth-token');
    }
    return null;
  });

  const user = token ? decodeJWT(token) : null;

  const login = useCallback((newToken: string) => {
    setToken(newToken);
    setAuthToken(newToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('icd-auth-token', newToken);
    }
    resetApolloClient();
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAuthToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('icd-auth-token');
    }
    resetApolloClient();
  }, []);

  const hasRoleCheck = useCallback((role: UserRole) => {
    if (!user) return true; // No auth = allow all (dev mode)
    return checkRole(user.roles, role);
  }, [user]);

  const canMutate = useCallback((domain: string) => {
    if (!user) return true; // No auth = allow all
    return hasPermission(user.roles, `mutation:${domain}:*`);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      login,
      logout,
      hasRole: hasRoleCheck,
      canMutate,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
