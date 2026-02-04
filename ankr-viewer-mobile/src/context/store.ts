import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FileItem,
  Bookmark,
  RecentFile,
  DocumentSource,
  AppSettings,
  KnowledgeGraph,
} from '../types';

interface AppState {
  // Navigation
  currentPath: string;
  setCurrentPath: (path: string) => void;

  // Files
  files: FileItem[];
  setFiles: (files: FileItem[]) => void;
  selectedFile: FileItem | null;
  setSelectedFile: (file: FileItem | null) => void;

  // Bookmarks & Recent
  bookmarks: Bookmark[];
  setBookmarks: (bookmarks: Bookmark[]) => void;
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (path: string) => void;

  recentFiles: RecentFile[];
  setRecentFiles: (files: RecentFile[]) => void;
  addRecentFile: (file: RecentFile) => void;

  // Sources
  sources: DocumentSource[];
  setSources: (sources: DocumentSource[]) => void;
  activeSource: DocumentSource | null;
  setActiveSource: (source: DocumentSource | null) => void;

  // Knowledge Graph
  knowledgeGraph: KnowledgeGraph | null;
  setKnowledgeGraph: (graph: KnowledgeGraph | null) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  apiUrl: 'https://ankr.in',
  offlineMode: false,
  cacheSize: 100,
  notifications: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Navigation
      currentPath: '',
      setCurrentPath: (path) => set({ currentPath: path }),

      // Files
      files: [],
      setFiles: (files) => set({ files }),
      selectedFile: null,
      setSelectedFile: (file) => set({ selectedFile: file }),

      // Bookmarks
      bookmarks: [],
      setBookmarks: (bookmarks) => set({ bookmarks }),
      addBookmark: (bookmark) =>
        set((state) => ({
          bookmarks: [...state.bookmarks.filter((b) => b.path !== bookmark.path), bookmark],
        })),
      removeBookmark: (path) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.path !== path),
        })),

      // Recent Files
      recentFiles: [],
      setRecentFiles: (files) => set({ recentFiles: files }),
      addRecentFile: (file) =>
        set((state) => ({
          recentFiles: [
            file,
            ...state.recentFiles.filter((f) => f.path !== file.path).slice(0, 19),
          ],
        })),

      // Sources
      sources: [],
      setSources: (sources) => set({ sources }),
      activeSource: null,
      setActiveSource: (source) => set({ activeSource: source }),

      // Knowledge Graph
      knowledgeGraph: null,
      setKnowledgeGraph: (graph) => set({ knowledgeGraph: graph }),

      // Settings
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // UI State
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      error: null,
      setError: (error) => set({ error }),
      drawerOpen: false,
      setDrawerOpen: (open) => set({ drawerOpen: open }),
    }),
    {
      name: 'ankr-viewer-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        recentFiles: state.recentFiles,
        settings: state.settings,
        activeSource: state.activeSource,
      }),
    }
  )
);

export default useAppStore;
