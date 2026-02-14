/**
 * SWAYAM Intelligence Types
 * Core type definitions for conversational AI system
 */

// ═══════════════════════════════════════════════════════════════════════════════
// INTENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type IntentDomain =
  | 'compliance'    // GST, TDS, ITR, MCA
  | 'erp'          // Accounting, Invoice, Inventory
  | 'crm'          // Leads, Contacts, Opportunities
  | 'banking'      // UPI, BBPS, Loans
  | 'government'   // Aadhaar, DigiLocker, Schemes
  | 'logistics'    // Fleet, Shipping, Tracking
  | 'general'      // Weather, Calculator, Search
  | 'meta';        // Help, Settings, About

export interface Intent {
  primary: string;           // e.g., 'gst_setup', 'create_invoice'
  domain: IntentDomain;
  confidence: number;        // 0-1
  subIntents?: string[];     // Related intents
  voiceTriggers?: string[];  // Voice patterns that matched
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type EntityType =
  | 'company'          // Company name, CIN
  | 'person'           // Person name
  | 'gstin'            // GST number
  | 'pan'              // PAN number
  | 'aadhaar'          // Aadhaar number
  | 'vehicle'          // Vehicle number
  | 'phone'            // Phone number
  | 'email'            // Email address
  | 'amount'           // Money amount
  | 'date'             // Date/time
  | 'location'         // City, State, Pincode
  | 'product'          // Product/Item name
  | 'document'         // Document type
  | 'custom'           // Custom entity
  // BFC Financial Entities (ankrBFC Integration)
  | 'loan_type'        // HOME_LOAN, CAR_LOAN, PERSONAL_LOAN, etc.
  | 'insurance_type'   // HEALTH_INSURANCE, LIFE_INSURANCE, etc.
  | 'employment_type'  // SALARIED, SELF_EMPLOYED, BUSINESS, etc.
  | 'goal_type'        // HOME_PURCHASE, WEDDING, RETIREMENT, etc.
  | 'tenure'           // Loan/Investment tenure (years/months)
  | 'age'              // Age in years
  | 'annual_income'    // Yearly income amount
  | 'credit_score'     // CIBIL score (300-900)
  | 'investment_type'  // MUTUAL_FUND, FD, SIP, PPF, etc.
  | 'bank_name';       // SBI, HDFC, ICICI, etc.

export interface Entity {
  type: EntityType;
  value: string;
  normalizedValue?: string;  // Cleaned/standardized value
  confidence: number;
  position?: { start: number; end: number };
  metadata?: Record<string, any>;
}

export interface ExtractedEntities {
  [key: string]: Entity | Entity[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// TODO TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';

export interface TodoItem {
  id: string;
  title: string;
  titleHi: string;              // Hindi version
  description?: string;
  status: TodoStatus;
  priority: number;             // 1-5, 1 being highest
  agent?: string;               // Assigned agent type
  tools: string[];              // Required MCP tools
  packages?: string[];          // Required @ankr packages
  dependencies: string[];       // Dependent task IDs
  estimatedDuration?: number;   // Estimated seconds
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface TodoPlan {
  id: string;
  title: string;
  titleHi: string;
  description?: string;
  intent: Intent;
  entities: ExtractedEntities;
  items: TodoItem[];
  status: 'planning' | 'ready' | 'executing' | 'completed' | 'failed';
  progress: number;             // 0-100
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type AgentType =
  | 'compliance'
  | 'document'
  | 'coding'
  | 'research'
  | 'communication'
  | 'training'
  | 'general';

export type AgentStatus = 'idle' | 'working' | 'waiting' | 'error';

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  nameHi: string;
  status: AgentStatus;
  currentTask?: string;
  tools: string[];
  capabilities: string[];
  memory?: string;              // Memory context ID
}

// ═══════════════════════════════════════════════════════════════════════════════
// PACKAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
  exports: string[];
  dependencies: string[];
  capabilities: string[];       // AI-inferred capabilities
  tools?: string[];             // MCP tools this package provides
  domain?: IntentDomain;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  language?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ConversationContext {
  sessionId: string;
  userId?: string;
  persona: string;
  language: string;
  messages: Message[];
  currentPlan?: TodoPlan;
  activeAgents: Agent[];
  extractedEntities: ExtractedEntities;
}

export interface ConversationAnalysis {
  intent: Intent;
  entities: ExtractedEntities;
  suggestedPlan?: TodoPlan;
  toolsNeeded: string[];
  toolsMissing: string[];
  packagesAvailable: PackageInfo[];
  confidence: number;
  requiresConfirmation: boolean;
  followUpQuestions?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ToolRequirement {
  name: string;
  description: string;
  descriptionHi?: string;
  parameters: ToolParameter[];
  behavior: string;
  testCases?: ToolTestCase[];
  suggestedPackages?: string[];
  persist?: boolean;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

export interface ToolTestCase {
  input: Record<string, any>;
  expectedOutput?: any;
  shouldSucceed: boolean;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  duration_ms: number;
  tool: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ProgressEventType =
  | 'plan_created'
  | 'task_started'
  | 'task_progress'
  | 'task_completed'
  | 'task_failed'
  | 'agent_spawned'
  | 'agent_completed'
  | 'tool_executed'
  | 'tool_created'
  | 'plan_completed';

export interface ProgressEvent {
  type: ProgressEventType;
  planId: string;
  taskId?: string;
  agentId?: string;
  message: string;
  messageHi: string;
  progress: number;
  data?: any;
  timestamp: Date;
}

export type ProgressCallback = (event: ProgressEvent) => void;
