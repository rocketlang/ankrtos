"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAppStore = void 0;
/**
 * 🎠 Zustand Wonderland - Global State Store
 */
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
exports.useAppStore = (0, zustand_1.create)()((0, middleware_1.persist)((set) => ({
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
}), {
    name: 'wowtruck-app-store',
    partialize: (state) => ({
        filters: state.filters,
        sidebarOpen: state.sidebarOpen,
        recentPages: state.recentPages,
    }),
}));
exports.default = exports.useAppStore;
