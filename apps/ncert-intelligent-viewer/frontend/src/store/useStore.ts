import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Book {
  id: string;
  class: number;
  subject: string;
  title: string;
  language: string;
  chapterCount: number;
}

interface Chapter {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  content: string;
  metadata?: {
    readingTime?: number;
    difficulty?: string;
    tags?: string[];
  };
}

interface UserProgress {
  chapterId: string;
  progress: number; // 0-100
  lastAccessed: Date;
  timeSpent: number; // seconds
}

interface AppState {
  // Books & Chapters
  books: Book[];
  currentBook: Book | null;
  currentChapter: Chapter | null;

  // User Progress
  userProgress: Record<string, UserProgress>;

  // UI State
  splitRatio: number; // percentage for document pane
  activePanel: 'index' | 'fermi' | 'socratic' | 'logic' | 'translate' | 'notes' | 'similar';

  // Actions
  setBooks: (books: Book[]) => void;
  setCurrentBook: (book: Book | null) => void;
  setCurrentChapter: (chapter: Chapter | null) => void;
  updateProgress: (chapterId: string, progress: Partial<UserProgress>) => void;
  setSplitRatio: (ratio: number) => void;
  setActivePanel: (panel: AppState['activePanel']) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      books: [],
      currentBook: null,
      currentChapter: null,
      userProgress: {},
      splitRatio: 40,
      activePanel: 'index',

      // Actions
      setBooks: (books) => set({ books }),

      setCurrentBook: (book) => set({ currentBook: book }),

      setCurrentChapter: (chapter) => set({ currentChapter: chapter }),

      updateProgress: (chapterId, progress) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            [chapterId]: {
              ...(state.userProgress[chapterId] || {
                chapterId,
                progress: 0,
                lastAccessed: new Date(),
                timeSpent: 0,
              }),
              ...progress,
              lastAccessed: new Date(),
            },
          },
        })),

      setSplitRatio: (ratio) => set({ splitRatio: ratio }),

      setActivePanel: (panel) => set({ activePanel: panel }),
    }),
    {
      name: 'ncert-viewer-storage',
      partialize: (state) => ({
        userProgress: state.userProgress,
        splitRatio: state.splitRatio,
      }),
    }
  )
);
