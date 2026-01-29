// Equipment Management Exports
export {
  EquipmentEngine,
  getEquipmentEngine,
  setEquipmentEngine,
  type RegisterEquipmentInput,
  type EquipmentQueryOptions,
  type AssignEquipmentInput,
  type AssignmentQueryOptions,
  type ScheduleMaintenanceInput,
  type CompleteMaintenanceInput,
  type MaintenanceQueryOptions,
  type SubmitChecklistInput,
  type TelematicsUpdate,
  type EquipmentFleetStats,
} from './equipment-engine';

// Re-export equipment types
export type {
  Equipment,
  EquipmentType,
  EquipmentStatus,
  MaintenanceRecord,
  MaintenanceType,
  EquipmentAssignment,
  PreShiftChecklist,
  ChecklistItem,
  EquipmentUtilization,
  FuelType,
  EquipmentTelematics,
  TelematicsAlert,
  EquipmentCertification,
} from '../types/equipment';

export { CHECKLIST_ITEMS } from '../types/equipment';
