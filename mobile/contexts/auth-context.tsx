import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { type AuthUser, type UserRole, decodeJWT, hasRole as checkRole, hasPermission } from '@/lib/auth';
import { getStoredToken, setToken as storeToken, initStorage } from '@/lib/storage';
import { resetApolloClient } from '@/lib/apollo-client';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  ready: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  canMutate: (domain: string) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isAuthenticated: false,
  ready: false,
  login: async () => {},
  logout: async () => {},
  hasRole: () => true,
  canMutate: () => true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStorage().then(() => {
      const stored = getStoredToken();
      if (stored) setTokenState(stored);
      setReady(true);
    });
  }, []);

  const user = token ? decodeJWT(token) : null;

  const login = useCallback(async (newToken: string) => {
    setTokenState(newToken);
    await storeToken(newToken);
    resetApolloClient();
  }, []);

  const logout = useCallback(async () => {
    setTokenState(null);
    await storeToken(null);
    resetApolloClient();
  }, []);

  const hasRoleCheck = useCallback((role: UserRole) => {
    if (!user) return true;
    return checkRole(user.roles, role);
  }, [user]);

  const canMutate = useCallback((domain: string) => {
    if (!user) return true;
    return hasPermission(user.roles, `mutation:${domain}:*`);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, ready, login, logout, hasRole: hasRoleCheck, canMutate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
