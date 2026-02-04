/**
 * Document Workflow Engine
 *
 * Manages document lifecycle:
 * - Routing and approval workflows
 * - Document archival and retention policies
 * - Workflow templates and automation
 * - Audit trail and compliance tracking
 *
 * @module DocumentWorkflow
 */

import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

// ============================================================================
// Types and Enums
// ============================================================================

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED',
}

export enum WorkflowStepType {
  REVIEW = 'REVIEW',
  APPROVE = 'APPROVE',
  SIGN = 'SIGN',
  VERIFY = 'VERIFY',
  ACKNOWLEDGE = 'ACKNOWLEDGE',
  CONDITIONAL = 'CONDITIONAL',
}

export enum WorkflowStepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  REJECTED = 'REJECTED',
}

export enum ArchivalStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  RETENTION_HOLD = 'RETENTION_HOLD',
  SCHEDULED_DELETION = 'SCHEDULED_DELETION',
  DELETED = 'DELETED',
}

export enum RetentionPolicy {
  PERMANENT = 'PERMANENT',
  SEVEN_YEARS = 'SEVEN_YEARS',
  FIVE_YEARS = 'FIVE_YEARS',
  THREE_YEARS = 'THREE_YEARS',
  ONE_YEAR = 'ONE_YEAR',
  CUSTOM = 'CUSTOM',
}

// ============================================================================
// Interfaces
// ============================================================================

export interface WorkflowStep {
  stepId: string;
  stepNumber: number;
  stepType: WorkflowStepType;
  stepName: string;
  assignedTo: string; // userId or roleId
  assignmentType: 'USER' | 'ROLE' | 'GROUP';
  status: WorkflowStepStatus;
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  comments?: string;
  metadata?: Record<string, any>;

  // Conditional logic
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
  };
  skipIfConditionFails?: boolean;
}

export interface DocumentWorkflow {
  workflowId: string;
  documentId: string;
  documentType: string;
  workflowTemplateId?: string;

  status: WorkflowStatus;
  currentStep: number;
  steps: WorkflowStep[];

  initiatedBy: string;
  initiatedAt: Date;
  completedAt?: Date;

  organizationId: string;
  metadata?: Record<string, any>;

  // Escalation
  escalationEnabled: boolean;
  escalationHours?: number;
  escalatedTo?: string;
  escalatedAt?: Date;
}

export interface WorkflowTemplate {
  templateId: string;
  templateName: string;
  description: string;
  documentType: string; // charter_party, bol, invoice, etc.

  steps: Omit<WorkflowStep, 'status' | 'completedAt' | 'completedBy'>[];

  organizationId: string;
  isActive: boolean;
  usageCount: number;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArchivalRecord {
  recordId: string;
  documentId: string;
  status: ArchivalStatus;
  retentionPolicy: RetentionPolicy;

  archivedAt?: Date;
  archivedBy?: string;
  scheduledDeletionDate?: Date;
  deletedAt?: Date;
  deletedBy?: string;

  archivalLocation?: string; // S3 path, cold storage location
  compressionApplied: boolean;
  encryptionApplied: boolean;

  organizationId: string;
  metadata?: Record<string, any>;
}

export interface WorkflowAuditEntry {
  entryId: string;
  workflowId: string;
  documentId: string;

  action: string; // 'INITIATED', 'STEP_COMPLETED', 'APPROVED', 'REJECTED', 'ESCALATED', etc.
  performedBy: string;
  performedAt: Date;

  previousStatus?: string;
  newStatus?: string;

  comments?: string;
  metadata?: Record<string, any>;

  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// Document Workflow Service
// ============================================================================

export class DocumentWorkflowService {

  /**
   * Create workflow from template
   */
  async createWorkflowFromTemplate(
    documentId: string,
    templateId: string,
    initiatedBy: string,
    organizationId: string,
    metadata?: Record<string, any>
  ): Promise<DocumentWorkflow> {
    // Fetch template
    const template = await this.getWorkflowTemplate(templateId, organizationId);
    if (!template) {
      throw new GraphQLError(`Template not found: ${templateId}`);
    }

    // Get document
    const document = await prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });
    if (!document) {
      throw new GraphQLError(`Document not found: ${documentId}`);
    }

    // Validate document type matches template
    if (template.documentType !== 'ANY' && document.type !== template.documentType) {
      throw new GraphQLError(
        `Document type mismatch. Expected ${template.documentType}, got ${document.type}`
      );
    }

    // Create workflow steps from template
    const steps: WorkflowStep[] = template.steps.map((templateStep, index) => ({
      ...templateStep,
      stepId: this.generateStepId(),
      status: index === 0 ? WorkflowStepStatus.PENDING : WorkflowStepStatus.PENDING,
      stepNumber: index + 1,
    }));

    const workflow: DocumentWorkflow = {
      workflowId: this.generateWorkflowId(),
      documentId,
      documentType: document.type,
      workflowTemplateId: templateId,
      status: WorkflowStatus.IN_PROGRESS,
      currentStep: 0,
      steps,
      initiatedBy,
      initiatedAt: new Date(),
      organizationId,
      metadata,
      escalationEnabled: false,
    };

    // Store workflow (in production, use DocumentWorkflow table)
    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          ...(document.metadata as any || {}),
          workflow,
        },
      },
    });

    // Create audit entry
    await this.logWorkflowAudit({
      entryId: this.generateAuditId(),
      workflowId: workflow.workflowId,
      documentId,
      action: 'INITIATED',
      performedBy: initiatedBy,
      performedAt: new Date(),
      newStatus: WorkflowStatus.IN_PROGRESS,
      comments: `Workflow initiated using template: ${template.templateName}`,
    });

    // Notify first assignee
    await this.notifyStepAssignee(workflow, 0);

    // Increment template usage
    await this.incrementTemplateUsage(templateId, organizationId);

    return workflow;
  }

  /**
   * Create custom workflow
   */
  async createCustomWorkflow(
    documentId: string,
    steps: Omit<WorkflowStep, 'stepId' | 'status' | 'stepNumber'>[],
    initiatedBy: string,
    organizationId: string,
    metadata?: Record<string, any>
  ): Promise<DocumentWorkflow> {
    // Get document
    const document = await prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });
    if (!document) {
      throw new GraphQLError(`Document not found: ${documentId}`);
    }

    // Create workflow steps
    const workflowSteps: WorkflowStep[] = steps.map((step, index) => ({
      ...step,
      stepId: this.generateStepId(),
      stepNumber: index + 1,
      status: index === 0 ? WorkflowStepStatus.PENDING : WorkflowStepStatus.PENDING,
    }));

    const workflow: DocumentWorkflow = {
      workflowId: this.generateWorkflowId(),
      documentId,
      documentType: document.type,
      status: WorkflowStatus.IN_PROGRESS,
      currentStep: 0,
      steps: workflowSteps,
      initiatedBy,
      initiatedAt: new Date(),
      organizationId,
      metadata,
      escalationEnabled: false,
    };

    // Store workflow
    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          ...(document.metadata as any || {}),
          workflow,
        },
      },
    });

    // Create audit entry
    await this.logWorkflowAudit({
      entryId: this.generateAuditId(),
      workflowId: workflow.workflowId,
      documentId,
      action: 'INITIATED',
      performedBy: initiatedBy,
      performedAt: new Date(),
      newStatus: WorkflowStatus.IN_PROGRESS,
      comments: 'Custom workflow initiated',
    });

    // Notify first assignee
    await this.notifyStepAssignee(workflow, 0);

    return workflow;
  }

  /**
   * Complete workflow step
   */
  async completeWorkflowStep(
    workflowId: string,
    stepId: string,
    completedBy: string,
    organizationId: string,
    comments?: string,
    metadata?: Record<string, any>
  ): Promise<DocumentWorkflow> {
    // Get workflow
    const workflow = await this.getWorkflow(workflowId, organizationId);
    if (!workflow) {
      throw new GraphQLError(`Workflow not found: ${workflowId}`);
    }

    // Find current step
    const stepIndex = workflow.steps.findIndex(s => s.stepId === stepId);
    if (stepIndex === -1) {
      throw new GraphQLError(`Step not found: ${stepId}`);
    }

    const currentStep = workflow.steps[stepIndex];

    // Validate step is current step
    if (stepIndex !== workflow.currentStep) {
      throw new GraphQLError(
        `Cannot complete step ${stepIndex + 1}. Current step is ${workflow.currentStep + 1}`
      );
    }

    // Validate step status
    if (currentStep.status === WorkflowStepStatus.COMPLETED) {
      throw new GraphQLError('Step already completed');
    }

    // Validate assignee (simplified - check user or role)
    // In production, implement full role/group resolution
    if (currentStep.assignmentType === 'USER' && currentStep.assignedTo !== completedBy) {
      throw new GraphQLError('Not authorized to complete this step');
    }

    // Update step
    currentStep.status = WorkflowStepStatus.COMPLETED;
    currentStep.completedAt = new Date();
    currentStep.completedBy = completedBy;
    if (comments) currentStep.comments = comments;
    if (metadata) currentStep.metadata = { ...currentStep.metadata, ...metadata };

    // Move to next step
    let nextStepIndex = stepIndex + 1;

    // Handle conditional steps
    while (nextStepIndex < workflow.steps.length) {
      const nextStep = workflow.steps[nextStepIndex];

      if (nextStep.condition) {
        const conditionMet = this.evaluateCondition(nextStep.condition, workflow);

        if (!conditionMet && nextStep.skipIfConditionFails) {
          // Skip this step
          nextStep.status = WorkflowStepStatus.SKIPPED;
          nextStepIndex++;
          continue;
        }
      }

      break; // Found next step to execute
    }

    // Check if workflow is complete
    if (nextStepIndex >= workflow.steps.length) {
      workflow.status = WorkflowStatus.APPROVED;
      workflow.completedAt = new Date();

      await this.logWorkflowAudit({
        entryId: this.generateAuditId(),
        workflowId: workflow.workflowId,
        documentId: workflow.documentId,
        action: 'COMPLETED',
        performedBy: completedBy,
        performedAt: new Date(),
        previousStatus: WorkflowStatus.IN_PROGRESS,
        newStatus: WorkflowStatus.APPROVED,
        comments: 'Workflow completed successfully',
      });
    } else {
      // Move to next step
      workflow.currentStep = nextStepIndex;

      // Notify next assignee
      await this.notifyStepAssignee(workflow, nextStepIndex);
    }

    // Update workflow
    const document = await prisma.document.findUnique({
      where: { id: workflow.documentId },
    });

    await prisma.document.update({
      where: { id: workflow.documentId },
      data: {
        metadata: {
          ...(document?.metadata as any || {}),
          workflow,
        },
      },
    });

    // Create audit entry
    await this.logWorkflowAudit({
      entryId: this.generateAuditId(),
      workflowId: workflow.workflowId,
      documentId: workflow.documentId,
      action: 'STEP_COMPLETED',
      performedBy: completedBy,
      performedAt: new Date(),
      comments: `Step ${stepIndex + 1} completed: ${currentStep.stepName}`,
      metadata: { stepId, stepNumber: stepIndex + 1 },
    });

    return workflow;
  }

  /**
   * Reject workflow
   */
  async rejectWorkflow(
    workflowId: string,
    rejectedBy: string,
    organizationId: string,
    reason: string
  ): Promise<DocumentWorkflow> {
    const workflow = await this.getWorkflow(workflowId, organizationId);
    if (!workflow) {
      throw new GraphQLError(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status === WorkflowStatus.APPROVED || workflow.status === WorkflowStatus.REJECTED) {
      throw new GraphQLError(`Cannot reject workflow in ${workflow.status} status`);
    }

    workflow.status = WorkflowStatus.REJECTED;
    workflow.completedAt = new Date();

    // Update document
    const document = await prisma.document.findUnique({
      where: { id: workflow.documentId },
    });

    await prisma.document.update({
      where: { id: workflow.documentId },
      data: {
        metadata: {
          ...(document?.metadata as any || {}),
          workflow,
        },
      },
    });

    // Create audit entry
    await this.logWorkflowAudit({
      entryId: this.generateAuditId(),
      workflowId: workflow.workflowId,
      documentId: workflow.documentId,
      action: 'REJECTED',
      performedBy: rejectedBy,
      performedAt: new Date(),
      previousStatus: workflow.status,
      newStatus: WorkflowStatus.REJECTED,
      comments: reason,
    });

    // Notify initiator and stakeholders
    await this.notifyWorkflowRejection(workflow, rejectedBy, reason);

    return workflow;
  }

  /**
   * Archive document
   */
  async archiveDocument(
    documentId: string,
    archivedBy: string,
    organizationId: string,
    retentionPolicy: RetentionPolicy = RetentionPolicy.SEVEN_YEARS,
    customRetentionDays?: number
  ): Promise<ArchivalRecord> {
    const document = await prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      throw new GraphQLError(`Document not found: ${documentId}`);
    }

    // Calculate deletion date
    let scheduledDeletionDate: Date | undefined;

    if (retentionPolicy !== RetentionPolicy.PERMANENT) {
      const retentionDays = this.getRetentionDays(retentionPolicy, customRetentionDays);
      scheduledDeletionDate = new Date();
      scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + retentionDays);
    }

    const archivalRecord: ArchivalRecord = {
      recordId: this.generateRecordId(),
      documentId,
      status: ArchivalStatus.ARCHIVED,
      retentionPolicy,
      archivedAt: new Date(),
      archivedBy,
      scheduledDeletionDate,
      archivalLocation: `s3://mari8x-archive/${organizationId}/${documentId}`,
      compressionApplied: true,
      encryptionApplied: true,
      organizationId,
      metadata: {
        originalSize: document.fileSize,
        archivalDate: new Date().toISOString(),
      },
    };

    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          ...(document.metadata as any || {}),
          archivalRecord,
        },
      },
    });

    // In production: Move file to cold storage, apply compression
    // await this.moveToArchivalStorage(document, archivalRecord);

    return archivalRecord;
  }

  /**
   * Restore archived document
   */
  async restoreDocument(
    documentId: string,
    restoredBy: string,
    organizationId: string
  ): Promise<ArchivalRecord> {
    const document = await prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      throw new GraphQLError(`Document not found: ${documentId}`);
    }

    const archivalRecord = (document.metadata as any)?.archivalRecord as ArchivalRecord;

    if (!archivalRecord || archivalRecord.status !== ArchivalStatus.ARCHIVED) {
      throw new GraphQLError('Document is not archived');
    }

    archivalRecord.status = ArchivalStatus.ACTIVE;
    archivalRecord.metadata = {
      ...archivalRecord.metadata,
      restoredAt: new Date().toISOString(),
      restoredBy,
    };

    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          ...(document.metadata as any || {}),
          archivalRecord,
        },
      },
    });

    // In production: Restore file from cold storage
    // await this.restoreFromArchivalStorage(document, archivalRecord);

    return archivalRecord;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string, organizationId: string): Promise<DocumentWorkflow | null> {
    const documents = await prisma.document.findMany({
      where: { organizationId },
    });

    for (const doc of documents) {
      const workflow = (doc.metadata as any)?.workflow as DocumentWorkflow;
      if (workflow && workflow.workflowId === workflowId) {
        return workflow;
      }
    }

    return null;
  }

  /**
   * Get pending workflows for user
   */
  async getPendingWorkflows(
    userId: string,
    organizationId: string
  ): Promise<DocumentWorkflow[]> {
    const documents = await prisma.document.findMany({
      where: { organizationId },
    });

    const pendingWorkflows: DocumentWorkflow[] = [];

    for (const doc of documents) {
      const workflow = (doc.metadata as any)?.workflow as DocumentWorkflow;

      if (workflow && workflow.status === WorkflowStatus.IN_PROGRESS) {
        const currentStep = workflow.steps[workflow.currentStep];

        // Check if user is assigned to current step
        if (currentStep.assignmentType === 'USER' && currentStep.assignedTo === userId) {
          pendingWorkflows.push(workflow);
        }
        // In production: also check role/group memberships
      }
    }

    return pendingWorkflows;
  }

  /**
   * Create workflow template
   */
  async createWorkflowTemplate(
    templateName: string,
    description: string,
    documentType: string,
    steps: Omit<WorkflowStep, 'stepId' | 'status' | 'stepNumber' | 'completedAt' | 'completedBy'>[],
    createdBy: string,
    organizationId: string
  ): Promise<WorkflowTemplate> {
    const template: WorkflowTemplate = {
      templateId: this.generateTemplateId(),
      templateName,
      description,
      documentType,
      steps,
      organizationId,
      isActive: true,
      usageCount: 0,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In production: Store in WorkflowTemplate table
    // For now, store in a simple cache or file

    return template;
  }

  /**
   * Get workflow template
   */
  async getWorkflowTemplate(
    templateId: string,
    organizationId: string
  ): Promise<WorkflowTemplate | null> {
    // In production: Fetch from WorkflowTemplate table
    // For MVP, return hardcoded templates

    const templates = this.getDefaultTemplates(organizationId);
    return templates.find(t => t.templateId === templateId) || null;
  }

  /**
   * Get all workflow templates
   */
  async getWorkflowTemplates(organizationId: string): Promise<WorkflowTemplate[]> {
    return this.getDefaultTemplates(organizationId);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private evaluateCondition(
    condition: { field: string; operator: string; value: any },
    workflow: DocumentWorkflow
  ): boolean {
    const fieldValue = (workflow.metadata as any)?.[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      default:
        return false;
    }
  }

  private getRetentionDays(policy: RetentionPolicy, customDays?: number): number {
    switch (policy) {
      case RetentionPolicy.SEVEN_YEARS:
        return 7 * 365;
      case RetentionPolicy.FIVE_YEARS:
        return 5 * 365;
      case RetentionPolicy.THREE_YEARS:
        return 3 * 365;
      case RetentionPolicy.ONE_YEAR:
        return 365;
      case RetentionPolicy.CUSTOM:
        return customDays || 365;
      case RetentionPolicy.PERMANENT:
      default:
        return 0;
    }
  }

  private async notifyStepAssignee(workflow: DocumentWorkflow, stepIndex: number): Promise<void> {
    const step = workflow.steps[stepIndex];

    // In production: Send email/notification to assignee
    console.log(`[Workflow] Notifying ${step.assignedTo} for step: ${step.stepName}`);

    // Create notification record
    await prisma.notification?.create({
      data: {
        userId: step.assignedTo,
        type: 'WORKFLOW_STEP_ASSIGNED',
        title: `New workflow step: ${step.stepName}`,
        message: `You have been assigned to ${step.stepType} for document workflow`,
        data: {
          workflowId: workflow.workflowId,
          documentId: workflow.documentId,
          stepId: step.stepId,
        },
        organizationId: workflow.organizationId,
      },
    });
  }

  private async notifyWorkflowRejection(
    workflow: DocumentWorkflow,
    rejectedBy: string,
    reason: string
  ): Promise<void> {
    // Notify initiator
    await prisma.notification?.create({
      data: {
        userId: workflow.initiatedBy,
        type: 'WORKFLOW_REJECTED',
        title: 'Workflow rejected',
        message: `Your workflow for document ${workflow.documentId} was rejected: ${reason}`,
        data: {
          workflowId: workflow.workflowId,
          documentId: workflow.documentId,
          rejectedBy,
          reason,
        },
        organizationId: workflow.organizationId,
      },
    });
  }

  private async incrementTemplateUsage(templateId: string, organizationId: string): Promise<void> {
    // In production: Update WorkflowTemplate.usageCount
    console.log(`[Template] Incremented usage count for ${templateId}`);
  }

  private async logWorkflowAudit(entry: WorkflowAuditEntry): Promise<void> {
    // In production: Store in WorkflowAudit table
    console.log(`[Audit] ${entry.action} by ${entry.performedBy}: ${entry.comments}`);
  }

  private getDefaultTemplates(organizationId: string): WorkflowTemplate[] {
    return [
      {
        templateId: 'charter-party-approval',
        templateName: 'Charter Party Approval',
        description: 'Standard approval workflow for charter party agreements',
        documentType: 'charter_party',
        steps: [
          {
            stepId: '',
            stepNumber: 0,
            stepType: WorkflowStepType.REVIEW,
            stepName: 'Commercial Review',
            assignedTo: 'commercial_manager',
            assignmentType: 'ROLE',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          {
            stepId: '',
            stepNumber: 0,
            stepType: WorkflowStepType.APPROVE,
            stepName: 'Operations Approval',
            assignedTo: 'ops_manager',
            assignmentType: 'ROLE',
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
          },
          {
            stepId: '',
            stepNumber: 0,
            stepType: WorkflowStepType.APPROVE,
            stepName: 'Finance Approval',
            assignedTo: 'finance_manager',
            assignmentType: 'ROLE',
            dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
            condition: {
              field: 'totalValue',
              operator: 'greater_than',
              value: 100000,
            },
            skipIfConditionFails: true,
          },
          {
            stepId: '',
            stepNumber: 0,
            stepType: WorkflowStepType.SIGN,
            stepName: 'Digital Signature',
            assignedTo: 'ceo',
            assignmentType: 'ROLE',
          },
        ],
        organizationId,
        isActive: true,
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        templateId: 'bol-verification',
        templateName: 'Bill of Lading Verification',
        description: 'Verification workflow for bills of lading',
        documentType: 'bill_of_lading',
        steps: [
          {
            stepId: '',
            stepNumber: 0,
            stepType: WorkflowStepType.VERIFY,
            stepName: 'Document Verification',
            assignedTo: 'document_controller',
            assignmentType: 'ROLE',
          },
          {
            stepId: '',
            stepNumber: 0,
            stepType: WorkflowStepType.ACKNOWLEDGE,
            stepName: 'Operations Acknowledgment',
            assignedTo: 'ops_team',
            assignmentType: 'GROUP',
          },
        ],
        organizationId,
        isActive: true,
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  private generateWorkflowId(): string {
    return `WF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStepId(): string {
    return `STEP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateId(): string {
    return `TPL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecordId(): string {
    return `AR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditId(): string {
    return `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const documentWorkflowService = new DocumentWorkflowService();
