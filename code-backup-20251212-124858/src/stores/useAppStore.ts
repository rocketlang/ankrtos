/**
 * 🎠 Zustand Wonderland - Global State Store
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Breadcrumb {
  label: string;
  path: string;
  icon?: string;
}

interface FilterState {
  fleet: string;
  orders: string;
  drivers: string;
  customers: string;
  pulse: string;
}

interface AppState {
  breadcrumbs: Breadcrumb[];
  setBreadcrumbs: (crumbs: Breadcrumb[]) => void;
  
  filters: FilterState;
  setFilter: (page: keyof FilterState, value: string) => void;
  clearFilter: (page: keyof FilterState) => void;
  clearAllFilters: () => void;
  
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  recentPages: { path: string; label: string; time: number }[];
  addRecentPage: (path: string, label: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      breadcrumbs: [{ label: 'Dashboard', path: '/', icon: '🏠' }],
      setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
      
      filters: {
        fleet: 'all',
        orders: 'all',
        drivers: 'all',
        customers: 'all',
        pulse: 'all',
      },
      setFilter: (page, value) => set((state) => ({
        filters: { ...state.filters, [page]: value }
      })),
      clearFilter: (page) => set((state) => ({
        filters: { ...state.filters, [page]: 'all' }
      })),
      clearAllFilters: () => set({
        filters: { fleet: 'all', orders: 'all', drivers: 'all', customers: 'all', pulse: 'all' }
      }),
      
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      recentPages: [],
      addRecentPage: (path, label) => set((state) => {
        const filtered = state.recentPages.filter(p => p.path !== path);
        return {
          recentPages: [{ path, label, time: Date.now() }, ...filtered].slice(0, 5)
        };
      }),
    }),
    {
      name: 'wowtruck-app-store',
      partialize: (state) => ({ 
        filters: state.filters,
        sidebarOpen: state.sidebarOpen,
        recentPages: state.recentPages,
      }),
    }
  )
);

export default useAppStore;
