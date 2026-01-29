/**
 * Inspection Engine Tests
 *
 * Comprehensive unit tests for InspectionEngine covering:
 * - Singleton pattern
 * - Container surveys (schedule, start, complete, damage, cancel)
 * - Customs examinations (order, schedule, assign, start, complete, sample, lab, cancel)
 * - Cargo QC checks (create, weight, temperature, dimension, fumigation, hold, release, complete)
 * - Inspection stats
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InspectionEngine } from '../inspection/inspection-engine';
import type {
  ScheduleSurveyInput,
  CompleteSurveyInput,
  AddDamageInput,
  OrderExamInput,
  CompleteExamInput,
  CreateQCCheckInput,
} from '../inspection/inspection-engine';
import { TENANT_ID, FACILITY_ID, uuid } from './test-utils';

// ============================================================================
// Helper Factories
// ============================================================================

let containerSeq = 1;

function makeSurveyInput(overrides: Record<string, unknown> = {}): ScheduleSurveyInput {
  const seq = containerSeq++;
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    surveyType: 'pre_stuffing' as const,
    containerId: uuid(),
    containerNumber: `MSCU${String(300000 + seq)}0`,
    isoType: '42G1',
    scheduledDate: new Date(),
    scheduledTime: '10:00',
    surveyorCompany: 'Lloyd\'s Register',
    remarks: 'Routine pre-stuffing survey',
    ...overrides,
  } as ScheduleSurveyInput;
}

function makeExamInput(overrides: Record<string, unknown> = {}): OrderExamInput {
  const seq = containerSeq++;
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    examType: 'first_check' as const,
    containerId: uuid(),
    containerNumber: `MSCU${String(400000 + seq)}0`,
    boeNumber: `BOE/2026/${String(seq).padStart(6, '0')}`,
    orderedBy: 'customs-officer-001',
    totalPackages: 100,
    declaredDescription: 'Electronic components',
    declaredQuantity: 500,
    declaredValue: 250000,
    hsnDeclared: '8471.30',
    remarks: 'Standard first check examination',
    ...overrides,
  } as OrderExamInput;
}

function makeQCInput(overrides: Record<string, unknown> = {}): CreateQCCheckInput {
  const seq = containerSeq++;
  return {
    tenantId: TENANT_ID,
    facilityId: FACILITY_ID,
    checkType: 'weight_verification' as const,
    containerId: uuid(),
    containerNumber: `MSCU${String(500000 + seq)}0`,
    declaredGrossWeight: 25000,
    declaredLength: 12.0,
    declaredWidth: 2.3,
    declaredHeight: 2.4,
    requiredTemperature: -18,
    fumigationRequired: false,
    phytosanitaryRequired: false,
    isHazmat: false,
    remarks: 'Standard QC check',
    ...overrides,
  } as CreateQCCheckInput;
}

function makeDamageInput(overrides: Record<string, unknown> = {}): AddDamageInput {
  return {
    damageType: 'dent' as const,
    severity: 'moderate' as const,
    location: 'left_wall' as const,
    description: 'Large dent on left wall panel',
    dimensions: '30cm x 20cm',
    photoIds: ['photo-001', 'photo-002'],
    repairEstimate: 15000,
    ...overrides,
  } as AddDamageInput;
}

// ============================================================================
// Helper: create and return domain objects in desired states
// ============================================================================

function scheduleSurvey(engine: InspectionEngine, overrides: Record<string, unknown> = {}) {
  const result = engine.scheduleSurvey(makeSurveyInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function startSurveyHelper(engine: InspectionEngine, overrides: Record<string, unknown> = {}) {
  const survey = scheduleSurvey(engine, overrides);
  const result = engine.startSurvey(survey.id, 'surveyor-001', 'John Smith');
  expect(result.success).toBe(true);
  return result.data!;
}

function orderExam(engine: InspectionEngine, overrides: Record<string, unknown> = {}) {
  const result = engine.orderExamination(makeExamInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

function createQC(engine: InspectionEngine, overrides: Record<string, unknown> = {}) {
  const result = engine.createQCCheck(makeQCInput(overrides));
  expect(result.success).toBe(true);
  return result.data!;
}

// ============================================================================
// TESTS
// ============================================================================

describe('InspectionEngine', () => {
  let engine: InspectionEngine;

  beforeEach(() => {
    InspectionEngine.resetInstance();
    engine = InspectionEngine.getInstance();
    containerSeq = 1;
  });

  // ==========================================================================
  // Singleton Pattern
  // ==========================================================================

  describe('Singleton pattern', () => {
    it('should return the same instance on repeated calls', () => {
      const a = InspectionEngine.getInstance();
      const b = InspectionEngine.getInstance();
      expect(a).toBe(b);
    });

    it('should return a new instance after reset', () => {
      const a = InspectionEngine.getInstance();
      InspectionEngine.resetInstance();
      const b = InspectionEngine.getInstance();
      expect(a).not.toBe(b);
    });
  });

  // ==========================================================================
  // Container Surveys - Schedule
  // ==========================================================================

  describe('scheduleSurvey', () => {
    it('should schedule a new survey with auto-generated number', () => {
      const result = engine.scheduleSurvey(makeSurveyInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.surveyNumber).toBe('SRV-001');
      expect(result.data!.status).toBe('scheduled');
      expect(result.data!.hasDamage).toBe(false);
      expect(result.data!.repairRequired).toBe(false);
      expect(result.data!.damages).toHaveLength(0);
    });

    it('should auto-increment survey numbers', () => {
      const r1 = engine.scheduleSurvey(makeSurveyInput());
      const r2 = engine.scheduleSurvey(makeSurveyInput());
      const r3 = engine.scheduleSurvey(makeSurveyInput());
      expect(r1.data!.surveyNumber).toBe('SRV-001');
      expect(r2.data!.surveyNumber).toBe('SRV-002');
      expect(r3.data!.surveyNumber).toBe('SRV-003');
    });

    it('should store tenant and facility IDs', () => {
      const result = engine.scheduleSurvey(makeSurveyInput());
      expect(result.data!.tenantId).toBe(TENANT_ID);
      expect(result.data!.facilityId).toBe(FACILITY_ID);
    });

    it('should store container details and survey type', () => {
      const input = makeSurveyInput({ surveyType: 'reefer_pti', isoType: '45R1' });
      const result = engine.scheduleSurvey(input);
      expect(result.data!.surveyType).toBe('reefer_pti');
      expect(result.data!.isoType).toBe('45R1');
      expect(result.data!.containerNumber).toBeDefined();
    });
  });

  // ==========================================================================
  // Container Surveys - Retrieve
  // ==========================================================================

  describe('getSurvey / getSurveyByNumber', () => {
    it('should retrieve a survey by ID', () => {
      const survey = scheduleSurvey(engine);
      const found = engine.getSurvey(survey.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(survey.id);
      expect(found!.surveyNumber).toBe(survey.surveyNumber);
    });

    it('should return undefined for unknown ID', () => {
      const found = engine.getSurvey('nonexistent-id');
      expect(found).toBeUndefined();
    });

    it('should retrieve a survey by number', () => {
      const survey = scheduleSurvey(engine);
      const found = engine.getSurveyByNumber(survey.surveyNumber);
      expect(found).toBeDefined();
      expect(found!.id).toBe(survey.id);
    });

    it('should return undefined for unknown number', () => {
      const found = engine.getSurveyByNumber('SRV-999');
      expect(found).toBeUndefined();
    });
  });

  // ==========================================================================
  // Container Surveys - List
  // ==========================================================================

  describe('listSurveys', () => {
    it('should list all surveys for a tenant', () => {
      scheduleSurvey(engine);
      scheduleSurvey(engine);
      scheduleSurvey(engine);
      const list = engine.listSurveys(TENANT_ID);
      expect(list).toHaveLength(3);
    });

    it('should return empty for unknown tenant', () => {
      scheduleSurvey(engine);
      const list = engine.listSurveys('other-tenant');
      expect(list).toHaveLength(0);
    });

    it('should filter by status', () => {
      const survey = scheduleSurvey(engine);
      scheduleSurvey(engine);
      engine.startSurvey(survey.id, 'surveyor-001', 'John Smith');

      expect(engine.listSurveys(TENANT_ID, 'scheduled')).toHaveLength(1);
      expect(engine.listSurveys(TENANT_ID, 'in_progress')).toHaveLength(1);
    });

    it('should filter by survey type', () => {
      scheduleSurvey(engine, { surveyType: 'pre_stuffing' });
      scheduleSurvey(engine, { surveyType: 'reefer_pti' });
      scheduleSurvey(engine, { surveyType: 'pre_stuffing' });

      expect(engine.listSurveys(TENANT_ID, undefined, 'pre_stuffing')).toHaveLength(2);
      expect(engine.listSurveys(TENANT_ID, undefined, 'reefer_pti')).toHaveLength(1);
    });

    it('should filter by both status and type', () => {
      const s1 = scheduleSurvey(engine, { surveyType: 'pre_stuffing' });
      scheduleSurvey(engine, { surveyType: 'reefer_pti' });
      engine.startSurvey(s1.id, 'surveyor-001', 'John Smith');

      expect(engine.listSurveys(TENANT_ID, 'in_progress', 'pre_stuffing')).toHaveLength(1);
      expect(engine.listSurveys(TENANT_ID, 'in_progress', 'reefer_pti')).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Container Surveys - Start
  // ==========================================================================

  describe('startSurvey', () => {
    it('should start a scheduled survey', () => {
      const survey = scheduleSurvey(engine);
      const result = engine.startSurvey(survey.id, 'surveyor-001', 'John Smith');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('in_progress');
      expect(result.data!.surveyorId).toBe('surveyor-001');
      expect(result.data!.surveyorName).toBe('John Smith');
      expect(result.data!.actualStartTime).toBeDefined();
    });

    it('should fail for nonexistent survey', () => {
      const result = engine.startSurvey('nonexistent-id', 'surveyor-001', 'John Smith');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Survey not found');
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail if survey is not in scheduled status', () => {
      const survey = startSurveyHelper(engine);
      const result = engine.startSurvey(survey.id, 'surveyor-002', 'Jane Doe');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Container Surveys - Complete
  // ==========================================================================

  describe('completeSurvey', () => {
    it('should complete an in-progress survey with pass result', () => {
      const survey = startSurveyHelper(engine);
      const input: CompleteSurveyInput = {
        result: 'pass',
        externalCondition: 'good',
        internalCondition: 'good',
        doorOperation: 'smooth',
        floorCondition: 'good',
        roofCondition: 'good',
        sealIntact: true,
        cleanlinessRating: 5,
        remarks: 'Container in excellent condition',
      };
      const result = engine.completeSurvey(survey.id, input);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('completed');
      expect(result.data!.result).toBe('pass');
      expect(result.data!.actualEndTime).toBeDefined();
      expect(result.data!.externalCondition).toBe('good');
      expect(result.data!.hasDamage).toBe(false);
      expect(result.data!.repairRequired).toBe(false);
    });

    it('should set repairRequired when result is fail', () => {
      const survey = startSurveyHelper(engine);
      const input: CompleteSurveyInput = {
        result: 'fail',
        externalCondition: 'good',
        internalCondition: 'good',
      };
      const result = engine.completeSurvey(survey.id, input);
      expect(result.success).toBe(true);
      expect(result.data!.repairRequired).toBe(true);
    });

    it('should set repairRequired when condition is poor', () => {
      const survey = startSurveyHelper(engine);
      const input: CompleteSurveyInput = {
        result: 'conditional_pass',
        externalCondition: 'poor',
      };
      const result = engine.completeSurvey(survey.id, input);
      expect(result.success).toBe(true);
      expect(result.data!.repairRequired).toBe(true);
    });

    it('should set repairRequired when door is damaged', () => {
      const survey = startSurveyHelper(engine);
      const input: CompleteSurveyInput = {
        result: 'pass',
        doorOperation: 'damaged',
      };
      const result = engine.completeSurvey(survey.id, input);
      expect(result.success).toBe(true);
      expect(result.data!.repairRequired).toBe(true);
    });

    it('should set hasDamage and repairRequired when damages exist', () => {
      const survey = startSurveyHelper(engine);
      engine.addDamageEntry(survey.id, makeDamageInput());
      const input: CompleteSurveyInput = {
        result: 'pass',
        externalCondition: 'good',
        internalCondition: 'good',
      };
      const result = engine.completeSurvey(survey.id, input);
      expect(result.success).toBe(true);
      expect(result.data!.hasDamage).toBe(true);
      expect(result.data!.repairRequired).toBe(true);
    });

    it('should store reefer data on complete', () => {
      const survey = startSurveyHelper(engine);
      const input: CompleteSurveyInput = {
        result: 'pass',
        reeferFunctional: true,
        reeferTemperature: -18.5,
        reeferSetPoint: -18,
        reeferHumidity: 70,
        reeferSupplyAirTemp: -20,
        reeferReturnAirTemp: -17,
        compressorWorking: true,
        defrostWorking: true,
      };
      const result = engine.completeSurvey(survey.id, input);
      expect(result.success).toBe(true);
      expect(result.data!.reeferFunctional).toBe(true);
      expect(result.data!.reeferTemperature).toBe(-18.5);
      expect(result.data!.reeferSetPoint).toBe(-18);
      expect(result.data!.compressorWorking).toBe(true);
    });

    it('should store estimatedRepairCost and recommendations', () => {
      const survey = startSurveyHelper(engine);
      const input: CompleteSurveyInput = {
        result: 'fail',
        estimatedRepairCost: 50000,
        recommendations: 'Replace floor panels',
      };
      const result = engine.completeSurvey(survey.id, input);
      expect(result.success).toBe(true);
      expect(result.data!.estimatedRepairCost).toBe(50000);
      expect(result.data!.recommendations).toBe('Replace floor panels');
    });

    it('should fail for nonexistent survey', () => {
      const result = engine.completeSurvey('nonexistent-id', { result: 'pass' });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail if survey is not in progress', () => {
      const survey = scheduleSurvey(engine);
      const result = engine.completeSurvey(survey.id, { result: 'pass' });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Container Surveys - Add Damage
  // ==========================================================================

  describe('addDamageEntry', () => {
    it('should add a damage entry to an in-progress survey', () => {
      const survey = startSurveyHelper(engine);
      const result = engine.addDamageEntry(survey.id, makeDamageInput());
      expect(result.success).toBe(true);
      expect(result.data!.damages).toHaveLength(1);
      expect(result.data!.damages[0].damageType).toBe('dent');
      expect(result.data!.damages[0].severity).toBe('moderate');
      expect(result.data!.damages[0].location).toBe('left_wall');
      expect(result.data!.damages[0].id).toBeDefined();
      expect(result.data!.hasDamage).toBe(true);
      expect(result.data!.repairRequired).toBe(true);
    });

    it('should add a damage entry to a scheduled survey', () => {
      const survey = scheduleSurvey(engine);
      const result = engine.addDamageEntry(survey.id, makeDamageInput());
      expect(result.success).toBe(true);
      expect(result.data!.damages).toHaveLength(1);
    });

    it('should accumulate multiple damages', () => {
      const survey = startSurveyHelper(engine);
      engine.addDamageEntry(survey.id, makeDamageInput({ damageType: 'dent' }));
      engine.addDamageEntry(survey.id, makeDamageInput({ damageType: 'rust' }));
      engine.addDamageEntry(survey.id, makeDamageInput({ damageType: 'hole' }));
      const found = engine.getSurvey(survey.id)!;
      expect(found.damages).toHaveLength(3);
    });

    it('should set photoIds and repairEstimate on damage entry', () => {
      const survey = startSurveyHelper(engine);
      const result = engine.addDamageEntry(survey.id, makeDamageInput({
        photoIds: ['p1', 'p2', 'p3'],
        repairEstimate: 25000,
        dimensions: '50cm x 30cm',
      }));
      expect(result.success).toBe(true);
      expect(result.data!.damages[0].photoIds).toEqual(['p1', 'p2', 'p3']);
      expect(result.data!.damages[0].repairEstimate).toBe(25000);
      expect(result.data!.damages[0].dimensions).toBe('50cm x 30cm');
    });

    it('should default photoIds to empty array when not provided', () => {
      const survey = startSurveyHelper(engine);
      const result = engine.addDamageEntry(survey.id, {
        damageType: 'rust',
        severity: 'minor',
        location: 'roof',
        description: 'Surface rust on roof',
      });
      expect(result.success).toBe(true);
      expect(result.data!.damages[0].photoIds).toEqual([]);
    });

    it('should fail for nonexistent survey', () => {
      const result = engine.addDamageEntry('nonexistent-id', makeDamageInput());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail for completed survey', () => {
      const survey = startSurveyHelper(engine);
      engine.completeSurvey(survey.id, { result: 'pass' });
      const result = engine.addDamageEntry(survey.id, makeDamageInput());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail for cancelled survey', () => {
      const survey = scheduleSurvey(engine);
      engine.cancelSurvey(survey.id, 'No longer needed');
      const result = engine.addDamageEntry(survey.id, makeDamageInput());
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Container Surveys - Cancel
  // ==========================================================================

  describe('cancelSurvey', () => {
    it('should cancel a scheduled survey', () => {
      const survey = scheduleSurvey(engine);
      const result = engine.cancelSurvey(survey.id, 'Weather conditions');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('cancelled');
      expect(result.data!.remarks).toBe('Weather conditions');
    });

    it('should cancel an in-progress survey', () => {
      const survey = startSurveyHelper(engine);
      const result = engine.cancelSurvey(survey.id, 'Surveyor unavailable');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('cancelled');
    });

    it('should fail for nonexistent survey', () => {
      const result = engine.cancelSurvey('nonexistent-id', 'Test');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail for already completed survey', () => {
      const survey = startSurveyHelper(engine);
      engine.completeSurvey(survey.id, { result: 'pass' });
      const result = engine.cancelSurvey(survey.id, 'Too late');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail for already cancelled survey', () => {
      const survey = scheduleSurvey(engine);
      engine.cancelSurvey(survey.id, 'First cancel');
      const result = engine.cancelSurvey(survey.id, 'Second cancel');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Customs Examinations - Order
  // ==========================================================================

  describe('orderExamination', () => {
    it('should order a new customs examination', () => {
      const result = engine.orderExamination(makeExamInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.examNumber).toBe('EXM-001');
      expect(result.data!.status).toBe('ordered');
      expect(result.data!.sampleDrawn).toBe(false);
      expect(result.data!.photos).toHaveLength(0);
    });

    it('should auto-increment exam numbers', () => {
      const r1 = engine.orderExamination(makeExamInput());
      const r2 = engine.orderExamination(makeExamInput());
      expect(r1.data!.examNumber).toBe('EXM-001');
      expect(r2.data!.examNumber).toBe('EXM-002');
    });

    it('should store BOE and customs reference data', () => {
      const result = engine.orderExamination(makeExamInput({
        boeNumber: 'BOE/2026/000100',
        sbNumber: 'SB/2026/000200',
        orderedBy: 'senior-officer-001',
      }));
      expect(result.data!.boeNumber).toBe('BOE/2026/000100');
      expect(result.data!.sbNumber).toBe('SB/2026/000200');
      expect(result.data!.orderedBy).toBe('senior-officer-001');
    });

    it('should store declared cargo details', () => {
      const result = engine.orderExamination(makeExamInput({
        declaredDescription: 'Auto parts',
        declaredQuantity: 1000,
        declaredValue: 500000,
        hsnDeclared: '8708.99',
      }));
      expect(result.data!.declaredDescription).toBe('Auto parts');
      expect(result.data!.declaredQuantity).toBe(1000);
      expect(result.data!.declaredValue).toBe(500000);
      expect(result.data!.hsnDeclared).toBe('8708.99');
    });
  });

  // ==========================================================================
  // Customs Examinations - Retrieve
  // ==========================================================================

  describe('getExam / getExamByNumber', () => {
    it('should retrieve an exam by ID', () => {
      const exam = orderExam(engine);
      const found = engine.getExam(exam.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(exam.id);
    });

    it('should return undefined for unknown ID', () => {
      expect(engine.getExam('nonexistent-id')).toBeUndefined();
    });

    it('should retrieve an exam by number', () => {
      const exam = orderExam(engine);
      const found = engine.getExamByNumber(exam.examNumber);
      expect(found).toBeDefined();
      expect(found!.id).toBe(exam.id);
    });

    it('should return undefined for unknown exam number', () => {
      expect(engine.getExamByNumber('EXM-999')).toBeUndefined();
    });
  });

  // ==========================================================================
  // Customs Examinations - List
  // ==========================================================================

  describe('listExams', () => {
    it('should list all exams for a tenant', () => {
      orderExam(engine);
      orderExam(engine);
      expect(engine.listExams(TENANT_ID)).toHaveLength(2);
    });

    it('should return empty for unknown tenant', () => {
      orderExam(engine);
      expect(engine.listExams('other-tenant')).toHaveLength(0);
    });

    it('should filter by status', () => {
      const exam = orderExam(engine);
      orderExam(engine);
      engine.scheduleExam(exam.id, new Date(), '14:00');
      expect(engine.listExams(TENANT_ID, 'scheduled')).toHaveLength(1);
      expect(engine.listExams(TENANT_ID, 'ordered')).toHaveLength(1);
    });

    it('should filter by exam type', () => {
      orderExam(engine, { examType: 'first_check' });
      orderExam(engine, { examType: 'percentage_check' });
      orderExam(engine, { examType: 'first_check' });
      expect(engine.listExams(TENANT_ID, undefined, 'first_check')).toHaveLength(2);
      expect(engine.listExams(TENANT_ID, undefined, 'percentage_check')).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Customs Examinations - Schedule
  // ==========================================================================

  describe('scheduleExam', () => {
    it('should schedule an ordered exam', () => {
      const exam = orderExam(engine);
      const schedDate = new Date();
      const result = engine.scheduleExam(exam.id, schedDate, '14:00');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('scheduled');
      expect(result.data!.scheduledDate).toBe(schedDate);
      expect(result.data!.scheduledTime).toBe('14:00');
    });

    it('should fail for nonexistent exam', () => {
      const result = engine.scheduleExam('nonexistent-id', new Date(), '14:00');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail if exam is not in ordered status', () => {
      const exam = orderExam(engine);
      engine.scheduleExam(exam.id, new Date(), '14:00');
      const result = engine.scheduleExam(exam.id, new Date(), '15:00');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Customs Examinations - Assign Officer
  // ==========================================================================

  describe('assignExamOfficer', () => {
    it('should assign an officer to an exam', () => {
      const exam = orderExam(engine);
      const result = engine.assignExamOfficer(exam.id, 'officer-001', 'Rajesh Kumar', 'Superintendent');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('officer_assigned');
      expect(result.data!.examiningOfficerId).toBe('officer-001');
      expect(result.data!.examiningOfficerName).toBe('Rajesh Kumar');
      expect(result.data!.examiningOfficerDesignation).toBe('Superintendent');
    });

    it('should fail for nonexistent exam', () => {
      const result = engine.assignExamOfficer('nonexistent-id', 'officer-001', 'Test', 'Test');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail for completed exam', () => {
      const exam = orderExam(engine);
      engine.assignExamOfficer(exam.id, 'officer-001', 'Rajesh Kumar', 'Superintendent');
      engine.startExam(exam.id);
      engine.completeExam(exam.id, { finding: 'no_discrepancy' });
      const result = engine.assignExamOfficer(exam.id, 'officer-002', 'New Officer', 'Inspector');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail for cancelled exam', () => {
      const exam = orderExam(engine);
      engine.cancelExam(exam.id, 'No longer required');
      const result = engine.assignExamOfficer(exam.id, 'officer-001', 'Test', 'Test');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Customs Examinations - Start
  // ==========================================================================

  describe('startExam', () => {
    it('should start a scheduled exam', () => {
      const exam = orderExam(engine);
      engine.scheduleExam(exam.id, new Date(), '14:00');
      const result = engine.startExam(exam.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('in_progress');
      expect(result.data!.actualStartTime).toBeDefined();
    });

    it('should start an officer-assigned exam', () => {
      const exam = orderExam(engine);
      engine.assignExamOfficer(exam.id, 'officer-001', 'Officer Name', 'Superintendent');
      const result = engine.startExam(exam.id);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('in_progress');
    });

    it('should fail for nonexistent exam', () => {
      const result = engine.startExam('nonexistent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail if exam is in ordered status', () => {
      const exam = orderExam(engine);
      const result = engine.startExam(exam.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Customs Examinations - Complete
  // ==========================================================================

  describe('completeExam', () => {
    function startExamHelper() {
      const exam = orderExam(engine);
      engine.assignExamOfficer(exam.id, 'officer-001', 'Officer', 'Superintendent');
      engine.startExam(exam.id);
      return exam;
    }

    it('should complete an in-progress exam with no discrepancy', () => {
      const exam = startExamHelper();
      const input: CompleteExamInput = {
        finding: 'no_discrepancy',
        percentageChecked: 100,
        packagesExamined: 50,
        actualDescription: 'Electronic components',
        actualQuantity: 500,
      };
      const result = engine.completeExam(exam.id, input);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('completed');
      expect(result.data!.finding).toBe('no_discrepancy');
      expect(result.data!.actualEndTime).toBeDefined();
      expect(result.data!.percentageChecked).toBe(100);
      expect(result.data!.packagesExamined).toBe(50);
      expect(result.data!.durationMinutes).toBeDefined();
    });

    it('should complete with minor discrepancy', () => {
      const exam = startExamHelper();
      const result = engine.completeExam(exam.id, {
        finding: 'minor_discrepancy',
        findingDetails: 'Quantity variance of 5 units',
        actualQuantity: 495,
      });
      expect(result.success).toBe(true);
      expect(result.data!.finding).toBe('minor_discrepancy');
      expect(result.data!.findingDetails).toBe('Quantity variance of 5 units');
    });

    it('should complete with major discrepancy', () => {
      const exam = startExamHelper();
      const result = engine.completeExam(exam.id, {
        finding: 'major_discrepancy',
        findingDetails: 'Goods mismatch',
        actualDescription: 'Textiles instead of electronics',
        assessedValue: 100000,
        hsnAssessed: '5208.11',
        customsRemarks: 'Refer for further investigation',
      });
      expect(result.success).toBe(true);
      expect(result.data!.finding).toBe('major_discrepancy');
      expect(result.data!.actualDescription).toBe('Textiles instead of electronics');
      expect(result.data!.assessedValue).toBe(100000);
      expect(result.data!.hsnAssessed).toBe('5208.11');
      expect(result.data!.customsRemarks).toBe('Refer for further investigation');
    });

    it('should complete an exam in awaiting_results status', () => {
      const exam = startExamHelper();
      engine.drawSample(exam.id, 'Chemical sample', 'Central Lab');
      engine.recordLabResult(exam.id, 'Sample matches declared composition');
      const result = engine.completeExam(exam.id, {
        finding: 'no_discrepancy',
      });
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('completed');
    });

    it('should fail for nonexistent exam', () => {
      const result = engine.completeExam('nonexistent-id', { finding: 'no_discrepancy' });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail if exam is not in progress or awaiting results', () => {
      const exam = orderExam(engine);
      const result = engine.completeExam(exam.id, { finding: 'no_discrepancy' });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Customs Examinations - Draw Sample
  // ==========================================================================

  describe('drawSample', () => {
    it('should draw a sample from an in-progress exam', () => {
      const exam = orderExam(engine);
      engine.assignExamOfficer(exam.id, 'officer-001', 'Officer', 'Superintendent');
      engine.startExam(exam.id);
      const result = engine.drawSample(exam.id, 'Chemical compound sample', 'Central Customs Lab');
      expect(result.success).toBe(true);
      expect(result.data!.sampleDrawn).toBe(true);
      expect(result.data!.sampleDescription).toBe('Chemical compound sample');
      expect(result.data!.sampleSentTo).toBe('Central Customs Lab');
      expect(result.data!.sampleSentDate).toBeDefined();
      expect(result.data!.status).toBe('sample_sent');
    });

    it('should fail for nonexistent exam', () => {
      const result = engine.drawSample('nonexistent-id', 'Sample', 'Lab');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail if exam is not in progress', () => {
      const exam = orderExam(engine);
      const result = engine.drawSample(exam.id, 'Sample', 'Lab');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Customs Examinations - Record Lab Result
  // ==========================================================================

  describe('recordLabResult', () => {
    function examWithSample() {
      const exam = orderExam(engine);
      engine.assignExamOfficer(exam.id, 'officer-001', 'Officer', 'Superintendent');
      engine.startExam(exam.id);
      engine.drawSample(exam.id, 'Chemical sample', 'Central Lab');
      return exam;
    }

    it('should record lab result for a sample-sent exam', () => {
      const exam = examWithSample();
      const result = engine.recordLabResult(exam.id, 'Sample matches declared composition');
      expect(result.success).toBe(true);
      expect(result.data!.labReportResult).toBe('Sample matches declared composition');
      expect(result.data!.labReportDate).toBeDefined();
      expect(result.data!.status).toBe('awaiting_results');
    });

    it('should fail for nonexistent exam', () => {
      const result = engine.recordLabResult('nonexistent-id', 'Result');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail if exam is not in sample_sent status', () => {
      const exam = orderExam(engine);
      const result = engine.recordLabResult(exam.id, 'Result');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Customs Examinations - Cancel
  // ==========================================================================

  describe('cancelExam', () => {
    it('should cancel an ordered exam', () => {
      const exam = orderExam(engine);
      const result = engine.cancelExam(exam.id, 'BOE withdrawn');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('cancelled');
      expect(result.data!.remarks).toBe('BOE withdrawn');
    });

    it('should cancel a scheduled exam', () => {
      const exam = orderExam(engine);
      engine.scheduleExam(exam.id, new Date(), '14:00');
      const result = engine.cancelExam(exam.id, 'Rescheduled');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('cancelled');
    });

    it('should fail for nonexistent exam', () => {
      const result = engine.cancelExam('nonexistent-id', 'Test');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail for already completed exam', () => {
      const exam = orderExam(engine);
      engine.assignExamOfficer(exam.id, 'officer-001', 'Officer', 'Superintendent');
      engine.startExam(exam.id);
      engine.completeExam(exam.id, { finding: 'no_discrepancy' });
      const result = engine.cancelExam(exam.id, 'Too late');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail for already cancelled exam', () => {
      const exam = orderExam(engine);
      engine.cancelExam(exam.id, 'First cancel');
      const result = engine.cancelExam(exam.id, 'Second cancel');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Cargo QC Checks - Create
  // ==========================================================================

  describe('createQCCheck', () => {
    it('should create a new QC check with auto-generated number', () => {
      const result = engine.createQCCheck(makeQCInput());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.checkNumber).toBe('QC-001');
      expect(result.data!.status).toBe('pending');
      expect(result.data!.passedChecks).toEqual([]);
      expect(result.data!.failedChecks).toEqual([]);
      expect(result.data!.isOversize).toBe(false);
      expect(result.data!.isOutOfGauge).toBe(false);
    });

    it('should auto-increment QC check numbers', () => {
      const r1 = engine.createQCCheck(makeQCInput());
      const r2 = engine.createQCCheck(makeQCInput());
      expect(r1.data!.checkNumber).toBe('QC-001');
      expect(r2.data!.checkNumber).toBe('QC-002');
    });

    it('should store hazmat details', () => {
      const result = engine.createQCCheck(makeQCInput({
        isHazmat: true,
        unNumber: 'UN1203',
        imdgClass: '3',
        properShippingName: 'Gasoline',
        packingGroup: 'II',
        flashPoint: -43,
        emergencyContact: '+919876543210',
      }));
      expect(result.data!.isHazmat).toBe(true);
      expect(result.data!.unNumber).toBe('UN1203');
      expect(result.data!.imdgClass).toBe('3');
      expect(result.data!.flashPoint).toBe(-43);
    });

    it('should store fumigation and phytosanitary flags', () => {
      const result = engine.createQCCheck(makeQCInput({
        fumigationRequired: true,
        phytosanitaryRequired: true,
      }));
      expect(result.data!.fumigationRequired).toBe(true);
      expect(result.data!.phytosanitaryRequired).toBe(true);
    });

    it('should default fumigation/phytosanitary/hazmat to false when not provided', () => {
      const result = engine.createQCCheck(makeQCInput({
        fumigationRequired: undefined,
        phytosanitaryRequired: undefined,
        isHazmat: undefined,
      }));
      expect(result.data!.fumigationRequired).toBe(false);
      expect(result.data!.phytosanitaryRequired).toBe(false);
      expect(result.data!.isHazmat).toBe(false);
    });
  });

  // ==========================================================================
  // Cargo QC Checks - Retrieve & List
  // ==========================================================================

  describe('getQCCheck / listQCChecks', () => {
    it('should retrieve a QC check by ID', () => {
      const qc = createQC(engine);
      const found = engine.getQCCheck(qc.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(qc.id);
    });

    it('should return undefined for unknown QC check ID', () => {
      expect(engine.getQCCheck('nonexistent-id')).toBeUndefined();
    });

    it('should list QC checks by tenant', () => {
      createQC(engine);
      createQC(engine);
      expect(engine.listQCChecks(TENANT_ID)).toHaveLength(2);
    });

    it('should return empty for unknown tenant', () => {
      createQC(engine);
      expect(engine.listQCChecks('other-tenant')).toHaveLength(0);
    });

    it('should filter QC checks by status', () => {
      const qc = createQC(engine);
      createQC(engine);
      engine.recordWeightVerification(qc.id, 25500, 3800);
      expect(engine.listQCChecks(TENANT_ID, 'in_progress')).toHaveLength(1);
      expect(engine.listQCChecks(TENANT_ID, 'pending')).toHaveLength(1);
    });

    it('should filter QC checks by type', () => {
      createQC(engine, { checkType: 'weight_verification' });
      createQC(engine, { checkType: 'temperature_check' });
      expect(engine.listQCChecks(TENANT_ID, undefined, 'weight_verification')).toHaveLength(1);
      expect(engine.listQCChecks(TENANT_ID, undefined, 'temperature_check')).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Cargo QC Checks - Weight Verification
  // ==========================================================================

  describe('recordWeightVerification', () => {
    it('should record weight verification data', () => {
      const qc = createQC(engine, { declaredGrossWeight: 25000 });
      const result = engine.recordWeightVerification(qc.id, 25500, 3800);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('in_progress');
      expect(result.data!.actualGrossWeight).toBe(25500);
      expect(result.data!.tareWeight).toBe(3800);
      expect(result.data!.netWeight).toBe(25500 - 3800);
    });

    it('should calculate weight variance against declared', () => {
      const qc = createQC(engine, { declaredGrossWeight: 25000 });
      const result = engine.recordWeightVerification(qc.id, 26000, 3800);
      expect(result.success).toBe(true);
      expect(result.data!.weightVarianceKg).toBe(1000);
      expect(result.data!.weightVariancePercent).toBe(4); // 1000/25000 * 100
    });

    it('should record VGM method when provided', () => {
      const qc = createQC(engine);
      const result = engine.recordWeightVerification(qc.id, 25000, 3800, 'method1');
      expect(result.success).toBe(true);
      expect(result.data!.vgmMethod).toBe('method1');
      expect(result.data!.vgmCertified).toBe(true);
    });

    it('should not set VGM when method not provided', () => {
      const qc = createQC(engine);
      const result = engine.recordWeightVerification(qc.id, 25000, 3800);
      expect(result.success).toBe(true);
      expect(result.data!.vgmMethod).toBeUndefined();
      expect(result.data!.vgmCertified).toBeUndefined();
    });

    it('should not calculate variance when declared weight is zero or not set', () => {
      const qc = createQC(engine, { declaredGrossWeight: 0 });
      const result = engine.recordWeightVerification(qc.id, 25000, 3800);
      expect(result.success).toBe(true);
      expect(result.data!.weightVarianceKg).toBeUndefined();
      expect(result.data!.weightVariancePercent).toBeUndefined();
    });

    it('should fail for nonexistent QC check', () => {
      const result = engine.recordWeightVerification('nonexistent-id', 25000, 3800);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail for finalized (passed) QC check', () => {
      const qc = createQC(engine);
      engine.recordWeightVerification(qc.id, 25000, 3800);
      engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector Name');
      const result = engine.recordWeightVerification(qc.id, 26000, 3900);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Cargo QC Checks - Temperature Check
  // ==========================================================================

  describe('recordTemperatureCheck', () => {
    it('should record temperature within acceptable range', () => {
      const qc = createQC(engine, { requiredTemperature: -18 });
      const result = engine.recordTemperatureCheck(qc.id, -17.5);
      expect(result.success).toBe(true);
      expect(result.data!.actualTemperature).toBe(-17.5);
      expect(result.data!.temperatureVariance).toBe(0.5);
      expect(result.data!.temperatureAcceptable).toBe(true);
      expect(result.data!.status).toBe('in_progress');
    });

    it('should mark temperature as unacceptable when variance > 2 degrees', () => {
      const qc = createQC(engine, { requiredTemperature: -18 });
      const result = engine.recordTemperatureCheck(qc.id, -14);
      expect(result.success).toBe(true);
      expect(result.data!.temperatureVariance).toBe(4);
      expect(result.data!.temperatureAcceptable).toBe(false);
    });

    it('should mark temperature acceptable when variance exactly 2 degrees', () => {
      const qc = createQC(engine, { requiredTemperature: -18 });
      const result = engine.recordTemperatureCheck(qc.id, -16);
      expect(result.success).toBe(true);
      expect(result.data!.temperatureVariance).toBe(2);
      expect(result.data!.temperatureAcceptable).toBe(true);
    });

    it('should not calculate variance when required temperature not set', () => {
      const qc = createQC(engine, { requiredTemperature: undefined });
      const result = engine.recordTemperatureCheck(qc.id, -18);
      expect(result.success).toBe(true);
      expect(result.data!.actualTemperature).toBe(-18);
      expect(result.data!.temperatureVariance).toBeUndefined();
      expect(result.data!.temperatureAcceptable).toBeUndefined();
    });

    it('should fail for nonexistent QC check', () => {
      const result = engine.recordTemperatureCheck('nonexistent-id', -18);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail for finalized QC check', () => {
      const qc = createQC(engine);
      engine.recordWeightVerification(qc.id, 25000, 3800);
      engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      const result = engine.recordTemperatureCheck(qc.id, -18);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Cargo QC Checks - Dimension Check
  // ==========================================================================

  describe('recordDimensionCheck', () => {
    it('should record standard dimensions (not oversize)', () => {
      const qc = createQC(engine);
      const result = engine.recordDimensionCheck(qc.id, 12.0, 2.3, 2.4);
      expect(result.success).toBe(true);
      expect(result.data!.actualLength).toBe(12.0);
      expect(result.data!.actualWidth).toBe(2.3);
      expect(result.data!.actualHeight).toBe(2.4);
      expect(result.data!.isOversize).toBe(false);
      expect(result.data!.isOutOfGauge).toBe(false);
      expect(result.data!.status).toBe('in_progress');
    });

    it('should detect oversize cargo (length exceeds limit)', () => {
      const qc = createQC(engine);
      const result = engine.recordDimensionCheck(qc.id, 13.0, 2.3, 2.4);
      expect(result.success).toBe(true);
      expect(result.data!.isOversize).toBe(true);
      expect(result.data!.isOutOfGauge).toBe(false);
    });

    it('should detect out-of-gauge cargo (width exceeds limit)', () => {
      const qc = createQC(engine);
      const result = engine.recordDimensionCheck(qc.id, 12.0, 2.6, 2.4);
      expect(result.success).toBe(true);
      expect(result.data!.isOversize).toBe(true);
      expect(result.data!.isOutOfGauge).toBe(true);
    });

    it('should detect out-of-gauge cargo (height exceeds limit)', () => {
      const qc = createQC(engine);
      const result = engine.recordDimensionCheck(qc.id, 12.0, 2.3, 2.7);
      expect(result.success).toBe(true);
      expect(result.data!.isOversize).toBe(true);
      expect(result.data!.isOutOfGauge).toBe(true);
    });

    it('should handle dimensions exactly at ISO limits', () => {
      const qc = createQC(engine);
      // Exactly at limits: 12.192 L x 2.438 W x 2.591 H
      const result = engine.recordDimensionCheck(qc.id, 12.192, 2.438, 2.591);
      expect(result.success).toBe(true);
      expect(result.data!.isOversize).toBe(false);
      expect(result.data!.isOutOfGauge).toBe(false);
    });

    it('should fail for nonexistent QC check', () => {
      const result = engine.recordDimensionCheck('nonexistent-id', 12.0, 2.3, 2.4);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail for finalized QC check', () => {
      const qc = createQC(engine);
      engine.recordWeightVerification(qc.id, 25000, 3800);
      engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      const result = engine.recordDimensionCheck(qc.id, 12.0, 2.3, 2.4);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Cargo QC Checks - Fumigation
  // ==========================================================================

  describe('recordFumigation', () => {
    it('should record fumigation details', () => {
      const qc = createQC(engine, { fumigationRequired: true });
      const expiryDate = new Date(Date.now() + 30 * 86400000);
      const result = engine.recordFumigation(qc.id, 'Methyl Bromide', 'CERT-12345', expiryDate, 'Pest Control Inc.');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('in_progress');
      expect(result.data!.fumigationType).toBe('Methyl Bromide');
      expect(result.data!.fumigationCertNumber).toBe('CERT-12345');
      expect(result.data!.fumigationExpiryDate).toBe(expiryDate);
      expect(result.data!.fumigationAgent).toBe('Pest Control Inc.');
      expect(result.data!.fumigationDate).toBeDefined();
    });

    it('should fail for nonexistent QC check', () => {
      const result = engine.recordFumigation('nonexistent-id', 'Type', 'Cert', new Date(), 'Agent');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail for finalized QC check', () => {
      const qc = createQC(engine);
      engine.recordWeightVerification(qc.id, 25000, 3800);
      engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      const result = engine.recordFumigation(qc.id, 'Type', 'Cert', new Date(), 'Agent');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Cargo QC Checks - Hold / Release
  // ==========================================================================

  describe('placeQCHold', () => {
    it('should place a hold on a pending QC check', () => {
      const qc = createQC(engine);
      const result = engine.placeQCHold(qc.id, 'Suspicious weight', 'officer-001');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('on_hold');
      expect(result.data!.holdReason).toBe('Suspicious weight');
      expect(result.data!.holdPlacedBy).toBe('officer-001');
    });

    it('should place a hold on an in-progress QC check', () => {
      const qc = createQC(engine);
      engine.recordWeightVerification(qc.id, 25000, 3800);
      const result = engine.placeQCHold(qc.id, 'Investigation needed', 'officer-002');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('on_hold');
    });

    it('should fail if already on hold', () => {
      const qc = createQC(engine);
      engine.placeQCHold(qc.id, 'First hold', 'officer-001');
      const result = engine.placeQCHold(qc.id, 'Second hold', 'officer-002');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ALREADY_ON_HOLD');
    });

    it('should fail for finalized QC check', () => {
      const qc = createQC(engine);
      engine.recordWeightVerification(qc.id, 25000, 3800);
      engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      const result = engine.placeQCHold(qc.id, 'Hold', 'officer-001');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail for nonexistent QC check', () => {
      const result = engine.placeQCHold('nonexistent-id', 'Hold', 'officer-001');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  describe('releaseQCHold', () => {
    it('should release a held QC check back to in_progress', () => {
      const qc = createQC(engine);
      engine.placeQCHold(qc.id, 'Under investigation', 'officer-001');
      const result = engine.releaseQCHold(qc.id, 'officer-002');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('in_progress');
      expect(result.data!.holdReleasedBy).toBe('officer-002');
      expect(result.data!.holdReleasedAt).toBeDefined();
    });

    it('should fail if not on hold', () => {
      const qc = createQC(engine);
      const result = engine.releaseQCHold(qc.id, 'officer-001');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should fail for nonexistent QC check', () => {
      const result = engine.releaseQCHold('nonexistent-id', 'officer-001');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  // ==========================================================================
  // Cargo QC Checks - Complete
  // ==========================================================================

  describe('completeQCCheck', () => {
    it('should pass QC check with weight within tolerance (<=5%)', () => {
      const qc = createQC(engine, { declaredGrossWeight: 25000 });
      engine.recordWeightVerification(qc.id, 25500, 3800); // 2% variance
      const result = engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector Name');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('passed');
      expect(result.data!.passedChecks).toContain('weight_verification');
      expect(result.data!.failedChecks).not.toContain('weight_verification');
      expect(result.data!.inspectorId).toBe('inspector-001');
      expect(result.data!.inspectorName).toBe('Inspector Name');
      expect(result.data!.inspectedAt).toBeDefined();
    });

    it('should fail QC check with weight exceeding 5% tolerance', () => {
      const qc = createQC(engine, { declaredGrossWeight: 25000 });
      engine.recordWeightVerification(qc.id, 27000, 3800); // 8% variance
      const result = engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('failed');
      expect(result.data!.failedChecks).toContain('weight_verification');
    });

    it('should pass temperature check when acceptable', () => {
      const qc = createQC(engine, { requiredTemperature: -18 });
      engine.recordTemperatureCheck(qc.id, -17.5); // within 2 degrees
      // Need to set status to in_progress first (recordTemperatureCheck does this)
      const result = engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      expect(result.success).toBe(true);
      expect(result.data!.passedChecks).toContain('temperature_check');
    });

    it('should fail temperature check when unacceptable', () => {
      const qc = createQC(engine, { requiredTemperature: -18 });
      engine.recordTemperatureCheck(qc.id, -14); // 4 degrees variance
      const result = engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('failed');
      expect(result.data!.failedChecks).toContain('temperature_check');
    });

    it('should pass dimension check when within limits', () => {
      const qc = createQC(engine);
      engine.recordDimensionCheck(qc.id, 12.0, 2.3, 2.4);
      const result = engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      expect(result.success).toBe(true);
      expect(result.data!.passedChecks).toContain('dimension_check');
    });

    it('should fail dimension check when oversize or out-of-gauge', () => {
      const qc = createQC(engine);
      engine.recordDimensionCheck(qc.id, 13.0, 2.6, 2.7); // oversize + OOG
      const result = engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      expect(result.success).toBe(true);
      expect(result.data!.failedChecks).toContain('dimension_check');
    });

    it('should pass fumigation check with valid certificate', () => {
      const futureDate = new Date(Date.now() + 30 * 86400000);
      const qc = createQC(engine, { fumigationRequired: true });
      engine.recordFumigation(qc.id, 'Methyl Bromide', 'CERT-001', futureDate, 'Agent');
      const result = engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      expect(result.success).toBe(true);
      expect(result.data!.passedChecks).toContain('fumigation');
    });

    it('should fail fumigation check with expired certificate', () => {
      const pastDate = new Date(Date.now() - 30 * 86400000);
      const qc = createQC(engine, { fumigationRequired: true });
      engine.recordFumigation(qc.id, 'Methyl Bromide', 'CERT-001', pastDate, 'Agent');
      const result = engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      expect(result.success).toBe(true);
      expect(result.data!.failedChecks).toContain('fumigation');
    });

    it('should fail fumigation check when required but no certificate', () => {
      const qc = createQC(engine, { fumigationRequired: true });
      // Set status to in_progress manually via weight verification
      engine.recordWeightVerification(qc.id, 25000, 3800);
      const result = engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      expect(result.success).toBe(true);
      expect(result.data!.failedChecks).toContain('fumigation');
    });

    it('should pass VGM verification when certified', () => {
      const qc = createQC(engine);
      engine.recordWeightVerification(qc.id, 25000, 3800, 'method1');
      const result = engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      expect(result.success).toBe(true);
      expect(result.data!.passedChecks).toContain('vgm_verification');
    });

    it('should combine multiple passed and failed checks', () => {
      const qc = createQC(engine, {
        declaredGrossWeight: 25000,
        requiredTemperature: -18,
        fumigationRequired: true,
      });
      engine.recordWeightVerification(qc.id, 25500, 3800, 'method1'); // pass weight + VGM
      engine.recordTemperatureCheck(qc.id, -14); // fail temperature
      engine.recordDimensionCheck(qc.id, 12.0, 2.3, 2.4); // pass dimension
      // No fumigation cert -> fail fumigation

      const result = engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('failed');
      expect(result.data!.passedChecks).toContain('weight_verification');
      expect(result.data!.passedChecks).toContain('vgm_verification');
      expect(result.data!.passedChecks).toContain('dimension_check');
      expect(result.data!.failedChecks).toContain('temperature_check');
      expect(result.data!.failedChecks).toContain('fumigation');
    });

    it('should set status to passed when all checks pass', () => {
      const qc = createQC(engine, { declaredGrossWeight: 25000 });
      engine.recordWeightVerification(qc.id, 25100, 3800); // within tolerance
      engine.recordDimensionCheck(qc.id, 12.0, 2.3, 2.4);
      const result = engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('passed');
      expect(result.data!.failedChecks).toHaveLength(0);
    });

    it('should fail for nonexistent QC check', () => {
      const result = engine.completeQCCheck('nonexistent-id', 'inspector-001', 'Inspector');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should fail if QC check is not in progress', () => {
      const qc = createQC(engine);
      // Status is 'pending', not 'in_progress'
      const result = engine.completeQCCheck(qc.id, 'inspector-001', 'Inspector');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ==========================================================================
  // Inspection Stats
  // ==========================================================================

  describe('getInspectionStats', () => {
    it('should return zeroed stats for an empty tenant', () => {
      const stats = engine.getInspectionStats('empty-tenant');
      expect(stats.tenantId).toBe('empty-tenant');
      expect(stats.totalSurveys).toBe(0);
      expect(stats.completedSurveys).toBe(0);
      expect(stats.pendingSurveys).toBe(0);
      expect(stats.passRate).toBe(0);
      expect(stats.failRate).toBe(0);
      expect(stats.surveysToday).toBe(0);
      expect(stats.averageSurveyDurationMinutes).toBe(0);
      expect(stats.totalExams).toBe(0);
      expect(stats.completedExams).toBe(0);
      expect(stats.pendingExams).toBe(0);
      expect(stats.examsToday).toBe(0);
      expect(stats.noDiscrepancyRate).toBe(0);
      expect(stats.discrepancyRate).toBe(0);
      expect(stats.averageExamDurationMinutes).toBe(0);
      expect(stats.totalQCChecks).toBe(0);
      expect(stats.passedQCChecks).toBe(0);
      expect(stats.failedQCChecks).toBe(0);
      expect(stats.onHoldQCChecks).toBe(0);
      expect(stats.qcChecksToday).toBe(0);
      expect(stats.qcPassRate).toBe(0);
      expect(stats.totalDamagesReported).toBe(0);
      expect(stats.criticalDamages).toBe(0);
      expect(stats.pendingRepairs).toBe(0);
      expect(stats.totalRepairCost).toBe(0);
    });

    it('should count surveys correctly', () => {
      // 2 scheduled, 1 in progress
      scheduleSurvey(engine);
      scheduleSurvey(engine);
      startSurveyHelper(engine);

      const stats = engine.getInspectionStats(TENANT_ID);
      expect(stats.totalSurveys).toBe(3);
      expect(stats.pendingSurveys).toBe(3); // scheduled + in_progress = pending
      expect(stats.completedSurveys).toBe(0);
    });

    it('should count completed surveys and pass/fail rates', () => {
      // Complete 2 surveys: 1 pass, 1 fail
      const s1 = startSurveyHelper(engine);
      const s2 = startSurveyHelper(engine);
      engine.completeSurvey(s1.id, { result: 'pass' });
      engine.completeSurvey(s2.id, { result: 'fail' });

      const stats = engine.getInspectionStats(TENANT_ID);
      expect(stats.completedSurveys).toBe(2);
      expect(stats.passRate).toBe(50); // 1/2 = 50%
      expect(stats.failRate).toBe(50); // 1/2 = 50%
    });

    it('should include conditional_pass in passRate', () => {
      const s1 = startSurveyHelper(engine);
      engine.completeSurvey(s1.id, { result: 'conditional_pass' });

      const stats = engine.getInspectionStats(TENANT_ID);
      expect(stats.passRate).toBe(100);
      expect(stats.failRate).toBe(0);
    });

    it('should count exams correctly', () => {
      orderExam(engine);
      orderExam(engine);
      const exam3 = orderExam(engine);
      engine.assignExamOfficer(exam3.id, 'officer-001', 'Officer', 'Superintendent');
      engine.startExam(exam3.id);
      engine.completeExam(exam3.id, { finding: 'no_discrepancy' });

      const stats = engine.getInspectionStats(TENANT_ID);
      expect(stats.totalExams).toBe(3);
      expect(stats.completedExams).toBe(1);
      expect(stats.pendingExams).toBe(2);
    });

    it('should compute discrepancy rates', () => {
      // Complete 3 exams: 1 no_discrepancy, 1 minor, 1 major
      const e1 = orderExam(engine);
      const e2 = orderExam(engine);
      const e3 = orderExam(engine);

      [e1, e2, e3].forEach(exam => {
        engine.assignExamOfficer(exam.id, 'officer-001', 'Officer', 'Superintendent');
        engine.startExam(exam.id);
      });

      engine.completeExam(e1.id, { finding: 'no_discrepancy' });
      engine.completeExam(e2.id, { finding: 'minor_discrepancy' });
      engine.completeExam(e3.id, { finding: 'major_discrepancy' });

      const stats = engine.getInspectionStats(TENANT_ID);
      expect(stats.noDiscrepancyRate).toBeCloseTo(33.33, 1);
      expect(stats.discrepancyRate).toBeCloseTo(66.67, 1);
    });

    it('should count QC checks by status', () => {
      const qc1 = createQC(engine, { declaredGrossWeight: 25000 });
      const qc2 = createQC(engine, { declaredGrossWeight: 25000 });
      const qc3 = createQC(engine);

      // qc1: pass
      engine.recordWeightVerification(qc1.id, 25100, 3800);
      engine.completeQCCheck(qc1.id, 'inspector-001', 'Inspector');

      // qc2: fail
      engine.recordWeightVerification(qc2.id, 28000, 3800); // >5% variance
      engine.completeQCCheck(qc2.id, 'inspector-001', 'Inspector');

      // qc3: on_hold
      engine.placeQCHold(qc3.id, 'Investigation', 'officer-001');

      const stats = engine.getInspectionStats(TENANT_ID);
      expect(stats.totalQCChecks).toBe(3);
      expect(stats.passedQCChecks).toBe(1);
      expect(stats.failedQCChecks).toBe(1);
      expect(stats.onHoldQCChecks).toBe(1);
      expect(stats.qcPassRate).toBe(50); // 1/(1+1) = 50%
    });

    it('should track damage statistics', () => {
      const s1 = startSurveyHelper(engine);
      engine.addDamageEntry(s1.id, makeDamageInput({ severity: 'critical' }));
      engine.addDamageEntry(s1.id, makeDamageInput({ severity: 'moderate' }));
      engine.completeSurvey(s1.id, {
        result: 'fail',
        estimatedRepairCost: 50000,
      });

      const s2 = startSurveyHelper(engine);
      engine.addDamageEntry(s2.id, makeDamageInput({ severity: 'critical' }));
      engine.completeSurvey(s2.id, {
        result: 'fail',
        estimatedRepairCost: 30000,
      });

      const stats = engine.getInspectionStats(TENANT_ID);
      expect(stats.totalDamagesReported).toBe(3);
      expect(stats.criticalDamages).toBe(2);
      expect(stats.pendingRepairs).toBe(2);
      expect(stats.totalRepairCost).toBe(80000);
    });

    it('should count today activity', () => {
      scheduleSurvey(engine);
      orderExam(engine);
      createQC(engine);

      const stats = engine.getInspectionStats(TENANT_ID);
      expect(stats.surveysToday).toBeGreaterThanOrEqual(1);
      expect(stats.examsToday).toBeGreaterThanOrEqual(1);
      expect(stats.qcChecksToday).toBeGreaterThanOrEqual(1);
    });

    it('should not count other tenant data', () => {
      scheduleSurvey(engine, { tenantId: 'other-tenant' });
      orderExam(engine, { tenantId: 'other-tenant' });
      createQC(engine, { tenantId: 'other-tenant' });

      const stats = engine.getInspectionStats(TENANT_ID);
      expect(stats.totalSurveys).toBe(0);
      expect(stats.totalExams).toBe(0);
      expect(stats.totalQCChecks).toBe(0);
    });
  });
});
