/**
 * Mari8X Flow Canvas Store
 *
 * Zustand store for Flow Canvas state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FlowType,
  FlowData,
  FlowEntity,
  UserFlowPreference,
} from '../../types/flow-canvas';
import { getDefaultFlow } from '../../config/flow-definitions';

interface FlowCanvasState {
  // Current active flow
  activeFlow: FlowType;
  setActiveFlow: (flowType: FlowType) => void;

  // Flow data cache (loaded from API)
  flowDataCache: Map<FlowType, FlowData>;
  setFlowData: (flowType: FlowType, data: FlowData) => void;
  getFlowData: (flowType: FlowType) => FlowData | undefined;

  // Selected entity (for drawer)
  selectedEntity: FlowEntity | null;
  setSelectedEntity: (entity: FlowEntity | null) => void;

  // Drawer state
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;

  // User preferences
  userPreferences: UserFlowPreference | null;
  setUserPreferences: (prefs: UserFlowPreference) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Entity operations
  moveEntity: (entityId: string, newStageId: string) => void;
  updateEntity: (entityId: string, updates: Partial<FlowEntity>) => void;
  deleteEntity: (entityId: string) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  activeFlow: 'voyage' as FlowType, // Default to Voyage flow
  flowDataCache: new Map(),
  selectedEntity: null,
  isDrawerOpen: false,
  userPreferences: null,
  isLoading: false,
};

/**
 * Flow Canvas Store
 */
export const useFlowCanvasStore = create<FlowCanvasState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Set active flow
      setActiveFlow: (flowType: FlowType) => {
        set({ activeFlow: flowType });
      },

      // Cache flow data
      setFlowData: (flowType: FlowType, data: FlowData) => {
        const cache = new Map(get().flowDataCache);
        cache.set(flowType, data);
        set({ flowDataCache: cache });
      },

      // Get cached flow data
      getFlowData: (flowType: FlowType) => {
        return get().flowDataCache.get(flowType);
      },

      // Selected entity
      setSelectedEntity: (entity: FlowEntity | null) => {
        set({ selectedEntity: entity });
        if (entity) {
          get().openDrawer();
        }
      },

      // Drawer controls
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false, selectedEntity: null }),

      // User preferences
      setUserPreferences: (prefs: UserFlowPreference) => {
        set({ userPreferences: prefs, activeFlow: prefs.defaultFlow });
      },

      // Loading state
      setIsLoading: (loading: boolean) => set({ isLoading: loading }),

      // Move entity to different stage
      moveEntity: (entityId: string, newStageId: string) => {
        const { activeFlow, flowDataCache } = get();
        const flowData = flowDataCache.get(activeFlow);

        if (!flowData) return;

        // Update entity stage
        const updatedStages = flowData.stages.map((stage) => ({
          ...stage,
          entities: stage.entities.map((entity) =>
            entity.id === entityId ? { ...entity, stageId: newStageId } : entity
          ),
        }));

        // Move entity to new stage
        const entity = flowData.stages
          .flatMap((s) => s.entities)
          .find((e) => e.id === entityId);

        if (entity) {
          const finalStages = updatedStages.map((stage) => {
            if (stage.id === newStageId) {
              return {
                ...stage,
                entities: [...stage.entities.filter((e) => e.id !== entityId), entity],
                count: stage.count + 1,
              };
            } else if (stage.entities.some((e) => e.id === entityId)) {
              return {
                ...stage,
                entities: stage.entities.filter((e) => e.id !== entityId),
                count: Math.max(0, stage.count - 1),
              };
            }
            return stage;
          });

          const updatedFlowData = {
            ...flowData,
            stages: finalStages,
            lastUpdated: new Date(),
          };

          get().setFlowData(activeFlow, updatedFlowData);
        }
      },

      // Update entity details
      updateEntity: (entityId: string, updates: Partial<FlowEntity>) => {
        const { activeFlow, flowDataCache } = get();
        const flowData = flowDataCache.get(activeFlow);

        if (!flowData) return;

        const updatedStages = flowData.stages.map((stage) => ({
          ...stage,
          entities: stage.entities.map((entity) =>
            entity.id === entityId ? { ...entity, ...updates } : entity
          ),
        }));

        const updatedFlowData = {
          ...flowData,
          stages: updatedStages,
          lastUpdated: new Date(),
        };

        get().setFlowData(activeFlow, updatedFlowData);

        // Update selected entity if it's the one being updated
        if (get().selectedEntity?.id === entityId) {
          set({ selectedEntity: { ...get().selectedEntity!, ...updates } });
        }
      },

      // Delete entity
      deleteEntity: (entityId: string) => {
        const { activeFlow, flowDataCache, selectedEntity } = get();
        const flowData = flowDataCache.get(activeFlow);

        if (!flowData) return;

        const updatedStages = flowData.stages.map((stage) => ({
          ...stage,
          entities: stage.entities.filter((entity) => entity.id !== entityId),
          count: stage.entities.some((e) => e.id === entityId)
            ? Math.max(0, stage.count - 1)
            : stage.count,
        }));

        const updatedFlowData = {
          ...flowData,
          stages: updatedStages,
          lastUpdated: new Date(),
        };

        get().setFlowData(activeFlow, updatedFlowData);

        // Close drawer if deleted entity was selected
        if (selectedEntity?.id === entityId) {
          get().closeDrawer();
        }
      },

      // Reset store
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'mari8x-flow-canvas-storage',
      partialize: (state) => ({
        activeFlow: state.activeFlow,
        userPreferences: state.userPreferences,
      }),
    }
  )
);

/**
 * Helper hook for flow operations
 */
export function useFlowOperations() {
  const {
    activeFlow,
    flowDataCache,
    moveEntity,
    updateEntity,
    deleteEntity,
    setSelectedEntity,
  } = useFlowCanvasStore();

  const activeFlowData = flowDataCache.get(activeFlow);

  return {
    activeFlow,
    activeFlowData,
    moveEntity,
    updateEntity,
    deleteEntity,
    selectEntity: setSelectedEntity,
  };
}

/**
 * Helper hook for drawer state
 */
export function useFlowDrawer() {
  const { isDrawerOpen, selectedEntity, openDrawer, closeDrawer, setSelectedEntity } =
    useFlowCanvasStore();

  return {
    isOpen: isDrawerOpen,
    entity: selectedEntity,
    open: openDrawer,
    close: closeDrawer,
    select: setSelectedEntity,
  };
}
