import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchResult {
  page: string;
  filters?: Record<string, any>;
  message: string;
}

interface AISearchState {
  isOpen: boolean;
  query: string;
  isLoading: boolean;
  result: SearchResult | null;
  error: string | null;
  recentSearches: string[];

  // Actions
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setResult: (result: SearchResult) => void;
  setError: (error: string | null) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const useAISearchStore = create<AISearchState>()(
  persist(
    (set) => ({
      isOpen: false,
      query: '',
      isLoading: false,
      result: null,
      error: null,
      recentSearches: [],

      open: () => set({ isOpen: true, query: '', result: null, error: null }),
      close: () => set({ isOpen: false }),
      setQuery: (query) => set({ query }),
      setLoading: (isLoading) => set({ isLoading }),
      setResult: (result) => set({ result, isLoading: false, error: null }),
      setError: (error) => set({ error, isLoading: false }),

      addRecentSearch: (query) =>
        set((state) => {
          const cleaned = query.trim();
          if (!cleaned) return state;

          const recent = [cleaned, ...state.recentSearches.filter((q) => q !== cleaned)].slice(
            0,
            10
          ); // Keep last 10

          return { recentSearches: recent };
        }),

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'mari8x-ai-search',
      partialize: (state) => ({
        recentSearches: state.recentSearches,
      }),
    }
  )
);
