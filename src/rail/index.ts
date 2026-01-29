// Rail Terminal Exports
// Comprehensive rail operations for ICD terminals

export const RailEngineVersion = '1.0.0';

// Rail Engine
export {
  RailEngine,
  getRailEngine,
  setRailEngine,
  type RegisterTrackInput,
  type TrackQueryOptions,
  type AnnounceRakeInput,
  type RakeQueryOptions,
  type AddWagonInput,
  type CreateManifestInput,
  type RailTerminalStats,
} from './rail-engine';

// Transport types for Rail
export type {
  RailTrack,
  RailTrackType,
  RailTrackStatus,
  Rake,
  RakeStatus,
  Wagon,
  IndianWagonType,
  WagonContainer,
  RailManifest,
  RailManifestContainer,
} from '../types/transport';
