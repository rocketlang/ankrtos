// Inspection & QC Engine for ankrICD
// Container surveys, customs examinations, cargo quality control checks

import { v4 as uuidv4 } from 'uuid';
import type { UUID, OperationResult } from '../types/common';
import type {
  ContainerSurvey,
  SurveyType,
  SurveyStatus,
  SurveyResult,
  DamageEntry,
  DamageType,
  DamageSeverity,
  DamageLocation,
  CustomsExam,
  InspectionExamType,
  ExaminationStatus,
  ExaminationFinding,
  CargoQCCheck,
  QCCheckType,
  QCStatus,
  InspectionStats,
} from '../types/inspection';
import { emit } from '../core';

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface ScheduleSurveyInput {
  tenantId: string;
  facilityId: string;
  surveyType: SurveyType;
  containerId: UUID;
  containerNumber: string;
  isoType: string;
  scheduledDate: Date;
  scheduledTime?: string;
  surveyorCompany?: string;
  remarks?: string;
}

export interface CompleteSurveyInput {
  result: SurveyResult;
  externalCondition?: 'good' | 'fair' | 'poor';
  internalCondition?: 'good' | 'fair' | 'poor';
  doorOperation?: 'smooth' | 'stiff' | 'damaged';
  floorCondition?: 'good' | 'fair' | 'poor';
  roofCondition?: 'good' | 'fair' | 'poor';
  sealIntact?: boolean;
  sealNumber?: string;
  cleanlinessRating?: number;
  reeferFunctional?: boolean;
  reeferTemperature?: number;
  reeferSetPoint?: number;
  reeferHumidity?: number;
  reeferSupplyAirTemp?: number;
  reeferReturnAirTemp?: number;
  compressorWorking?: boolean;
  defrostWorking?: boolean;
  estimatedRepairCost?: number;
  remarks?: string;
  recommendations?: string;
}

export interface AddDamageInput {
  damageType: DamageType;
  severity: DamageSeverity;
  location: DamageLocation;
  description: string;
  dimensions?: string;
  photoIds?: string[];
  repairEstimate?: number;
}

export interface OrderExamInput {
  tenantId: string;
  facilityId: string;
  examType: InspectionExamType;
  containerId: UUID;
  containerNumber: string;
  boeNumber?: string;
  sbNumber?: string;
  orderedBy: string;
  totalPackages?: number;
  declaredDescription?: string;
  declaredQuantity?: number;
  declaredValue?: number;
  hsnDeclared?: string;
  remarks?: string;
}

export interface CompleteExamInput {
  finding: ExaminationFinding;
  findingDetails?: string;
  percentageChecked?: number;
  packagesExamined?: number;
  actualDescription?: string;
  actualQuantity?: number;
  assessedValue?: number;
  hsnAssessed?: string;
  customsRemarks?: string;
}

export interface CreateQCCheckInput {
  tenantId: string;
  facilityId: string;
  checkType: QCCheckType;
  containerId: UUID;
  containerNumber: string;
  declaredGrossWeight?: number;
  declaredLength?: number;
  declaredWidth?: number;
  declaredHeight?: number;
  requiredTemperature?: number;
  fumigationRequired?: boolean;
  phytosanitaryRequired?: boolean;
  isHazmat?: boolean;
  unNumber?: string;
  imdgClass?: string;
  properShippingName?: string;
  packingGroup?: string;
  flashPoint?: number;
  emergencyContact?: string;
  remarks?: string;
}

// ============================================================================
// INSPECTION ENGINE
// ============================================================================

export class InspectionEngine {
  private static instance: InspectionEngine | null = null;

  // Primary storage
  private surveys: Map<UUID, ContainerSurvey> = new Map();
  private exams: Map<UUID, CustomsExam> = new Map();
  private qcChecks: Map<UUID, CargoQCCheck> = new Map();

  // Indexes
  private surveyByNumber: Map<string, UUID> = new Map();
  private examByNumber: Map<string, UUID> = new Map();
  private qcByNumber: Map<string, UUID> = new Map();

  // Counters for sequential numbering
  private surveyCounter = 0;
  private examCounter = 0;
  private qcCounter = 0;

  private constructor() {}

  static getInstance(): InspectionEngine {
    if (!InspectionEngine.instance) {
      InspectionEngine.instance = new InspectionEngine();
    }
    return InspectionEngine.instance;
  }

  static resetInstance(): void {
    InspectionEngine.instance = null;
  }

  // ============================================================================
  // CONTAINER SURVEY
  // ============================================================================

  /**
   * Schedule a new container survey.
   * Auto-generates a sequential survey number (SRV-001, SRV-002, ...).
   */
  scheduleSurvey(input: ScheduleSurveyInput): OperationResult<ContainerSurvey> {
    this.surveyCounter++;
    const surveyNumber = `SRV-${String(this.surveyCounter).padStart(3, '0')}`;

    const now = new Date();
    const survey: ContainerSurvey = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      surveyNumber,
      surveyType: input.surveyType,
      status: 'scheduled',

      containerId: input.containerId,
      containerNumber: input.containerNumber,
      isoType: input.isoType,

      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,

      surveyorCompany: input.surveyorCompany,

      damages: [],
      hasDamage: false,
      repairRequired: false,
      photos: [],

      remarks: input.remarks,

      createdAt: now,
      updatedAt: now,
    };

    this.surveys.set(survey.id, survey);
    this.surveyByNumber.set(surveyNumber, survey.id);

    emit('inspection.survey_scheduled', {
      surveyId: survey.id,
      surveyNumber,
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      surveyType: input.surveyType,
    }, { tenantId: input.tenantId });

    return { success: true, data: survey };
  }

  /**
   * Retrieve a survey by its ID.
   */
  getSurvey(id: UUID): ContainerSurvey | undefined {
    return this.surveys.get(id);
  }

  /**
   * Retrieve a survey by its survey number.
   */
  getSurveyByNumber(num: string): ContainerSurvey | undefined {
    const id = this.surveyByNumber.get(num);
    return id ? this.surveys.get(id) : undefined;
  }

  /**
   * List surveys filtered by tenant, and optionally by status and type.
   */
  listSurveys(tenantId: string, status?: SurveyStatus, type?: SurveyType): ContainerSurvey[] {
    let results = Array.from(this.surveys.values()).filter(s => s.tenantId === tenantId);
    if (status) results = results.filter(s => s.status === status);
    if (type) results = results.filter(s => s.surveyType === type);
    return results;
  }

  /**
   * Start a scheduled survey by assigning a surveyor and recording the actual start time.
   */
  startSurvey(id: UUID, surveyorId: string, surveyorName: string): OperationResult<ContainerSurvey> {
    const survey = this.surveys.get(id);
    if (!survey) {
      return { success: false, error: 'Survey not found', errorCode: 'NOT_FOUND' };
    }

    if (survey.status !== 'scheduled') {
      return { success: false, error: 'Survey is not in scheduled status', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    survey.status = 'in_progress';
    survey.surveyorId = surveyorId;
    survey.surveyorName = surveyorName;
    survey.actualStartTime = now;
    survey.updatedAt = now;

    emit('inspection.survey_started', {
      surveyId: survey.id,
      surveyNumber: survey.surveyNumber,
      surveyorId,
      surveyorName,
    }, { tenantId: survey.tenantId });

    return { success: true, data: survey };
  }

  /**
   * Complete a survey with full condition assessment results.
   * Automatically calculates hasDamage and repairRequired based on conditions and damages.
   */
  completeSurvey(id: UUID, input: CompleteSurveyInput): OperationResult<ContainerSurvey> {
    const survey = this.surveys.get(id);
    if (!survey) {
      return { success: false, error: 'Survey not found', errorCode: 'NOT_FOUND' };
    }

    if (survey.status !== 'in_progress') {
      return { success: false, error: 'Survey is not in progress', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    survey.status = 'completed';
    survey.result = input.result;
    survey.actualEndTime = now;

    // Physical conditions
    survey.externalCondition = input.externalCondition;
    survey.internalCondition = input.internalCondition;
    survey.doorOperation = input.doorOperation;
    survey.floorCondition = input.floorCondition;
    survey.roofCondition = input.roofCondition;
    survey.sealIntact = input.sealIntact;
    survey.sealNumber = input.sealNumber;
    survey.cleanlinessRating = input.cleanlinessRating;

    // Reefer data
    survey.reeferFunctional = input.reeferFunctional;
    survey.reeferTemperature = input.reeferTemperature;
    survey.reeferSetPoint = input.reeferSetPoint;
    survey.reeferHumidity = input.reeferHumidity;
    survey.reeferSupplyAirTemp = input.reeferSupplyAirTemp;
    survey.reeferReturnAirTemp = input.reeferReturnAirTemp;
    survey.compressorWorking = input.compressorWorking;
    survey.defrostWorking = input.defrostWorking;

    // Repair cost
    survey.estimatedRepairCost = input.estimatedRepairCost;
    survey.remarks = input.remarks ?? survey.remarks;
    survey.recommendations = input.recommendations;

    // Calculate damage flags
    survey.hasDamage = survey.damages.length > 0;
    survey.repairRequired = survey.hasDamage ||
      input.result === 'fail' ||
      input.externalCondition === 'poor' ||
      input.internalCondition === 'poor' ||
      input.doorOperation === 'damaged' ||
      input.floorCondition === 'poor' ||
      input.roofCondition === 'poor';

    survey.updatedAt = now;

    emit('inspection.survey_completed', {
      surveyId: survey.id,
      surveyNumber: survey.surveyNumber,
      containerId: survey.containerId,
      containerNumber: survey.containerNumber,
      result: input.result,
      hasDamage: survey.hasDamage,
      repairRequired: survey.repairRequired,
    }, { tenantId: survey.tenantId });

    return { success: true, data: survey };
  }

  /**
   * Add a damage entry to a survey. The survey must be in progress.
   * Updates hasDamage and repairRequired flags accordingly.
   */
  addDamageEntry(surveyId: UUID, input: AddDamageInput): OperationResult<ContainerSurvey> {
    const survey = this.surveys.get(surveyId);
    if (!survey) {
      return { success: false, error: 'Survey not found', errorCode: 'NOT_FOUND' };
    }

    if (survey.status !== 'in_progress' && survey.status !== 'scheduled') {
      return { success: false, error: 'Cannot add damage to a completed or cancelled survey', errorCode: 'INVALID_STATUS' };
    }

    const damage: DamageEntry = {
      id: uuidv4(),
      damageType: input.damageType,
      severity: input.severity,
      location: input.location,
      description: input.description,
      dimensions: input.dimensions,
      photoIds: input.photoIds ?? [],
      repairEstimate: input.repairEstimate,
    };

    survey.damages.push(damage);
    survey.hasDamage = true;
    survey.repairRequired = true;
    survey.updatedAt = new Date();

    emit('inspection.damage_reported', {
      surveyId: survey.id,
      surveyNumber: survey.surveyNumber,
      containerId: survey.containerId,
      containerNumber: survey.containerNumber,
      damageId: damage.id,
      damageType: input.damageType,
      severity: input.severity,
      location: input.location,
    }, { tenantId: survey.tenantId });

    return { success: true, data: survey };
  }

  /**
   * Cancel a scheduled or in-progress survey.
   */
  cancelSurvey(id: UUID, reason: string): OperationResult<ContainerSurvey> {
    const survey = this.surveys.get(id);
    if (!survey) {
      return { success: false, error: 'Survey not found', errorCode: 'NOT_FOUND' };
    }

    if (survey.status === 'completed' || survey.status === 'cancelled') {
      return { success: false, error: 'Cannot cancel a completed or already cancelled survey', errorCode: 'INVALID_STATUS' };
    }

    survey.status = 'cancelled';
    survey.remarks = reason;
    survey.updatedAt = new Date();

    return { success: true, data: survey };
  }

  // ============================================================================
  // CUSTOMS EXAMINATION
  // ============================================================================

  /**
   * Order a new customs examination.
   * Auto-generates a sequential exam number (EXM-001, EXM-002, ...).
   */
  orderExamination(input: OrderExamInput): OperationResult<CustomsExam> {
    this.examCounter++;
    const examNumber = `EXM-${String(this.examCounter).padStart(3, '0')}`;

    const now = new Date();
    const exam: CustomsExam = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      examNumber,
      examType: input.examType,
      status: 'ordered',

      boeNumber: input.boeNumber,
      sbNumber: input.sbNumber,
      containerId: input.containerId,
      containerNumber: input.containerNumber,

      orderedDate: now,
      orderedBy: input.orderedBy,

      totalPackages: input.totalPackages,

      declaredDescription: input.declaredDescription,
      declaredQuantity: input.declaredQuantity,
      declaredValue: input.declaredValue,
      hsnDeclared: input.hsnDeclared,

      sampleDrawn: false,
      photos: [],

      remarks: input.remarks,

      createdAt: now,
      updatedAt: now,
    };

    this.exams.set(exam.id, exam);
    this.examByNumber.set(examNumber, exam.id);

    emit('inspection.exam_ordered', {
      examId: exam.id,
      examNumber,
      examType: input.examType,
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      orderedBy: input.orderedBy,
    }, { tenantId: input.tenantId });

    return { success: true, data: exam };
  }

  /**
   * Retrieve an exam by its ID.
   */
  getExam(id: UUID): CustomsExam | undefined {
    return this.exams.get(id);
  }

  /**
   * Retrieve an exam by its exam number.
   */
  getExamByNumber(num: string): CustomsExam | undefined {
    const id = this.examByNumber.get(num);
    return id ? this.exams.get(id) : undefined;
  }

  /**
   * List exams filtered by tenant, and optionally by status and type.
   */
  listExams(tenantId: string, status?: ExaminationStatus, type?: InspectionExamType): CustomsExam[] {
    let results = Array.from(this.exams.values()).filter(e => e.tenantId === tenantId);
    if (status) results = results.filter(e => e.status === status);
    if (type) results = results.filter(e => e.examType === type);
    return results;
  }

  /**
   * Schedule an ordered exam for a specific date and time.
   */
  scheduleExam(id: UUID, date: Date, time: string): OperationResult<CustomsExam> {
    const exam = this.exams.get(id);
    if (!exam) {
      return { success: false, error: 'Exam not found', errorCode: 'NOT_FOUND' };
    }

    if (exam.status !== 'ordered') {
      return { success: false, error: 'Exam must be in ordered status to schedule', errorCode: 'INVALID_STATUS' };
    }

    exam.status = 'scheduled';
    exam.scheduledDate = date;
    exam.scheduledTime = time;
    exam.updatedAt = new Date();

    return { success: true, data: exam };
  }

  /**
   * Assign a customs examining officer to an exam.
   */
  assignExamOfficer(id: UUID, officerId: string, officerName: string, designation: string): OperationResult<CustomsExam> {
    const exam = this.exams.get(id);
    if (!exam) {
      return { success: false, error: 'Exam not found', errorCode: 'NOT_FOUND' };
    }

    if (exam.status === 'completed' || exam.status === 'cancelled') {
      return { success: false, error: 'Cannot assign officer to a completed or cancelled exam', errorCode: 'INVALID_STATUS' };
    }

    exam.examiningOfficerId = officerId;
    exam.examiningOfficerName = officerName;
    exam.examiningOfficerDesignation = designation;
    exam.status = 'officer_assigned';
    exam.updatedAt = new Date();

    return { success: true, data: exam };
  }

  /**
   * Start an exam, recording the actual start time.
   */
  startExam(id: UUID): OperationResult<CustomsExam> {
    const exam = this.exams.get(id);
    if (!exam) {
      return { success: false, error: 'Exam not found', errorCode: 'NOT_FOUND' };
    }

    if (exam.status !== 'scheduled' && exam.status !== 'officer_assigned') {
      return { success: false, error: 'Exam must be scheduled or have an officer assigned to start', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    exam.status = 'in_progress';
    exam.actualStartTime = now;
    exam.updatedAt = now;

    emit('inspection.exam_started', {
      examId: exam.id,
      examNumber: exam.examNumber,
      containerId: exam.containerId,
      containerNumber: exam.containerNumber,
      officerId: exam.examiningOfficerId,
      officerName: exam.examiningOfficerName,
    }, { tenantId: exam.tenantId });

    return { success: true, data: exam };
  }

  /**
   * Complete an exam with findings and details.
   * Automatically calculates durationMinutes from actualStartTime.
   * Emits a discrepancy event if finding indicates a problem.
   */
  completeExam(id: UUID, input: CompleteExamInput): OperationResult<CustomsExam> {
    const exam = this.exams.get(id);
    if (!exam) {
      return { success: false, error: 'Exam not found', errorCode: 'NOT_FOUND' };
    }

    if (exam.status !== 'in_progress' && exam.status !== 'awaiting_results') {
      return { success: false, error: 'Exam must be in progress or awaiting results to complete', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    exam.status = 'completed';
    exam.actualEndTime = now;

    // Findings
    exam.finding = input.finding;
    exam.findingDetails = input.findingDetails;
    exam.percentageChecked = input.percentageChecked;
    exam.packagesExamined = input.packagesExamined;
    exam.actualDescription = input.actualDescription;
    exam.actualQuantity = input.actualQuantity;
    exam.assessedValue = input.assessedValue;
    exam.hsnAssessed = input.hsnAssessed;
    exam.customsRemarks = input.customsRemarks;

    // Calculate duration from actual start time
    if (exam.actualStartTime) {
      exam.durationMinutes = Math.round(
        (now.getTime() - exam.actualStartTime.getTime()) / 60000
      );
    }

    exam.updatedAt = now;

    emit('inspection.exam_completed', {
      examId: exam.id,
      examNumber: exam.examNumber,
      containerId: exam.containerId,
      containerNumber: exam.containerNumber,
      finding: input.finding,
      durationMinutes: exam.durationMinutes,
    }, { tenantId: exam.tenantId });

    // Emit discrepancy event if finding indicates a problem
    if (
      input.finding === 'minor_discrepancy' ||
      input.finding === 'major_discrepancy' ||
      input.finding === 'contraband' ||
      input.finding === 'misclassified'
    ) {
      emit('inspection.exam_discrepancy', {
        examId: exam.id,
        examNumber: exam.examNumber,
        containerId: exam.containerId,
        containerNumber: exam.containerNumber,
        finding: input.finding,
        findingDetails: input.findingDetails,
      }, { tenantId: exam.tenantId });
    }

    return { success: true, data: exam };
  }

  /**
   * Draw a sample from an exam container and record where it is sent for lab analysis.
   */
  drawSample(examId: UUID, description: string, sentTo: string): OperationResult<CustomsExam> {
    const exam = this.exams.get(examId);
    if (!exam) {
      return { success: false, error: 'Exam not found', errorCode: 'NOT_FOUND' };
    }

    if (exam.status !== 'in_progress') {
      return { success: false, error: 'Exam must be in progress to draw a sample', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    exam.sampleDrawn = true;
    exam.sampleDescription = description;
    exam.sampleSentTo = sentTo;
    exam.sampleSentDate = now;
    exam.status = 'sample_sent';
    exam.updatedAt = now;

    return { success: true, data: exam };
  }

  /**
   * Record the lab result for a sample that was drawn during an examination.
   */
  recordLabResult(examId: UUID, result: string): OperationResult<CustomsExam> {
    const exam = this.exams.get(examId);
    if (!exam) {
      return { success: false, error: 'Exam not found', errorCode: 'NOT_FOUND' };
    }

    if (exam.status !== 'sample_sent') {
      return { success: false, error: 'Exam must have a sample sent to record lab results', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    exam.labReportDate = now;
    exam.labReportResult = result;
    exam.status = 'awaiting_results';
    exam.updatedAt = now;

    return { success: true, data: exam };
  }

  /**
   * Cancel an exam that is not yet completed.
   */
  cancelExam(id: UUID, reason: string): OperationResult<CustomsExam> {
    const exam = this.exams.get(id);
    if (!exam) {
      return { success: false, error: 'Exam not found', errorCode: 'NOT_FOUND' };
    }

    if (exam.status === 'completed' || exam.status === 'cancelled') {
      return { success: false, error: 'Cannot cancel a completed or already cancelled exam', errorCode: 'INVALID_STATUS' };
    }

    exam.status = 'cancelled';
    exam.remarks = reason;
    exam.updatedAt = new Date();

    return { success: true, data: exam };
  }

  // ============================================================================
  // CARGO QC CHECKS
  // ============================================================================

  /**
   * Create a new cargo quality control check.
   * Auto-generates a sequential check number (QC-001, QC-002, ...).
   */
  createQCCheck(input: CreateQCCheckInput): OperationResult<CargoQCCheck> {
    this.qcCounter++;
    const checkNumber = `QC-${String(this.qcCounter).padStart(3, '0')}`;

    const now = new Date();
    const qcCheck: CargoQCCheck = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      checkNumber,
      checkType: input.checkType,
      status: 'pending',

      containerId: input.containerId,
      containerNumber: input.containerNumber,

      declaredGrossWeight: input.declaredGrossWeight,
      declaredLength: input.declaredLength,
      declaredWidth: input.declaredWidth,
      declaredHeight: input.declaredHeight,

      requiredTemperature: input.requiredTemperature,

      isOversize: false,
      isOutOfGauge: false,

      fumigationRequired: input.fumigationRequired ?? false,
      phytosanitaryRequired: input.phytosanitaryRequired ?? false,

      isHazmat: input.isHazmat ?? false,
      unNumber: input.unNumber,
      imdgClass: input.imdgClass,
      properShippingName: input.properShippingName,
      packingGroup: input.packingGroup,
      flashPoint: input.flashPoint,
      emergencyContact: input.emergencyContact,

      passedChecks: [],
      failedChecks: [],

      remarks: input.remarks,
      photos: [],

      createdAt: now,
      updatedAt: now,
    };

    this.qcChecks.set(qcCheck.id, qcCheck);
    this.qcByNumber.set(checkNumber, qcCheck.id);

    emit('inspection.qc_check_created', {
      checkId: qcCheck.id,
      checkNumber,
      checkType: input.checkType,
      containerId: input.containerId,
      containerNumber: input.containerNumber,
    }, { tenantId: input.tenantId });

    return { success: true, data: qcCheck };
  }

  /**
   * Retrieve a QC check by its ID.
   */
  getQCCheck(id: UUID): CargoQCCheck | undefined {
    return this.qcChecks.get(id);
  }

  /**
   * List QC checks filtered by tenant, and optionally by status and type.
   */
  listQCChecks(tenantId: string, status?: QCStatus, type?: QCCheckType): CargoQCCheck[] {
    let results = Array.from(this.qcChecks.values()).filter(qc => qc.tenantId === tenantId);
    if (status) results = results.filter(qc => qc.status === status);
    if (type) results = results.filter(qc => qc.checkType === type);
    return results;
  }

  /**
   * Record a weight verification on a QC check.
   * Calculates net weight, variance in kg and percent.
   * Auto-pass if variance <= 5%, auto-fail if variance > 5%.
   */
  recordWeightVerification(
    id: UUID,
    actualGross: number,
    tare: number,
    vgmMethod?: 'method1' | 'method2'
  ): OperationResult<CargoQCCheck> {
    const qcCheck = this.qcChecks.get(id);
    if (!qcCheck) {
      return { success: false, error: 'QC check not found', errorCode: 'NOT_FOUND' };
    }

    if (qcCheck.status === 'passed' || qcCheck.status === 'failed') {
      return { success: false, error: 'QC check has already been finalized', errorCode: 'INVALID_STATUS' };
    }

    qcCheck.status = 'in_progress';
    qcCheck.actualGrossWeight = actualGross;
    qcCheck.tareWeight = tare;
    qcCheck.netWeight = actualGross - tare;

    if (vgmMethod) {
      qcCheck.vgmMethod = vgmMethod;
      qcCheck.vgmCertified = true;
    }

    // Calculate variance against declared gross weight
    if (qcCheck.declaredGrossWeight && qcCheck.declaredGrossWeight > 0) {
      qcCheck.weightVarianceKg = Math.abs(actualGross - qcCheck.declaredGrossWeight);
      qcCheck.weightVariancePercent = (qcCheck.weightVarianceKg / qcCheck.declaredGrossWeight) * 100;
    }

    qcCheck.updatedAt = new Date();

    return { success: true, data: qcCheck };
  }

  /**
   * Record a temperature check on a QC check (for reefer containers).
   * Compares actual temperature to the required temperature.
   * Auto-pass if variance <= 2 degrees C, auto-fail if > 2 degrees C.
   */
  recordTemperatureCheck(id: UUID, actualTemp: number): OperationResult<CargoQCCheck> {
    const qcCheck = this.qcChecks.get(id);
    if (!qcCheck) {
      return { success: false, error: 'QC check not found', errorCode: 'NOT_FOUND' };
    }

    if (qcCheck.status === 'passed' || qcCheck.status === 'failed') {
      return { success: false, error: 'QC check has already been finalized', errorCode: 'INVALID_STATUS' };
    }

    qcCheck.status = 'in_progress';
    qcCheck.actualTemperature = actualTemp;

    if (qcCheck.requiredTemperature !== undefined) {
      qcCheck.temperatureVariance = Math.abs(actualTemp - qcCheck.requiredTemperature);
      qcCheck.temperatureAcceptable = qcCheck.temperatureVariance <= 2;
    }

    qcCheck.updatedAt = new Date();

    return { success: true, data: qcCheck };
  }

  /**
   * Record a dimension check on a QC check.
   * Detects oversize and out-of-gauge conditions based on standard container limits.
   * Standard 40ft container internal: ~12.03m L x 2.35m W x 2.39m H.
   */
  recordDimensionCheck(
    id: UUID,
    length: number,
    width: number,
    height: number
  ): OperationResult<CargoQCCheck> {
    const qcCheck = this.qcChecks.get(id);
    if (!qcCheck) {
      return { success: false, error: 'QC check not found', errorCode: 'NOT_FOUND' };
    }

    if (qcCheck.status === 'passed' || qcCheck.status === 'failed') {
      return { success: false, error: 'QC check has already been finalized', errorCode: 'INVALID_STATUS' };
    }

    qcCheck.status = 'in_progress';
    qcCheck.actualLength = length;
    qcCheck.actualWidth = width;
    qcCheck.actualHeight = height;

    // Detect oversize: cargo exceeds standard container external dimensions
    // Standard limits for ISO containers (external): 12.192m L x 2.438m W x 2.591m H
    const MAX_LENGTH = 12.192;
    const MAX_WIDTH = 2.438;
    const MAX_HEIGHT = 2.591;

    qcCheck.isOversize = length > MAX_LENGTH || width > MAX_WIDTH || height > MAX_HEIGHT;

    // Out-of-gauge: cargo extends beyond the container footprint in width or height
    // typically width > 2.438m or height > 2.591m
    qcCheck.isOutOfGauge = width > MAX_WIDTH || height > MAX_HEIGHT;

    qcCheck.updatedAt = new Date();

    return { success: true, data: qcCheck };
  }

  /**
   * Record fumigation details on a QC check.
   */
  recordFumigation(
    id: UUID,
    fumType: string,
    certNumber: string,
    expiryDate: Date,
    agent: string
  ): OperationResult<CargoQCCheck> {
    const qcCheck = this.qcChecks.get(id);
    if (!qcCheck) {
      return { success: false, error: 'QC check not found', errorCode: 'NOT_FOUND' };
    }

    if (qcCheck.status === 'passed' || qcCheck.status === 'failed') {
      return { success: false, error: 'QC check has already been finalized', errorCode: 'INVALID_STATUS' };
    }

    qcCheck.status = 'in_progress';
    qcCheck.fumigationType = fumType;
    qcCheck.fumigationCertNumber = certNumber;
    qcCheck.fumigationExpiryDate = expiryDate;
    qcCheck.fumigationAgent = agent;
    qcCheck.fumigationDate = new Date();
    qcCheck.updatedAt = new Date();

    return { success: true, data: qcCheck };
  }

  /**
   * Place a hold on a QC check, preventing its release.
   */
  placeQCHold(id: UUID, reason: string, placedBy: string): OperationResult<CargoQCCheck> {
    const qcCheck = this.qcChecks.get(id);
    if (!qcCheck) {
      return { success: false, error: 'QC check not found', errorCode: 'NOT_FOUND' };
    }

    if (qcCheck.status === 'on_hold') {
      return { success: false, error: 'QC check is already on hold', errorCode: 'ALREADY_ON_HOLD' };
    }

    if (qcCheck.status === 'passed' || qcCheck.status === 'failed') {
      return { success: false, error: 'Cannot place hold on a finalized QC check', errorCode: 'INVALID_STATUS' };
    }

    qcCheck.status = 'on_hold';
    qcCheck.holdReason = reason;
    qcCheck.holdPlacedBy = placedBy;
    qcCheck.updatedAt = new Date();

    emit('inspection.qc_hold_placed', {
      checkId: qcCheck.id,
      checkNumber: qcCheck.checkNumber,
      containerId: qcCheck.containerId,
      containerNumber: qcCheck.containerNumber,
      reason,
      placedBy,
    }, { tenantId: qcCheck.tenantId });

    return { success: true, data: qcCheck };
  }

  /**
   * Release a hold on a QC check, returning it to in_progress status.
   */
  releaseQCHold(id: UUID, releasedBy: string): OperationResult<CargoQCCheck> {
    const qcCheck = this.qcChecks.get(id);
    if (!qcCheck) {
      return { success: false, error: 'QC check not found', errorCode: 'NOT_FOUND' };
    }

    if (qcCheck.status !== 'on_hold') {
      return { success: false, error: 'QC check is not on hold', errorCode: 'INVALID_STATUS' };
    }

    qcCheck.status = 'in_progress';
    qcCheck.holdReleasedBy = releasedBy;
    qcCheck.holdReleasedAt = new Date();
    qcCheck.updatedAt = new Date();

    emit('inspection.qc_hold_released', {
      checkId: qcCheck.id,
      checkNumber: qcCheck.checkNumber,
      containerId: qcCheck.containerId,
      containerNumber: qcCheck.containerNumber,
      releasedBy,
    }, { tenantId: qcCheck.tenantId });

    return { success: true, data: qcCheck };
  }

  /**
   * Complete a QC check by finalizing results and assigning an inspector.
   * Automatically determines passed/failed checks based on recorded data:
   *  - Weight: >5% variance = fail
   *  - Temperature: >2 degree C variance = fail
   *  - Dimensions: oversize or out-of-gauge = fail
   *  - Fumigation: missing cert when required = fail
   */
  completeQCCheck(id: UUID, inspectorId: string, inspectorName: string): OperationResult<CargoQCCheck> {
    const qcCheck = this.qcChecks.get(id);
    if (!qcCheck) {
      return { success: false, error: 'QC check not found', errorCode: 'NOT_FOUND' };
    }

    if (qcCheck.status !== 'in_progress') {
      return { success: false, error: 'QC check must be in progress to complete', errorCode: 'INVALID_STATUS' };
    }

    const now = new Date();
    qcCheck.inspectorId = inspectorId;
    qcCheck.inspectorName = inspectorName;
    qcCheck.inspectedAt = now;

    const passed: string[] = [];
    const failed: string[] = [];

    // Weight verification
    if (qcCheck.actualGrossWeight !== undefined) {
      if (qcCheck.weightVariancePercent !== undefined && qcCheck.weightVariancePercent > 5) {
        failed.push('weight_verification');
      } else {
        passed.push('weight_verification');
      }
    }

    // Temperature check
    if (qcCheck.actualTemperature !== undefined) {
      if (qcCheck.temperatureAcceptable === false) {
        failed.push('temperature_check');
      } else {
        passed.push('temperature_check');
      }
    }

    // Dimension check
    if (qcCheck.actualLength !== undefined || qcCheck.actualWidth !== undefined || qcCheck.actualHeight !== undefined) {
      if (qcCheck.isOversize || qcCheck.isOutOfGauge) {
        failed.push('dimension_check');
      } else {
        passed.push('dimension_check');
      }
    }

    // Fumigation check
    if (qcCheck.fumigationRequired) {
      if (qcCheck.fumigationCertNumber) {
        // Check if certificate has expired
        if (qcCheck.fumigationExpiryDate && qcCheck.fumigationExpiryDate < now) {
          failed.push('fumigation');
        } else {
          passed.push('fumigation');
        }
      } else {
        failed.push('fumigation');
      }
    }

    // Phytosanitary check
    if (qcCheck.phytosanitaryRequired) {
      if (qcCheck.phytosanitaryCertNumber) {
        passed.push('phytosanitary');
      } else {
        failed.push('phytosanitary');
      }
    }

    // VGM verification
    if (qcCheck.vgmCertified !== undefined) {
      if (qcCheck.vgmCertified) {
        passed.push('vgm_verification');
      } else {
        failed.push('vgm_verification');
      }
    }

    qcCheck.passedChecks = passed;
    qcCheck.failedChecks = failed;

    // Determine overall status
    if (failed.length > 0) {
      qcCheck.status = 'failed';
      emit('inspection.qc_failed', {
        checkId: qcCheck.id,
        checkNumber: qcCheck.checkNumber,
        containerId: qcCheck.containerId,
        containerNumber: qcCheck.containerNumber,
        failedChecks: failed,
        passedChecks: passed,
      }, { tenantId: qcCheck.tenantId });
    } else {
      qcCheck.status = 'passed';
      emit('inspection.qc_passed', {
        checkId: qcCheck.id,
        checkNumber: qcCheck.checkNumber,
        containerId: qcCheck.containerId,
        containerNumber: qcCheck.containerNumber,
        passedChecks: passed,
      }, { tenantId: qcCheck.tenantId });
    }

    qcCheck.updatedAt = now;

    return { success: true, data: qcCheck };
  }

  // ============================================================================
  // INSPECTION STATS
  // ============================================================================

  /**
   * Get comprehensive inspection statistics for a tenant.
   */
  getInspectionStats(tenantId: string): InspectionStats {
    const allSurveys = Array.from(this.surveys.values()).filter(s => s.tenantId === tenantId);
    const allExams = Array.from(this.exams.values()).filter(e => e.tenantId === tenantId);
    const allQC = Array.from(this.qcChecks.values()).filter(qc => qc.tenantId === tenantId);

    const completedSurveys = allSurveys.filter(s => s.status === 'completed');
    const pendingSurveys = allSurveys.filter(s => s.status === 'scheduled' || s.status === 'in_progress');
    const passedSurveys = completedSurveys.filter(s => s.result === 'pass' || s.result === 'conditional_pass');
    const failedSurveys = completedSurveys.filter(s => s.result === 'fail');

    const completedExams = allExams.filter(e => e.status === 'completed');
    const pendingExams = allExams.filter(e => e.status !== 'completed' && e.status !== 'cancelled');
    const noDiscrepancyExams = completedExams.filter(e => e.finding === 'no_discrepancy');
    const discrepancyExams = completedExams.filter(e => e.finding !== 'no_discrepancy');

    const passedQC = allQC.filter(qc => qc.status === 'passed');
    const failedQC = allQC.filter(qc => qc.status === 'failed');
    const onHoldQC = allQC.filter(qc => qc.status === 'on_hold');

    // Today counts
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const surveysToday = allSurveys.filter(s => s.createdAt >= todayStart).length;
    const examsToday = allExams.filter(e => e.createdAt >= todayStart).length;
    const qcChecksToday = allQC.filter(qc => qc.createdAt >= todayStart).length;

    // Average survey duration
    const surveyDurations = completedSurveys
      .filter(s => s.actualStartTime && s.actualEndTime)
      .map(s => (s.actualEndTime!.getTime() - s.actualStartTime!.getTime()) / 60000);
    const avgSurveyDuration = surveyDurations.length > 0
      ? surveyDurations.reduce((a, b) => a + b, 0) / surveyDurations.length
      : 0;

    // Average exam duration
    const examDurations = completedExams
      .filter(e => e.durationMinutes !== undefined)
      .map(e => e.durationMinutes!);
    const avgExamDuration = examDurations.length > 0
      ? examDurations.reduce((a, b) => a + b, 0) / examDurations.length
      : 0;

    // Damage tracking
    const allDamages = allSurveys.flatMap(s => s.damages);
    const criticalDamages = allDamages.filter(d => d.severity === 'critical');
    const surveysWithRepairs = allSurveys.filter(s => s.repairRequired && s.status === 'completed');
    const totalRepairCost = allSurveys
      .filter(s => s.estimatedRepairCost !== undefined)
      .reduce((sum, s) => sum + (s.estimatedRepairCost ?? 0), 0);

    return {
      tenantId,

      // Surveys
      totalSurveys: allSurveys.length,
      completedSurveys: completedSurveys.length,
      pendingSurveys: pendingSurveys.length,
      passRate: completedSurveys.length > 0
        ? (passedSurveys.length / completedSurveys.length) * 100
        : 0,
      failRate: completedSurveys.length > 0
        ? (failedSurveys.length / completedSurveys.length) * 100
        : 0,
      surveysToday,
      averageSurveyDurationMinutes: avgSurveyDuration,

      // Customs exams
      totalExams: allExams.length,
      completedExams: completedExams.length,
      pendingExams: pendingExams.length,
      examsToday,
      noDiscrepancyRate: completedExams.length > 0
        ? (noDiscrepancyExams.length / completedExams.length) * 100
        : 0,
      discrepancyRate: completedExams.length > 0
        ? (discrepancyExams.length / completedExams.length) * 100
        : 0,
      averageExamDurationMinutes: avgExamDuration,

      // QC checks
      totalQCChecks: allQC.length,
      passedQCChecks: passedQC.length,
      failedQCChecks: failedQC.length,
      onHoldQCChecks: onHoldQC.length,
      qcChecksToday,
      qcPassRate: (passedQC.length + failedQC.length) > 0
        ? (passedQC.length / (passedQC.length + failedQC.length)) * 100
        : 0,

      // Damage tracking
      totalDamagesReported: allDamages.length,
      criticalDamages: criticalDamages.length,
      pendingRepairs: surveysWithRepairs.length,
      totalRepairCost,
    };
  }
}

// ============================================================================
// SINGLETON ACCESSORS
// ============================================================================

let _inspectionEngine: InspectionEngine | null = null;

export function getInspectionEngine(): InspectionEngine {
  if (!_inspectionEngine) {
    _inspectionEngine = InspectionEngine.getInstance();
  }
  return _inspectionEngine;
}

export function setInspectionEngine(engine: InspectionEngine): void {
  _inspectionEngine = engine;
}
