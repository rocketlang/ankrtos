/**
 * Mari8X Flow Canvas - Flow Definitions
 *
 * Defines 6 core business flows + 1 personal flow
 */

import { FlowDefinition, FlowType } from '../types/flow-canvas';

/**
 * Chartering Flow
 * Charter party lifecycle from enquiry to completion
 */
const charteringFlow: FlowDefinition = {
  id: 'chartering' as FlowType,
  name: 'Chartering',
  icon: '⚓',
  color: '#3b82f6', // Blue
  description: 'Charter party lifecycle management',
  stages: [
    { id: 'enquiry', name: 'Enquiry', order: 1, color: '#e0e7ff' },
    { id: 'negotiations', name: 'Negotiations', order: 2, color: '#c7d2fe' },
    { id: 'on_subs', name: 'On Subs', order: 3, color: '#a5b4fc' },
    { id: 'fixed', name: 'Fixed', order: 4, color: '#818cf8' },
    { id: 'cp_signed', name: 'CP Signed', order: 5, color: '#6366f1' },
    { id: 'executed', name: 'Executed', order: 6, color: '#4f46e5' },
    { id: 'completed', name: 'Completed', order: 7, color: '#10b981' },
  ],
};

/**
 * Voyage Flow
 * Vessel voyage lifecycle with real-time AIS integration
 */
const voyageFlow: FlowDefinition = {
  id: 'voyage' as FlowType,
  name: 'Voyage',
  icon: '🚢',
  color: '#0ea5e9', // Sky blue
  description: 'Vessel voyage management with live tracking',
  stages: [
    { id: 'planned', name: 'Planned', order: 1, color: '#e0f2fe' },
    { id: 'nominated', name: 'Nominated', order: 2, color: '#bae6fd' },
    { id: 'enroute', name: 'Enroute', order: 3, color: '#7dd3fc' },
    { id: 'loading', name: 'Loading', order: 4, color: '#38bdf8' },
    { id: 'in_transit', name: 'In Transit', order: 5, color: '#0ea5e9' },
    { id: 'discharge', name: 'Discharge', order: 6, color: '#0284c7' },
    { id: 'complete', name: 'Complete', order: 7, color: '#10b981' },
  ],
};

/**
 * DA Desk Flow
 * Despatch/Demurrage claims processing
 */
const daDeskFlow: FlowDefinition = {
  id: 'daDesk' as FlowType,
  name: 'DA Desk',
  icon: '📋',
  color: '#f59e0b', // Amber
  description: 'Despatch/Demurrage claims management',
  stages: [
    { id: 'sof_submitted', name: 'SOF Submitted', order: 1, color: '#fef3c7' },
    { id: 'laytime_calc', name: 'Laytime Calc', order: 2, color: '#fde68a' },
    { id: 'review', name: 'Review', order: 3, color: '#fcd34d' },
    { id: 'disputed', name: 'Disputed', order: 4, color: '#fbbf24' },
    { id: 'agreed', name: 'Agreed', order: 5, color: '#f59e0b' },
    { id: 'invoiced', name: 'Invoiced', order: 6, color: '#d97706' },
    { id: 'settled', name: 'Settled', order: 7, color: '#10b981' },
  ],
};

/**
 * AIS Data Flow (Unique to Mari8X!)
 * Automated vessel tracking and route learning
 */
const aisDataFlow: FlowDefinition = {
  id: 'aisData' as FlowType,
  name: 'AIS Data',
  icon: '🛰️',
  color: '#8b5cf6', // Violet
  description: 'AI-powered vessel tracking and route extraction',
  stages: [
    { id: 'tracking', name: 'Tracking', order: 1, color: '#ede9fe' },
    { id: 'voyage_detect', name: 'Voyage Detect', order: 2, color: '#ddd6fe' },
    { id: 'route_extract', name: 'Route Extract', order: 3, color: '#c4b5fd' },
    { id: 'eta_calc', name: 'ETA Calc', order: 4, color: '#a78bfa' },
    { id: 'congestion', name: 'Congestion', order: 5, color: '#8b5cf6' },
    { id: 'complete', name: 'Complete', order: 6, color: '#10b981' },
  ],
};

/**
 * Agent Flow
 * Port agent appointment and services
 */
const agentFlow: FlowDefinition = {
  id: 'agent' as FlowType,
  name: 'Agent',
  icon: '🤝',
  color: '#06b6d4', // Cyan
  description: 'Port agent services and DA collection',
  stages: [
    { id: 'nominated', name: 'Nominated', order: 1, color: '#cffafe' },
    { id: 'confirmed', name: 'Confirmed', order: 2, color: '#a5f3fc' },
    { id: 'da_received', name: 'DA Received', order: 3, color: '#67e8f9' },
    { id: 'services', name: 'Services', order: 4, color: '#22d3ee' },
    { id: 'invoiced', name: 'Invoiced', order: 5, color: '#06b6d4' },
    { id: 'paid', name: 'Paid', order: 6, color: '#10b981' },
  ],
};

/**
 * Finance Flow
 * Invoice and payment tracking
 */
const financeFlow: FlowDefinition = {
  id: 'finance' as FlowType,
  name: 'Finance',
  icon: '💰',
  color: '#10b981', // Green
  description: 'Invoice and collections management',
  stages: [
    { id: 'draft', name: 'Draft', order: 1, color: '#d1fae5' },
    { id: 'approved', name: 'Approved', order: 2, color: '#a7f3d0' },
    { id: 'sent', name: 'Sent', order: 3, color: '#6ee7b7' },
    { id: 'partial', name: 'Partial', order: 4, color: '#34d399' },
    { id: 'paid', name: 'Paid', order: 5, color: '#10b981' },
    { id: 'overdue', name: 'Overdue', order: 6, color: '#ef4444' },
  ],
};

/**
 * My Day Flow (Personal Dashboard)
 * User's personalized task and priority management
 */
const myDayFlow: FlowDefinition = {
  id: 'myDay' as FlowType,
  name: 'My Day',
  icon: '☀️',
  color: '#ec4899', // Pink
  description: 'Personal dashboard with prioritized tasks',
  stages: [
    { id: 'urgent', name: 'Urgent', order: 1, color: '#fee2e2' },
    { id: 'today', name: 'Today', order: 2, color: '#fecaca' },
    { id: 'this_week', name: 'This Week', order: 3, color: '#fca5a5' },
    { id: 'later', name: 'Later', order: 4, color: '#f87171' },
    { id: 'done', name: 'Done', order: 5, color: '#10b981' },
  ],
};

/**
 * All Flow Definitions (Export)
 */
export const flowDefinitions: FlowDefinition[] = [
  charteringFlow,
  voyageFlow,
  daDeskFlow,
  aisDataFlow,
  agentFlow,
  financeFlow,
  myDayFlow,
];

/**
 * Get flow definition by ID
 */
export function getFlowDefinition(flowId: FlowType): FlowDefinition | undefined {
  return flowDefinitions.find((flow) => flow.id === flowId);
}

/**
 * Get default flow (Voyage Flow for most users)
 */
export function getDefaultFlow(): FlowDefinition {
  return voyageFlow;
}

/**
 * Flow categories for navigation
 */
export const flowCategories = {
  operations: [voyageFlow, agentFlow],
  commercial: [charteringFlow, daDeskFlow],
  finance: [financeFlow],
  technology: [aisDataFlow],
  personal: [myDayFlow],
};
