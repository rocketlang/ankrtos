/**
 * Report Generation Service
 *
 * Generates all compliance, regulatory, and operational reports
 * All reports are automatically docchained for immutable audit trails
 */

import {
  DocumentType,
  AccessLevel,
  ReportDefinition,
  ReportInstance,
  ReportParameter,
  ReportRecipient,
} from './types';
import { DocChainService } from './service';

// Report templates
export const REPORT_DEFINITIONS: ReportDefinition[] = [
  // ==================== Regulatory Reports ====================
  {
    id: 'RBI_CYBER_INCIDENT',
    name: 'RBI Cyber Security Incident Report',
    description: 'Cyber security incident report as per RBI guidelines (within 6 hours)',
    type: DocumentType.REGULATORY_RBI,
    frequency: 'ON_DEMAND',
    templateId: 'TPL_RBI_CYBER',
    templateVersion: '1.0',
    parameters: [
      { name: 'incidentType', label: 'Incident Type', type: 'SELECT', required: true, options: [
        { value: 'DATA_BREACH', label: 'Data Breach' },
        { value: 'RANSOMWARE', label: 'Ransomware Attack' },
        { value: 'DDOS', label: 'DDoS Attack' },
        { value: 'PHISHING', label: 'Phishing Incident' },
        { value: 'INSIDER_THREAT', label: 'Insider Threat' },
        { value: 'OTHER', label: 'Other' },
      ]},
      { name: 'severity', label: 'Severity', type: 'SELECT', required: true, options: [
        { value: 'CRITICAL', label: 'Critical' },
        { value: 'HIGH', label: 'High' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'LOW', label: 'Low' },
      ]},
      { name: 'description', label: 'Description', type: 'STRING', required: true },
      { name: 'impactAssessment', label: 'Impact Assessment', type: 'STRING', required: true },
      { name: 'actionsTaken', label: 'Actions Taken', type: 'STRING', required: true },
    ],
    outputFormats: ['PDF', 'XML'],
    defaultFormat: 'PDF',
    autoDistribute: true,
    recipients: [
      { type: 'REGULATOR', value: 'RBI' },
      { type: 'ROLE', value: 'CISO' },
      { type: 'ROLE', value: 'COMPLIANCE_OFFICER' },
    ],
    regulatoryReport: true,
    submissionDeadline: 'T+6H',
    regulatorCode: 'RBI',
    retentionYears: 8,
    archiveAfterDays: 90,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // STR - Suspicious Transaction Report
  {
    id: 'AML_STR',
    name: 'Suspicious Transaction Report (STR)',
    description: 'FIU-India Suspicious Transaction Report as per PMLA',
    type: DocumentType.AML_STR,
    frequency: 'ON_DEMAND',
    templateId: 'TPL_STR',
    templateVersion: '2.0',
    parameters: [
      { name: 'customerId', label: 'Customer ID', type: 'STRING', required: true },
      { name: 'transactionIds', label: 'Transaction IDs', type: 'STRING', required: true },
      { name: 'suspicionReason', label: 'Reason for Suspicion', type: 'SELECT', required: true, options: [
        { value: 'UNUSUAL_PATTERN', label: 'Unusual Transaction Pattern' },
        { value: 'STRUCTURING', label: 'Structuring' },
        { value: 'WATCHLIST_MATCH', label: 'Watchlist Match' },
        { value: 'HIGH_RISK_COUNTRY', label: 'High Risk Country' },
        { value: 'PEP_RELATED', label: 'PEP Related' },
        { value: 'OTHER', label: 'Other' },
      ]},
      { name: 'narrative', label: 'Narrative', type: 'STRING', required: true },
    ],
    outputFormats: ['PDF', 'XML'],
    defaultFormat: 'XML',
    autoDistribute: true,
    recipients: [
      { type: 'REGULATOR', value: 'FIU-INDIA' },
      { type: 'ROLE', value: 'COMPLIANCE_MANAGER' },
      { type: 'ROLE', value: 'AML_OFFICER' },
    ],
    regulatoryReport: true,
    submissionDeadline: 'T+7D',
    regulatorCode: 'FIU',
    retentionYears: 8,
    archiveAfterDays: 90,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // CTR - Cash Transaction Report
  {
    id: 'AML_CTR',
    name: 'Cash Transaction Report (CTR)',
    description: 'FIU-India Cash Transaction Report for transactions >= 10 Lakhs',
    type: DocumentType.AML_CTR,
    frequency: 'MONTHLY',
    scheduleExpression: '0 9 1 * *', // 1st of every month at 9 AM
    templateId: 'TPL_CTR',
    templateVersion: '2.0',
    parameters: [
      { name: 'month', label: 'Report Month', type: 'DATE', required: true },
      { name: 'branch', label: 'Branch', type: 'STRING', required: false },
    ],
    outputFormats: ['PDF', 'XML', 'CSV'],
    defaultFormat: 'XML',
    autoDistribute: true,
    recipients: [
      { type: 'REGULATOR', value: 'FIU-INDIA' },
      { type: 'ROLE', value: 'COMPLIANCE_MANAGER' },
    ],
    regulatoryReport: true,
    submissionDeadline: 'T+15D',
    regulatorCode: 'FIU',
    retentionYears: 8,
    archiveAfterDays: 90,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ==================== Credit Reports ====================
  {
    id: 'CREDIT_DECISION_REPORT',
    name: 'Credit Decision Report',
    description: 'Detailed credit decision with risk analysis',
    type: DocumentType.CREDIT_DECISION,
    frequency: 'ON_DEMAND',
    templateId: 'TPL_CREDIT_DECISION',
    templateVersion: '1.0',
    parameters: [
      { name: 'applicationId', label: 'Application ID', type: 'STRING', required: true },
      { name: 'customerId', label: 'Customer ID', type: 'STRING', required: true },
    ],
    outputFormats: ['PDF'],
    defaultFormat: 'PDF',
    autoDistribute: true,
    recipients: [
      { type: 'ROLE', value: 'CREDIT_OFFICER' },
    ],
    regulatoryReport: false,
    retentionYears: 8,
    archiveAfterDays: 365,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // NPA Report
  {
    id: 'NPA_MONITORING',
    name: 'NPA Monitoring Report',
    description: 'Non-Performing Assets monitoring and provisioning report',
    type: DocumentType.REGULATORY_RBI,
    frequency: 'MONTHLY',
    scheduleExpression: '0 6 5 * *', // 5th of every month at 6 AM
    templateId: 'TPL_NPA',
    templateVersion: '1.0',
    parameters: [
      { name: 'month', label: 'Report Month', type: 'DATE', required: true },
    ],
    outputFormats: ['PDF', 'XLSX'],
    defaultFormat: 'PDF',
    autoDistribute: true,
    recipients: [
      { type: 'ROLE', value: 'RISK_MANAGER' },
      { type: 'ROLE', value: 'CREDIT_HEAD' },
      { type: 'ROLE', value: 'CFO' },
    ],
    regulatoryReport: true,
    regulatorCode: 'RBI',
    retentionYears: 8,
    archiveAfterDays: 365,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ==================== Tax Reports ====================
  {
    id: 'TDS_CERTIFICATE',
    name: 'TDS Certificate (Form 16A)',
    description: 'TDS certificate for non-salary payments',
    type: DocumentType.TDS_CERTIFICATE,
    frequency: 'QUARTERLY',
    scheduleExpression: '0 9 15 4,7,10,1 *', // 15th of Apr, Jul, Oct, Jan
    templateId: 'TPL_TDS_16A',
    templateVersion: '1.0',
    parameters: [
      { name: 'quarter', label: 'Quarter', type: 'SELECT', required: true, options: [
        { value: 'Q1', label: 'Q1 (Apr-Jun)' },
        { value: 'Q2', label: 'Q2 (Jul-Sep)' },
        { value: 'Q3', label: 'Q3 (Oct-Dec)' },
        { value: 'Q4', label: 'Q4 (Jan-Mar)' },
      ]},
      { name: 'financialYear', label: 'Financial Year', type: 'STRING', required: true },
      { name: 'customerId', label: 'Customer ID', type: 'STRING', required: false },
    ],
    outputFormats: ['PDF'],
    defaultFormat: 'PDF',
    autoDistribute: true,
    recipients: [
      { type: 'ROLE', value: 'FINANCE_TEAM' },
    ],
    regulatoryReport: true,
    regulatorCode: 'IT',
    retentionYears: 7,
    archiveAfterDays: 365,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Form 26AS
  {
    id: 'FORM_26AS',
    name: 'Form 26AS - Tax Credit Statement',
    description: 'Annual tax credit statement',
    type: DocumentType.FORM_26AS,
    frequency: 'YEARLY',
    scheduleExpression: '0 9 1 6 *', // 1st June
    templateId: 'TPL_26AS',
    templateVersion: '1.0',
    parameters: [
      { name: 'financialYear', label: 'Financial Year', type: 'STRING', required: true },
      { name: 'pan', label: 'PAN', type: 'STRING', required: true },
    ],
    outputFormats: ['PDF'],
    defaultFormat: 'PDF',
    autoDistribute: false,
    regulatoryReport: true,
    regulatorCode: 'IT',
    retentionYears: 7,
    archiveAfterDays: 365,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // GST Invoice
  {
    id: 'GST_INVOICE',
    name: 'GST Tax Invoice',
    description: 'GST compliant tax invoice',
    type: DocumentType.GST_INVOICE,
    frequency: 'ON_DEMAND',
    templateId: 'TPL_GST_INV',
    templateVersion: '1.0',
    parameters: [
      { name: 'invoiceNumber', label: 'Invoice Number', type: 'STRING', required: true },
      { name: 'customerId', label: 'Customer ID', type: 'STRING', required: true },
      { name: 'amount', label: 'Amount', type: 'NUMBER', required: true },
    ],
    outputFormats: ['PDF'],
    defaultFormat: 'PDF',
    autoDistribute: false,
    regulatoryReport: false,
    retentionYears: 7,
    archiveAfterDays: 365,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ==================== Operational Reports ====================
  {
    id: 'DAILY_OPERATIONS',
    name: 'Daily Operations Report',
    description: 'Daily summary of all operations',
    type: DocumentType.DAILY_OPERATIONS,
    frequency: 'DAILY',
    scheduleExpression: '0 7 * * *', // Every day at 7 AM
    templateId: 'TPL_DAILY_OPS',
    templateVersion: '1.0',
    parameters: [
      { name: 'date', label: 'Report Date', type: 'DATE', required: true },
      { name: 'branch', label: 'Branch', type: 'STRING', required: false },
    ],
    outputFormats: ['PDF', 'XLSX'],
    defaultFormat: 'PDF',
    autoDistribute: true,
    recipients: [
      { type: 'ROLE', value: 'BRANCH_MANAGER' },
      { type: 'ROLE', value: 'OPERATIONS_HEAD' },
    ],
    regulatoryReport: false,
    retentionYears: 3,
    archiveAfterDays: 90,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Exception Report
  {
    id: 'EXCEPTION_REPORT',
    name: 'Exception Report',
    description: 'Daily exceptions and anomalies report',
    type: DocumentType.EXCEPTION_REPORT,
    frequency: 'DAILY',
    scheduleExpression: '0 8 * * *', // Every day at 8 AM
    templateId: 'TPL_EXCEPTION',
    templateVersion: '1.0',
    parameters: [
      { name: 'date', label: 'Report Date', type: 'DATE', required: true },
      { name: 'exceptionTypes', label: 'Exception Types', type: 'MULTI_SELECT', required: false, options: [
        { value: 'LIMIT_BREACH', label: 'Limit Breach' },
        { value: 'FRAUD_ALERT', label: 'Fraud Alert' },
        { value: 'COMPLIANCE_VIOLATION', label: 'Compliance Violation' },
        { value: 'SYSTEM_ERROR', label: 'System Error' },
      ]},
    ],
    outputFormats: ['PDF', 'XLSX'],
    defaultFormat: 'PDF',
    autoDistribute: true,
    recipients: [
      { type: 'ROLE', value: 'RISK_MANAGER' },
      { type: 'ROLE', value: 'COMPLIANCE_OFFICER' },
    ],
    regulatoryReport: false,
    retentionYears: 5,
    archiveAfterDays: 180,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ==================== Audit Reports ====================
  {
    id: 'INTERNAL_AUDIT',
    name: 'Internal Audit Report',
    description: 'Periodic internal audit findings',
    type: DocumentType.INTERNAL_AUDIT,
    frequency: 'QUARTERLY',
    templateId: 'TPL_INTERNAL_AUDIT',
    templateVersion: '1.0',
    parameters: [
      { name: 'auditArea', label: 'Audit Area', type: 'STRING', required: true },
      { name: 'auditPeriod', label: 'Audit Period', type: 'STRING', required: true },
      { name: 'auditor', label: 'Auditor', type: 'STRING', required: true },
    ],
    outputFormats: ['PDF'],
    defaultFormat: 'PDF',
    autoDistribute: true,
    recipients: [
      { type: 'ROLE', value: 'AUDIT_COMMITTEE' },
      { type: 'ROLE', value: 'CEO' },
    ],
    regulatoryReport: false,
    retentionYears: 8,
    archiveAfterDays: 365,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // VAPT Report
  {
    id: 'VAPT_REPORT',
    name: 'Vulnerability Assessment & Penetration Test Report',
    description: 'Quarterly VAPT findings as per RBI guidelines',
    type: DocumentType.PENETRATION_TEST,
    frequency: 'QUARTERLY',
    templateId: 'TPL_VAPT',
    templateVersion: '1.0',
    parameters: [
      { name: 'quarter', label: 'Quarter', type: 'SELECT', required: true, options: [
        { value: 'Q1', label: 'Q1' },
        { value: 'Q2', label: 'Q2' },
        { value: 'Q3', label: 'Q3' },
        { value: 'Q4', label: 'Q4' },
      ]},
      { name: 'testingVendor', label: 'Testing Vendor', type: 'STRING', required: true },
    ],
    outputFormats: ['PDF'],
    defaultFormat: 'PDF',
    autoDistribute: true,
    recipients: [
      { type: 'ROLE', value: 'CISO' },
      { type: 'ROLE', value: 'IT_HEAD' },
    ],
    regulatoryReport: true,
    regulatorCode: 'RBI',
    retentionYears: 5,
    archiveAfterDays: 365,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // KYC Verification Report
  {
    id: 'KYC_VERIFICATION',
    name: 'KYC Verification Report',
    description: 'Customer KYC verification details',
    type: DocumentType.KYC_VERIFICATION,
    frequency: 'ON_DEMAND',
    templateId: 'TPL_KYC',
    templateVersion: '1.0',
    parameters: [
      { name: 'customerId', label: 'Customer ID', type: 'STRING', required: true },
      { name: 'verificationType', label: 'Verification Type', type: 'SELECT', required: true, options: [
        { value: 'FULL_KYC', label: 'Full KYC' },
        { value: 'PERIODIC_UPDATE', label: 'Periodic Update' },
        { value: 'RE_KYC', label: 'Re-KYC' },
      ]},
    ],
    outputFormats: ['PDF'],
    defaultFormat: 'PDF',
    autoDistribute: false,
    regulatoryReport: false,
    retentionYears: 5,
    archiveAfterDays: 180,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Report Generation Service
 */
export class ReportService {
  private docChain: DocChainService;
  private definitions: Map<string, ReportDefinition> = new Map();
  private instances: Map<string, ReportInstance> = new Map();

  constructor(docChain: DocChainService) {
    this.docChain = docChain;
    this.loadDefinitions();
  }

  private loadDefinitions(): void {
    for (const def of REPORT_DEFINITIONS) {
      this.definitions.set(def.id, def);
    }
  }

  /**
   * Get all report definitions
   */
  getDefinitions(): ReportDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Get definition by ID
   */
  getDefinition(id: string): ReportDefinition | undefined {
    return this.definitions.get(id);
  }

  /**
   * Get definitions by type
   */
  getDefinitionsByType(type: DocumentType): ReportDefinition[] {
    return Array.from(this.definitions.values()).filter(d => d.type === type);
  }

  /**
   * Get regulatory report definitions
   */
  getRegulatoryDefinitions(): ReportDefinition[] {
    return Array.from(this.definitions.values()).filter(d => d.regulatoryReport);
  }

  /**
   * Generate a report
   */
  async generateReport(
    definitionId: string,
    parameters: Record<string, any>,
    generatedBy: string,
    generatedByName: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ReportInstance> {
    const definition = this.definitions.get(definitionId);
    if (!definition) {
      throw new Error(`Report definition not found: ${definitionId}`);
    }

    // Validate parameters
    this.validateParameters(definition, parameters);

    const instanceId = this.generateInstanceId();
    const now = new Date();

    // Create instance (initially generating)
    const instance: ReportInstance = {
      id: instanceId,
      definitionId,
      documentId: '', // Will be set after docchain
      generatedAt: now,
      generatedBy,
      parameters,
      periodStart,
      periodEnd,
      status: 'GENERATING',
    };

    this.instances.set(instanceId, instance);

    try {
      // Generate report content
      const reportContent = await this.renderReport(definition, parameters, periodStart, periodEnd);

      // Store in DocChain
      const document = await this.docChain.storeDocument({
        content: reportContent,
        fileName: this.generateFileName(definition, periodStart, periodEnd),
        mimeType: this.getMimeType(definition.defaultFormat),
        type: definition.type,
        accessLevel: definition.regulatoryReport ? AccessLevel.RESTRICTED : AccessLevel.CONFIDENTIAL,
        title: `${definition.name} - ${this.formatPeriod(periodStart, periodEnd)}`,
        description: definition.description,
        ownerId: generatedBy,
        ownerName: generatedByName,
        tags: [
          definition.regulatoryReport ? 'regulatory' : 'operational',
          definition.regulatorCode || 'internal',
          `report-${definitionId.toLowerCase()}`,
        ],
        requiresApproval: definition.regulatoryReport,
      });

      // Update instance
      instance.documentId = document.id;
      instance.status = 'GENERATED';
      this.instances.set(instanceId, instance);

      // Auto-distribute if enabled
      if (definition.autoDistribute && definition.recipients) {
        await this.distributeReport(instance, definition.recipients);
      }

      return instance;
    } catch (error: any) {
      instance.status = 'FAILED';
      instance.errorMessage = error.message;
      this.instances.set(instanceId, instance);
      throw error;
    }
  }

  /**
   * Submit report to regulator
   */
  async submitToRegulator(
    instanceId: string,
    submitterId: string,
    submitterName: string
  ): Promise<ReportInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Report instance not found');
    }

    const definition = this.definitions.get(instance.definitionId);
    if (!definition || !definition.regulatoryReport) {
      throw new Error('Report is not a regulatory report');
    }

    // Submit via DocChain
    const submission = await this.docChain.submitToRegulator(
      instance.documentId,
      definition.regulatorCode || 'RBI',
      submitterId,
      submitterName
    );

    // Update instance
    instance.status = 'SUBMITTED';
    instance.submittedAt = new Date();
    instance.submittedTo = definition.regulatorCode;
    instance.submissionRef = submission.submissionRef;
    this.instances.set(instanceId, instance);

    return instance;
  }

  /**
   * Record acknowledgement from regulator
   */
  async recordAcknowledgement(
    instanceId: string,
    acknowledgementRef: string
  ): Promise<ReportInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Report instance not found');
    }

    instance.status = 'ACKNOWLEDGED';
    instance.acknowledgedAt = new Date();
    instance.acknowledgementRef = acknowledgementRef;
    this.instances.set(instanceId, instance);

    return instance;
  }

  /**
   * Get report instances
   */
  getInstances(definitionId?: string): ReportInstance[] {
    let instances = Array.from(this.instances.values());
    if (definitionId) {
      instances = instances.filter(i => i.definitionId === definitionId);
    }
    return instances.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  /**
   * Get pending regulatory submissions
   */
  getPendingSubmissions(): ReportInstance[] {
    return Array.from(this.instances.values()).filter(i => {
      const def = this.definitions.get(i.definitionId);
      return def?.regulatoryReport && i.status === 'GENERATED';
    });
  }

  /**
   * Get overdue submissions
   */
  getOverdueSubmissions(): ReportInstance[] {
    const now = new Date();
    return Array.from(this.instances.values()).filter(i => {
      const def = this.definitions.get(i.definitionId);
      if (!def?.regulatoryReport || !def.submissionDeadline || i.status !== 'GENERATED') {
        return false;
      }

      const deadline = this.calculateDeadline(i.periodEnd, def.submissionDeadline);
      return deadline < now;
    });
  }

  // ==================== Private Methods ====================

  private validateParameters(definition: ReportDefinition, parameters: Record<string, any>): void {
    for (const param of definition.parameters) {
      if (param.required && (parameters[param.name] === undefined || parameters[param.name] === null)) {
        throw new Error(`Missing required parameter: ${param.label}`);
      }

      if (param.validation && parameters[param.name]) {
        const regex = new RegExp(param.validation);
        if (!regex.test(String(parameters[param.name]))) {
          throw new Error(`Invalid value for ${param.label}`);
        }
      }
    }
  }

  private async renderReport(
    definition: ReportDefinition,
    parameters: Record<string, any>,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Buffer> {
    // In production, this would use a template engine (e.g., Handlebars, Puppeteer for PDF)
    // For now, generate a placeholder

    const reportData = {
      title: definition.name,
      description: definition.description,
      generatedAt: new Date().toISOString(),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      parameters,
      regulatoryReport: definition.regulatoryReport,
      regulatorCode: definition.regulatorCode,
      templateId: definition.templateId,
      templateVersion: definition.templateVersion,
    };

    // Return JSON for now (would be PDF/Excel in production)
    return Buffer.from(JSON.stringify(reportData, null, 2));
  }

  private async distributeReport(
    instance: ReportInstance,
    recipients: ReportRecipient[]
  ): Promise<void> {
    // In production, this would send emails/notifications
    console.log(`[ReportService] Distributing report ${instance.id} to ${recipients.length} recipients`);
  }

  private generateFileName(definition: ReportDefinition, periodStart: Date, periodEnd: Date): string {
    const startStr = periodStart.toISOString().slice(0, 10);
    const endStr = periodEnd.toISOString().slice(0, 10);
    const ext = this.getExtension(definition.defaultFormat);
    return `${definition.id}_${startStr}_${endStr}.${ext}`;
  }

  private formatPeriod(start: Date, end: Date): string {
    const startStr = start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const endStr = end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${startStr} to ${endStr}`;
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      PDF: 'application/pdf',
      XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      CSV: 'text/csv',
      JSON: 'application/json',
      XML: 'application/xml',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  private getExtension(format: string): string {
    return format.toLowerCase();
  }

  private calculateDeadline(periodEnd: Date, deadline: string): Date {
    const result = new Date(periodEnd);

    if (deadline.startsWith('T+')) {
      const value = deadline.slice(2);
      if (value.endsWith('H')) {
        result.setHours(result.getHours() + parseInt(value));
      } else if (value.endsWith('D')) {
        result.setDate(result.getDate() + parseInt(value));
      }
    }

    return result;
  }

  private generateInstanceId(): string {
    return `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
}

/**
 * Create report service
 */
export function createReportService(docChain: DocChainService): ReportService {
  return new ReportService(docChain);
}

export default ReportService;
