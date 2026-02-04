import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SearchFilters {
  docTypes: string[];
  vesselId?: string;
  voyageId?: string;
  minImportance?: number;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
}

export interface SearchResult {
  id: string;
  documentId: string;
  title: string;
  content: string;
  excerpt: string;
  score: number;
  metadata: any;
  entities: {
    vesselNames: string[];
    portNames: string[];
    cargoTypes: string[];
    parties: string[];
  };
  createdAt: Date;
}

interface SearchState {
  // Search query and results
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  isSearching: boolean;
  totalResults: number;

  // Recent searches (persisted)
  recentSearches: string[];

  // Pagination
  currentPage: number;
  pageSize: number;

  // Sort
  sortBy: 'relevance' | 'date' | 'title';
  sortOrder: 'asc' | 'desc';

  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setResults: (results: SearchResult[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setTotalResults: (total: number) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSortBy: (sortBy: 'relevance' | 'date' | 'title') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      query: '',
      filters: {
        docTypes: [],
      },
      results: [],
      isSearching: false,
      totalResults: 0,
      recentSearches: [],
      currentPage: 1,
      pageSize: 10,
      sortBy: 'relevance',
      sortOrder: 'desc',

      setQuery: (query) => set({ query }),

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1, // Reset to first page when filters change
        })),

      setResults: (results) => set({ results }),

      setIsSearching: (isSearching) => set({ isSearching }),

      setTotalResults: (total) => set({ totalResults: total }),

      addRecentSearch: (query) =>
        set((state) => {
          const trimmed = query.trim();
          if (!trimmed) return state;

          // Add to recent searches, remove duplicates, keep last 10
          const updated = [
            trimmed,
            ...state.recentSearches.filter((s) => s !== trimmed),
          ].slice(0, 10);

          return { recentSearches: updated };
        }),

      clearRecentSearches: () => set({ recentSearches: [] }),

      setPage: (page) => set({ currentPage: page }),

      setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),

      setSortBy: (sortBy) => set({ sortBy }),

      setSortOrder: (order) => set({ sortOrder: order }),

      clearSearch: () =>
        set({
          query: '',
          results: [],
          isSearching: false,
          totalResults: 0,
          currentPage: 1,
          filters: { docTypes: [] },
        }),
    }),
    {
      name: 'mari8x-search-storage',
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        pageSize: state.pageSize,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);
