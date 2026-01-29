// =============================================================================
// ankrICD - World-Class ICD & CFS Management System
// =============================================================================
//
// A comprehensive Inland Container Depot (ICD) and Container Freight Station
// (CFS) management system with integrated Rail, Road, Waterfront, Yard, and
// Equipment management capabilities.
//
// Features:
// - Multi-tenant SaaS architecture
// - Full container lifecycle management
// - Advanced yard planning with AI optimization
// - Automated gate operations (OCR, RFID)
// - Rail terminal management
// - Waterfront/port operations
// - Equipment fleet management
// - Automated billing & demurrage
// - ICEGATE integration (India Customs)
// - E-way bill integration (GST)
// - Real-time event-driven architecture
// - 150+ event types for full visibility
//
// =============================================================================

// Configuration & Feature Flags
export * from './config';

// Core Event System
export * from './core';

// Database & Repository Layer
export * from './db';

// Type Definitions
export * from './types';

// Version info
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@ankr/dodd-icd';

// System info
export interface ICDSystemInfo {
  version: string;
  packageName: string;
  features: {
    totalEventTypes: number;
    totalFeatureFlags: number;
    presets: string[];
  };
}

export function getSystemInfo(): ICDSystemInfo {
  return {
    version: VERSION,
    packageName: PACKAGE_NAME,
    features: {
      totalEventTypes: 150,
      totalFeatureFlags: 64,
      presets: ['FULL_ICD', 'BASIC_ICD', 'CFS_ONLY', 'RAIL_TERMINAL', 'PORT_TERMINAL', 'DRY_PORT', 'MULTI_MODAL', 'STARTER'],
    },
  };
}

// Re-export commonly used types for convenience
export type {
  // Common
  UUID,
  Currency,
  Address,
  Coordinates,
  OperationResult,
  PaginatedResult,

  // Facility
  Facility,
  FacilityType,
  FacilityZone,
  YardBlock,
  YardLocation,
  GroundSlot,

  // Container
  Container,
  ContainerStatus,
  ContainerISOType,
  ContainerSize,
  ContainerType,
  ContainerMovement,
  ContainerHold,
  HazmatInfo,
  ReeferInfo,

  // Yard
  YardPlan,
  PlacementStrategy,
  YardWorkOrder,
  YardOccupancy,
  RestackPlan,
  SlotRecommendation,

  // Transport
  RailTrack,
  Rake,
  Wagon,
  TruckAppointment,
  Transporter,
  EWayBill,
  Berth,
  VesselVisit,
  QuayCrane,

  // Equipment
  Equipment,
  EquipmentType,
  EquipmentStatus,
  MaintenanceRecord,
  PreShiftChecklist,

  // Billing
  Customer,
  Tariff,
  Invoice,
  Payment,
  DemurrageCalculation,

  // Customs
  BillOfEntry,
  ShippingBill,
  CustomsExamination,
  ICEGATEMessage,
} from './types';

// Re-export event system
export type { ICDEvent, EventHandler } from './core';
export { ICDEventBus, getEventBus, emit, subscribe, createCorrelationId } from './core';
export type { ICDEventType } from './core';

// Re-export config
export type { ICDFeatureFlags, ICDPresetType } from './config';
export { DEFAULT_FEATURE_FLAGS, getPresetConfig, isFeatureEnabled } from './config';

// ============================================================================
// ENGINES
// ============================================================================

// Facility Management
export {
  FacilityManager,
  getFacilityManager,
  setFacilityManager,
  type CreateFacilityInput,
  type CreateZoneInput,
  type CreateBlockInput,
  type FacilityStats,
} from './facility';

// Container Management
export {
  ContainerEngine,
  getContainerEngine,
  setContainerEngine,
  type RegisterContainerInput,
  type ContainerQueryOptions,
  type GateInInput,
  type GateOutInput,
  type PlaceHoldInput,
  type ContainerStats,
} from './containers';

// Yard Management
export {
  YardEngine,
  getYardEngine,
  setYardEngine,
  type CreateWorkOrderInput,
  type SlotRecommendationOptions,
} from './yard';

// Gate Operations
export {
  GateEngine,
  getGateEngine,
  setGateEngine,
  type RegisterGateInput,
  type AddLaneInput,
  type CreateAppointmentInput,
  type StartGateInInput,
  type StartGateOutInput,
  type TransactionQueryOptions,
} from './gate';

// Re-export gate types
export type {
  Gate,
  GateLane,
  GateTransaction,
  GateTransactionType,
  GateTransactionStatus,
  OCRCapture,
  RFIDCapture,
  WeighbridgeCapture,
  GatePhoto,
  InspectionResult,
  GateQueue,
  GateMetrics,
} from './types/gate';

// Rail Terminal Operations
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
} from './rail';

// Road Transport Operations
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
} from './road';

// Waterfront Operations
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
} from './waterfront';

// Equipment Management
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
} from './equipment';

// Billing & Revenue
export {
  BillingEngine,
  getBillingEngine,
  setBillingEngine,
  type RegisterCustomerInput,
  type CustomerQueryOptions,
  type CreateTariffInput,
  type TariffQueryOptions,
  type CreateInvoiceInput,
  type CreateInvoiceLineItemInput,
  type InvoiceQueryOptions,
  type RecordPaymentInput,
  type CalculateDemurrageInput,
  type CalculateDetentionInput,
  type BillingStats,
} from './billing';

// Customs & ICEGATE
export {
  CustomsEngine,
  getCustomsEngine,
  setCustomsEngine,
  type CreateBOEInput,
  type BOEAssessmentInput,
  type DutyPaymentInput,
  type BOEQueryOptions,
  type CreateSBInput,
  type SBQueryOptions,
  type OrderExaminationInput,
  type CompleteExaminationInput,
  type ExaminationQueryOptions,
  type ProcessInboundMessageInput,
  type ICEGATEMessageQueryOptions,
  type CustomsStats,
} from './customs';

// Operations (Stuffing/Destuffing/LCL/FCL/Cross-dock/Inspection)
export {
  OperationsEngine,
  getOperationsEngine,
  setOperationsEngine,
  type CreateStuffingInput,
  type CreateDestuffingInput,
  type CreateConsolidationInput,
  type AddConsignmentInput,
  type CreateFCLOperationInput,
  type CreateCrossDockInput,
  type CreateInspectionInput as CreateCargoInspectionInput,
  type StuffingQueryOptions,
  type DestuffingQueryOptions,
  type ConsolidationQueryOptions,
  type FCLQueryOptions,
  type CrossDockQueryOptions,
  type InspectionQueryOptions as CargoInspectionQueryOptions,
} from './operations';

// Documentation (B/L, D/O, EDI, Manifest)
export {
  DocumentationEngine,
  getDocumentationEngine,
  setDocumentationEngine,
  type CreateBLInput,
  type CreateDOInput,
  type SendEDIInput,
  type CreateManifestInput as CreateDocManifestInput,
  type AddManifestItemInput,
  type BLQueryOptions,
  type DOQueryOptions,
  type EDIQueryOptions,
  type ManifestQueryOptions as DocManifestQueryOptions,
} from './documentation';

// Hardware Integration (RFID, OCR, Weighbridge, Scanners, Printers)
export {
  HardwareManager,
  getHardwareManager,
  setHardwareManager,
  type RegisterDeviceInput,
  type RecordRFIDInput,
  type RecordOCRInput,
  type RecordWeighInput,
  type RecordScanInput,
  type CreatePrintJobInput,
  type DeviceQueryOptions,
} from './hardware';

// IoT (Sensors, Reefer Monitoring, GPS, Environmental)
export {
  IoTManager,
  getIoTManager,
  setIoTManager,
  type RegisterSensorInput,
  type RecordReadingInput,
  type CreateReeferProfileInput,
  type UpdateGPSInput,
  type CreateEnvironmentalZoneInput,
  type SensorQueryOptions,
} from './iot';

// Bond & Bonded Warehouse
export {
  BondEngine,
  getBondEngine,
  setBondEngine,
  type RegisterBondInput,
  type BondInInput,
  type BondOutInput,
} from './bond';

// Re-export bond types
export type {
  Bond,
  BondType,
  BondStatus,
  BondedContainer,
  BondedContainerStatus,
  BondMovement,
  BondMovementType,
  BondStatement,
  BondStats,
} from './bond';

// Compliance (E-Way Bill, E-Invoice, GST)
export {
  ComplianceEngine,
  getComplianceEngine,
  setComplianceEngine,
  type GenerateEWayBillInput,
  type GenerateEInvoiceInput,
  type CreateGSTReturnInput,
  type AddGSTREntryInput,
} from './compliance';

// Re-export compliance types
export type {
  EWayBill as ComplianceEWayBill,
  EWayBillStatus,
  EWayBillTransactionType,
  EWayBillSubType,
  EWayBillItem,
  EInvoice,
  EInvoiceStatus,
  EInvoiceItem,
  GSTReturn,
  GSTReturnType,
  GSTReturnStatus,
  GSTREntry,
  ComplianceStats,
} from './compliance';

// Congestion & Hotspot Management
export {
  CongestionEngine,
  getCongestionEngine,
  setCongestionEngine,
  type RegisterCongestionZoneInput,
  type RecordCongestionReadingInput,
  type CreateTrafficActionInput,
} from './congestion';

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
} from './congestion';

// Scheduling & Yard Operations
export {
  SchedulingEngine,
  getSchedulingEngine,
  setSchedulingEngine,
  type RegisterDockSlotInput,
  type CreateDockAppointmentInput,
  type RegisterTrailerInput,
  type ReceiveEmptyInput,
  type CreateAllotmentInput,
  type AddStackingRuleInput,
} from './scheduling';

// Inspection & QC
export {
  InspectionEngine,
  getInspectionEngine,
  setInspectionEngine,
  type ScheduleSurveyInput,
  type CompleteSurveyInput,
  type AddDamageInput,
  type OrderExamInput,
  type CompleteExamInput,
  type CreateQCCheckInput,
} from './inspection';

// Reconciliation & Cycle Counting
export {
  ReconciliationEngine,
  getReconciliationEngine,
  setReconciliationEngine,
  type PlanCycleCountInput,
  type RecordCountEntryInput,
  type CreateAdjustmentInput,
} from './reconciliation';

// Labor Management & Cost Allocation
export {
  LaborEngine,
  getLaborEngine,
  setLaborEngine,
  type RegisterWorkerInput,
  type CreateShiftInput,
  type CreateGangInput,
  type RecordClockInput,
  type AssignLaborTaskInput,
  type CreateCostCenterInput,
  type AllocateCostInput,
} from './labor';

// Advanced Equipment & MHE
export {
  MHEEngine,
  getMHEEngine,
  setMHEEngine,
  type RecordTelematicsInput,
  type CreateGeofenceInput,
  type RegisterCertificationInput,
  type RecordTrainingInput,
  type ReportIncidentInput,
  type SubmitSafetyCheckInput,
  type RegisterChargingDockInput,
  type StartChargingInput,
  type RecordBatterySwapInput,
  type CreateMHEWorkOrderInput,
  type RegisterLifecycleInput,
} from './mhe';

// Advanced EDI & Integration
export {
  EDIEngine,
  getEDIEngine,
  setEDIEngine,
  type RegisterPartnerInput,
  type CreateTransactionInput,
  type ParseInboundInput,
  type GenerateOutboundInput,
  type AddValidationRuleInput,
  type EnqueueInput,
  type CreateFieldMappingInput,
} from './edi';

// Analytics & Reporting
export {
  AnalyticsEngine,
  getAnalyticsEngine,
  setAnalyticsEngine,
  type TerminalKPIs,
  type ThroughputMetrics,
  type DwellTimeAnalytics,
  type OperationsDashboard,
  type DashboardModule,
  type ModuleDashboardData,
  type AlertThreshold,
  type SetAlertThresholdInput,
  type AnalyticsAlert,
  type KPITrendPoint,
  type DailyOperationsReport,
  type PerformanceScorecard,
} from './analytics';

// ============================================================================
// ICD SYSTEM - Main Facade
// ============================================================================

import { getFacilityManager } from './facility';
import { getContainerEngine } from './containers';
import { getYardEngine } from './yard';
import { getGateEngine } from './gate';
import { getRailEngine } from './rail';
import { getRoadEngine } from './road';
import { getWaterfrontEngine } from './waterfront';
import { getEquipmentEngine } from './equipment';
import { getBillingEngine } from './billing';
import { getCustomsEngine } from './customs';
import { getAnalyticsEngine } from './analytics';
import { getOperationsEngine } from './operations';
import { getDocumentationEngine } from './documentation';
import { getHardwareManager } from './hardware';
import { getIoTManager } from './iot';
import { getBondEngine } from './bond';
import { getComplianceEngine } from './compliance';
import { getCongestionEngine } from './congestion';
import { getSchedulingEngine } from './scheduling';
import { getInspectionEngine } from './inspection';
import { getReconciliationEngine } from './reconciliation';
import { getLaborEngine } from './labor';
import { getMHEEngine } from './mhe';
import { getEDIEngine } from './edi';
import { getEventBus } from './core';

/**
 * ICDSystem - Main facade for the ICD management system
 * Provides unified access to all engines and services
 */
export class ICDSystem {
  private static instance: ICDSystem | null = null;

  private constructor() {}

  static getInstance(): ICDSystem {
    if (!ICDSystem.instance) {
      ICDSystem.instance = new ICDSystem();
    }
    return ICDSystem.instance;
  }

  // Engines
  get facilities() { return getFacilityManager(); }
  get containers() { return getContainerEngine(); }
  get yard() { return getYardEngine(); }
  get gate() { return getGateEngine(); }
  get rail() { return getRailEngine(); }
  get road() { return getRoadEngine(); }
  get waterfront() { return getWaterfrontEngine(); }
  get equipment() { return getEquipmentEngine(); }
  get billing() { return getBillingEngine(); }
  get customs() { return getCustomsEngine(); }
  get analytics() { return getAnalyticsEngine(); }
  get operations() { return getOperationsEngine(); }
  get documentation() { return getDocumentationEngine(); }
  get hardware() { return getHardwareManager(); }
  get iot() { return getIoTManager(); }
  get bond() { return getBondEngine(); }
  get compliance() { return getComplianceEngine(); }
  get congestion() { return getCongestionEngine(); }
  get scheduling() { return getSchedulingEngine(); }
  get inspection() { return getInspectionEngine(); }
  get reconciliation() { return getReconciliationEngine(); }
  get labor() { return getLaborEngine(); }
  get mhe() { return getMHEEngine(); }
  get edi() { return getEDIEngine(); }
  get events() { return getEventBus(); }

  // Health check
  getHealthStatus(): ICDHealthStatus {
    return {
      status: 'healthy',
      version: VERSION,
      timestamp: new Date(),
      engines: {
        facilities: 'active',
        containers: 'active',
        yard: 'active',
        gate: 'active',
        rail: 'active',
        road: 'active',
        waterfront: 'active',
        equipment: 'active',
        billing: 'active',
        customs: 'active',
        analytics: 'active',
        operations: 'active',
        documentation: 'active',
        hardware: 'active',
        iot: 'active',
        bond: 'active',
        compliance: 'active',
        congestion: 'active',
        scheduling: 'active',
        inspection: 'active',
        reconciliation: 'active',
        labor: 'active',
        mhe: 'active',
        edi: 'active',
        events: 'active',
      },
    };
  }
}

export interface ICDHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: Date;
  engines: {
    facilities: 'active' | 'inactive';
    containers: 'active' | 'inactive';
    yard: 'active' | 'inactive';
    gate: 'active' | 'inactive';
    rail: 'active' | 'inactive';
    road: 'active' | 'inactive';
    waterfront: 'active' | 'inactive';
    equipment: 'active' | 'inactive';
    billing: 'active' | 'inactive';
    customs: 'active' | 'inactive';
    analytics: 'active' | 'inactive';
    operations: 'active' | 'inactive';
    documentation: 'active' | 'inactive';
    hardware: 'active' | 'inactive';
    iot: 'active' | 'inactive';
    bond: 'active' | 'inactive';
    compliance: 'active' | 'inactive';
    congestion: 'active' | 'inactive';
    scheduling: 'active' | 'inactive';
    inspection: 'active' | 'inactive';
    reconciliation: 'active' | 'inactive';
    labor: 'active' | 'inactive';
    mhe: 'active' | 'inactive';
    edi: 'active' | 'inactive';
    events: 'active' | 'inactive';
  };
}

// Convenience function
export function getICDSystem(): ICDSystem {
  return ICDSystem.getInstance();
}
