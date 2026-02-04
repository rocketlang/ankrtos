/**
 * Mari8x Feature Flags — Switchable Enterprise Configuration
 *
 * Tiers:
 *   FREE    — Ships by default. Core maritime ops.
 *   PRO     — Advanced ops, analytics, multi-user.
 *   ENTERPRISE — Full platform: DA Desk, Laytime, Claims, P&I, Weather Routing, Mari8xLLM.
 */

export type FeatureTier = 'free' | 'pro' | 'enterprise';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  tier: FeatureTier;
  enabled: boolean;
  module: string;
}

const FEATURES: FeatureFlag[] = [
  // === FREE TIER — Always On ===
  { key: 'vessel_registry', name: 'Vessel Registry', description: 'CRUD for vessel fleet management', tier: 'free', enabled: true, module: 'core' },
  { key: 'port_directory', name: 'Port Directory', description: '50+ world ports with UNLOCODE', tier: 'free', enabled: true, module: 'core' },
  { key: 'company_directory', name: 'Company Directory', description: 'Manage charterers, brokers, agents', tier: 'free', enabled: true, module: 'core' },
  { key: 'basic_chartering', name: 'Basic Chartering', description: 'Create and track charter fixtures', tier: 'free', enabled: true, module: 'chartering' },
  { key: 'voyage_tracking', name: 'Voyage Tracking', description: 'Basic voyage with departure/arrival', tier: 'free', enabled: true, module: 'voyage' },
  { key: 'cargo_management', name: 'Cargo Management', description: 'Commodity, quantity, HS code tracking', tier: 'free', enabled: true, module: 'core' },
  { key: 'oss_maps', name: 'OSS Maps (MapLibre)', description: 'OpenStreetMap-based port visualization', tier: 'free', enabled: true, module: 'maps' },
  { key: 'clause_library', name: 'Clause Library', description: 'Standard BIMCO/GENCON clauses', tier: 'free', enabled: true, module: 'chartering' },

  // === PRO TIER ===
  { key: 'voyage_milestones', name: 'Voyage Milestones', description: 'NOR, berthing, loading, discharge milestones', tier: 'pro', enabled: false, module: 'voyage' },
  { key: 'vendor_ratings', name: 'Vendor Ratings', description: 'Rate and track agent/supplier performance', tier: 'pro', enabled: false, module: 'vendors' },
  { key: 'charter_party_builder', name: 'Charter Party Builder', description: 'Build C/P documents with clause selection', tier: 'pro', enabled: false, module: 'chartering' },
  { key: 'multi_user', name: 'Multi-User & Roles', description: 'Team access with role-based permissions', tier: 'pro', enabled: false, module: 'auth' },
  { key: 'osrm_routing', name: 'OSRM Land Routing', description: 'Truck/rail route optimization to port', tier: 'pro', enabled: false, module: 'maps' },
  { key: 'basic_analytics', name: 'Basic Analytics', description: 'Voyage counts, port call frequency, fleet utilization', tier: 'pro', enabled: false, module: 'analytics' },

  // === ENTERPRISE TIER ===
  { key: 'da_desk', name: 'DA Desk (PDA/FDA)', description: 'Proforma & Final Disbursement Accounts', tier: 'enterprise', enabled: false, module: 'da_desk' },
  { key: 'laytime_calculator', name: 'Laytime Calculator', description: 'SHINC/SHEX, weather days, demurrage/despatch', tier: 'enterprise', enabled: false, module: 'laytime' },
  { key: 'claims_management', name: 'Claims Management', description: 'Cargo damage, demurrage, deviation claims', tier: 'enterprise', enabled: false, module: 'claims' },
  { key: 'pi_club_integration', name: 'P&I Club Integration', description: 'Insurance, club correspondence tracking', tier: 'enterprise', enabled: false, module: 'insurance' },
  { key: 'weather_routing', name: 'Weather Routing', description: 'GFS/ECMWF wind+wave data, optimal route calc', tier: 'enterprise', enabled: process.env.ENABLE_WEATHER_ROUTING === 'true', module: 'routing' },
  { key: 'sea_routing_engine', name: 'Sea Routing Engine', description: 'Great circle + waypoint maritime routing', tier: 'enterprise', enabled: process.env.ENABLE_SEA_ROUTING === 'true', module: 'routing' },
  { key: 'ml_eta_prediction', name: 'ML ETA Prediction', description: 'Machine learning powered ETA with weather and congestion', tier: 'pro', enabled: process.env.ENABLE_ML_ETA === 'true', module: 'voyage' },
  { key: 'voyage_automation', name: 'Voyage Automation', description: 'Auto-detect milestones and SOF from AIS', tier: 'pro', enabled: process.env.ENABLE_VOYAGE_AUTOMATION === 'true', module: 'voyage' },
  { key: 'mari8x_llm', name: 'Mari8xLLM', description: 'Domain-specific LLM for clause analysis, voyage optimization', tier: 'enterprise', enabled: false, module: 'ai' },
  { key: 'rag_search', name: 'RAG Search & Knowledge Engine', description: 'Semantic search, document Q&A, entity extraction', tier: 'enterprise', enabled: process.env.ENABLE_RAG === 'true', module: 'ai' },
  { key: 'rag_auto_index', name: 'RAG Auto-Indexing', description: 'Automatically index documents on upload', tier: 'enterprise', enabled: process.env.ENABLE_RAG_AUTO_INDEX === 'true', module: 'ai' },
  { key: 'advanced_analytics', name: 'Advanced Analytics', description: 'TCE analysis, market benchmarking, P&L', tier: 'enterprise', enabled: false, module: 'analytics' },
  { key: 'opensea_charts', name: 'OpenSeaMap Charts', description: 'Nautical chart overlay with depth/lights', tier: 'enterprise', enabled: false, module: 'maps' },
  { key: 'edi_integration', name: 'EDI Integration', description: 'BAPLIE, COPARN, CUSCAR messages', tier: 'enterprise', enabled: false, module: 'integration' },
  { key: 'api_access', name: 'API Access', description: 'REST/GraphQL API for third-party integration', tier: 'enterprise', enabled: false, module: 'integration' },
];

// Active tier — set via env or database per org
let activeTier: FeatureTier = (process.env.MARI8X_TIER as FeatureTier) || 'free';

export function setTier(tier: FeatureTier) {
  activeTier = tier;
}

export function getTier(): FeatureTier {
  return activeTier;
}

export function isFeatureEnabled(key: string): boolean {
  const feature = FEATURES.find((f) => f.key === key);
  if (!feature) return false;
  const tierRank = { free: 0, pro: 1, enterprise: 2 };
  return tierRank[feature.tier] <= tierRank[activeTier];
}

export function getEnabledFeatures(): FeatureFlag[] {
  return FEATURES.filter((f) => isFeatureEnabled(f.key)).map((f) => ({
    ...f,
    enabled: true,
  }));
}

export function getAllFeatures(): FeatureFlag[] {
  return FEATURES.map((f) => ({
    ...f,
    enabled: isFeatureEnabled(f.key),
  }));
}

export function getFeaturesByModule(module: string): FeatureFlag[] {
  return getAllFeatures().filter((f) => f.module === module);
}
