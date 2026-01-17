/**
 * ANKR Packages Integration Layer
 *
 * Integrates reusable ANKR packages into BFC platform:
 * - Banking: UPI, BBPS, Calculators, Accounts
 * - IAM: Identity, OAuth, Security
 * - Compliance: GST, TDS, Aadhaar
 * - HRMS: Staff management, Payroll
 * - CRM: Customer relationships
 * - ERP: Accounting, Ledger
 * - Document AI: OCR, Extraction
 * - EON: Memory, Context
 */

// =============================================================================
// PACKAGE CONFIGURATION
// =============================================================================

export interface AnkrPackageConfig {
  // Core Services
  iam?: {
    enabled: boolean;
    mfaRequired: boolean;
    sessionTimeout: number; // minutes
    jitAccessEnabled: boolean;
  };

  oauth?: {
    enabled: boolean;
    providers: ('google' | 'microsoft' | 'apple' | 'phone' | 'email')[];
    passwordlessEnabled: boolean;
    webauthnEnabled: boolean;
  };

  security?: {
    enabled: boolean;
    zeroTrustEnabled: boolean;
    threatDetectionEnabled: boolean;
    alertChannels: ('telegram' | 'sms' | 'email' | 'slack')[];
  };

  // Banking Services
  banking?: {
    upi: {
      enabled: boolean;
      provider: 'razorpay' | 'paytm' | 'mock';
      merchantId?: string;
    };
    bbps: {
      enabled: boolean;
      agentId?: string;
    };
    accounts: {
      enabled: boolean;
      beneficiaryCoolingPeriod: number; // hours
    };
  };

  // Compliance
  compliance?: {
    gst: { enabled: boolean };
    tds: { enabled: boolean };
    aadhaar: { enabled: boolean; sandboxMode: boolean };
    auditRetentionDays: number;
  };

  // HR/Payroll
  hrms?: {
    enabled: boolean;
    modules: ('employee' | 'attendance' | 'leave' | 'payroll' | 'recruitment' | 'training')[];
    statutoryCompliance: {
      epf: boolean;
      esi: boolean;
      pt: boolean;
      tds: boolean;
    };
  };

  // CRM
  crm?: {
    enabled: boolean;
    multiTenant: boolean;
    leadScoring: boolean;
  };

  // ERP
  erp?: {
    enabled: boolean;
    modules: ('accounting' | 'inventory' | 'procurement' | 'sales')[];
    fiscalYearStart: string; // MM-DD
  };

  // AI/Intelligence
  ai?: {
    eon: { enabled: boolean; hybridSearch: boolean };
    documentAi: { enabled: boolean; ocrLanguages: string[] };
    voiceAi: { enabled: boolean; languages: string[] };
  };

  // Notifications
  notifications?: {
    channels: ('email' | 'sms' | 'push' | 'whatsapp' | 'telegram')[];
    providers: {
      sms?: 'msg91' | 'twilio';
      email?: 'ses' | 'sendgrid' | 'smtp';
      whatsapp?: 'official' | 'wati';
    };
  };
}

// Default configuration for BFC
export const DEFAULT_BFC_CONFIG: AnkrPackageConfig = {
  iam: {
    enabled: true,
    mfaRequired: true,
    sessionTimeout: 30,
    jitAccessEnabled: true,
  },

  oauth: {
    enabled: true,
    providers: ['google', 'phone', 'email'],
    passwordlessEnabled: true,
    webauthnEnabled: false,
  },

  security: {
    enabled: true,
    zeroTrustEnabled: true,
    threatDetectionEnabled: true,
    alertChannels: ['telegram', 'email'],
  },

  banking: {
    upi: { enabled: true, provider: 'razorpay' },
    bbps: { enabled: true },
    accounts: { enabled: true, beneficiaryCoolingPeriod: 24 },
  },

  compliance: {
    gst: { enabled: true },
    tds: { enabled: true },
    aadhaar: { enabled: true, sandboxMode: false },
    auditRetentionDays: 2555, // 7 years
  },

  hrms: {
    enabled: true,
    modules: ['employee', 'attendance', 'leave', 'payroll'],
    statutoryCompliance: { epf: true, esi: true, pt: true, tds: true },
  },

  crm: {
    enabled: true,
    multiTenant: true,
    leadScoring: true,
  },

  erp: {
    enabled: true,
    modules: ['accounting'],
    fiscalYearStart: '04-01', // April 1 for India
  },

  ai: {
    eon: { enabled: true, hybridSearch: true },
    documentAi: { enabled: true, ocrLanguages: ['eng', 'hin'] },
    voiceAi: { enabled: false, languages: ['en', 'hi'] },
  },

  notifications: {
    channels: ['email', 'sms', 'push', 'whatsapp'],
    providers: {
      sms: 'msg91',
      email: 'ses',
      whatsapp: 'wati',
    },
  },
};

// =============================================================================
// BANKING INTEGRATIONS
// =============================================================================

/**
 * UPI Service Integration
 * From @ankr/banking-upi
 */
export interface UPIService {
  verifyVPA(vpa: string): Promise<VPAVerificationResult>;
  sendMoney(params: UPISendParams): Promise<UPITransactionResult>;
  requestMoney(params: UPIRequestParams): Promise<UPIRequestResult>;
  createMandate(params: MandateParams): Promise<MandateResult>;
  generateQRCode(params: QRParams): Promise<string>;
  getTransactionStatus(txnId: string): Promise<UPITransactionStatus>;
}

export interface VPAVerificationResult {
  valid: boolean;
  name?: string;
  bankName?: string;
  ifsc?: string;
}

export interface UPISendParams {
  senderVpa: string;
  receiverVpa: string;
  amount: number;
  remarks?: string;
  referenceId?: string;
}

export interface UPITransactionResult {
  success: boolean;
  transactionId: string;
  rrn?: string;
  timestamp: Date;
  error?: string;
}

export interface UPIRequestParams {
  payerVpa: string;
  payeeVpa: string;
  amount: number;
  remarks?: string;
  expiryMinutes?: number;
}

export interface UPIRequestResult {
  requestId: string;
  paymentLink: string;
  qrCode: string;
  expiresAt: Date;
}

export interface MandateParams {
  payerVpa: string;
  payeeVpa: string;
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: Date;
  endDate?: Date;
  purpose: string;
}

export interface MandateResult {
  mandateId: string;
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'REVOKED';
  umn?: string; // Unique Mandate Number
}

export interface QRParams {
  vpa: string;
  amount?: number;
  merchantName: string;
  merchantCategory?: string;
}

export interface UPITransactionStatus {
  transactionId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  amount: number;
  rrn?: string;
  timestamp: Date;
}

/**
 * BBPS Service Integration
 * From @ankr/banking-bbps
 */
export interface BBPSService {
  getBillerCategories(): Promise<BillerCategory[]>;
  searchBillers(category: string, query?: string): Promise<Biller[]>;
  fetchBill(params: FetchBillParams): Promise<BillDetails>;
  payBill(params: PayBillParams): Promise<BillPaymentResult>;
  getPaymentHistory(customerId: string): Promise<BillPayment[]>;
  registerComplaint(params: ComplaintParams): Promise<ComplaintResult>;
}

export interface BillerCategory {
  code: string;
  name: string;
  nameHindi?: string;
  icon?: string;
}

export interface Biller {
  id: string;
  name: string;
  category: string;
  fetchRequirements: BillerField[];
  paymentModes: string[];
}

export interface BillerField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: string;
}

export interface FetchBillParams {
  billerId: string;
  customerParams: Record<string, string>;
}

export interface BillDetails {
  billerId: string;
  customerName: string;
  billNumber: string;
  billDate: Date;
  dueDate: Date;
  amount: number;
  minAmount?: number;
  maxAmount?: number;
  billPeriod?: string;
}

export interface PayBillParams {
  billerId: string;
  customerParams: Record<string, string>;
  amount: number;
  paymentMode: 'UPI' | 'DEBIT_CARD' | 'NET_BANKING' | 'WALLET';
  paymentDetails?: Record<string, string>;
}

export interface BillPaymentResult {
  transactionId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  bbpsRefId?: string;
  timestamp: Date;
}

export interface BillPayment {
  transactionId: string;
  billerId: string;
  billerName: string;
  amount: number;
  status: string;
  paidAt: Date;
}

export interface ComplaintParams {
  transactionId: string;
  complaintType: string;
  description: string;
}

export interface ComplaintResult {
  complaintId: string;
  status: 'REGISTERED' | 'IN_PROGRESS' | 'RESOLVED';
  estimatedResolution?: Date;
}

/**
 * Banking Calculators Integration
 * From @ankr/banking-calculators
 */
export interface BankingCalculators {
  calculateEMI(params: EMIParams): EMIResult;
  calculateSIP(params: SIPParams): SIPResult;
  calculateFD(params: FDParams): FDResult;
  calculateRD(params: RDParams): RDResult;
  calculateIncomeTax(params: TaxParams): TaxResult;
  generateAmortization(params: EMIParams): AmortizationSchedule[];
}

export interface EMIParams {
  principal: number;
  annualRate: number;
  tenureMonths: number;
}

export interface EMIResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  effectiveRate: number;
}

export interface SIPParams {
  monthlyInvestment: number;
  expectedReturnRate: number;
  tenureMonths: number;
}

export interface SIPResult {
  totalInvested: number;
  estimatedReturns: number;
  maturityValue: number;
}

export interface FDParams {
  principal: number;
  annualRate: number;
  tenureMonths: number;
  compoundingFrequency: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
}

export interface FDResult {
  maturityAmount: number;
  interestEarned: number;
  effectiveYield: number;
}

export interface RDParams {
  monthlyDeposit: number;
  annualRate: number;
  tenureMonths: number;
}

export interface RDResult {
  totalDeposited: number;
  interestEarned: number;
  maturityAmount: number;
}

export interface TaxParams {
  income: number;
  regime: 'OLD' | 'NEW';
  deductions?: {
    section80C?: number;
    section80D?: number;
    section80G?: number;
    hra?: number;
    lta?: number;
    standardDeduction?: number;
  };
  fy: string; // Financial year e.g., "2024-25"
}

export interface TaxResult {
  taxableIncome: number;
  taxBeforeCess: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
  breakdown: TaxSlab[];
}

export interface TaxSlab {
  from: number;
  to: number;
  rate: number;
  tax: number;
}

export interface AmortizationSchedule {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

// =============================================================================
// IAM & SECURITY INTEGRATIONS
// =============================================================================

/**
 * IAM Service Integration
 * From @ankr/iam
 */
export interface IAMService {
  // Role Management
  createRole(role: RoleDefinition): Promise<Role>;
  assignRole(userId: string, roleId: string): Promise<void>;
  removeRole(userId: string, roleId: string): Promise<void>;
  getUserRoles(userId: string): Promise<Role[]>;

  // Permission Management
  checkPermission(userId: string, resource: string, action: string): Promise<boolean>;
  getPermissions(roleId: string): Promise<Permission[]>;

  // MFA
  setupMFA(userId: string, method: 'TOTP' | 'SMS' | 'EMAIL'): Promise<MFASetupResult>;
  verifyMFA(userId: string, code: string): Promise<boolean>;

  // JIT Access
  requestAccess(params: JITAccessRequest): Promise<JITAccessResult>;
  approveAccess(requestId: string, approverId: string): Promise<void>;
  revokeAccess(userId: string, resource: string): Promise<void>;

  // Session Management
  createSession(userId: string, metadata: SessionMetadata): Promise<Session>;
  validateSession(sessionId: string): Promise<SessionValidation>;
  terminateSession(sessionId: string): Promise<void>;

  // Audit
  getAccessLog(userId: string, options?: AuditOptions): Promise<AccessLogEntry[]>;
}

export interface RoleDefinition {
  name: string;
  description: string;
  permissions: string[];
  inherits?: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface MFASetupResult {
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
}

export interface JITAccessRequest {
  userId: string;
  resource: string;
  reason: string;
  durationMinutes: number;
}

export interface JITAccessResult {
  requestId: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  expiresAt?: Date;
}

export interface SessionMetadata {
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  location?: { lat: number; lng: number };
}

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  metadata: SessionMetadata;
}

export interface SessionValidation {
  valid: boolean;
  userId?: string;
  expiresAt?: Date;
  reason?: string;
}

export interface AuditOptions {
  fromDate?: Date;
  toDate?: Date;
  actions?: string[];
  resources?: string[];
  limit?: number;
}

export interface AccessLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  success: boolean;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// HRMS INTEGRATIONS
// =============================================================================

/**
 * HRMS Service Integration
 * From @ankr/hrms
 */
export interface HRMSService {
  // Employee Management
  createEmployee(data: EmployeeData): Promise<Employee>;
  updateEmployee(id: string, data: Partial<EmployeeData>): Promise<Employee>;
  getEmployee(id: string): Promise<Employee>;
  searchEmployees(criteria: EmployeeSearchCriteria): Promise<Employee[]>;
  terminateEmployee(id: string, reason: string, lastDay: Date): Promise<void>;

  // Attendance
  markAttendance(employeeId: string, type: 'IN' | 'OUT'): Promise<AttendanceRecord>;
  getAttendance(employeeId: string, month: Date): Promise<AttendanceSummary>;

  // Leave Management
  applyLeave(params: LeaveRequest): Promise<LeaveApplication>;
  approveLeave(applicationId: string, approverId: string): Promise<void>;
  rejectLeave(applicationId: string, approverId: string, reason: string): Promise<void>;
  getLeaveBalance(employeeId: string): Promise<LeaveBalance>;

  // Payroll
  processPayroll(month: Date, options?: PayrollOptions): Promise<PayrollRun>;
  generatePayslip(employeeId: string, month: Date): Promise<Payslip>;
  getPayrollSummary(month: Date): Promise<PayrollSummary>;

  // Statutory
  calculateStatutory(salary: number, options: StatutoryOptions): StatutoryDeductions;
  generatePFReturn(month: Date): Promise<Buffer>;
  generateESIReturn(month: Date): Promise<Buffer>;
}

export interface EmployeeData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  dateOfJoining: Date;
  department: string;
  designation: string;
  reportingTo?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  salary: SalaryStructure;
  bankDetails?: BankDetails;
  pan?: string;
  aadhaar?: string;
  pfNumber?: string;
  esiNumber?: string;
  address?: Address;
}

export interface Employee extends EmployeeData {
  id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_NOTICE';
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryStructure {
  basic: number;
  hra: number;
  conveyance?: number;
  specialAllowance?: number;
  otherAllowances?: number;
  grossSalary: number;
}

export interface BankDetails {
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branchName?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface EmployeeSearchCriteria {
  department?: string;
  designation?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY' | 'WEEK_OFF';
  workHours?: number;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  holidays: number;
  weekOffs: number;
  averageWorkHours: number;
}

export interface LeaveRequest {
  employeeId: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'MATERNITY' | 'PATERNITY' | 'UNPAID';
  fromDate: Date;
  toDate: Date;
  reason: string;
  isHalfDay?: boolean;
}

export interface LeaveApplication extends LeaveRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  appliedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface LeaveBalance {
  casual: { total: number; used: number; balance: number };
  sick: { total: number; used: number; balance: number };
  earned: { total: number; used: number; balance: number };
}

export interface PayrollOptions {
  includeArrears?: boolean;
  customDeductions?: { name: string; amount: number }[];
  customEarnings?: { name: string; amount: number }[];
}

export interface PayrollRun {
  id: string;
  month: Date;
  status: 'DRAFT' | 'PROCESSED' | 'APPROVED' | 'DISBURSED';
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  processedAt: Date;
}

export interface Payslip {
  employeeId: string;
  employeeName: string;
  month: Date;
  earnings: { component: string; amount: number }[];
  deductions: { component: string; amount: number }[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  bankDetails: BankDetails;
}

export interface PayrollSummary {
  month: Date;
  totalEmployees: number;
  grossSalary: number;
  totalPF: number;
  totalESI: number;
  totalPT: number;
  totalTDS: number;
  netPayable: number;
}

export interface StatutoryOptions {
  pfApplicable: boolean;
  esiApplicable: boolean;
  ptState?: string;
  taxRegime: 'OLD' | 'NEW';
}

export interface StatutoryDeductions {
  employeePF: number;
  employerPF: number;
  employeeESI: number;
  employerESI: number;
  professionalTax: number;
  tds: number;
  total: number;
}

// =============================================================================
// CRM INTEGRATIONS
// =============================================================================

/**
 * CRM Service Integration
 * From @ankr/crm-core
 */
export interface CRMService {
  // Leads
  createLead(data: LeadData): Promise<Lead>;
  updateLead(id: string, data: Partial<LeadData>): Promise<Lead>;
  convertLead(id: string): Promise<{ customerId: string }>;
  assignLead(leadId: string, userId: string): Promise<void>;

  // Contacts
  createContact(data: ContactData): Promise<Contact>;
  searchContacts(criteria: ContactSearchCriteria): Promise<Contact[]>;
  mergeContacts(primaryId: string, secondaryId: string): Promise<Contact>;

  // Opportunities
  createOpportunity(data: OpportunityData): Promise<Opportunity>;
  updateStage(id: string, stage: string): Promise<Opportunity>;
  getOpportunityPipeline(): Promise<PipelineStage[]>;

  // Activities
  logActivity(data: ActivityData): Promise<Activity>;
  getActivities(entityId: string, entityType: string): Promise<Activity[]>;

  // Analytics
  getLeadScore(leadId: string): Promise<number>;
  getConversionMetrics(dateRange: DateRange): Promise<ConversionMetrics>;
}

export interface LeadData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  company?: string;
  source: string;
  product?: string;
  notes?: string;
}

export interface Lead extends LeadData {
  id: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  score?: number;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  company?: string;
  designation?: string;
  address?: Address;
}

export interface Contact extends ContactData {
  id: string;
  customerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactSearchCriteria {
  search?: string;
  company?: string;
  hasCustomer?: boolean;
  limit?: number;
  offset?: number;
}

export interface OpportunityData {
  name: string;
  contactId: string;
  product: string;
  value: number;
  probability?: number;
  expectedCloseDate?: Date;
  notes?: string;
}

export interface Opportunity extends OpportunityData {
  id: string;
  stage: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStage {
  name: string;
  order: number;
  count: number;
  value: number;
}

export interface ActivityData {
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE';
  entityId: string;
  entityType: 'LEAD' | 'CONTACT' | 'OPPORTUNITY' | 'CUSTOMER';
  subject: string;
  description?: string;
  scheduledAt?: Date;
  completedAt?: Date;
}

export interface Activity extends ActivityData {
  id: string;
  createdBy: string;
  createdAt: Date;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ConversionMetrics {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  averageTimeToConvert: number; // days
  bySource: { source: string; leads: number; converted: number }[];
  byProduct: { product: string; leads: number; converted: number }[];
}

// =============================================================================
// ERP/ACCOUNTING INTEGRATIONS
// =============================================================================

/**
 * Accounting Service Integration
 * From @ankr/erp-accounting
 */
export interface AccountingService {
  // Chart of Accounts
  createAccount(data: AccountData): Promise<Account>;
  getAccounts(type?: AccountType): Promise<Account[]>;

  // Journal Entries
  createJournalEntry(entry: JournalEntryData): Promise<JournalEntry>;
  postJournalEntry(id: string): Promise<void>;
  reverseJournalEntry(id: string, reason: string): Promise<JournalEntry>;

  // Ledger
  getLedger(accountId: string, dateRange: DateRange): Promise<LedgerEntry[]>;
  getTrialBalance(asOfDate: Date): Promise<TrialBalanceEntry[]>;

  // Financial Statements
  getBalanceSheet(asOfDate: Date): Promise<BalanceSheet>;
  getProfitAndLoss(dateRange: DateRange): Promise<ProfitAndLoss>;
  getCashFlow(dateRange: DateRange): Promise<CashFlow>;

  // Fiscal Year
  closeFiscalYear(year: string): Promise<void>;
  getFiscalYearStatus(year: string): Promise<FiscalYearStatus>;
}

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface AccountData {
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
  description?: string;
  isActive?: boolean;
}

export interface Account extends AccountData {
  id: string;
  balance: number;
  children?: Account[];
  createdAt: Date;
}

export interface JournalEntryData {
  date: Date;
  description: string;
  reference?: string;
  lines: JournalLine[];
}

export interface JournalLine {
  accountId: string;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface JournalEntry extends JournalEntryData {
  id: string;
  number: string;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  postedAt?: Date;
  postedBy?: string;
  createdAt: Date;
}

export interface LedgerEntry {
  date: Date;
  journalEntryId: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debit: number;
  credit: number;
}

export interface BalanceSheet {
  asOfDate: Date;
  assets: { current: BalanceSheetItem[]; nonCurrent: BalanceSheetItem[]; total: number };
  liabilities: { current: BalanceSheetItem[]; nonCurrent: BalanceSheetItem[]; total: number };
  equity: { items: BalanceSheetItem[]; total: number };
}

export interface BalanceSheetItem {
  accountName: string;
  amount: number;
}

export interface ProfitAndLoss {
  period: DateRange;
  revenue: { items: PLItem[]; total: number };
  expenses: { items: PLItem[]; total: number };
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
}

export interface PLItem {
  accountName: string;
  amount: number;
}

export interface CashFlow {
  period: DateRange;
  operating: { items: CashFlowItem[]; net: number };
  investing: { items: CashFlowItem[]; net: number };
  financing: { items: CashFlowItem[]; net: number };
  netChange: number;
  openingBalance: number;
  closingBalance: number;
}

export interface CashFlowItem {
  description: string;
  amount: number;
}

export interface FiscalYearStatus {
  year: string;
  startDate: Date;
  endDate: Date;
  isClosed: boolean;
  closedAt?: Date;
  closedBy?: string;
}

// =============================================================================
// PACKAGE MANAGER
// =============================================================================

/**
 * ANKR Package Manager
 * Central management of all integrated packages
 */
export class AnkrPackageManager {
  private config: AnkrPackageConfig;
  private services: Map<string, any> = new Map();

  constructor(config: AnkrPackageConfig = DEFAULT_BFC_CONFIG) {
    this.config = config;
  }

  getConfig(): AnkrPackageConfig {
    return this.config;
  }

  updateConfig(updates: Partial<AnkrPackageConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  isEnabled(packageName: keyof AnkrPackageConfig): boolean {
    const pkg = this.config[packageName];
    return pkg && typeof pkg === 'object' && 'enabled' in pkg ? pkg.enabled : false;
  }

  registerService(name: string, service: any): void {
    this.services.set(name, service);
  }

  getService<T>(name: string): T | undefined {
    return this.services.get(name) as T;
  }

  getEnabledPackages(): string[] {
    const enabled: string[] = [];
    for (const [key, value] of Object.entries(this.config)) {
      if (value && typeof value === 'object' && 'enabled' in value && value.enabled) {
        enabled.push(key);
      }
    }
    return enabled;
  }
}

// Singleton instance
let packageManager: AnkrPackageManager | null = null;

export function getPackageManager(config?: AnkrPackageConfig): AnkrPackageManager {
  if (!packageManager) {
    packageManager = new AnkrPackageManager(config);
  }
  return packageManager;
}

export function resetPackageManager(): void {
  packageManager = null;
}

export default AnkrPackageManager;
