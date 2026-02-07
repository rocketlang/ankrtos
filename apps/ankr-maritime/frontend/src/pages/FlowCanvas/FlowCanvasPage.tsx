/**
 * Mari8X Flow Canvas - Main Page
 *
 * Kanban-style workflow visualization with clickable KPIs and AI integration
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlowCanvasStore } from '../../lib/stores/flowCanvasStore';
import { flowDefinitions } from '../../config/flow-definitions';
import { FlowType, FlowData } from '../../types/flow-canvas';
import FlowKPIs from './FlowKPIs';
import FlowLanes from './FlowLanes';
import FlowEntityDrawer from './FlowEntityDrawer';

/**
 * Flow Canvas Page Component
 */
export default function FlowCanvasPage() {
  const { activeFlow, setActiveFlow, flowDataCache, setFlowData, isLoading, setIsLoading } =
    useFlowCanvasStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Load flow data on mount or when active flow changes
  useEffect(() => {
    loadFlowData(activeFlow);
  }, [activeFlow]);

  /**
   * Load flow data from API (or mock data for now)
   */
  const loadFlowData = async (flowType: FlowType) => {
    setIsLoading(true);

    try {
      // Check cache first
      const cached = flowDataCache.get(flowType);
      if (cached) {
        setIsLoading(false);
        return;
      }

      // TODO: Replace with real API call
      // const response = await fetch(`/api/flow/${flowType}`);
      // const data = await response.json();

      // Mock data for now
      const mockData = generateMockFlowData(flowType);
      setFlowData(flowType, mockData);

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to load flow data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentFlowData = flowDataCache.get(activeFlow);
  const currentFlowDef = flowDefinitions.find((f) => f.id === activeFlow);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header: Flow Selector */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flow Canvas</h1>
              <p className="text-sm text-gray-500 mt-1">
                Visualize your workflows, track progress, and take action
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Customize Flow
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                + Create Custom Flow
              </button>
            </div>
          </div>

          {/* Flow Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {flowDefinitions.map((flow) => (
              <button
                key={flow.id}
                onClick={() => setActiveFlow(flow.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap
                  transition-all duration-200 font-medium text-sm
                  ${
                    activeFlow === flow.id
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                  }
                `}
              >
                <span className="text-lg">{flow.icon}</span>
                <span>{flow.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !currentFlowData && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading flow data...</p>
          </div>
        </div>
      )}

      {/* Flow Content */}
      <AnimatePresence mode="wait">
        {currentFlowData && currentFlowDef && (
          <motion.div
            key={activeFlow}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1800px] mx-auto px-6 py-6"
          >
            {/* KPI Cards (Clickable Stats) */}
            <FlowKPIs flowData={currentFlowData} flowDefinition={currentFlowDef} />

            {/* Kanban Lanes */}
            <FlowLanes flowData={currentFlowData} flowDefinition={currentFlowDef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entity Drawer (Slides in from right) */}
      <FlowEntityDrawer />
    </div>
  );
}

/**
 * Generate mock flow data for development
 * TODO: Replace with real API calls
 */
function generateMockFlowData(flowType: FlowType): FlowData {
  const flowDef = flowDefinitions.find((f) => f.id === flowType);
  if (!flowDef) throw new Error(`Flow ${flowType} not found`);

  // Mock KPIs based on flow type
  const kpis = generateMockKPIs(flowType);

  // Mock stages with entities
  const stages = flowDef.stages.map((stage) => ({
    ...stage,
    count: Math.floor(Math.random() * 10) + 1,
    alertCount: Math.floor(Math.random() * 3),
    entities: generateMockEntities(flowType, stage.id, 3),
  }));

  return {
    id: flowType,
    name: flowDef.name,
    icon: flowDef.icon,
    color: flowDef.color,
    kpis,
    stages,
    lastUpdated: new Date(),
  };
}

/**
 * Generate mock KPIs for each flow type
 */
function generateMockKPIs(flowType: FlowType) {
  const kpiMap: Record<FlowType, any[]> = {
    chartering: [
      { label: 'Active Charters', value: '24', trend: 'up', trendPercent: 12, icon: '⚓', color: '#3b82f6' },
      { label: 'On Subs', value: '8', trend: 'stable', icon: '📝', color: '#f59e0b', onClick: '/chartering?status=on_subs' },
      { label: 'Fixed This Month', value: '12', trend: 'up', trendPercent: 25, icon: '✓', color: '#10b981' },
      { label: 'Total Value', value: '$2.4M', trend: 'up', trendPercent: 15, icon: '💰', color: '#3b82f6' },
    ],
    voyage: [
      { label: 'Active Voyages', value: '18', trend: 'stable', icon: '🚢', color: '#0ea5e9' },
      { label: 'In Transit', value: '7', trend: 'down', trendPercent: 10, icon: '🌊', color: '#0ea5e9' },
      { label: 'Delayed', value: '2', trend: 'down', trendPercent: 50, icon: '⚠️', color: '#ef4444', alert: true },
      { label: 'ETA Confidence', value: '94%', trend: 'up', trendPercent: 2, icon: '🎯', color: '#10b981' },
    ],
    daDesk: [
      { label: 'Open DAs', value: '15', trend: 'up', trendPercent: 7, icon: '📋', color: '#f59e0b' },
      { label: 'Disputed', value: '3', trend: 'stable', icon: '⚠️', color: '#ef4444', alert: true },
      { label: 'Avg Resolution', value: '4.2 days', trend: 'down', trendPercent: 15, icon: '⏱️', color: '#10b981' },
      { label: 'Total at Risk', value: '$340K', trend: 'down', trendPercent: 20, icon: '💰', color: '#f59e0b' },
    ],
    aisData: [
      { label: 'Vessels Tracked', value: '41,043', trend: 'up', trendPercent: 5, icon: '🛰️', color: '#8b5cf6' },
      { label: 'Voyages Detected', value: '1,247', trend: 'up', trendPercent: 12, icon: '🔍', color: '#8b5cf6' },
      { label: 'Routes Learned', value: '453', trend: 'up', trendPercent: 8, icon: '🗺️', color: '#8b5cf6' },
      { label: 'Accuracy', value: '96.8%', trend: 'stable', icon: '🎯', color: '#10b981' },
    ],
    agent: [
      { label: 'Active Appointments', value: '28', trend: 'up', trendPercent: 10, icon: '🤝', color: '#06b6d4' },
      { label: 'DAs Pending', value: '12', trend: 'down', trendPercent: 8, icon: '📋', color: '#f59e0b' },
      { label: 'Outstanding', value: '$45K', trend: 'down', trendPercent: 15, icon: '💰', color: '#ef4444' },
      { label: 'Avg Response', value: '2.4 hrs', trend: 'down', trendPercent: 20, icon: '⏱️', color: '#10b981' },
    ],
    finance: [
      { label: 'Open Invoices', value: '42', trend: 'stable', icon: '💰', color: '#10b981' },
      { label: 'Overdue', value: '8', trend: 'up', trendPercent: 14, icon: '⚠️', color: '#ef4444', alert: true },
      { label: 'Collections', value: '$1.2M', trend: 'up', trendPercent: 18, icon: '📈', color: '#10b981' },
      { label: 'DSO', value: '32 days', trend: 'down', trendPercent: 10, icon: '📅', color: '#10b981' },
    ],
    myDay: [
      { label: 'Urgent', value: '3', trend: 'stable', icon: '🔥', color: '#ef4444', alert: true },
      { label: 'Today', value: '7', trend: 'down', trendPercent: 25, icon: '☀️', color: '#f59e0b' },
      { label: 'This Week', value: '12', trend: 'up', trendPercent: 10, icon: '📅', color: '#3b82f6' },
      { label: 'Completed', value: '28', trend: 'up', trendPercent: 40, icon: '✓', color: '#10b981' },
    ],
  };

  return kpiMap[flowType] || [];
}

/**
 * Generate mock entities for a stage
 */
function generateMockEntities(flowType: FlowType, stageId: string, count: number): import('../../types/flow-canvas').FlowEntity[] {
  const entities: import('../../types/flow-canvas').FlowEntity[] = [];

  // Map flow types to entity types
  const entityTypeMap: Record<FlowType, import('../../types/flow-canvas').EntityType> = {
    chartering: 'charter',
    voyage: 'voyage',
    daDesk: 'da',
    aisData: 'vessel',
    agent: 'agent',
    finance: 'invoice',
    myDay: 'task',
  };

  for (let i = 0; i < count; i++) {
    entities.push({
      id: `${flowType}-${stageId}-${i}`,
      type: entityTypeMap[flowType],
      stageId,
      title: `${flowType.toUpperCase()}-2024-${String(i + 1).padStart(3, '0')}`,
      subtitle: getRandomSubtitle(flowType),
      status: stageId,
      amount: Math.random() > 0.5 ? Math.floor(Math.random() * 100000) + 10000 : undefined,
      date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      alerts: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0,
      metadata: {},
    });
  }

  return entities;
}

/**
 * Get random subtitle for mock data
 */
function getRandomSubtitle(flowType: FlowType): string {
  const subtitles: Record<FlowType, string[]> = {
    chartering: ['MV Ocean Star - Mumbai', 'MV Atlantic Wave - Singapore', 'MV Pacific Dawn - LA'],
    voyage: ['Mumbai → Singapore', 'LA → Shanghai', 'Rotterdam → New York'],
    daDesk: ['Mumbai DA Claim', 'Singapore Demurrage', 'LA Port Despatch'],
    aisData: ['Voyage #1247', 'Route Extraction', 'ETA Calculation'],
    agent: ['Mumbai Port Agent', 'Singapore Services', 'LA Agent Appointment'],
    finance: ['Invoice #2024-001', 'Payment Pending', 'Overdue Collection'],
    myDay: ['Review charter terms', 'Call agent in Singapore', 'Finalize DA claim'],
  };

  const options = subtitles[flowType] || ['Task item'];
  return options[Math.floor(Math.random() * options.length)];
}
