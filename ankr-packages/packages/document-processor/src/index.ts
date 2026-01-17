/**
 * @ankr/document-processor
 * Universal Document AI Processing Engine
 * OCR, data extraction, template matching, validation
 */

// Types
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ValidationStatus = 'VALID' | 'INVALID' | 'PENDING';

export type DocumentType =
  | 'MEDICAL_BILL'
  | 'ID_CARD'
  | 'INCOME_PROOF'
  | 'VEHICLE_RC'
  | 'POLICY_DOC'
  | 'CLAIM_FORM'
  | 'BANK_STATEMENT'
  | 'INVOICE'
  | 'CONTRACT'
  | 'OTHER';

export interface DocumentProcessingJob {
  id: string;
  jobNumber: string;
  jobType: string;
  sourceType: string;
  sourceId: string;
  documentType: string;
  documentName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  pageCount?: number;
  status: JobStatus;
  processingEngine?: string;
  startedAt?: Date;
  completedAt?: Date;
  rawText?: string;
  extractedData?: Record<string, any>;
  confidence?: number;
  fieldConfidences?: Record<string, number>;
  validationStatus?: ValidationStatus;
  validationErrors?: any[];
  needsReview: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  corrections?: Record<string, any>;
  retryCount: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentTemplate {
  id: string;
  templateCode: string;
  templateName: string;
  documentType: string;
  fields: TemplateField[];
  validationRules: ValidationRule[];
  sampleUrls: string[];
  accuracy?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  required?: boolean;
  description?: string;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'pattern' | 'range' | 'date' | 'enum';
  pattern?: string;
  min?: number;
  max?: number;
  values?: string[];
  message?: string;
}

export interface DocumentJobInput {
  jobType: string;
  sourceType: string;
  sourceId: string;
  documentType: string;
  documentName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  pageCount?: number;
}

export interface ExtractionResult {
  rawText: string;
  extractedData: Record<string, any>;
  confidence: number;
  fieldConfidences: Record<string, number>;
}

export interface DocumentTemplateInput {
  templateCode: string;
  templateName: string;
  documentType: string;
  fields: TemplateField[];
  validationRules?: ValidationRule[];
  sampleUrls?: string[];
}

export interface ProcessingStats {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  needsReview: number;
  total: number;
  avgConfidence: number;
}

export interface ClassificationResult {
  documentType: string;
  confidence: number;
}

// OCR Engine Interface
export interface OCREngine {
  extractText(fileUrl: string, mimeType: string): Promise<string>;
  extractStructured(fileUrl: string, mimeType: string, template?: DocumentTemplate): Promise<Record<string, any>>;
}

// Storage Interface
export interface DocumentStorage {
  // Job operations
  createJob(job: Omit<DocumentProcessingJob, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt'>): Promise<DocumentProcessingJob>;
  getJob(id: string): Promise<DocumentProcessingJob | null>;
  updateJob(id: string, updates: Partial<DocumentProcessingJob>): Promise<DocumentProcessingJob>;
  findJobs(filter: {
    sourceType?: string;
    sourceId?: string;
    status?: JobStatus[];
    needsReview?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<DocumentProcessingJob[]>;
  countJobs(filter: { status?: JobStatus; needsReview?: boolean }): Promise<number>;

  // Template operations
  createTemplate(template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentTemplate>;
  getTemplate(id: string): Promise<DocumentTemplate | null>;
  getTemplateByType(documentType: string): Promise<DocumentTemplate | null>;
  updateTemplate(id: string, updates: Partial<DocumentTemplate>): Promise<DocumentTemplate>;
  getActiveTemplates(): Promise<DocumentTemplate[]>;
}

// Default Field Extractors by Document Type
const DEFAULT_EXTRACTORS: Record<string, () => Record<string, any>> = {
  MEDICAL_BILL: () => ({
    hospitalName: 'Sample Hospital',
    billNumber: `BILL${Date.now()}`,
    billDate: new Date().toISOString().split('T')[0],
    patientName: 'John Doe',
    totalAmount: 15000 + Math.floor(Math.random() * 50000),
    consultationCharges: 1500,
    medicineCharges: 3000,
    roomCharges: 5000,
    procedureCharges: 5500,
    gstNumber: '29AABCT1234F1ZH',
  }),

  ID_CARD: () => ({
    documentType: 'AADHAAR',
    name: 'John Doe',
    number: '1234-5678-9012',
    dob: '1990-01-15',
    gender: 'Male',
    address: '123 Main Street, City, State - 560001',
  }),

  INCOME_PROOF: () => ({
    documentType: 'SALARY_SLIP',
    employerName: 'ABC Corporation',
    employeeId: 'EMP001',
    month: 'December 2025',
    grossSalary: 100000,
    deductions: 15000,
    netSalary: 85000,
  }),

  VEHICLE_RC: () => ({
    registrationNumber: 'KA01AB1234',
    ownerName: 'John Doe',
    vehicleClass: 'LMV',
    fuelType: 'PETROL',
    makerModel: 'Maruti Swift',
    registrationDate: '2022-05-15',
    fitnessValidity: '2027-05-14',
    insuranceValidity: '2025-05-14',
  }),

  POLICY_DOC: () => ({
    policyNumber: 'POL123456789',
    policyType: 'COMPREHENSIVE',
    insuredName: 'John Doe',
    sumInsured: 500000,
    premium: 12500,
    startDate: '2025-01-01',
    endDate: '2026-01-01',
    coverages: ['Third Party', 'Own Damage', 'Personal Accident'],
  }),

  CLAIM_FORM: () => ({
    policyNumber: 'POL123456789',
    claimantName: 'John Doe',
    incidentDate: '2025-12-15',
    incidentType: 'ACCIDENT',
    incidentDescription: 'Vehicle collision at intersection',
    claimAmount: 25000,
    hospitalName: 'City Hospital',
    doctorName: 'Dr. Smith',
  }),

  BANK_STATEMENT: () => ({
    bankName: 'State Bank',
    accountNumber: '****1234',
    accountHolder: 'John Doe',
    statementPeriod: 'Jan 2025 - Dec 2025',
    openingBalance: 50000,
    closingBalance: 75000,
    totalCredits: 1200000,
    totalDebits: 1175000,
    averageBalance: 65000,
  }),

  INVOICE: () => ({
    invoiceNumber: `INV${Date.now()}`,
    vendorName: 'ABC Supplies',
    vendorGSTIN: '29AABCT1234F1ZH',
    invoiceDate: new Date().toISOString().split('T')[0],
    lineItems: [
      { description: 'Product A', quantity: 2, unitPrice: 1000, amount: 2000 },
      { description: 'Product B', quantity: 1, unitPrice: 5000, amount: 5000 },
    ],
    subtotal: 7000,
    tax: 1260,
    total: 8260,
  }),

  CONTRACT: () => ({
    contractNumber: `CON${Date.now()}`,
    contractType: 'SERVICE_AGREEMENT',
    parties: ['Party A', 'Party B'],
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: 100000,
    renewalTerms: 'Auto-renewal annually',
  }),
};

// Main Processor
export class DocumentProcessor {
  private storage: DocumentStorage;
  private ocrEngine?: OCREngine;

  constructor(storage: DocumentStorage, ocrEngine?: OCREngine) {
    this.storage = storage;
    this.ocrEngine = ocrEngine;
  }

  /**
   * Create a document processing job
   */
  async createJob(input: DocumentJobInput): Promise<DocumentProcessingJob> {
    return this.storage.createJob({
      ...input,
      status: 'QUEUED',
      needsReview: false,
      retryCount: 0,
    });
  }

  /**
   * Start processing a job
   */
  async startProcessing(jobId: string, engine: string): Promise<DocumentProcessingJob> {
    return this.storage.updateJob(jobId, {
      status: 'PROCESSING',
      processingEngine: engine,
      startedAt: new Date(),
    });
  }

  /**
   * Process document
   */
  async processDocument(jobId: string): Promise<ExtractionResult> {
    const job = await this.storage.getJob(jobId);
    if (!job) throw new Error('Job not found');

    await this.startProcessing(jobId, this.ocrEngine ? 'CUSTOM' : 'SIMULATED');

    // Get template for this document type
    const template = await this.storage.getTemplateByType(job.documentType);

    // Extract data
    let extractedData: Record<string, any>;
    let rawText: string;

    if (this.ocrEngine) {
      rawText = await this.ocrEngine.extractText(job.fileUrl, job.mimeType);
      extractedData = await this.ocrEngine.extractStructured(job.fileUrl, job.mimeType, template || undefined);
    } else {
      // Simulated extraction
      rawText = `Simulated OCR text for ${job.documentName}`;
      extractedData = this.simulateExtraction(job.documentType);
    }

    const confidence = 0.85 + Math.random() * 0.1;
    const fieldConfidences = Object.keys(extractedData).reduce((acc, key) => {
      acc[key] = 0.8 + Math.random() * 0.15;
      return acc;
    }, {} as Record<string, number>);

    const result: ExtractionResult = {
      rawText,
      extractedData,
      confidence,
      fieldConfidences,
    };

    // Validate extracted data
    const validationResult = template?.validationRules
      ? this.validateExtraction(extractedData, template.validationRules)
      : { status: 'VALID' as ValidationStatus, errors: [] };

    // Update job with results
    await this.storage.updateJob(jobId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      rawText: result.rawText,
      extractedData: result.extractedData,
      confidence: result.confidence,
      fieldConfidences: result.fieldConfidences,
      validationStatus: validationResult.status,
      validationErrors: validationResult.errors,
      needsReview: result.confidence < 0.9 || validationResult.status !== 'VALID',
    });

    return result;
  }

  private simulateExtraction(documentType: string): Record<string, any> {
    const extractor = DEFAULT_EXTRACTORS[documentType];
    if (extractor) {
      return extractor();
    }
    return {
      documentType,
      extractedAt: new Date().toISOString(),
      fields: 'Unable to extract specific fields',
    };
  }

  /**
   * Validate extracted data against rules
   */
  validateExtraction(
    data: Record<string, any>,
    rules: ValidationRule[]
  ): { status: ValidationStatus; errors: any[] } {
    const errors: any[] = [];

    for (const rule of rules) {
      const value = data[rule.field];

      switch (rule.type) {
        case 'required':
          if (!value && value !== 0 && value !== false) {
            errors.push({
              field: rule.field,
              error: rule.message || 'Required field missing',
            });
          }
          break;

        case 'pattern':
          if (value && rule.pattern && !new RegExp(rule.pattern).test(String(value))) {
            errors.push({
              field: rule.field,
              error: rule.message || `Does not match pattern ${rule.pattern}`,
            });
          }
          break;

        case 'range':
          if (value !== undefined && value !== null) {
            if (rule.min !== undefined && value < rule.min) {
              errors.push({
                field: rule.field,
                error: rule.message || `Value below minimum ${rule.min}`,
              });
            }
            if (rule.max !== undefined && value > rule.max) {
              errors.push({
                field: rule.field,
                error: rule.message || `Value above maximum ${rule.max}`,
              });
            }
          }
          break;

        case 'date':
          if (value && isNaN(Date.parse(value))) {
            errors.push({
              field: rule.field,
              error: rule.message || 'Invalid date format',
            });
          }
          break;

        case 'enum':
          if (value && rule.values && !rule.values.includes(value)) {
            errors.push({
              field: rule.field,
              error: rule.message || `Value must be one of: ${rule.values.join(', ')}`,
            });
          }
          break;
      }
    }

    return {
      status: errors.length === 0 ? 'VALID' : 'INVALID',
      errors,
    };
  }

  /**
   * Mark job for manual review
   */
  async markForReview(jobId: string): Promise<DocumentProcessingJob> {
    return this.storage.updateJob(jobId, {
      needsReview: true,
    });
  }

  /**
   * Complete manual review
   */
  async completeReview(
    jobId: string,
    reviewedBy: string,
    corrections?: Record<string, any>
  ): Promise<DocumentProcessingJob> {
    const job = await this.storage.getJob(jobId);
    if (!job) throw new Error('Job not found');

    const updatedData = corrections
      ? { ...(job.extractedData || {}), ...corrections }
      : (job.extractedData || {});

    return this.storage.updateJob(jobId, {
      needsReview: false,
      reviewedBy,
      reviewedAt: new Date(),
      corrections,
      extractedData: updatedData,
      validationStatus: 'VALID',
    });
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<ExtractionResult> {
    const job = await this.storage.getJob(jobId);
    if (!job || job.status !== 'FAILED') {
      throw new Error('Job not found or not failed');
    }

    await this.storage.updateJob(jobId, {
      status: 'QUEUED',
      retryCount: job.retryCount + 1,
      errorMessage: undefined,
    });

    return this.processDocument(jobId);
  }

  /**
   * Create document template
   */
  async createTemplate(input: DocumentTemplateInput): Promise<DocumentTemplate> {
    return this.storage.createTemplate({
      templateCode: input.templateCode,
      templateName: input.templateName,
      documentType: input.documentType,
      fields: input.fields,
      validationRules: input.validationRules || [],
      sampleUrls: input.sampleUrls || [],
      isActive: true,
    });
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, updates: Partial<DocumentTemplateInput>): Promise<DocumentTemplate> {
    return this.storage.updateTemplate(templateId, updates);
  }

  /**
   * Get jobs by source
   */
  async getJobsBySource(sourceType: string, sourceId: string): Promise<DocumentProcessingJob[]> {
    return this.storage.findJobs({ sourceType, sourceId });
  }

  /**
   * Get jobs needing review
   */
  async getJobsNeedingReview(limit: number = 20): Promise<DocumentProcessingJob[]> {
    return this.storage.findJobs({ needsReview: true, limit });
  }

  /**
   * Get processing stats
   */
  async getProcessingStats(): Promise<ProcessingStats> {
    const [queued, processing, completed, failed, needsReview] = await Promise.all([
      this.storage.countJobs({ status: 'QUEUED' }),
      this.storage.countJobs({ status: 'PROCESSING' }),
      this.storage.countJobs({ status: 'COMPLETED' }),
      this.storage.countJobs({ status: 'FAILED' }),
      this.storage.countJobs({ needsReview: true }),
    ]);

    const completedJobs = await this.storage.findJobs({ status: ['COMPLETED'], limit: 1000 });
    const avgConfidence = completedJobs.length > 0
      ? completedJobs.reduce((sum, j) => sum + (j.confidence || 0), 0) / completedJobs.length
      : 0;

    return {
      queued,
      processing,
      completed,
      failed,
      needsReview,
      total: queued + processing + completed + failed,
      avgConfidence,
    };
  }

  /**
   * Batch process documents
   */
  async batchProcess(jobIds: string[]): Promise<{
    processed: number;
    failed: number;
    results: Array<{ jobId: string; status: string; result?: ExtractionResult; error?: string }>;
  }> {
    const results: Array<{ jobId: string; status: string; result?: ExtractionResult; error?: string }> = [];
    let processed = 0;
    let failed = 0;

    for (const jobId of jobIds) {
      try {
        const result = await this.processDocument(jobId);
        results.push({ jobId, status: 'success', result });
        processed++;
      } catch (error: any) {
        await this.storage.updateJob(jobId, {
          status: 'FAILED',
          errorMessage: error.message,
        });
        results.push({ jobId, status: 'failed', error: error.message });
        failed++;
      }
    }

    return { processed, failed, results };
  }

  /**
   * Get document types with templates
   */
  async getDocumentTypes(): Promise<Array<{ documentType: string; templateName: string; accuracy?: number }>> {
    const templates = await this.storage.getActiveTemplates();
    return templates.map(t => ({
      documentType: t.documentType,
      templateName: t.templateName,
      accuracy: t.accuracy,
    }));
  }

  /**
   * Classify document type
   */
  async classifyDocument(fileUrl: string, mimeType: string): Promise<ClassificationResult> {
    // In reality, this would use ML classification
    const types = Object.keys(DEFAULT_EXTRACTORS);
    const randomType = types[Math.floor(Math.random() * types.length)];

    return {
      documentType: randomType,
      confidence: 0.75 + Math.random() * 0.2,
    };
  }
}

// In-Memory Storage Implementation
export class InMemoryDocumentStorage implements DocumentStorage {
  private jobs: Map<string, DocumentProcessingJob> = new Map();
  private templates: Map<string, DocumentTemplate> = new Map();
  private jobCounter = 0;

  async createJob(data: Omit<DocumentProcessingJob, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt'>): Promise<DocumentProcessingJob> {
    this.jobCounter++;
    const job: DocumentProcessingJob = {
      ...data,
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      jobNumber: `DOC${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(job.id, job);
    return job;
  }

  async getJob(id: string): Promise<DocumentProcessingJob | null> {
    return this.jobs.get(id) || null;
  }

  async updateJob(id: string, updates: Partial<DocumentProcessingJob>): Promise<DocumentProcessingJob> {
    const job = this.jobs.get(id);
    if (!job) throw new Error('Job not found');

    const updated = { ...job, ...updates, updatedAt: new Date() };
    this.jobs.set(id, updated);
    return updated;
  }

  async findJobs(filter: {
    sourceType?: string;
    sourceId?: string;
    status?: JobStatus[];
    needsReview?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<DocumentProcessingJob[]> {
    let results = Array.from(this.jobs.values()).filter(j => {
      if (filter.sourceType && j.sourceType !== filter.sourceType) return false;
      if (filter.sourceId && j.sourceId !== filter.sourceId) return false;
      if (filter.status && !filter.status.includes(j.status)) return false;
      if (filter.needsReview !== undefined && j.needsReview !== filter.needsReview) return false;
      return true;
    });

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (filter.offset) {
      results = results.slice(filter.offset);
    }
    if (filter.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  async countJobs(filter: { status?: JobStatus; needsReview?: boolean }): Promise<number> {
    return Array.from(this.jobs.values()).filter(j => {
      if (filter.status && j.status !== filter.status) return false;
      if (filter.needsReview !== undefined && j.needsReview !== filter.needsReview) return false;
      return true;
    }).length;
  }

  async createTemplate(data: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentTemplate> {
    const template: DocumentTemplate = {
      ...data,
      id: `template_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.templates.set(template.id, template);
    return template;
  }

  async getTemplate(id: string): Promise<DocumentTemplate | null> {
    return this.templates.get(id) || null;
  }

  async getTemplateByType(documentType: string): Promise<DocumentTemplate | null> {
    for (const t of this.templates.values()) {
      if (t.documentType === documentType && t.isActive) {
        return t;
      }
    }
    return null;
  }

  async updateTemplate(id: string, updates: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const template = this.templates.get(id);
    if (!template) throw new Error('Template not found');

    const updated = { ...template, ...updates, updatedAt: new Date() };
    this.templates.set(id, updated);
    return updated;
  }

  async getActiveTemplates(): Promise<DocumentTemplate[]> {
    return Array.from(this.templates.values()).filter(t => t.isActive);
  }
}

// Factory function
export function createDocumentProcessor(
  storage?: DocumentStorage,
  ocrEngine?: OCREngine
): DocumentProcessor {
  return new DocumentProcessor(storage || new InMemoryDocumentStorage(), ocrEngine);
}

// Utility functions
export function getSupportedDocumentTypes(): DocumentType[] {
  return Object.keys(DEFAULT_EXTRACTORS) as DocumentType[];
}
