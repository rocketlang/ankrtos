/**
 * ankr AI Store - Global state for AI-First Architecture
 * Manages intents, actions, and syncs with ankr-eon/sim
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ParsedIntent {
  id: string;
  intent: 'action' | 'query' | 'codegen' | 'conversation';
  action?: string;
  confidence: number;
  entities: Record<string, any>;
  originalText: string;
  language: string;
  timestamp: Date;
  storedInEon?: boolean;
}

interface ActionEvent {
  id: string;
  intentId?: string;
  action: string;
  status: 'pending' | 'executing' | 'success' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  result?: any;
  error?: string;
  loggedToSim?: boolean;
}

interface GeneratedCode {
  id: string;
  type: 'widget' | 'component' | 'page' | 'function';
  name: string;
  code: string;
  filePath?: string;
  timestamp: Date;
  saved?: boolean;
}

interface AIState {
  // Data
  intents: ParsedIntent[];
  actions: ActionEvent[];
  generatedCode: GeneratedCode[];
  
  // Service URLs
  eonUrl: string;
  simUrl: string;
  guruUrl: string;
  
  // Stats
  stats: {
    totalIntents: number;
    totalActions: number;
    successRate: number;
    avgDuration: number;
  };
  
  // Actions
  addIntent: (intent: ParsedIntent) => Promise<void>;
  addAction: (action: ActionEvent) => void;
  updateAction: (id: string, updates: Partial<ActionEvent>) => void;
  addGeneratedCode: (code: GeneratedCode) => void;
  
  // Sync
  syncToEon: (intent: ParsedIntent) => Promise<boolean>;
  logToSim: (action: ActionEvent) => Promise<boolean>;
  
  // Clear
  clearHistory: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      // Initial state
      intents: [],
      actions: [],
      generatedCode: [],
      
      eonUrl: 'http://localhost:4005',
      simUrl: 'http://localhost:4010',
      guruUrl: 'http://localhost:4020',
      
      stats: {
        totalIntents: 0,
        totalActions: 0,
        successRate: 0,
        avgDuration: 0,
      },
      
      // Add intent and sync to eon
      addIntent: async (intent: ParsedIntent) => {
        const stored = await get().syncToEon(intent);
        intent.storedInEon = stored;
        
        set((state) => ({
          intents: [intent, ...state.intents.slice(0, 99)],
          stats: {
            ...state.stats,
            totalIntents: state.stats.totalIntents + 1,
          },
        }));
      },
      
      // Add action
      addAction: (action: ActionEvent) => {
        set((state) => ({
          actions: [action, ...state.actions.slice(0, 99)],
        }));
      },
      
      // Update action status
      updateAction: (id: string, updates: Partial<ActionEvent>) => {
        set((state) => {
          const actions = state.actions.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          );
          
          // Recalculate stats
          const completed = actions.filter((a) => a.status === 'success' || a.status === 'failed');
          const successful = actions.filter((a) => a.status === 'success');
          const totalDuration = completed.reduce((sum, a) => sum + (a.duration || 0), 0);
          
          return {
            actions,
            stats: {
              ...state.stats,
              totalActions: completed.length,
              successRate: completed.length > 0 ? (successful.length / completed.length) * 100 : 0,
              avgDuration: completed.length > 0 ? totalDuration / completed.length : 0,
            },
          };
        });
        
        // Log completed actions to sim
        const action = get().actions.find((a) => a.id === id);
        if (action && (action.status === 'success' || action.status === 'failed')) {
          get().logToSim(action);
        }
      },
      
      // Add generated code
      addGeneratedCode: (code: GeneratedCode) => {
        set((state) => ({
          generatedCode: [code, ...state.generatedCode.slice(0, 49)],
        }));
      },
      
      // Sync intent to ankr-eon memory
      syncToEon: async (intent: ParsedIntent): Promise<boolean> => {
        try {
          const response = await fetch(`${get().eonUrl}/api/remember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: JSON.stringify(intent),
              type: 'user_intent',
              metadata: {
                language: intent.language,
                action: intent.action,
                confidence: intent.confidence,
              },
            }),
          });
          
          if (response.ok) {
            console.log(`[ankr-ai] ✅ Intent stored in eon: ${intent.id}`);
            return true;
          }
          return false;
        } catch (e) {
          console.warn('[ankr-ai] ⚠️ Failed to sync to eon:', e);
          return false;
        }
      },
      
      // Log action to ankr-sim for learning
      logToSim: async (action: ActionEvent): Promise<boolean> => {
        try {
          const response = await fetch(`${get().simUrl}/api/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'action_completed',
              action: action.action,
              status: action.status,
              duration: action.duration,
              timestamp: new Date().toISOString(),
            }),
          });
          
          if (response.ok) {
            console.log(`[ankr-ai] ✅ Action logged to sim: ${action.id}`);
            
            // Update action as logged
            set((state) => ({
              actions: state.actions.map((a) =>
                a.id === action.id ? { ...a, loggedToSim: true } : a
              ),
            }));
            
            return true;
          }
          return false;
        } catch (e) {
          console.warn('[ankr-ai] ⚠️ Failed to log to sim:', e);
          return false;
        }
      },
      
      // Clear all history
      clearHistory: () => {
        set({
          intents: [],
          actions: [],
          generatedCode: [],
          stats: { totalIntents: 0, totalActions: 0, successRate: 0, avgDuration: 0 },
        });
      },
    }),
    {
      name: 'ankr-ai-store',
      partialize: (state) => ({
        intents: state.intents.slice(0, 20),
        actions: state.actions.slice(0, 20),
        stats: state.stats,
      }),
    }
  )
);

export default useAIStore;
