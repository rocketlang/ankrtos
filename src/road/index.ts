// Road Transport Exports
// Truck appointments, E-way bill integration, Transporter management

export const RoadEngineVersion = '1.0.0';

// Road Engine
export {
  RoadEngine,
  getRoadEngine,
  setRoadEngine,
  type RegisterTransporterInput,
  type TransporterQueryOptions,
  type CreateTruckAppointmentInput,
  type AppointmentQueryOptions,
  type RegisterEWayBillInput,
  type EWayBillQueryOptions,
  type PartBUpdateInput,
  type EWayBillValidationResult,
  type RecordTruckVisitInput,
  type RoadTransportStats,
  type TimeSlot,
} from './road-engine';

// Transport types for Road
export type {
  TruckAppointment,
  AppointmentStatus,
  AppointmentContainer,
  Transporter,
  TruckVisit,
  EWayBill,
  EWayBillPartBUpdate,
} from '../types/transport';
