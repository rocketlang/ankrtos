/**
 * BFC Web Store (Zustand)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// Auth Store
// ============================================================================

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  branchCode?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        login: (user, token) => set({ user, token, isAuthenticated: true }),
        logout: () => set({ user: null, token: null, isAuthenticated: false }),
      }),
      { name: 'bfc-auth' }
    )
  )
);

// ============================================================================
// UI Store
// ============================================================================

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        theme: 'light',
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setTheme: (theme) => set({ theme }),
      }),
      { name: 'bfc-ui' }
    )
  )
);

// ============================================================================
// Customer Store
// ============================================================================

interface CustomerState {
  selectedCustomerId: string | null;
  recentCustomers: Array<{ id: string; name: string }>;
  setSelectedCustomer: (id: string | null) => void;
  addRecentCustomer: (customer: { id: string; name: string }) => void;
}

export const useCustomerStore = create<CustomerState>()(
  devtools(
    persist(
      (set) => ({
        selectedCustomerId: null,
        recentCustomers: [],
        setSelectedCustomer: (id) => set({ selectedCustomerId: id }),
        addRecentCustomer: (customer) =>
          set((state) => ({
            recentCustomers: [
              customer,
              ...state.recentCustomers.filter((c) => c.id !== customer.id),
            ].slice(0, 10),
          })),
      }),
      { name: 'bfc-customer' }
    )
  )
);

// ============================================================================
// Notification Store
// ============================================================================

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools((set) => ({
    notifications: [],
    addNotification: (notification) =>
      set((state) => ({
        notifications: [
          ...state.notifications,
          { ...notification, id: `${Date.now()}-${Math.random()}` },
        ],
      })),
    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
    clearAll: () => set({ notifications: [] }),
  }))
);
