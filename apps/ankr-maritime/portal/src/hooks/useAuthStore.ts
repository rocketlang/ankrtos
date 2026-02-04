/**
 * Authentication Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: { id: string; name: string; email: string } | null;
  role: 'owner' | 'charterer' | 'broker' | 'agent' | null;
  token: string | null;
  login: (user: any, role: string, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      token: null,
      login: (user, role, token) => set({ user, role: role as any, token }),
      logout: () => set({ user: null, role: null, token: null }),
    }),
    {
      name: 'mari8x-auth',
    }
  )
);
