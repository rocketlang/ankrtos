/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WowTruck 2.0 - Enhanced AuthContext
 * Connects to Option E PostgreSQL-backed auth
 * ═══════════════════════════════════════════════════════════════════════════
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type UserRole = 'super_admin' | 'branch_manager' | 'dispatcher' | 'accountant' | 'driver' | 'customer' | 'vendor';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  permissions: string[];
  branchId?: string;
  branch?: { id: string; name: string; code: string };
}

export interface AuthContextType {
  // State
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  
  // Actions
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  
  // Permission helpers
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  
  // Session info
  sessionId: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  token: 'wowtruck_token',
  refreshToken: 'wowtruck_refresh_token',
  user: 'wowtruck_user',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Decode JWT to get sessionId
// ═══════════════════════════════════════════════════════════════════════════

function decodeJWT(token: string): { sessionId?: string; exp?: number } | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────────────────────────────────────────────────
  // Initialize from localStorage on mount
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.token);
    const savedUser = localStorage.getItem(STORAGE_KEYS.user);

    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        const decoded = decodeJWT(savedToken);
        
        // Check if token is expired
        if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
          // Token expired, clear storage
          console.log('Token expired, clearing session');
          localStorage.removeItem(STORAGE_KEYS.token);
          localStorage.removeItem(STORAGE_KEYS.refreshToken);
          localStorage.removeItem(STORAGE_KEYS.user);
        } else {
          setToken(savedToken);
          setUser(userData);
          setSessionId(decoded?.sessionId || null);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem(STORAGE_KEYS.user);
      }
    }
    setLoading(false);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────────────────────────────────
  const login = useCallback((newToken: string, refreshToken: string, userData: User) => {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.token, newToken);
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData));
    
    // Extract sessionId from token
    const decoded = decodeJWT(newToken);
    
    // Update state
    setToken(newToken);
    setUser(userData);
    setSessionId(decoded?.sessionId || null);
    setIsAuthenticated(true);
    
    console.log('🔐 Login successful:', { email: userData.email, role: userData.role, sessionId: decoded?.sessionId });
    
    // Redirect based on role
    const redirectPath = getRedirectPath(userData.role);
    window.location.href = redirectPath;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Logout - Calls backend to invalidate session
  // ─────────────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const currentToken = localStorage.getItem(STORAGE_KEYS.token);
    
    // Call backend logout to invalidate PostgreSQL session
    if (currentToken) {
      try {
        const response = await fetch('http://localhost:4000/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            query: `mutation { logout }`
          }),
        });
        const result = await response.json();
        console.log('🔓 Logout result:', result);
      } catch (e) {
        console.error('Logout API error:', e);
      }
    }
    
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    
    // Clear state
    setToken(null);
    setUser(null);
    setSessionId(null);
    setIsAuthenticated(false);
    
    // Redirect to login
    window.location.href = '/login';
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Permission Helpers
  // ─────────────────────────────────────────────────────────────────────────
  
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.permissions.includes('*')) return true;
    
    // Direct permission check
    if (user.permissions.includes(permission)) return true;
    
    // Wildcard check (e.g., 'orders:*' matches 'orders:create')
    const [resource] = permission.split(':');
    if (user.permissions.includes(`${resource}:*`)) return true;
    
    return false;
  }, [user]);

  const hasRole = useCallback((...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const hasAnyPermission = useCallback((...permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p));
  }, [hasPermission]);

  // ─────────────────────────────────────────────────────────────────────────
  // Context Value
  // ─────────────────────────────────────────────────────────────────────────
  const value: AuthContextType = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    hasAnyPermission,
    sessionId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'super_admin':
    case 'branch_manager':
      return '/dashboard';
    case 'dispatcher':
      return '/command-center';
    case 'driver':
      return '/driver-app';
    case 'customer':
      return '/customer-portal';
    case 'vendor':
      return '/vendor-portal';
    case 'accountant':
      return '/invoices';
    default:
      return '/dashboard';
  }
}

// Role display names
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  branch_manager: 'Branch Manager',
  dispatcher: 'Dispatcher',
  accountant: 'Accountant',
  driver: 'Driver',
  customer: 'Customer',
  vendor: 'Vendor / Fleet Owner',
};

// Role colors for badges
export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-red-500',
  branch_manager: 'bg-purple-500',
  dispatcher: 'bg-blue-500',
  accountant: 'bg-green-500',
  driver: 'bg-orange-500',
  customer: 'bg-cyan-500',
  vendor: 'bg-yellow-500',
};

export default AuthContext;
