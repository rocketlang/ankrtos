/**
 * @ankr/compliance-engine
 * Regulatory Compliance Engine
 * IRDAI, RBI, SEBI, GST, AML/CFT compliance management
 */

// Types
export type FilingStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED';

export type GrievanceStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED';

export type AMLAlertStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'FALSE_POSITIVE'
  | 'SAR_FILED'
  | 'CLOSED';

export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ComplianceRequirement {
  id: string;
  requirementCode: string;
  requirementName: string;
  description?: string;
  regulator: string;
  regulation: string;
  section?: string;
  entityTypes: string[];
  productTypes: string[];
  complianceType: string;
  frequency: string;
  dueDayOfMonth?: number;
  dueMonthOfYear?: number;
  gracePeriodDays?: number;
  penaltyType?: string;
  penaltyDetails?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceFiling {
  id: string;
  requirementId: string;
  periodType: PeriodType;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  status: FilingStatus;
  submissionRef?: string;
  submittedBy?: string;
  submittedAt?: Date;
  filingData?: Record<string, any>;
  documents: string[];
  ackNumber?: string;
  acceptedAt?: Date;
  rejectionReason?: string;
  isOverdue: boolean;
  revisionNumber: number;
  previousFilingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SolvencyRecord {
  id: string;
  reportDate: Date;
  periodType: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  requiredSolvencyMargin?: number;
  availableSolvencyMargin?: number;
  solvencyRatio?: number;
  tier1Capital?: number;
  tier2Capital?: number;
  riskWeightedAssets?: number;
  capitalAdequacyRatio?: number;
  isCompliant: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrievanceCase {
  id: string;
  grievanceNumber: string;
  grievanceType: string;
  customerId?: string;
  customerName: string;
  customerContact: string;
  policyNumber?: string;
  claimNumber?: string;
  transactionRef?: string;
  subject: string;
  description: string;
  dateOfIncident?: Date;
  amountInvolved?: number;
  source: string;
  externalRef?: string;
  priority: Priority;
  status: GrievanceStatus;
  assignedTo?: string;
  department?: string;
  slaDeadline: Date;
  escalationLevel: number;
  escalatedAt?: Date;
  escalatedTo?: string;
  resolution?: string;
  resolutionType?: string;
  compensationPaid?: number;
  resolvedBy?: string;
  resolvedAt?: Date;
  satisfactionScore?: number;
  feedbackNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrievanceCommunication {
  id: string;
  grievanceId: string;
  direction: string;
  channel: string;
  subject?: string;
  content: string;
  fromName?: string;
  fromContact?: string;
  toName?: string;
  toContact?: string;
  attachments: string[];
  createdAt: Date;
}

export interface AMLAlert {
  id: string;
  alertNumber: string;
  alertType: string;
  severity: Severity;
  customerId: string;
  customerName: string;
  transactionId?: string;
  transactionAmount?: number;
  transactionDate?: Date;
  detectionRule: string;
  riskIndicators: string[];
  riskScore: number;
  description: string;
  details?: Record<string, any>;
  status: AMLAlertStatus;
  assignedTo?: string;
  reviewedAt?: Date;
  investigationNotes?: string;
  investigationOutcome?: string;
  sarRequired?: boolean;
  sarNumber?: string;
  sarFiledAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Input Types
export interface ComplianceRequirementInput {
  requirementCode: string;
  requirementName: string;
  description?: string;
  regulator: string;
  regulation: string;
  section?: string;
  entityTypes: string[];
  productTypes: string[];
  complianceType: string;
  frequency: string;
  dueDayOfMonth?: number;
  dueMonthOfYear?: number;
  gracePeriodDays?: number;
  penaltyType?: string;
  penaltyDetails?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface GrievanceInput {
  grievanceType: string;
  customerId?: string;
  customerName: string;
  customerContact: string;
  policyNumber?: string;
  claimNumber?: string;
  transactionRef?: string;
  subject: string;
  description: string;
  dateOfIncident?: Date;
  amountInvolved?: number;
  source: string;
  externalRef?: string;
  priority?: Priority;
}

export interface AMLAlertInput {
  alertType: string;
  severity: Severity;
  customerId: string;
  customerName: string;
  transactionId?: string;
  transactionAmount?: number;
  transactionDate?: Date;
  detectionRule: string;
  riskIndicators: string[];
  riskScore: number;
  description: string;
  details?: Record<string, any>;
}

export interface SolvencyInput {
  reportDate: Date;
  periodType: string;
  totalAssets: number;
  totalLiabilities: number;
  requiredSolvencyMargin?: number;
  availableSolvencyMargin?: number;
  tier1Capital?: number;
  tier2Capital?: number;
  riskWeightedAssets?: number;
}

export interface DashboardStats {
  filings: { overdue: number; upcoming: number };
  grievances: { open: number };
  aml: { pending: number };
  solvency: { ratio?: number; car?: number; isCompliant: boolean } | null;
}

export interface AMLDashboard {
  newAlerts: number;
  underReview: number;
  sarFiled: number;
  bySeverity: Record<string, number>;
}

// Storage Interface
export interface ComplianceStorage {
  // Requirements
  createRequirement(req: Omit<ComplianceRequirement, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceRequirement>;
  getRequirement(id: string): Promise<ComplianceRequirement | null>;
  getActiveRequirements(productType?: string): Promise<ComplianceRequirement[]>;

  // Filings
  createFiling(filing: Omit<ComplianceFiling, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceFiling>;
  getFiling(id: string): Promise<ComplianceFiling | null>;
  updateFiling(id: string, updates: Partial<ComplianceFiling>): Promise<ComplianceFiling>;
  getUpcomingFilings(days: number): Promise<Array<ComplianceFiling & { requirement?: ComplianceRequirement }>>;
  countFilings(filter: { status?: FilingStatus[]; isOverdue?: boolean }): Promise<number>;
  updateOverdueFilings(): Promise<number>;

  // Solvency
  createSolvencyRecord(record: Omit<SolvencyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<SolvencyRecord>;
  getLatestSolvency(): Promise<SolvencyRecord | null>;

  // Grievances
  createGrievance(grievance: Omit<GrievanceCase, 'id' | 'grievanceNumber' | 'createdAt' | 'updatedAt'>): Promise<GrievanceCase>;
  getGrievance(id: string): Promise<GrievanceCase | null>;
  updateGrievance(id: string, updates: Partial<GrievanceCase>): Promise<GrievanceCase>;
  countGrievances(filter: { status?: GrievanceStatus[] }): Promise<number>;

  // Grievance Communications
  addGrievanceCommunication(comm: Omit<GrievanceCommunication, 'id' | 'createdAt'>): Promise<GrievanceCommunication>;
  getGrievanceCommunications(grievanceId: string): Promise<GrievanceCommunication[]>;

  // AML
  createAMLAlert(alert: Omit<AMLAlert, 'id' | 'alertNumber' | 'createdAt' | 'updatedAt'>): Promise<AMLAlert>;
  getAMLAlert(id: string): Promise<AMLAlert | null>;
  updateAMLAlert(id: string, updates: Partial<AMLAlert>): Promise<AMLAlert>;
  countAMLAlerts(filter: { status?: AMLAlertStatus[]; severity?: Severity[] }): Promise<number>;
  groupAMLBySeverity(statusFilter: AMLAlertStatus[]): Promise<{ severity: Severity; count: number }[]>;
}

// Main Engine
export class ComplianceEngine {
  private storage: ComplianceStorage;

  constructor(storage: ComplianceStorage) {
    this.storage = storage;
  }

  // ==================== COMPLIANCE REQUIREMENTS ====================

  async createRequirement(input: ComplianceRequirementInput): Promise<ComplianceRequirement> {
    return this.storage.createRequirement({
      ...input,
      isActive: true,
    });
  }

  async getUpcomingDeadlines(days: number = 30): Promise<Array<ComplianceFiling & { requirement?: ComplianceRequirement }>> {
    return this.storage.getUpcomingFilings(days);
  }

  async createFiling(
    requirementId: string,
    periodStart: Date,
    periodEnd: Date,
    dueDate: Date
  ): Promise<ComplianceFiling> {
    return this.storage.createFiling({
      requirementId,
      periodType: this.determinePeriodType(periodStart, periodEnd),
      periodStart,
      periodEnd,
      dueDate,
      status: 'PENDING',
      documents: [],
      isOverdue: false,
      revisionNumber: 0,
    });
  }

  private determinePeriodType(start: Date, end: Date): PeriodType {
    const days = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    if (days <= 7) return 'WEEKLY';
    if (days <= 31) return 'MONTHLY';
    if (days <= 92) return 'QUARTERLY';
    return 'ANNUAL';
  }

  async submitFiling(
    filingId: string,
    submittedBy: string,
    filingData: Record<string, any>,
    documents?: string[]
  ): Promise<ComplianceFiling> {
    const submissionRef = `SUB${Date.now()}`;

    return this.storage.updateFiling(filingId, {
      status: 'SUBMITTED',
      submissionRef,
      submittedBy,
      submittedAt: new Date(),
      filingData,
      documents: documents || [],
    });
  }

  async acceptFiling(filingId: string, ackNumber: string): Promise<ComplianceFiling> {
    return this.storage.updateFiling(filingId, {
      status: 'ACCEPTED',
      ackNumber,
      acceptedAt: new Date(),
    });
  }

  async rejectFiling(filingId: string, rejectionReason: string): Promise<ComplianceFiling> {
    const filing = await this.storage.getFiling(filingId);
    if (!filing) throw new Error('Filing not found');

    // Create revision
    await this.storage.createFiling({
      requirementId: filing.requirementId,
      periodType: filing.periodType,
      periodStart: filing.periodStart,
      periodEnd: filing.periodEnd,
      dueDate: filing.dueDate,
      status: 'PENDING',
      documents: [],
      isOverdue: false,
      revisionNumber: filing.revisionNumber + 1,
      previousFilingId: filing.id,
    });

    return this.storage.updateFiling(filingId, {
      status: 'REJECTED',
      rejectionReason,
    });
  }

  async updateOverdueFilings(): Promise<number> {
    return this.storage.updateOverdueFilings();
  }

  // ==================== SOLVENCY ====================

  async recordSolvency(input: SolvencyInput): Promise<SolvencyRecord> {
    const netWorth = input.totalAssets - input.totalLiabilities;

    const solvencyRatio = input.requiredSolvencyMargin && input.availableSolvencyMargin
      ? input.availableSolvencyMargin / input.requiredSolvencyMargin
      : undefined;

    const capitalAdequacyRatio = input.riskWeightedAssets && (input.tier1Capital || 0) + (input.tier2Capital || 0)
      ? ((input.tier1Capital || 0) + (input.tier2Capital || 0)) / input.riskWeightedAssets * 100
      : undefined;

    // Insurance: ratio >= 1.5, Banking: CAR >= 9%
    const isCompliant = solvencyRatio
      ? solvencyRatio >= 1.5
      : capitalAdequacyRatio
        ? capitalAdequacyRatio >= 9
        : true;

    return this.storage.createSolvencyRecord({
      reportDate: input.reportDate,
      periodType: input.periodType,
      totalAssets: input.totalAssets,
      totalLiabilities: input.totalLiabilities,
      netWorth,
      requiredSolvencyMargin: input.requiredSolvencyMargin,
      availableSolvencyMargin: input.availableSolvencyMargin,
      solvencyRatio,
      tier1Capital: input.tier1Capital,
      tier2Capital: input.tier2Capital,
      riskWeightedAssets: input.riskWeightedAssets,
      capitalAdequacyRatio,
      isCompliant,
      status: 'CALCULATED',
    });
  }

  // ==================== GRIEVANCE ====================

  async createGrievance(input: GrievanceInput): Promise<GrievanceCase> {
    const slaDays = input.source === 'IGMS' || input.source === 'OMBUDSMAN' ? 15 : 30;
    const slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000);

    return this.storage.createGrievance({
      grievanceType: input.grievanceType,
      customerId: input.customerId,
      customerName: input.customerName,
      customerContact: input.customerContact,
      policyNumber: input.policyNumber,
      claimNumber: input.claimNumber,
      transactionRef: input.transactionRef,
      subject: input.subject,
      description: input.description,
      dateOfIncident: input.dateOfIncident,
      amountInvolved: input.amountInvolved,
      source: input.source,
      externalRef: input.externalRef,
      priority: input.priority || 'MEDIUM',
      status: 'OPEN',
      escalationLevel: 0,
      slaDeadline,
    });
  }

  async assignGrievance(grievanceId: string, assignedTo: string, department: string): Promise<GrievanceCase> {
    return this.storage.updateGrievance(grievanceId, {
      assignedTo,
      department,
      status: 'IN_PROGRESS',
    });
  }

  async addGrievanceCommunication(input: {
    grievanceId: string;
    direction: string;
    channel: string;
    subject?: string;
    content: string;
    fromName?: string;
    fromContact?: string;
    toName?: string;
    toContact?: string;
    attachments?: string[];
  }): Promise<GrievanceCommunication> {
    return this.storage.addGrievanceCommunication({
      ...input,
      attachments: input.attachments || [],
    });
  }

  async resolveGrievance(grievanceId: string, input: {
    resolution: string;
    resolutionType: string;
    compensationPaid?: number;
    resolvedBy: string;
  }): Promise<GrievanceCase> {
    return this.storage.updateGrievance(grievanceId, {
      status: 'RESOLVED',
      resolution: input.resolution,
      resolutionType: input.resolutionType,
      compensationPaid: input.compensationPaid,
      resolvedBy: input.resolvedBy,
      resolvedAt: new Date(),
    });
  }

  async escalateGrievance(grievanceId: string, escalatedTo: string, reason: string): Promise<GrievanceCase> {
    const grievance = await this.storage.getGrievance(grievanceId);
    if (!grievance) throw new Error('Grievance not found');

    return this.storage.updateGrievance(grievanceId, {
      status: 'ESCALATED',
      escalationLevel: grievance.escalationLevel + 1,
      escalatedAt: new Date(),
      escalatedTo,
    });
  }

  async recordSatisfaction(grievanceId: string, score: number, notes?: string): Promise<GrievanceCase> {
    return this.storage.updateGrievance(grievanceId, {
      satisfactionScore: score,
      feedbackNotes: notes,
      status: 'CLOSED',
    });
  }

  // ==================== AML/CFT ====================

  async createAMLAlert(input: AMLAlertInput): Promise<AMLAlert> {
    return this.storage.createAMLAlert({
      ...input,
      status: 'NEW',
    });
  }

  async assignAMLAlert(alertId: string, assignedTo: string): Promise<AMLAlert> {
    return this.storage.updateAMLAlert(alertId, {
      assignedTo,
      status: 'UNDER_REVIEW',
      reviewedAt: new Date(),
    });
  }

  async updateAMLInvestigation(alertId: string, notes: string, outcome?: string): Promise<AMLAlert> {
    return this.storage.updateAMLAlert(alertId, {
      investigationNotes: notes,
      investigationOutcome: outcome,
    });
  }

  async closeAMLAlertFalsePositive(alertId: string): Promise<AMLAlert> {
    return this.storage.updateAMLAlert(alertId, {
      status: 'FALSE_POSITIVE',
      closedAt: new Date(),
    });
  }

  async fileSAR(alertId: string, sarNumber: string): Promise<AMLAlert> {
    return this.storage.updateAMLAlert(alertId, {
      status: 'SAR_FILED',
      sarRequired: true,
      sarNumber,
      sarFiledAt: new Date(),
      closedAt: new Date(),
    });
  }

  async getAMLDashboard(): Promise<AMLDashboard> {
    const [newAlerts, underReview, sarFiled, bySeverity] = await Promise.all([
      this.storage.countAMLAlerts({ status: ['NEW'] }),
      this.storage.countAMLAlerts({ status: ['UNDER_REVIEW'] }),
      this.storage.countAMLAlerts({ status: ['SAR_FILED'] }),
      this.storage.groupAMLBySeverity(['NEW', 'UNDER_REVIEW']),
    ]);

    return {
      newAlerts,
      underReview,
      sarFiled,
      bySeverity: bySeverity.reduce((acc, s) => {
        acc[s.severity] = s.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async getComplianceDashboard(): Promise<DashboardStats> {
    const now = new Date();
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [overdue, upcoming, grievancesOpen, amlPending, latestSolvency] = await Promise.all([
      this.storage.countFilings({ isOverdue: true, status: ['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'REJECTED'] }),
      this.storage.countFilings({ status: ['PENDING'] }),
      this.storage.countGrievances({ status: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] }),
      this.storage.countAMLAlerts({ status: ['NEW', 'UNDER_REVIEW'] }),
      this.storage.getLatestSolvency(),
    ]);

    return {
      filings: { overdue, upcoming },
      grievances: { open: grievancesOpen },
      aml: { pending: amlPending },
      solvency: latestSolvency ? {
        ratio: latestSolvency.solvencyRatio,
        car: latestSolvency.capitalAdequacyRatio,
        isCompliant: latestSolvency.isCompliant,
      } : null,
    };
  }
}

// In-Memory Storage Implementation
export class InMemoryComplianceStorage implements ComplianceStorage {
  private requirements: Map<string, ComplianceRequirement> = new Map();
  private filings: Map<string, ComplianceFiling> = new Map();
  private solvencyRecords: Map<string, SolvencyRecord> = new Map();
  private grievances: Map<string, GrievanceCase> = new Map();
  private grievanceComms: Map<string, GrievanceCommunication> = new Map();
  private amlAlerts: Map<string, AMLAlert> = new Map();

  async createRequirement(data: Omit<ComplianceRequirement, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceRequirement> {
    const req: ComplianceRequirement = {
      ...data,
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.requirements.set(req.id, req);
    return req;
  }

  async getRequirement(id: string): Promise<ComplianceRequirement | null> {
    return this.requirements.get(id) || null;
  }

  async getActiveRequirements(productType?: string): Promise<ComplianceRequirement[]> {
    return Array.from(this.requirements.values()).filter(r => {
      if (!r.isActive) return false;
      if (productType && !r.productTypes.includes(productType)) return false;
      return true;
    });
  }

  async createFiling(data: Omit<ComplianceFiling, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceFiling> {
    const filing: ComplianceFiling = {
      ...data,
      id: `fil_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.filings.set(filing.id, filing);
    return filing;
  }

  async getFiling(id: string): Promise<ComplianceFiling | null> {
    return this.filings.get(id) || null;
  }

  async updateFiling(id: string, updates: Partial<ComplianceFiling>): Promise<ComplianceFiling> {
    const filing = this.filings.get(id);
    if (!filing) throw new Error('Filing not found');
    const updated = { ...filing, ...updates, updatedAt: new Date() };
    this.filings.set(id, updated);
    return updated;
  }

  async getUpcomingFilings(days: number): Promise<Array<ComplianceFiling & { requirement?: ComplianceRequirement }>> {
    const now = new Date();
    const deadline = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return Array.from(this.filings.values())
      .filter(f => {
        if (!['PENDING', 'IN_PROGRESS'].includes(f.status)) return false;
        if (f.dueDate < now || f.dueDate > deadline) return false;
        return true;
      })
      .map(f => ({
        ...f,
        requirement: this.requirements.get(f.requirementId) || undefined,
      }))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  async countFilings(filter: { status?: FilingStatus[]; isOverdue?: boolean }): Promise<number> {
    return Array.from(this.filings.values()).filter(f => {
      if (filter.status && !filter.status.includes(f.status)) return false;
      if (filter.isOverdue !== undefined && f.isOverdue !== filter.isOverdue) return false;
      return true;
    }).length;
  }

  async updateOverdueFilings(): Promise<number> {
    const now = new Date();
    let count = 0;
    for (const [id, filing] of this.filings) {
      if (['PENDING', 'IN_PROGRESS'].includes(filing.status) && filing.dueDate < now && !filing.isOverdue) {
        this.filings.set(id, { ...filing, isOverdue: true, updatedAt: new Date() });
        count++;
      }
    }
    return count;
  }

  async createSolvencyRecord(data: Omit<SolvencyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<SolvencyRecord> {
    const record: SolvencyRecord = {
      ...data,
      id: `sol_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.solvencyRecords.set(record.id, record);
    return record;
  }

  async getLatestSolvency(): Promise<SolvencyRecord | null> {
    const records = Array.from(this.solvencyRecords.values());
    if (records.length === 0) return null;
    return records.sort((a, b) => b.reportDate.getTime() - a.reportDate.getTime())[0];
  }

  async createGrievance(data: Omit<GrievanceCase, 'id' | 'grievanceNumber' | 'createdAt' | 'updatedAt'>): Promise<GrievanceCase> {
    const grievance: GrievanceCase = {
      ...data,
      id: `grv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      grievanceNumber: `GRV${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.grievances.set(grievance.id, grievance);
    return grievance;
  }

  async getGrievance(id: string): Promise<GrievanceCase | null> {
    return this.grievances.get(id) || null;
  }

  async updateGrievance(id: string, updates: Partial<GrievanceCase>): Promise<GrievanceCase> {
    const grievance = this.grievances.get(id);
    if (!grievance) throw new Error('Grievance not found');
    const updated = { ...grievance, ...updates, updatedAt: new Date() };
    this.grievances.set(id, updated);
    return updated;
  }

  async countGrievances(filter: { status?: GrievanceStatus[] }): Promise<number> {
    return Array.from(this.grievances.values()).filter(g => {
      if (filter.status && !filter.status.includes(g.status)) return false;
      return true;
    }).length;
  }

  async addGrievanceCommunication(data: Omit<GrievanceCommunication, 'id' | 'createdAt'>): Promise<GrievanceCommunication> {
    const comm: GrievanceCommunication = {
      ...data,
      id: `comm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
    };
    this.grievanceComms.set(comm.id, comm);
    return comm;
  }

  async getGrievanceCommunications(grievanceId: string): Promise<GrievanceCommunication[]> {
    return Array.from(this.grievanceComms.values()).filter(c => c.grievanceId === grievanceId);
  }

  async createAMLAlert(data: Omit<AMLAlert, 'id' | 'alertNumber' | 'createdAt' | 'updatedAt'>): Promise<AMLAlert> {
    const alert: AMLAlert = {
      ...data,
      id: `aml_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      alertNumber: `AML${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.amlAlerts.set(alert.id, alert);
    return alert;
  }

  async getAMLAlert(id: string): Promise<AMLAlert | null> {
    return this.amlAlerts.get(id) || null;
  }

  async updateAMLAlert(id: string, updates: Partial<AMLAlert>): Promise<AMLAlert> {
    const alert = this.amlAlerts.get(id);
    if (!alert) throw new Error('AML Alert not found');
    const updated = { ...alert, ...updates, updatedAt: new Date() };
    this.amlAlerts.set(id, updated);
    return updated;
  }

  async countAMLAlerts(filter: { status?: AMLAlertStatus[]; severity?: Severity[] }): Promise<number> {
    return Array.from(this.amlAlerts.values()).filter(a => {
      if (filter.status && !filter.status.includes(a.status)) return false;
      if (filter.severity && !filter.severity.includes(a.severity)) return false;
      return true;
    }).length;
  }

  async groupAMLBySeverity(statusFilter: AMLAlertStatus[]): Promise<{ severity: Severity; count: number }[]> {
    const counts: Record<string, number> = {};
    for (const alert of this.amlAlerts.values()) {
      if (statusFilter.includes(alert.status)) {
        counts[alert.severity] = (counts[alert.severity] || 0) + 1;
      }
    }
    return Object.entries(counts).map(([severity, count]) => ({
      severity: severity as Severity,
      count,
    }));
  }
}

// Factory function
export function createComplianceEngine(storage?: ComplianceStorage): ComplianceEngine {
  return new ComplianceEngine(storage || new InMemoryComplianceStorage());
}

// Common regulators
export const REGULATORS = {
  IRDAI: 'Insurance Regulatory and Development Authority of India',
  RBI: 'Reserve Bank of India',
  SEBI: 'Securities and Exchange Board of India',
  GST: 'Goods and Services Tax',
  CBDT: 'Central Board of Direct Taxes',
  FIU_IND: 'Financial Intelligence Unit - India',
};
