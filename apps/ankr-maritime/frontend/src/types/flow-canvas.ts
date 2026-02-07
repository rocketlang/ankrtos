/**
 * Mari8X Flow Canvas Types
 *
 * Defines the structure for workflow visualization and management
 */

// Flow Types
export type FlowType =
  | 'chartering'
  | 'voyage'
  | 'daDesk'
  | 'aisData'
  | 'agent'
  | 'finance'
  | 'myDay';

// Flow Stage
export interface FlowStage {
  id: string;
  name: string;
  order: number;
  color?: string;
}

// Flow Definition
export interface FlowDefinition {
  id: FlowType;
  name: string;
  icon: string;
  color: string;
  description: string;
  stages: FlowStage[];
}

// KPI Data
export interface FlowKPI {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendPercent?: number;
  icon?: string;
  color?: string;
  alert?: boolean;
  onClick?: string; // Route to navigate
}

// Entity Types
export type EntityType =
  | 'charter'
  | 'voyage'
  | 'da'
  | 'agent'
  | 'invoice'
  | 'vessel'
  | 'task';

// Flow Entity (Card in a stage)
export interface FlowEntity {
  id: string;
  type: EntityType;
  stageId: string;
  title: string;
  subtitle?: string;
  status: string;
  amount?: number;
  date?: string | Date;
  alerts?: number;
  metadata?: Record<string, any>;
}

// Flow Data (Complete flow with entities)
export interface FlowData {
  id: FlowType;
  name: string;
  icon: string;
  color: string;
  kpis: FlowKPI[];
  stages: FlowStageData[];
  lastUpdated: Date;
}

export interface FlowStageData extends FlowStage {
  count: number;
  alertCount: number;
  entities: FlowEntity[];
}

// User Flow Preferences
export interface UserFlowPreference {
  userId: string;
  defaultFlow: FlowType;
  customFlows?: CustomFlowDefinition[];
  flowOrder?: FlowType[];
}

// Custom Flow Definition
export interface CustomFlowDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  stages: FlowStage[];
  dataSources: string[];
}
