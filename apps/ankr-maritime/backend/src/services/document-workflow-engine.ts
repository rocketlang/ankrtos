/**
 * Document Workflow Engine
 * Phase 33: Task #68 - Document Workflow Automation
 *
 * Automated workflows for document approval, review, and routing:
 * - Approval chains (sequential, parallel)
 * - Auto-routing based on rules
 * - Workflow templates
 * - Status tracking
 * - Deadline management
 * - Notifications
 */

import { prisma } from '../lib/prisma.js';
import { BullMQService } from './bullmq-service.js';

export interface WorkflowStep {
  stepNumber: number;
  stepType: 'approval' | 'review' | 'sign' | 'acknowledge' | 'route';
  assignedTo: string | string[]; // User ID(s)
  assignedRole?: string; // Or by role
  dueInHours?: number;
  required: boolean;
  allowDelegate: boolean;
  parallelApproval?: boolean; // For multiple approvers
  minApprovals?: number; // Minimum approvals needed (if parallel)
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string; // charter_party, invoice, certificate, etc.
  steps: WorkflowStep[];
  autoStart: boolean; // Automatically start on document upload
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  field: string; // documentField to check
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  value: any;
}

export interface WorkflowInstance {
  id: string;
  documentId: string;
  templateId: string;
  organizationId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  currentStepNumber: number;
  startedAt: Date;
  completedAt?: Date;
  initiatedBy: string;
  steps: WorkflowStepInstance[];
}

export interface WorkflowStepInstance {
  stepNumber: number;
  stepType: string;
  assignedTo: string[];
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: string;
  comments?: string;
  dueDate?: Date;
  approvals?: {
    userId: string;
    decision: 'approved' | 'rejected';
    comments?: string;
    timestamp: Date;
  }[];
}

/**
 * Auto-routing rules
 */
export interface RoutingRule {
  id: string;
  name: string;
  organizationId: string;
  priority: number; // Higher = evaluated first
  conditions: WorkflowCondition[];
  actions: RoutingAction[];
  enabled: boolean;
}

export interface RoutingAction {
  type: 'assign_workflow' | 'move_to_folder' | 'add_tags' | 'notify' | 'set_category';
  value: any;
}

class DocumentWorkflowEngine {
  private bullmq: BullMQService;

  constructor() {
    this.bullmq = new BullMQService();
  }

  /**
   * Create workflow template
   */
  async createTemplate(
    template: Omit<WorkflowTemplate, 'id'>,
    organizationId: string
  ): Promise<WorkflowTemplate> {
    const created = await prisma.workflowTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        category: template.category,
        organizationId,
        steps: template.steps as any,
        autoStart: template.autoStart,
        conditions: template.conditions as any,
        isActive: true,
      },
    });

    return {
      id: created.id,
      name: created.name,
      description: created.description,
      category: created.category,
      steps: created.steps as WorkflowStep[],
      autoStart: created.autoStart,
      conditions: created.conditions as WorkflowCondition[] | undefined,
    };
  }

  /**
   * Start workflow for a document
   */
  async startWorkflow(
    documentId: string,
    templateId: string,
    initiatedBy: string,
    organizationId: string
  ): Promise<WorkflowInstance> {
    // Get template
    const template = await prisma.workflowTemplate.findUnique({
      where: { id: templateId, organizationId },
    });

    if (!template) {
      throw new Error('Workflow template not found');
    }

    // Create workflow instance
    const steps = (template.steps as WorkflowStep[]).map((step) => ({
      stepNumber: step.stepNumber,
      stepType: step.stepType,
      assignedTo: Array.isArray(step.assignedTo) ? step.assignedTo : [step.assignedTo],
      status: 'pending' as const,
      dueDate: step.dueInHours
        ? new Date(Date.now() + step.dueInHours * 60 * 60 * 1000)
        : null,
      approvals: [],
    }));

    const instance = await prisma.workflowInstance.create({
      data: {
        documentId,
        templateId,
        organizationId,
        status: 'in_progress',
        currentStepNumber: 1,
        startedAt: new Date(),
        initiatedBy,
        steps: steps as any,
      },
    });

    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'pending_approval',
        metadata: {
          workflow: {
            instanceId: instance.id,
            templateId,
            status: 'in_progress',
            currentStep: 1,
          },
        },
      },
    });

    // Mark first step as in_progress
    steps[0].status = 'in_progress';
    steps[0].startedAt = new Date();
    await prisma.workflowInstance.update({
      where: { id: instance.id },
      data: { steps: steps as any },
    });

    // Send notifications for first step
    await this.notifyAssignees(instance.id, 1, organizationId);

    // Schedule deadline reminder
    if (steps[0].dueDate) {
      await this.scheduleDeadlineReminder(instance.id, 1, steps[0].dueDate);
    }

    return {
      id: instance.id,
      documentId: instance.documentId,
      templateId: instance.templateId,
      organizationId: instance.organizationId,
      status: instance.status as any,
      currentStepNumber: instance.currentStepNumber,
      startedAt: instance.startedAt,
      initiatedBy: instance.initiatedBy,
      steps: steps as WorkflowStepInstance[],
    };
  }

  /**
   * Complete workflow step (approve/reject)
   */
  async completeStep(
    instanceId: string,
    stepNumber: number,
    userId: string,
    decision: 'approved' | 'rejected',
    comments?: string
  ): Promise<WorkflowInstance> {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    const steps = instance.steps as WorkflowStepInstance[];
    const currentStep = steps.find((s) => s.stepNumber === stepNumber);

    if (!currentStep) {
      throw new Error('Step not found');
    }

    if (currentStep.status !== 'in_progress') {
      throw new Error('Step is not in progress');
    }

    // Check if user is assigned to this step
    if (!currentStep.assignedTo.includes(userId)) {
      throw new Error('User not assigned to this step');
    }

    // Get template to check parallel approval settings
    const template = await prisma.workflowTemplate.findUnique({
      where: { id: instance.templateId },
    });
    const templateSteps = template?.steps as WorkflowStep[];
    const templateStep = templateSteps.find((s) => s.stepNumber === stepNumber);

    // Record approval/rejection
    if (!currentStep.approvals) {
      currentStep.approvals = [];
    }

    currentStep.approvals.push({
      userId,
      decision,
      comments,
      timestamp: new Date(),
    });

    // Check if step is complete
    let stepComplete = false;

    if (templateStep?.parallelApproval) {
      // Parallel approval: check if minimum approvals reached
      const minApprovals = templateStep.minApprovals || currentStep.assignedTo.length;
      const approvalCount = currentStep.approvals.filter((a) => a.decision === 'approved').length;
      const rejectionCount = currentStep.approvals.filter((a) => a.decision === 'rejected').length;

      if (decision === 'rejected') {
        // Any rejection completes the step as rejected
        stepComplete = true;
        currentStep.status = 'rejected';
      } else if (approvalCount >= minApprovals) {
        // Enough approvals
        stepComplete = true;
        currentStep.status = 'approved';
      }
    } else {
      // Single approval
      stepComplete = true;
      currentStep.status = decision === 'approved' ? 'approved' : 'rejected';
    }

    if (stepComplete) {
      currentStep.completedAt = new Date();
      currentStep.completedBy = userId;

      // Handle rejection
      if (currentStep.status === 'rejected') {
        instance.status = 'rejected';
        await prisma.workflowInstance.update({
          where: { id: instanceId },
          data: {
            status: 'rejected',
            completedAt: new Date(),
            steps: steps as any,
          },
        });

        // Update document status
        await prisma.document.update({
          where: { id: instance.documentId },
          data: {
            status: 'rejected',
            metadata: {
              workflow: {
                instanceId,
                status: 'rejected',
                rejectedBy: userId,
                rejectedAt: new Date().toISOString(),
                rejectionReason: comments,
              },
            },
          },
        });

        return this.getWorkflowInstance(instanceId);
      }

      // Move to next step or complete workflow
      const nextStep = steps.find((s) => s.stepNumber === stepNumber + 1);

      if (nextStep) {
        // Start next step
        nextStep.status = 'in_progress';
        nextStep.startedAt = new Date();

        await prisma.workflowInstance.update({
          where: { id: instanceId },
          data: {
            currentStepNumber: nextStep.stepNumber,
            steps: steps as any,
          },
        });

        // Notify assignees of next step
        await this.notifyAssignees(instanceId, nextStep.stepNumber, instance.organizationId);

        // Schedule deadline reminder
        if (nextStep.dueDate) {
          await this.scheduleDeadlineReminder(instanceId, nextStep.stepNumber, nextStep.dueDate);
        }
      } else {
        // Workflow complete
        await prisma.workflowInstance.update({
          where: { id: instanceId },
          data: {
            status: 'completed',
            completedAt: new Date(),
            steps: steps as any,
          },
        });

        // Update document status
        await prisma.document.update({
          where: { id: instance.documentId },
          data: {
            status: 'approved',
            metadata: {
              workflow: {
                instanceId,
                status: 'completed',
                completedAt: new Date().toISOString(),
              },
            },
          },
        });
      }
    } else {
      // Step not yet complete (waiting for more approvals)
      await prisma.workflowInstance.update({
        where: { id: instanceId },
        data: { steps: steps as any },
      });
    }

    return this.getWorkflowInstance(instanceId);
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(instanceId: string, userId: string, reason?: string): Promise<void> {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });

    await prisma.document.update({
      where: { id: instance.documentId },
      data: {
        status: 'active',
        metadata: {
          workflow: {
            instanceId,
            status: 'cancelled',
            cancelledBy: userId,
            cancelledAt: new Date().toISOString(),
            cancellationReason: reason,
          },
        },
      },
    });
  }

  /**
   * Auto-route document based on rules
   */
  async autoRoute(documentId: string, organizationId: string): Promise<void> {
    const document = await prisma.document.findUnique({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Get active routing rules (ordered by priority)
    const rules = await prisma.routingRule.findMany({
      where: { organizationId, enabled: true },
      orderBy: { priority: 'desc' },
    });

    for (const rule of rules) {
      const conditions = rule.conditions as WorkflowCondition[];
      const actions = rule.actions as RoutingAction[];

      // Check if all conditions match
      if (this.evaluateConditions(document, conditions)) {
        // Execute actions
        for (const action of actions) {
          await this.executeRoutingAction(document.id, action, organizationId);
        }

        // Only apply first matching rule
        break;
      }
    }
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(document: any, conditions: WorkflowCondition[]): boolean {
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(document, condition.field);

      switch (condition.operator) {
        case 'equals':
          if (fieldValue !== condition.value) return false;
          break;
        case 'contains':
          if (
            typeof fieldValue !== 'string' ||
            !fieldValue.toLowerCase().includes(String(condition.value).toLowerCase())
          ) {
            return false;
          }
          break;
        case 'greaterThan':
          if (!(Number(fieldValue) > Number(condition.value))) return false;
          break;
        case 'lessThan':
          if (!(Number(fieldValue) < Number(condition.value))) return false;
          break;
      }
    }

    return true;
  }

  /**
   * Get field value from document
   */
  private getFieldValue(document: any, field: string): any {
    const parts = field.split('.');
    let value = document;

    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) return null;
    }

    return value;
  }

  /**
   * Execute routing action
   */
  private async executeRoutingAction(
    documentId: string,
    action: RoutingAction,
    organizationId: string
  ): Promise<void> {
    switch (action.type) {
      case 'assign_workflow':
        await this.startWorkflow(documentId, action.value, 'system', organizationId);
        break;

      case 'move_to_folder':
        await prisma.document.update({
          where: { id: documentId },
          data: { folderId: action.value },
        });
        break;

      case 'add_tags':
        const doc = await prisma.document.findUnique({ where: { id: documentId } });
        const newTags = Array.isArray(action.value) ? action.value : [action.value];
        await prisma.document.update({
          where: { id: documentId },
          data: { tags: { set: [...(doc?.tags || []), ...newTags] } },
        });
        break;

      case 'set_category':
        await prisma.document.update({
          where: { id: documentId },
          data: { category: action.value },
        });
        break;

      case 'notify':
        // TODO: Send notification
        break;
    }
  }

  /**
   * Get workflow instance
   */
  private async getWorkflowInstance(instanceId: string): Promise<WorkflowInstance> {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    return {
      id: instance.id,
      documentId: instance.documentId,
      templateId: instance.templateId,
      organizationId: instance.organizationId,
      status: instance.status as any,
      currentStepNumber: instance.currentStepNumber,
      startedAt: instance.startedAt,
      completedAt: instance.completedAt || undefined,
      initiatedBy: instance.initiatedBy,
      steps: instance.steps as WorkflowStepInstance[],
    };
  }

  /**
   * Notify assignees
   */
  private async notifyAssignees(
    instanceId: string,
    stepNumber: number,
    organizationId: string
  ): Promise<void> {
    // TODO: Implement notification system
    console.log(`Notifying assignees for workflow ${instanceId}, step ${stepNumber}`);
  }

  /**
   * Schedule deadline reminder
   */
  private async scheduleDeadlineReminder(
    instanceId: string,
    stepNumber: number,
    dueDate: Date
  ): Promise<void> {
    // Schedule reminder 24 hours before deadline
    const reminderTime = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);

    if (reminderTime > new Date()) {
      // TODO: Schedule with BullMQ
      console.log(`Scheduling deadline reminder for ${instanceId}, step ${stepNumber}`);
    }
  }
}

export const documentWorkflowEngine = new DocumentWorkflowEngine();
