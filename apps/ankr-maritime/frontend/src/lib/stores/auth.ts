import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from './sidebar-nav-rbac';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string; // Legacy single role (kept for backward compatibility)
  roles: UserRole[]; // New: Array of roles for RBAC
  organizationId: string;
  permissions?: string[]; // Optional fine-grained permissions
  company?: {
    id: string;
    name: string;
    type: 'owner' | 'charterer' | 'broker' | 'agent';
  };
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

// Helper: Migrate legacy role to roles array
function migrateUserRoles(user: AuthUser): AuthUser {
  if (!user.roles || user.roles.length === 0) {
    const roleMap: Record<string, UserRole> = {
      admin: 'admin',
      agent: 'agent',
      charterer: 'charterer',
      owner: 'fleet-owner',
      broker: 'broker',
      operations: 'operations',
      commercial: 'commercial',
      technical: 'technical',
      finance: 'finance',
      compliance: 'compliance',
    };
    user.roles = [roleMap[user.role] || 'operations'];
  }
  return user;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        // Ensure roles array exists (migrate from legacy single role)
        user = migrateUserRoles(user);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      hasRole: (role: UserRole) => {
        const state = get();
        if (!state.user) return false;
        return (
          state.user.roles.includes(role) || state.user.roles.includes('admin')
        );
      },

      hasAnyRole: (roles: UserRole[]) => {
        const state = get();
        if (!state.user) return false;
        return (
          roles.some((role) => state.user!.roles.includes(role)) ||
          state.user.roles.includes('admin')
        );
      },

      hasPermission: (permission: string) => {
        const state = get();
        if (!state.user) return false;
        return (
          state.user.permissions?.includes(permission) ||
          state.user.roles.includes('admin')
        );
      },
    }),
    {
      name: 'ankr-maritime-auth',
      onRehydrateStorage: () => (state) => {
        // Migrate legacy user roles on store rehydration
        if (state?.user && (!state.user.roles || state.user.roles.length === 0)) {
          console.log('🔄 Migrating user roles from legacy format...');
          state.user = migrateUserRoles(state.user);
          console.log('✅ User roles migrated:', state.user.roles);
        }
      },
    },
  ),
);
