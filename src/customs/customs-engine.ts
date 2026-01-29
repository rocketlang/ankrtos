// Customs Engine for ankrICD
// Bill of Entry, Shipping Bill, ICEGATE EDI, Examination, Duty Payment

import { v4 as uuidv4 } from 'uuid';
import type {
  UUID,
  OperationResult,
  PaginatedResult,
  Address,
} from '../types/common';
import type {
  BillOfEntry,
  BOEType,
  BOEStatus,
  BOEContainer,
  BOELineItem,
  BOEDocument,
  ShippingBill,
  SBType,
  SBStatus,
  SBContainer,
  SBLineItem,
  SBDocument,
  CustomsExamination,
  ExaminationType,
  ExaminationResult,
  ExamDiscrepancy,
  ICEGATEMessage,
  ICEGATEMessageType,
  DutyChallan,
} from '../types/customs';
import { emit } from '../core';

// ============================================================================
// CUSTOMS ENGINE
// ============================================================================

export class CustomsEngine {
  private static instance: CustomsEngine | null = null;

  // In-memory stores
  private billsOfEntry: Map<UUID, BillOfEntry> = new Map();
  private shippingBills: Map<UUID, ShippingBill> = new Map();
  private examinations: Map<UUID, CustomsExamination> = new Map();
  private icegateMessages: Map<UUID, ICEGATEMessage> = new Map();
  private dutyChallan: Map<UUID, DutyChallan> = new Map();

  private boeCounter = 0;
  private sbCounter = 0;

  private constructor() {}

  static getInstance(): CustomsEngine {
    if (!CustomsEngine.instance) {
      CustomsEngine.instance = new CustomsEngine();
    }
    return CustomsEngine.instance;
  }

  static resetInstance(): void {
    CustomsEngine.instance = null;
  }

  // ============================================================================
  // BILL OF ENTRY (IMPORT)
  // ============================================================================

  /**
   * Create a Bill of Entry
   */
  createBillOfEntry(input: CreateBOEInput): OperationResult<BillOfEntry> {
    this.boeCounter++;

    // Calculate totals
    let totalDuty = 0;
    let totalAssessableValue = 0;
    for (const item of input.lineItems) {
      totalAssessableValue += item.assessableValue;
      totalDuty += item.basicDuty + item.igst + (item.cess ?? 0);
    }

    const boe: BillOfEntry = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      beType: input.beType,
      status: 'draft',
      jobNumber: input.jobNumber,
      referenceNumber: input.referenceNumber,

      // Importer
      importerIEC: input.importerIEC,
      importerName: input.importerName,
      importerGstin: input.importerGstin,
      importerAddress: input.importerAddress,

      // CHA
      chaLicense: input.chaLicense,
      chaName: input.chaName,

      // Import details
      countryOfOrigin: input.countryOfOrigin,
      countryOfConsignment: input.countryOfConsignment,
      portOfLoading: input.portOfLoading,
      portOfDischarge: input.portOfDischarge,
      portOfRegistration: input.portOfRegistration,

      // Transport
      transportMode: input.transportMode,
      vesselName: input.vesselName,
      voyageNumber: input.voyageNumber,
      flightNumber: input.flightNumber,
      arrivalDate: input.arrivalDate,

      // BL
      blNumber: input.blNumber,
      blDate: input.blDate,
      blType: input.blType ?? 'master',
      masterBlNumber: input.masterBlNumber,

      // IGM
      igmNumber: input.igmNumber,
      igmDate: input.igmDate,
      igmLineNumber: input.igmLineNumber,

      // Containers
      containers: input.containers,
      totalContainers: input.containers.length,
      totalPackages: input.containers.reduce((s, c) => s + c.packages, 0),
      totalGrossWeight: input.containers.reduce((s, c) => s + c.grossWeight, 0),
      totalNetWeight: input.totalNetWeight,

      // Items
      lineItems: input.lineItems,
      totalItems: input.lineItems.length,

      // Values
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      invoiceValue: input.invoiceValue,
      invoiceCurrency: input.invoiceCurrency,
      exchangeRate: input.exchangeRate,
      cifValue: input.cifValue,
      assessableValue: totalAssessableValue,
      currency: 'INR',

      // Duties
      basicDuty: input.lineItems.reduce((s, i) => s + i.basicDuty, 0),
      additionalDuty: input.additionalDuty ?? 0,
      specialDuty: input.specialDuty ?? 0,
      igst: input.lineItems.reduce((s, i) => s + i.igst, 0),
      cess: input.lineItems.reduce((s, i) => s + (i.cess ?? 0), 0),
      totalDuty,

      // Insurance & Freight
      insuranceValue: input.insuranceValue,
      freightValue: input.freightValue,
      landingCharges: input.landingCharges,

      // Examination
      examinationOrdered: false,

      // Documents
      documents: input.documents ?? [],

      // Notes
      remarks: input.remarks,

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.billsOfEntry.set(boe.id, boe);

    emit('customs.boe_created', {
      boeId: boe.id,
      beType: boe.beType,
      importerName: boe.importerName,
      importerIEC: boe.importerIEC,
      blNumber: boe.blNumber,
      totalContainers: boe.totalContainers,
      totalDuty: boe.totalDuty,
    }, { tenantId: boe.tenantId });

    return { success: true, data: boe };
  }

  /**
   * Get Bill of Entry by ID
   */
  getBillOfEntry(boeId: UUID): BillOfEntry | undefined {
    return this.billsOfEntry.get(boeId);
  }

  /**
   * Submit BOE to ICEGATE
   */
  submitBOE(boeId: UUID): OperationResult<BillOfEntry> {
    const boe = this.billsOfEntry.get(boeId);
    if (!boe) {
      return { success: false, error: 'Bill of Entry not found', errorCode: 'NOT_FOUND' };
    }

    if (boe.status !== 'draft') {
      return {
        success: false,
        error: `Cannot submit BOE in status ${boe.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    boe.status = 'submitted';
    boe.submittedAt = new Date();
    boe.icegateRefNumber = `ICEGATE-BOE-${Date.now()}`;
    boe.updatedAt = new Date();
    this.billsOfEntry.set(boeId, boe);

    // Create ICEGATE outbound message
    this._createICEGATEMessage({
      tenantId: boe.tenantId,
      facilityId: boe.facilityId,
      messageType: 'IGES_BOE',
      direction: 'outbound',
      referenceNumber: boe.icegateRefNumber!,
      payload: JSON.stringify({
        boeId: boe.id,
        beType: boe.beType,
        importerIEC: boe.importerIEC,
        blNumber: boe.blNumber,
      }),
    });

    emit('customs.boe_submitted', {
      boeId: boe.id,
      beType: boe.beType,
      importerName: boe.importerName,
      blNumber: boe.blNumber,
      icegateRef: boe.icegateRefNumber,
    }, { tenantId: boe.tenantId });

    return { success: true, data: boe };
  }

  /**
   * Register BOE (after customs assigns number)
   */
  registerBOE(boeId: UUID, boeNumber: string): OperationResult<BillOfEntry> {
    const boe = this.billsOfEntry.get(boeId);
    if (!boe) {
      return { success: false, error: 'Bill of Entry not found', errorCode: 'NOT_FOUND' };
    }

    boe.boeNumber = boeNumber;
    boe.status = 'registered';
    boe.registeredAt = new Date();
    boe.updatedAt = new Date();
    this.billsOfEntry.set(boeId, boe);

    emit('customs.boe_registered', {
      boeId: boe.id,
      boeNumber,
      importerName: boe.importerName,
      blNumber: boe.blNumber,
    }, { tenantId: boe.tenantId });

    return { success: true, data: boe };
  }

  /**
   * Update BOE assessment (after customs assessment)
   */
  assessBOE(boeId: UUID, assessment: BOEAssessmentInput): OperationResult<BillOfEntry> {
    const boe = this.billsOfEntry.get(boeId);
    if (!boe) {
      return { success: false, error: 'Bill of Entry not found', errorCode: 'NOT_FOUND' };
    }

    if (!['registered', 'under_assessment'].includes(boe.status)) {
      return {
        success: false,
        error: `Cannot assess BOE in status ${boe.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    if (assessment.assessableValue !== undefined) {
      boe.assessableValue = assessment.assessableValue;
    }
    if (assessment.basicDuty !== undefined) boe.basicDuty = assessment.basicDuty;
    if (assessment.additionalDuty !== undefined) boe.additionalDuty = assessment.additionalDuty;
    if (assessment.igst !== undefined) boe.igst = assessment.igst;
    if (assessment.cess !== undefined) boe.cess = assessment.cess;
    boe.totalDuty = boe.basicDuty + boe.additionalDuty + boe.specialDuty + boe.igst + boe.cess;

    boe.status = 'assessed';
    boe.assessedAt = new Date();
    boe.updatedAt = new Date();
    this.billsOfEntry.set(boeId, boe);

    emit('customs.boe_assessed', {
      boeId: boe.id,
      boeNumber: boe.boeNumber,
      importerName: boe.importerName,
      totalDuty: boe.totalDuty,
    }, { tenantId: boe.tenantId });

    return { success: true, data: boe };
  }

  /**
   * Record duty payment
   */
  recordDutyPayment(boeId: UUID, paymentInfo: DutyPaymentInput): OperationResult<BillOfEntry> {
    const boe = this.billsOfEntry.get(boeId);
    if (!boe) {
      return { success: false, error: 'Bill of Entry not found', errorCode: 'NOT_FOUND' };
    }

    if (!['assessed', 'duty_pending'].includes(boe.status)) {
      return {
        success: false,
        error: `Cannot record duty payment for BOE in status ${boe.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    // Create duty challan
    const challan: DutyChallan = {
      id: uuidv4(),
      tenantId: boe.tenantId,
      facilityId: boe.facilityId,
      challanNumber: paymentInfo.challanNumber,
      documentType: 'BOE',
      documentId: boe.id,
      documentNumber: boe.boeNumber ?? '',
      basicDuty: boe.basicDuty,
      additionalDuty: boe.additionalDuty,
      igst: boe.igst,
      cess: boe.cess,
      interest: paymentInfo.interest,
      penalty: paymentInfo.penalty,
      totalAmount: boe.totalDuty + (paymentInfo.interest ?? 0) + (paymentInfo.penalty ?? 0),
      status: 'completed',
      paymentMode: paymentInfo.paymentMode,
      bankName: paymentInfo.bankName,
      bankRefNumber: paymentInfo.bankRefNumber,
      icegateRefNumber: paymentInfo.icegateRefNumber,
      generatedAt: new Date(),
      paidAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dutyChallan.set(challan.id, challan);

    boe.status = 'duty_paid';
    boe.dutyPaidDate = new Date();
    boe.updatedAt = new Date();
    this.billsOfEntry.set(boeId, boe);

    emit('customs.duty_paid', {
      boeId: boe.id,
      boeNumber: boe.boeNumber,
      challanId: challan.id,
      totalAmount: challan.totalAmount,
      paymentMode: challan.paymentMode,
    }, { tenantId: boe.tenantId });

    return { success: true, data: boe };
  }

  /**
   * Grant Out of Charge
   */
  grantOutOfCharge(boeId: UUID): OperationResult<BillOfEntry> {
    const boe = this.billsOfEntry.get(boeId);
    if (!boe) {
      return { success: false, error: 'Bill of Entry not found', errorCode: 'NOT_FOUND' };
    }

    if (!['duty_paid', 'examination_completed'].includes(boe.status)) {
      return {
        success: false,
        error: `Cannot grant OOC for BOE in status ${boe.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    boe.status = 'out_of_charge';
    boe.outOfChargeAt = new Date();
    boe.updatedAt = new Date();

    // Update all container statuses
    for (const container of boe.containers) {
      container.status = 'cleared';
    }

    this.billsOfEntry.set(boeId, boe);

    emit('customs.out_of_charge', {
      boeId: boe.id,
      boeNumber: boe.boeNumber,
      importerName: boe.importerName,
      containerNumbers: boe.containers.map(c => c.containerNumber),
      outOfChargeAt: boe.outOfChargeAt,
    }, { tenantId: boe.tenantId });

    return { success: true, data: boe };
  }

  /**
   * List Bills of Entry
   */
  listBillsOfEntry(options: BOEQueryOptions = {}): PaginatedResult<BillOfEntry> {
    let items = Array.from(this.billsOfEntry.values());

    if (options.tenantId) items = items.filter(b => b.tenantId === options.tenantId);
    if (options.facilityId) items = items.filter(b => b.facilityId === options.facilityId);
    if (options.status) items = items.filter(b => b.status === options.status);
    if (options.statuses) items = items.filter(b => options.statuses!.includes(b.status));
    if (options.importerIEC) items = items.filter(b => b.importerIEC === options.importerIEC);
    if (options.blNumber) items = items.filter(b => b.blNumber === options.blNumber);
    if (options.boeNumber) items = items.filter(b => b.boeNumber === options.boeNumber);
    if (options.containerNumber) {
      items = items.filter(b =>
        b.containers.some(c => c.containerNumber === options.containerNumber)
      );
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    items = items.slice(offset, offset + pageSize);

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  // ============================================================================
  // SHIPPING BILL (EXPORT)
  // ============================================================================

  /**
   * Create a Shipping Bill
   */
  createShippingBill(input: CreateSBInput): OperationResult<ShippingBill> {
    this.sbCounter++;

    const sb: ShippingBill = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      sbType: input.sbType,
      status: 'draft',
      jobNumber: input.jobNumber,

      // Exporter
      exporterIEC: input.exporterIEC,
      exporterName: input.exporterName,
      exporterGstin: input.exporterGstin,
      exporterAddress: input.exporterAddress,

      // CHA
      chaLicense: input.chaLicense,
      chaName: input.chaName,

      // Buyer
      buyerName: input.buyerName,
      buyerAddress: input.buyerAddress,
      buyerCountry: input.buyerCountry,

      // Export details
      portOfLoading: input.portOfLoading,
      portOfDischarge: input.portOfDischarge,
      finalDestination: input.finalDestination,
      countryOfDestination: input.countryOfDestination,

      // Invoice
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      invoiceValue: input.invoiceValue,
      invoiceCurrency: input.invoiceCurrency,
      exchangeRate: input.exchangeRate,
      fobValue: input.fobValue,
      currency: 'INR',

      // Transport
      transportMode: input.transportMode,
      vesselName: input.vesselName,
      voyageNumber: input.voyageNumber,
      rotationNumber: input.rotationNumber,

      // Containers
      containers: input.containers,
      totalContainers: input.containers.length,
      totalPackages: input.containers.reduce((s, c) => s + c.packages, 0),
      totalGrossWeight: input.containers.reduce((s, c) => s + c.grossWeight, 0),
      totalNetWeight: input.totalNetWeight,

      // Items
      lineItems: input.lineItems,
      totalItems: input.lineItems.length,

      // Incentives
      drawbackAmount: input.drawbackAmount,
      drawbackClaimed: input.drawbackClaimed,
      rodtep: input.rodtep,

      // Documents
      documents: input.documents ?? [],

      // Notes
      remarks: input.remarks,

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.shippingBills.set(sb.id, sb);

    emit('customs.sb_created', {
      sbId: sb.id,
      sbType: sb.sbType,
      exporterName: sb.exporterName,
      exporterIEC: sb.exporterIEC,
      totalContainers: sb.totalContainers,
      fobValue: sb.fobValue,
    }, { tenantId: sb.tenantId });

    return { success: true, data: sb };
  }

  /**
   * Get Shipping Bill by ID
   */
  getShippingBill(sbId: UUID): ShippingBill | undefined {
    return this.shippingBills.get(sbId);
  }

  /**
   * Submit Shipping Bill to ICEGATE
   */
  submitShippingBill(sbId: UUID): OperationResult<ShippingBill> {
    const sb = this.shippingBills.get(sbId);
    if (!sb) {
      return { success: false, error: 'Shipping Bill not found', errorCode: 'NOT_FOUND' };
    }

    if (sb.status !== 'draft') {
      return {
        success: false,
        error: `Cannot submit SB in status ${sb.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    sb.status = 'submitted';
    sb.submittedAt = new Date();
    sb.icegateRefNumber = `ICEGATE-SB-${Date.now()}`;
    sb.updatedAt = new Date();
    this.shippingBills.set(sbId, sb);

    this._createICEGATEMessage({
      tenantId: sb.tenantId,
      facilityId: sb.facilityId,
      messageType: 'IGES_SB',
      direction: 'outbound',
      referenceNumber: sb.icegateRefNumber!,
      payload: JSON.stringify({
        sbId: sb.id,
        sbType: sb.sbType,
        exporterIEC: sb.exporterIEC,
        fobValue: sb.fobValue,
      }),
    });

    emit('customs.sb_submitted', {
      sbId: sb.id,
      sbType: sb.sbType,
      exporterName: sb.exporterName,
      icegateRef: sb.icegateRefNumber,
    }, { tenantId: sb.tenantId });

    return { success: true, data: sb };
  }

  /**
   * Register Shipping Bill
   */
  registerShippingBill(sbId: UUID, sbNumber: string): OperationResult<ShippingBill> {
    const sb = this.shippingBills.get(sbId);
    if (!sb) {
      return { success: false, error: 'Shipping Bill not found', errorCode: 'NOT_FOUND' };
    }

    sb.sbNumber = sbNumber;
    sb.status = 'registered';
    sb.registeredAt = new Date();
    sb.updatedAt = new Date();
    this.shippingBills.set(sbId, sb);

    emit('customs.sb_registered', {
      sbId: sb.id,
      sbNumber,
      exporterName: sb.exporterName,
    }, { tenantId: sb.tenantId });

    return { success: true, data: sb };
  }

  /**
   * Grant Let Export Order (LEO)
   */
  grantLetExport(sbId: UUID, officer: string): OperationResult<ShippingBill> {
    const sb = this.shippingBills.get(sbId);
    if (!sb) {
      return { success: false, error: 'Shipping Bill not found', errorCode: 'NOT_FOUND' };
    }

    if (!['assessed', 'examination_completed', 'registered'].includes(sb.status)) {
      return {
        success: false,
        error: `Cannot grant LEO for SB in status ${sb.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    sb.status = 'let_export';
    sb.letExportDate = new Date();
    sb.letExportBy = officer;
    sb.letExportAt = new Date();
    sb.updatedAt = new Date();
    this.shippingBills.set(sbId, sb);

    emit('customs.let_export', {
      sbId: sb.id,
      sbNumber: sb.sbNumber,
      exporterName: sb.exporterName,
      containerNumbers: sb.containers.map(c => c.containerNumber),
      letExportAt: sb.letExportAt,
    }, { tenantId: sb.tenantId });

    return { success: true, data: sb };
  }

  /**
   * Generate Export Order of Shipment (EOS)
   */
  generateEOS(sbId: UUID, egmNumber: string, egmDate: Date): OperationResult<ShippingBill> {
    const sb = this.shippingBills.get(sbId);
    if (!sb) {
      return { success: false, error: 'Shipping Bill not found', errorCode: 'NOT_FOUND' };
    }

    if (sb.status !== 'let_export') {
      return {
        success: false,
        error: `Cannot generate EOS for SB in status ${sb.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    sb.status = 'eos';
    sb.egmNumber = egmNumber;
    sb.egmDate = egmDate;
    sb.updatedAt = new Date();
    this.shippingBills.set(sbId, sb);

    emit('customs.eos_generated', {
      sbId: sb.id,
      sbNumber: sb.sbNumber,
      exporterName: sb.exporterName,
      egmNumber,
    }, { tenantId: sb.tenantId });

    return { success: true, data: sb };
  }

  /**
   * List Shipping Bills
   */
  listShippingBills(options: SBQueryOptions = {}): PaginatedResult<ShippingBill> {
    let items = Array.from(this.shippingBills.values());

    if (options.tenantId) items = items.filter(s => s.tenantId === options.tenantId);
    if (options.facilityId) items = items.filter(s => s.facilityId === options.facilityId);
    if (options.status) items = items.filter(s => s.status === options.status);
    if (options.statuses) items = items.filter(s => options.statuses!.includes(s.status));
    if (options.exporterIEC) items = items.filter(s => s.exporterIEC === options.exporterIEC);
    if (options.sbNumber) items = items.filter(s => s.sbNumber === options.sbNumber);

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    items = items.slice(offset, offset + pageSize);

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  // ============================================================================
  // CUSTOMS EXAMINATION
  // ============================================================================

  /**
   * Order a customs examination
   */
  orderExamination(input: OrderExaminationInput): OperationResult<CustomsExamination> {
    const exam: CustomsExamination = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      examinationNumber: `EXAM-${Date.now()}`,
      examinationType: input.examinationType,
      documentType: input.documentType,
      documentId: input.documentId,
      documentNumber: input.documentNumber,
      containerId: input.containerId,
      containerNumber: input.containerNumber,
      orderedAt: new Date(),
      orderedBy: input.orderedBy,
      scheduledDate: input.scheduledDate,
      scheduledSlot: input.scheduledSlot,
      examinationLocation: input.examinationLocation,
      photos: [],
      sampleTaken: false,
      reExaminationRequired: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.examinations.set(exam.id, exam);

    // Update the linked document
    if (input.documentType === 'BOE') {
      const boe = this.billsOfEntry.get(input.documentId);
      if (boe) {
        boe.examinationOrdered = true;
        boe.examinationId = exam.id;
        boe.status = 'examination_ordered';
        boe.updatedAt = new Date();
        this.billsOfEntry.set(boe.id, boe);
      }
    }

    emit('customs.examination_ordered', {
      examId: exam.id,
      examinationType: exam.examinationType,
      documentType: exam.documentType,
      documentNumber: exam.documentNumber,
      containerNumber: exam.containerNumber,
      orderedBy: exam.orderedBy,
    }, { tenantId: exam.tenantId });

    return { success: true, data: exam };
  }

  /**
   * Start examination
   */
  startExamination(examId: UUID, officer: string): OperationResult<CustomsExamination> {
    const exam = this.examinations.get(examId);
    if (!exam) {
      return { success: false, error: 'Examination not found', errorCode: 'NOT_FOUND' };
    }

    exam.startedAt = new Date();
    exam.examOfficer = officer;
    exam.updatedAt = new Date();
    this.examinations.set(examId, exam);

    // Update linked document
    if (exam.documentType === 'BOE') {
      const boe = this.billsOfEntry.get(exam.documentId);
      if (boe) {
        boe.status = 'under_examination';
        boe.updatedAt = new Date();
        this.billsOfEntry.set(boe.id, boe);
      }
    }

    emit('customs.examination_started', {
      examId: exam.id,
      examinationType: exam.examinationType,
      containerNumber: exam.containerNumber,
      officer,
    }, { tenantId: exam.tenantId });

    return { success: true, data: exam };
  }

  /**
   * Complete examination with findings
   */
  completeExamination(input: CompleteExaminationInput): OperationResult<CustomsExamination> {
    const exam = this.examinations.get(input.examId);
    if (!exam) {
      return { success: false, error: 'Examination not found', errorCode: 'NOT_FOUND' };
    }

    exam.completedAt = new Date();
    exam.result = input.result;
    exam.findings = input.findings;
    exam.discrepancies = input.discrepancies;
    exam.sampleTaken = input.sampleTaken ?? false;
    exam.sampleDetails = input.sampleDetails;
    exam.reExaminationRequired = input.reExaminationRequired ?? false;
    exam.reExaminationReason = input.reExaminationReason;
    exam.updatedAt = new Date();
    this.examinations.set(input.examId, exam);

    // Update linked document
    if (exam.documentType === 'BOE') {
      const boe = this.billsOfEntry.get(exam.documentId);
      if (boe) {
        boe.status = 'examination_completed';
        boe.updatedAt = new Date();
        this.billsOfEntry.set(boe.id, boe);
      }
    } else {
      const sb = this.shippingBills.get(exam.documentId);
      if (sb) {
        sb.status = 'examination_completed';
        sb.updatedAt = new Date();
        this.shippingBills.set(sb.id, sb);
      }
    }

    emit('customs.examination_completed', {
      examId: exam.id,
      examinationType: exam.examinationType,
      containerNumber: exam.containerNumber,
      result: exam.result,
      discrepanciesFound: (exam.discrepancies?.length ?? 0) > 0,
    }, { tenantId: exam.tenantId });

    if (exam.discrepancies && exam.discrepancies.length > 0) {
      emit('customs.discrepancy_found', {
        examId: exam.id,
        containerNumber: exam.containerNumber,
        documentNumber: exam.documentNumber,
        discrepancies: exam.discrepancies,
      }, { tenantId: exam.tenantId });
    }

    return { success: true, data: exam };
  }

  /**
   * List examinations
   */
  listExaminations(options: ExaminationQueryOptions = {}): PaginatedResult<CustomsExamination> {
    let items = Array.from(this.examinations.values());

    if (options.tenantId) items = items.filter(e => e.tenantId === options.tenantId);
    if (options.facilityId) items = items.filter(e => e.facilityId === options.facilityId);
    if (options.documentType) items = items.filter(e => e.documentType === options.documentType);
    if (options.documentId) items = items.filter(e => e.documentId === options.documentId);
    if (options.result) items = items.filter(e => e.result === options.result);
    if (options.pendingOnly) {
      items = items.filter(e => !e.completedAt);
    }

    items.sort((a, b) => b.orderedAt.getTime() - a.orderedAt.getTime());

    const total = items.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    items = items.slice(offset, offset + pageSize);

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  // ============================================================================
  // ICEGATE EDI MESSAGING
  // ============================================================================

  /**
   * Create and queue an ICEGATE message
   */
  private _createICEGATEMessage(input: {
    tenantId: string;
    facilityId: string;
    messageType: ICEGATEMessageType;
    direction: 'inbound' | 'outbound';
    referenceNumber: string;
    payload: string;
    correlationId?: string;
  }): ICEGATEMessage {
    const message: ICEGATEMessage = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      messageType: input.messageType,
      direction: input.direction,
      referenceNumber: input.referenceNumber,
      correlationId: input.correlationId,
      payload: input.payload,
      status: input.direction === 'outbound' ? 'pending' : 'acknowledged',
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.icegateMessages.set(message.id, message);
    return message;
  }

  /**
   * Process an inbound ICEGATE message
   */
  processInboundMessage(input: ProcessInboundMessageInput): OperationResult<ICEGATEMessage> {
    const message = this._createICEGATEMessage({
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      messageType: input.messageType,
      direction: 'inbound',
      referenceNumber: input.referenceNumber,
      payload: input.payload,
      correlationId: input.correlationId,
    });

    message.processedAt = new Date();
    message.parsedData = input.parsedData;
    message.status = 'acknowledged';
    this.icegateMessages.set(message.id, message);

    emit('system.edi_received', {
      messageId: message.id,
      messageType: message.messageType,
      referenceNumber: message.referenceNumber,
    }, { tenantId: message.tenantId });

    return { success: true, data: message };
  }

  /**
   * List ICEGATE messages
   */
  listICEGATEMessages(options: ICEGATEMessageQueryOptions = {}): PaginatedResult<ICEGATEMessage> {
    let items = Array.from(this.icegateMessages.values());

    if (options.tenantId) items = items.filter(m => m.tenantId === options.tenantId);
    if (options.direction) items = items.filter(m => m.direction === options.direction);
    if (options.messageType) items = items.filter(m => m.messageType === options.messageType);
    if (options.status) items = items.filter(m => m.status === options.status);

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    items = items.slice(offset, offset + pageSize);

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  // ============================================================================
  // HOLDS
  // ============================================================================

  /**
   * Place customs hold on a BOE
   */
  placeHold(boeId: UUID, reason: string): OperationResult<BillOfEntry> {
    const boe = this.billsOfEntry.get(boeId);
    if (!boe) {
      return { success: false, error: 'Bill of Entry not found', errorCode: 'NOT_FOUND' };
    }

    boe.remarks = (boe.remarks ? boe.remarks + '\n' : '') + `HOLD: ${reason}`;
    boe.updatedAt = new Date();
    this.billsOfEntry.set(boeId, boe);

    emit('customs.hold_placed', {
      boeId: boe.id,
      boeNumber: boe.boeNumber,
      importerName: boe.importerName,
      reason,
      containerNumbers: boe.containers.map(c => c.containerNumber),
    }, { tenantId: boe.tenantId });

    return { success: true, data: boe };
  }

  /**
   * Release customs hold
   */
  releaseHold(boeId: UUID, releasedBy: string): OperationResult<BillOfEntry> {
    const boe = this.billsOfEntry.get(boeId);
    if (!boe) {
      return { success: false, error: 'Bill of Entry not found', errorCode: 'NOT_FOUND' };
    }

    boe.remarks = (boe.remarks ? boe.remarks + '\n' : '') + `HOLD RELEASED by ${releasedBy}`;
    boe.updatedAt = new Date();
    this.billsOfEntry.set(boeId, boe);

    emit('customs.hold_released', {
      boeId: boe.id,
      boeNumber: boe.boeNumber,
      importerName: boe.importerName,
      releasedBy,
    }, { tenantId: boe.tenantId });

    return { success: true, data: boe };
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get customs statistics
   */
  getCustomsStats(tenantId: string): CustomsStats {
    const boes = Array.from(this.billsOfEntry.values()).filter(b => b.tenantId === tenantId);
    const sbs = Array.from(this.shippingBills.values()).filter(s => s.tenantId === tenantId);
    const exams = Array.from(this.examinations.values()).filter(e => e.tenantId === tenantId);

    const pendingBOEs = boes.filter(b => !['out_of_charge', 'cancelled', 'rejected'].includes(b.status));
    const pendingSBs = sbs.filter(s => !['eos', 'shipped', 'cancelled', 'rejected'].includes(s.status));
    const pendingExams = exams.filter(e => !e.completedAt);

    const totalDutyCollected = boes
      .filter(b => b.status === 'duty_paid' || b.status === 'out_of_charge')
      .reduce((sum, b) => sum + b.totalDuty, 0);

    const totalExportValue = sbs
      .filter(s => ['let_export', 'eos', 'shipped'].includes(s.status))
      .reduce((sum, s) => sum + s.fobValue, 0);

    return {
      totalBillsOfEntry: boes.length,
      pendingBOEs: pendingBOEs.length,
      clearedBOEs: boes.filter(b => b.status === 'out_of_charge').length,
      totalShippingBills: sbs.length,
      pendingSBs: pendingSBs.length,
      exportedSBs: sbs.filter(s => ['let_export', 'eos', 'shipped'].includes(s.status)).length,
      pendingExaminations: pendingExams.length,
      completedExaminations: exams.filter(e => e.completedAt).length,
      totalDutyCollected,
      totalExportValue,
      discrepanciesFound: exams.filter(e =>
        e.result === 'major_discrepancy' || e.result === 'seizure'
      ).length,
    };
  }
}

// ============================================================================
// SINGLETON ACCESS
// ============================================================================

let customsEngineInstance: CustomsEngine | null = null;

export function getCustomsEngine(): CustomsEngine {
  if (!customsEngineInstance) {
    customsEngineInstance = CustomsEngine.getInstance();
  }
  return customsEngineInstance;
}

export function setCustomsEngine(engine: CustomsEngine): void {
  customsEngineInstance = engine;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateBOEInput {
  tenantId: string;
  facilityId: UUID;
  beType: BOEType;
  jobNumber?: string;
  referenceNumber?: string;
  importerIEC: string;
  importerName: string;
  importerGstin?: string;
  importerAddress: Address;
  chaLicense?: string;
  chaName?: string;
  countryOfOrigin: string;
  countryOfConsignment: string;
  portOfLoading: string;
  portOfDischarge: string;
  portOfRegistration: string;
  transportMode: 'sea' | 'air' | 'land' | 'rail';
  vesselName?: string;
  voyageNumber?: string;
  flightNumber?: string;
  arrivalDate: Date;
  blNumber: string;
  blDate: Date;
  blType?: 'master' | 'house' | 'direct';
  masterBlNumber?: string;
  igmNumber?: string;
  igmDate?: Date;
  igmLineNumber?: number;
  containers: BOEContainer[];
  totalNetWeight?: number;
  lineItems: BOELineItem[];
  invoiceNumber?: string;
  invoiceDate?: Date;
  invoiceValue: number;
  invoiceCurrency: string;
  exchangeRate: number;
  cifValue: number;
  additionalDuty?: number;
  specialDuty?: number;
  insuranceValue?: number;
  freightValue?: number;
  landingCharges?: number;
  documents?: BOEDocument[];
  remarks?: string;
}

export interface BOEAssessmentInput {
  assessableValue?: number;
  basicDuty?: number;
  additionalDuty?: number;
  igst?: number;
  cess?: number;
}

export interface DutyPaymentInput {
  challanNumber?: string;
  paymentMode: 'online' | 'bank' | 'neft' | 'rtgs';
  bankName?: string;
  bankRefNumber?: string;
  icegateRefNumber?: string;
  interest?: number;
  penalty?: number;
}

export interface BOEQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: BOEStatus;
  statuses?: BOEStatus[];
  importerIEC?: string;
  blNumber?: string;
  boeNumber?: string;
  containerNumber?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateSBInput {
  tenantId: string;
  facilityId: UUID;
  sbType: SBType;
  jobNumber?: string;
  exporterIEC: string;
  exporterName: string;
  exporterGstin?: string;
  exporterAddress: Address;
  chaLicense?: string;
  chaName?: string;
  buyerName: string;
  buyerAddress: Address;
  buyerCountry: string;
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination: string;
  countryOfDestination: string;
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceValue: number;
  invoiceCurrency: string;
  exchangeRate: number;
  fobValue: number;
  transportMode: 'sea' | 'air' | 'land' | 'rail';
  vesselName?: string;
  voyageNumber?: string;
  rotationNumber?: string;
  containers: SBContainer[];
  totalNetWeight?: number;
  lineItems: SBLineItem[];
  drawbackAmount?: number;
  drawbackClaimed?: boolean;
  rodtep?: boolean;
  documents?: SBDocument[];
  remarks?: string;
}

export interface SBQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: SBStatus;
  statuses?: SBStatus[];
  exporterIEC?: string;
  sbNumber?: string;
  page?: number;
  pageSize?: number;
}

export interface OrderExaminationInput {
  tenantId: string;
  facilityId: UUID;
  examinationType: ExaminationType;
  documentType: 'BOE' | 'SB';
  documentId: UUID;
  documentNumber: string;
  containerId: UUID;
  containerNumber: string;
  orderedBy: string;
  scheduledDate?: Date;
  scheduledSlot?: string;
  examinationLocation?: string;
}

export interface CompleteExaminationInput {
  examId: UUID;
  result: ExaminationResult;
  findings?: string;
  discrepancies?: ExamDiscrepancy[];
  sampleTaken?: boolean;
  sampleDetails?: string;
  reExaminationRequired?: boolean;
  reExaminationReason?: string;
}

export interface ExaminationQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  documentType?: 'BOE' | 'SB';
  documentId?: UUID;
  result?: ExaminationResult;
  pendingOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ProcessInboundMessageInput {
  tenantId: string;
  facilityId: string;
  messageType: ICEGATEMessageType;
  referenceNumber: string;
  payload: string;
  correlationId?: string;
  parsedData?: Record<string, unknown>;
}

export interface ICEGATEMessageQueryOptions {
  tenantId?: string;
  direction?: 'inbound' | 'outbound';
  messageType?: ICEGATEMessageType;
  status?: 'pending' | 'sent' | 'acknowledged' | 'error' | 'rejected';
  page?: number;
  pageSize?: number;
}

export interface CustomsStats {
  totalBillsOfEntry: number;
  pendingBOEs: number;
  clearedBOEs: number;
  totalShippingBills: number;
  pendingSBs: number;
  exportedSBs: number;
  pendingExaminations: number;
  completedExaminations: number;
  totalDutyCollected: number;
  totalExportValue: number;
  discrepanciesFound: number;
}
