// Inspection & QC types for ankrICD
// Container survey, customs examination, cargo quality control

import type { UUID, AuditFields, TenantEntity, Attachment } from './common';

// ============================================================================
// CONTAINER SURVEY
// ============================================================================

export type SurveyType =
  | 'pre_stuffing'
  | 'de_stuffing'
  | 'empty_return'
  | 'damage_assessment'
  | 'reefer_pti'
  | 'periodic';

export type SurveyStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type SurveyResult = 'pass' | 'fail' | 'conditional_pass';

export type DamageType =
  | 'dent'
  | 'hole'
  | 'rust'
  | 'bent_door'
  | 'damaged_floor'
  | 'damaged_roof'
  | 'damaged_seal'
  | 'missing_parts'
  | 'contamination'
  | 'water_damage'
  | 'structural'
  | 'other';

export type DamageSeverity = 'minor' | 'moderate' | 'major' | 'critical';

export type DamageLocation =
  | 'front_wall'
  | 'rear_wall'
  | 'left_wall'
  | 'right_wall'
  | 'roof'
  | 'floor'
  | 'door_left'
  | 'door_right'
  | 'corner_casting'
  | 'underframe'
  | 'reefer_unit';

export interface ContainerSurvey extends TenantEntity, AuditFields {
  id: UUID;
  surveyNumber: string;
  surveyType: SurveyType;
  status: SurveyStatus;
  result?: SurveyResult;

  // Container
  containerId: UUID;
  containerNumber: string;
  isoType: string;

  // Scheduling
  scheduledDate: Date;
  scheduledTime?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;

  // Surveyor
  surveyorId?: string;
  surveyorName?: string;
  surveyorCompany?: string;

  // Physical checks
  externalCondition?: 'good' | 'fair' | 'poor';
  internalCondition?: 'good' | 'fair' | 'poor';
  doorOperation?: 'smooth' | 'stiff' | 'damaged';
  floorCondition?: 'good' | 'fair' | 'poor';
  roofCondition?: 'good' | 'fair' | 'poor';
  sealIntact?: boolean;
  sealNumber?: string;
  cleanlinessRating?: number; // 1-5

  // Reefer specific
  reeferFunctional?: boolean;
  reeferTemperature?: number;
  reeferSetPoint?: number;
  reeferHumidity?: number;
  reeferSupplyAirTemp?: number;
  reeferReturnAirTemp?: number;
  compressorWorking?: boolean;
  defrostWorking?: boolean;

  // Damages
  damages: DamageEntry[];
  hasDamage: boolean;
  estimatedRepairCost?: number;
  repairRequired: boolean;

  // Attachments
  photos: Attachment[];
  reportPdf?: Attachment;

  // Remarks
  remarks?: string;
  recommendations?: string;
}

export interface DamageEntry {
  id: UUID;
  damageType: DamageType;
  severity: DamageSeverity;
  location: DamageLocation;
  description: string;
  dimensions?: string;
  photoIds: string[];
  repairEstimate?: number;
}

// ============================================================================
// CUSTOMS EXAMINATION
// ============================================================================

export type InspectionExamType =
  | 'first_check'
  | 'second_check'
  | 'percentage_check'
  | 're_examination'
  | 'special_valuation'
  | 'sample_drawing'
  | 'vacis_scan';

export type ExaminationStatus =
  | 'ordered'
  | 'scheduled'
  | 'officer_assigned'
  | 'in_progress'
  | 'sample_sent'
  | 'awaiting_results'
  | 'completed'
  | 'cancelled';

export type ExaminationFinding = 'no_discrepancy' | 'minor_discrepancy' | 'major_discrepancy' | 'contraband' | 'misclassified';

export interface CustomsExam extends TenantEntity, AuditFields {
  id: UUID;
  examNumber: string;
  examType: InspectionExamType;
  status: ExaminationStatus;

  // Reference
  boeNumber?: string;
  sbNumber?: string;
  containerId: UUID;
  containerNumber: string;

  // Scheduling
  orderedDate: Date;
  orderedBy: string; // customs officer name/id
  scheduledDate?: Date;
  scheduledTime?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  durationMinutes?: number;

  // Officer
  examiningOfficerId?: string;
  examiningOfficerName?: string;
  examiningOfficerDesignation?: string;
  supervisorId?: string;
  supervisorName?: string;

  // Examination details
  percentageChecked?: number;
  packagesExamined?: number;
  totalPackages?: number;

  // Findings
  finding?: ExaminationFinding;
  findingDetails?: string;
  declaredDescription?: string;
  actualDescription?: string;
  declaredQuantity?: number;
  actualQuantity?: number;
  declaredValue?: number;
  assessedValue?: number;
  hsnDeclared?: string;
  hsnAssessed?: string;

  // Sample
  sampleDrawn: boolean;
  sampleDescription?: string;
  sampleSentTo?: string;
  sampleSentDate?: Date;
  labReportDate?: Date;
  labReportResult?: string;

  // Photos/docs
  photos: Attachment[];
  reportPdf?: Attachment;

  // Remarks
  remarks?: string;
  customsRemarks?: string;
}

// ============================================================================
// CARGO QC (QUALITY CONTROL)
// ============================================================================

export type QCCheckType =
  | 'weight_verification'
  | 'dimension_check'
  | 'temperature_check'
  | 'fumigation'
  | 'phytosanitary'
  | 'vgm_verification'
  | 'hazmat_check'
  | 'general_quality';

export type QCStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'on_hold' | 'waived';

export interface CargoQCCheck extends TenantEntity, AuditFields {
  id: UUID;
  checkNumber: string;
  checkType: QCCheckType;
  status: QCStatus;

  // Container
  containerId: UUID;
  containerNumber: string;

  // Weight verification
  declaredGrossWeight?: number;
  actualGrossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  weightVarianceKg?: number;
  weightVariancePercent?: number;
  vgmCertified?: boolean;
  vgmMethod?: 'method1' | 'method2'; // SOLAS

  // Dimensions
  declaredLength?: number;
  declaredWidth?: number;
  declaredHeight?: number;
  actualLength?: number;
  actualWidth?: number;
  actualHeight?: number;
  isOversize: boolean;
  isOutOfGauge: boolean;

  // Temperature (reefer)
  requiredTemperature?: number;
  actualTemperature?: number;
  temperatureVariance?: number;
  temperatureAcceptable?: boolean;

  // Fumigation
  fumigationRequired: boolean;
  fumigationType?: string;
  fumigationDate?: Date;
  fumigationCertNumber?: string;
  fumigationExpiryDate?: Date;
  fumigationAgent?: string;

  // Phytosanitary
  phytosanitaryRequired: boolean;
  phytosanitaryCertNumber?: string;
  phytosanitaryIssueDate?: Date;
  phytosanitaryIssuingAuthority?: string;

  // Hazmat
  isHazmat: boolean;
  unNumber?: string;
  imdgClass?: string;
  properShippingName?: string;
  packingGroup?: string;
  flashPoint?: number;
  emergencyContact?: string;

  // Inspector
  inspectorId?: string;
  inspectorName?: string;
  inspectedAt?: Date;

  // Result
  passedChecks: string[];
  failedChecks: string[];
  holdReason?: string;
  holdPlacedBy?: string;
  holdReleasedBy?: string;
  holdReleasedAt?: Date;

  remarks?: string;
  photos: Attachment[];
}

// ============================================================================
// STATS
// ============================================================================

export interface InspectionStats {
  tenantId: string;

  // Surveys
  totalSurveys: number;
  completedSurveys: number;
  pendingSurveys: number;
  passRate: number; // percentage
  failRate: number;
  surveysToday: number;
  averageSurveyDurationMinutes: number;

  // Customs exams
  totalExams: number;
  completedExams: number;
  pendingExams: number;
  examsToday: number;
  noDiscrepancyRate: number;
  discrepancyRate: number;
  averageExamDurationMinutes: number;

  // QC checks
  totalQCChecks: number;
  passedQCChecks: number;
  failedQCChecks: number;
  onHoldQCChecks: number;
  qcChecksToday: number;
  qcPassRate: number;

  // Damage tracking
  totalDamagesReported: number;
  criticalDamages: number;
  pendingRepairs: number;
  totalRepairCost: number;
}
