import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceDocument[];
  confidence?: number;
}

export interface SourceDocument {
  documentId: string;
  title: string;
  excerpt: string;
  page?: number;
  relevanceScore: number;
}

interface RAGState {
  // Conversation state
  currentQuery: string;
  conversationHistory: Message[];
  activeSources: SourceDocument[];
  confidence: number;
  isQuerying: boolean;

  // Follow-up suggestions
  followUpSuggestions: string[];

  // Actions
  setQuery: (query: string) => void;
  addMessage: (message: Message) => void;
  addSources: (sources: SourceDocument[]) => void;
  setConfidence: (confidence: number) => void;
  setIsQuerying: (isQuerying: boolean) => void;
  setFollowUpSuggestions: (suggestions: string[]) => void;
  clearConversation: () => void;
}

export const useRAGStore = create<RAGState>((set) => ({
  currentQuery: '',
  conversationHistory: [],
  activeSources: [],
  confidence: 0,
  isQuerying: false,
  followUpSuggestions: [],

  setQuery: (query) => set({ currentQuery: query }),

  addMessage: (message) =>
    set((state) => ({
      conversationHistory: [...state.conversationHistory, message],
    })),

  addSources: (sources) =>
    set((state) => ({
      activeSources: [...state.activeSources, ...sources],
    })),

  setConfidence: (confidence) => set({ confidence }),

  setIsQuerying: (isQuerying) => set({ isQuerying }),

  setFollowUpSuggestions: (suggestions) =>
    set({ followUpSuggestions: suggestions }),

  clearConversation: () =>
    set({
      currentQuery: '',
      conversationHistory: [],
      activeSources: [],
      confidence: 0,
      isQuerying: false,
      followUpSuggestions: [],
    }),
}));
