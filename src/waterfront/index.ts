// Waterfront Operations Exports
export {
  WaterfrontEngine,
  getWaterfrontEngine,
  setWaterfrontEngine,
  type RegisterBerthInput,
  type BerthQueryOptions,
  type AnnounceVesselInput,
  type VesselVisitQueryOptions,
  type RegisterCraneInput,
  type CreateStowPlanInput,
  type WaterfrontStats,
} from './waterfront-engine';

// Re-export transport types used by waterfront
export type {
  Berth,
  BerthStatus,
  VesselVisit,
  VesselStatus,
  QuayCrane,
  CraneType,
  VesselStowPlan,
  BayPlan,
} from '../types/transport';
