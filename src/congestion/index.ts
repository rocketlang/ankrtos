// Congestion & Hotspot Management Exports
export {
  CongestionEngine,
  getCongestionEngine,
  setCongestionEngine,
  type RegisterCongestionZoneInput,
  type RecordCongestionReadingInput,
  type CreateTrafficActionInput,
} from './congestion-engine';

// Re-export congestion types
export type {
  CongestionZone,
  CongestionZoneType,
  CongestionLevel,
  CongestionReading,
  CongestionAlert,
  CongestionAlertSeverity,
  TrafficAction,
  TrafficActionType,
  CongestionStats,
} from '../types/congestion';
