// fixture-approval-workflow.ts — Fixture Approval Workflow & Charter Party Generation

import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

interface ApprovalStep {
  id: string;
  role: string; // commercial_manager, ops_manager, finance_manager, ceo
  userId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approvedAt?: Date;
  approvedBy?: string;
  comments?: string;
  order: number;
}

interface FixtureApprovalWorkflow {
  id: string;
  charterId: string;
  organizationId: string;
  initiatedBy: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
  currentStep: number;
  steps: ApprovalStep[];
  createdAt: Date;
  completedAt?: Date;
  finalApprover?: string;
  rejectionReason?: string;
}

interface CharterPartyTemplate {
  id: string;
  name: string;
  type: string; // GENCON, NYPE, BALTIME, BIMCO_BALTCON, custom
  version?: string;
  template: string; // Markdown or HTML template with placeholders
  clauses: string[]; // Array of clause IDs
  isDefault: boolean;
  organizationId: string;
}

interface CharterPartyData {
  // Parties
  ownerName: string;
  ownerAddress: string;
  chartererName: string;
  chartererAddress: string;
  brokerName?: string;

  // Vessel
  vesselName: string;
  vesselImo: string;
  vesselFlag: string;
  vesselDwt: number;
  vesselYearBuilt: number;
  vesselClass?: string;

  // Commercial
  freightRate?: number;
  hireRate?: number;
  currency: string;
  commissionAddress: number;
  commissionBrokerage: number;

  // Voyage (for voyage charter)
  loadPort?: string;
  dischargePort?: string;
  cargoType?: string;
  cargoQuantity?: number;
  laycanFrom?: Date;
  laycanTo?: Date;
  laytimeLoading?: string;
  laytimeDischarge?: string;
  demurrageRate?: number;
  despatchRate?: number;

  // Time Charter
  deliveryPort?: string;
  redeliveryPort?: string;
  charterPeriod?: string;

  // Legal
  arbitrationLocation?: string;
  governingLaw?: string;

  // Custom clauses
  additionalClauses?: Array<{ title: string; text: string }>;
}

export class FixtureApprovalWorkflowService {
  /**
   * Create approval workflow for a charter
   */
  async createWorkflow(
    charterId: string,
    organizationId: string,
    initiatedBy: string,
    customSteps?: Partial<ApprovalStep>[]
  ): Promise<string> {
    // Get organization approval configuration
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { tenantConfig: true },
    });

    const config = org?.tenantConfig as any;
    const approvalConfig = config?.approvalWorkflow || this.getDefaultApprovalSteps();

    // Create workflow steps
    const steps: ApprovalStep[] = customSteps?.length
      ? (customSteps as ApprovalStep[])
      : approvalConfig.map((step: any, index: number) => ({
          id: `step_${index + 1}`,
          role: step.role,
          userId: step.userId,
          status: 'pending',
          order: index + 1,
        }));

    const workflow: FixtureApprovalWorkflow = {
      id: `wf_${Date.now()}`,
      charterId,
      organizationId,
      initiatedBy,
      status: 'pending',
      currentStep: 0,
      steps,
      createdAt: new Date(),
    };

    // Store workflow in charter metadata
    await prisma.charter.update({
      where: { id: charterId },
      data: {
        approvalWorkflow: workflow as any,
        status: 'pending_approval',
      },
    });

    // Create notification for first approver
    await this.notifyNextApprover(workflow);

    // Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: initiatedBy,
        action: 'fixture_approval_initiated',
        entityType: 'charter',
        entityId: charterId,
        metadata: { workflowId: workflow.id, steps: steps.length },
      },
    });

    return workflow.id;
  }

  /**
   * Approve current step
   */
  async approveStep(
    workflowId: string,
    userId: string,
    comments?: string
  ): Promise<FixtureApprovalWorkflow> {
    const charter = await this.getCharterByWorkflowId(workflowId);
    if (!charter) throw new GraphQLError('Workflow not found');

    const workflow = charter.approvalWorkflow as FixtureApprovalWorkflow;

    if (workflow.status !== 'pending' && workflow.status !== 'in_progress') {
      throw new GraphQLError(`Cannot approve - workflow is ${workflow.status}`);
    }

    const currentStep = workflow.steps[workflow.currentStep];
    if (!currentStep) throw new GraphQLError('Invalid workflow step');

    // Verify user has permission to approve this step
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new GraphQLError('User not found');

    if (currentStep.userId && currentStep.userId !== userId) {
      throw new GraphQLError('You are not authorized to approve this step');
    }

    if (currentStep.role && user.role !== currentStep.role) {
      // Check if user has a higher authority role
      if (!this.hasHigherAuthority(user.role, currentStep.role)) {
        throw new GraphQLError(`Insufficient permissions. Required role: ${currentStep.role}`);
      }
    }

    // Approve current step
    currentStep.status = 'approved';
    currentStep.approvedAt = new Date();
    currentStep.approvedBy = userId;
    currentStep.comments = comments;

    // Move to next step or complete workflow
    workflow.currentStep++;
    workflow.status = 'in_progress';

    if (workflow.currentStep >= workflow.steps.length) {
      // All steps approved - complete workflow
      workflow.status = 'approved';
      workflow.completedAt = new Date();
      workflow.finalApprover = userId;

      await prisma.charter.update({
        where: { id: charter.id },
        data: {
          approvalWorkflow: workflow as any,
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: userId,
        },
      });

      // Create alert for initiator
      await prisma.alert.create({
        data: {
          organizationId: workflow.organizationId,
          userId: workflow.initiatedBy,
          type: 'fixture_approved',
          severity: 'low',
          title: 'Fixture Approved',
          message: `Charter ${charter.vesselName || charter.id} has been fully approved`,
          metadata: { charterId: charter.id, workflowId: workflow.id },
          status: 'active',
        },
      });
    } else {
      // Update workflow and notify next approver
      await prisma.charter.update({
        where: { id: charter.id },
        data: { approvalWorkflow: workflow as any },
      });

      await this.notifyNextApprover(workflow);
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId: workflow.organizationId,
        userId,
        action: 'fixture_approval_step_approved',
        entityType: 'charter',
        entityId: charter.id,
        metadata: {
          workflowId: workflow.id,
          step: currentStep.order,
          role: currentStep.role,
        },
      },
    });

    return workflow;
  }

  /**
   * Reject fixture
   */
  async rejectFixture(
    workflowId: string,
    userId: string,
    reason: string
  ): Promise<FixtureApprovalWorkflow> {
    const charter = await this.getCharterByWorkflowId(workflowId);
    if (!charter) throw new GraphQLError('Workflow not found');

    const workflow = charter.approvalWorkflow as FixtureApprovalWorkflow;

    if (workflow.status === 'approved' || workflow.status === 'rejected') {
      throw new GraphQLError(`Cannot reject - workflow is ${workflow.status}`);
    }

    const currentStep = workflow.steps[workflow.currentStep];
    currentStep.status = 'rejected';
    currentStep.approvedAt = new Date();
    currentStep.approvedBy = userId;
    currentStep.comments = reason;

    workflow.status = 'rejected';
    workflow.completedAt = new Date();
    workflow.rejectionReason = reason;

    await prisma.charter.update({
      where: { id: charter.id },
      data: {
        approvalWorkflow: workflow as any,
        status: 'rejected',
      },
    });

    // Notify initiator of rejection
    await prisma.alert.create({
      data: {
        organizationId: workflow.organizationId,
        userId: workflow.initiatedBy,
        type: 'fixture_rejected',
        severity: 'medium',
        title: 'Fixture Rejected',
        message: `Charter ${charter.vesselName || charter.id} was rejected: ${reason}`,
        metadata: { charterId: charter.id, workflowId: workflow.id, reason },
        status: 'active',
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId: workflow.organizationId,
        userId,
        action: 'fixture_rejected',
        entityType: 'charter',
        entityId: charter.id,
        metadata: { workflowId: workflow.id, reason },
      },
    });

    return workflow;
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId: string): Promise<FixtureApprovalWorkflow | null> {
    const charter = await this.getCharterByWorkflowId(workflowId);
    if (!charter) return null;

    return charter.approvalWorkflow as FixtureApprovalWorkflow;
  }

  /**
   * Get pending approvals for user
   */
  async getPendingApprovals(userId: string, organizationId: string): Promise<any[]> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    const charters = await prisma.charter.findMany({
      where: {
        organizationId,
        status: { in: ['pending_approval', 'in_progress'] },
      },
      include: {
        vessel: true,
        company: true,
      },
    });

    const pendingForUser = charters.filter((charter) => {
      const workflow = charter.approvalWorkflow as FixtureApprovalWorkflow;
      if (!workflow || workflow.status === 'approved' || workflow.status === 'rejected') {
        return false;
      }

      const currentStep = workflow.steps[workflow.currentStep];
      if (!currentStep) return false;

      // Check if user can approve this step
      return (
        (currentStep.userId && currentStep.userId === userId) ||
        (currentStep.role && user.role === currentStep.role) ||
        this.hasHigherAuthority(user.role, currentStep.role)
      );
    });

    return pendingForUser.map((charter) => ({
      charterId: charter.id,
      vesselName: charter.vesselName || charter.vessel?.name,
      chartererName: charter.chartererName || charter.company?.name,
      charterType: charter.charterType,
      workflow: charter.approvalWorkflow,
      createdAt: charter.createdAt,
    }));
  }

  /**
   * Generate Charter Party document from approved fixture
   */
  async generateCharterParty(
    charterId: string,
    templateId?: string
  ): Promise<{ documentId: string; content: string }> {
    const charter = await prisma.charter.findUnique({
      where: { id: charterId },
      include: { vessel: true, company: true, voyage: true },
    });

    if (!charter) throw new GraphQLError('Charter not found');

    if (charter.status !== 'approved') {
      throw new GraphQLError('Charter must be approved before generating C/P');
    }

    // Get template
    let template: CharterPartyTemplate;
    if (templateId) {
      const customTemplate = await prisma.charterPartyTemplate?.findUnique({
        where: { id: templateId },
      });
      if (!customTemplate) throw new GraphQLError('Template not found');
      template = customTemplate as any;
    } else {
      // Get default template for charter type
      template = this.getDefaultTemplate(charter.charterType || 'time_charter');
    }

    // Build charter party data
    const cpData: CharterPartyData = {
      ownerName: charter.ownerName || '',
      ownerAddress: charter.ownerAddress || '',
      chartererName: charter.chartererName || charter.company?.name || '',
      chartererAddress: charter.chartererAddress || '',
      brokerName: charter.brokerName || '',

      vesselName: charter.vesselName || charter.vessel?.name || '',
      vesselImo: charter.vessel?.imo || '',
      vesselFlag: charter.vessel?.flag || '',
      vesselDwt: charter.vessel?.dwt || 0,
      vesselYearBuilt: charter.vessel?.yearBuilt || 0,

      freightRate: charter.freightRate,
      hireRate: charter.hireRate,
      currency: charter.currency || 'USD',
      commissionAddress: charter.commissionAddress || 1.25,
      commissionBrokerage: charter.commissionBrokerage || 1.25,

      loadPort: charter.loadPort,
      dischargePort: charter.dischargePort,
      cargoType: charter.cargoType,
      cargoQuantity: charter.cargoQuantity,
      laycanFrom: charter.laycanFrom,
      laycanTo: charter.laycanTo,

      arbitrationLocation: 'London',
      governingLaw: 'English Law',
    };

    // Generate document content
    const content = this.fillTemplate(template.template, cpData);

    // Create document record
    const document = await prisma.document.create({
      data: {
        title: `Charter Party - ${cpData.vesselName} - ${new Date().toISOString().split('T')[0]}`,
        type: 'charter_party',
        fileName: `CP_${cpData.vesselName.replace(/\s/g, '_')}_${Date.now()}.pdf`,
        fileUrl: '', // Will be generated by document service
        content,
        organizationId: charter.organizationId,
        uploadedBy: 'system',
        metadata: {
          charterId,
          templateId: template.id,
          charterType: charter.charterType,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    // Link document to charter
    await prisma.charter.update({
      where: { id: charterId },
      data: {
        charterPartyDocumentId: document.id,
        charterPartyGeneratedAt: new Date(),
      },
    });

    return {
      documentId: document.id,
      content,
    };
  }

  // ===== Private Helper Methods =====

  private async getCharterByWorkflowId(workflowId: string) {
    const charters = await prisma.charter.findMany({
      where: {
        approvalWorkflow: {
          path: ['id'],
          equals: workflowId,
        },
      },
    });

    return charters[0] || null;
  }

  private async notifyNextApprover(workflow: FixtureApprovalWorkflow): Promise<void> {
    const nextStep = workflow.steps[workflow.currentStep];
    if (!nextStep) return;

    // Find users with the required role
    const users = await prisma.user.findMany({
      where: {
        organizationId: workflow.organizationId,
        role: nextStep.role,
        isActive: true,
      },
    });

    for (const user of users) {
      await prisma.alert.create({
        data: {
          organizationId: workflow.organizationId,
          userId: user.id,
          type: 'approval_required',
          severity: 'medium',
          title: 'Fixture Approval Required',
          message: `A fixture requires your approval (Step ${nextStep.order}: ${nextStep.role})`,
          metadata: { workflowId: workflow.id, charterId: workflow.charterId },
          status: 'active',
        },
      });
    }
  }

  private hasHigherAuthority(userRole: string, requiredRole: string): boolean {
    const hierarchy = ['ceo', 'finance_manager', 'ops_manager', 'commercial_manager', 'user'];
    const userLevel = hierarchy.indexOf(userRole);
    const requiredLevel = hierarchy.indexOf(requiredRole);

    return userLevel !== -1 && requiredLevel !== -1 && userLevel < requiredLevel;
  }

  private getDefaultApprovalSteps(): Partial<ApprovalStep>[] {
    return [
      { id: 'step_1', role: 'commercial_manager', order: 1 },
      { id: 'step_2', role: 'ops_manager', order: 2 },
      { id: 'step_3', role: 'finance_manager', order: 3 },
    ];
  }

  private getDefaultTemplate(charterType: string): CharterPartyTemplate {
    const templates: Record<string, string> = {
      voyage_charter: `
# CHARTER PARTY (GENCON 2022)

**Date:** {{currentDate}}

## PARTIES

**Owners:** {{ownerName}}
**Address:** {{ownerAddress}}

**Charterers:** {{chartererName}}
**Address:** {{chartererAddress}}

**Broker:** {{brokerName}}

## VESSEL

**Name:** {{vesselName}}
**IMO:** {{vesselImo}}
**Flag:** {{vesselFlag}}
**DWT:** {{vesselDwt}} MT
**Built:** {{vesselYearBuilt}}
**Class:** {{vesselClass}}

## CARGO

**Description:** {{cargoType}}
**Quantity:** {{cargoQuantity}} MT (approx, 10% MOLOO)

## VOYAGE

**Load Port:** {{loadPort}}
**Discharge Port:** {{dischargePort}}

## LAYCAN

**From:** {{laycanFrom}}
**To:** {{laycanTo}}

## FREIGHT

**Rate:** USD {{freightRate}} per MT
**Commission:** {{commissionAddress}}% Address, {{commissionBrokerage}}% Brokerage

## LAYTIME

**Loading:** {{laytimeLoading}}
**Discharge:** {{laytimeDischarge}}

## DEMURRAGE/DESPATCH

**Demurrage:** USD {{demurrageRate}} per day
**Despatch:** USD {{despatchRate}} per day (50% demurrage rate)

## LAW & ARBITRATION

**Governing Law:** {{governingLaw}}
**Arbitration:** {{arbitrationLocation}} (LMAA Terms)

---

_Generated by Mari8X on {{currentDate}}_
`,
      time_charter: `
# TIME CHARTER PARTY (NYPE 2015)

**Date:** {{currentDate}}

## PARTIES

**Owners:** {{ownerName}}
**Charterers:** {{chartererName}}

## VESSEL

**Name:** {{vesselName}}
**IMO:** {{vesselImo}}
**DWT:** {{vesselDwt}} MT

## PERIOD

**Duration:** {{charterPeriod}}

## HIRE

**Rate:** USD {{hireRate}} per day
**Commission:** {{commissionAddress}}% + {{commissionBrokerage}}%

## DELIVERY/REDELIVERY

**Delivery:** {{deliveryPort}}
**Redelivery:** {{redeliveryPort}}

## LAW & ARBITRATION

**Governing Law:** {{governingLaw}}
**Arbitration:** {{arbitrationLocation}}

---

_Generated by Mari8X on {{currentDate}}_
`,
    };

    return {
      id: `default_${charterType}`,
      name: `Default ${charterType.replace('_', ' ').toUpperCase()}`,
      type: charterType === 'voyage_charter' ? 'GENCON' : 'NYPE',
      template: templates[charterType] || templates.voyage_charter,
      clauses: [],
      isDefault: true,
      organizationId: 'system',
    };
  }

  private fillTemplate(template: string, data: CharterPartyData): string {
    let filled = template;

    // Replace all placeholders
    filled = filled.replace(/{{currentDate}}/g, new Date().toISOString().split('T')[0]);
    filled = filled.replace(/{{ownerName}}/g, data.ownerName || '[OWNER NAME]');
    filled = filled.replace(/{{ownerAddress}}/g, data.ownerAddress || '[OWNER ADDRESS]');
    filled = filled.replace(/{{chartererName}}/g, data.chartererName || '[CHARTERER NAME]');
    filled = filled.replace(/{{chartererAddress}}/g, data.chartererAddress || '[CHARTERER ADDRESS]');
    filled = filled.replace(/{{brokerName}}/g, data.brokerName || '[BROKER NAME]');

    filled = filled.replace(/{{vesselName}}/g, data.vesselName || '[VESSEL NAME]');
    filled = filled.replace(/{{vesselImo}}/g, data.vesselImo || '[IMO]');
    filled = filled.replace(/{{vesselFlag}}/g, data.vesselFlag || '[FLAG]');
    filled = filled.replace(/{{vesselDwt}}/g, String(data.vesselDwt || 0));
    filled = filled.replace(/{{vesselYearBuilt}}/g, String(data.vesselYearBuilt || 0));
    filled = filled.replace(/{{vesselClass}}/g, data.vesselClass || 'N/A');

    filled = filled.replace(/{{cargoType}}/g, data.cargoType || '[CARGO TYPE]');
    filled = filled.replace(/{{cargoQuantity}}/g, String(data.cargoQuantity || 0));

    filled = filled.replace(/{{loadPort}}/g, data.loadPort || '[LOAD PORT]');
    filled = filled.replace(/{{dischargePort}}/g, data.dischargePort || '[DISCHARGE PORT]');

    filled = filled.replace(/{{laycanFrom}}/g, data.laycanFrom?.toISOString().split('T')[0] || '[LAYCAN FROM]');
    filled = filled.replace(/{{laycanTo}}/g, data.laycanTo?.toISOString().split('T')[0] || '[LAYCAN TO]');

    filled = filled.replace(/{{freightRate}}/g, String(data.freightRate || 0));
    filled = filled.replace(/{{hireRate}}/g, String(data.hireRate || 0));
    filled = filled.replace(/{{currency}}/g, data.currency);
    filled = filled.replace(/{{commissionAddress}}/g, String(data.commissionAddress));
    filled = filled.replace(/{{commissionBrokerage}}/g, String(data.commissionBrokerage));

    filled = filled.replace(/{{laytimeLoading}}/g, data.laytimeLoading || '72 hours WWDSHEX');
    filled = filled.replace(/{{laytimeDischarge}}/g, data.laytimeDischarge || '72 hours WWDSHEX');
    filled = filled.replace(/{{demurrageRate}}/g, String(data.demurrageRate || 0));
    filled = filled.replace(/{{despatchRate}}/g, String(data.despatchRate || 0));

    filled = filled.replace(/{{deliveryPort}}/g, data.deliveryPort || '[DELIVERY PORT]');
    filled = filled.replace(/{{redeliveryPort}}/g, data.redeliveryPort || '[REDELIVERY PORT]');
    filled = filled.replace(/{{charterPeriod}}/g, data.charterPeriod || '[PERIOD]');

    filled = filled.replace(/{{arbitrationLocation}}/g, data.arbitrationLocation || 'London');
    filled = filled.replace(/{{governingLaw}}/g, data.governingLaw || 'English Law');

    return filled;
  }
}

export const fixtureApprovalWorkflow = new FixtureApprovalWorkflowService();
