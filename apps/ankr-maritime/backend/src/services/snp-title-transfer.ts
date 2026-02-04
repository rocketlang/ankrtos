/**
 * SNP Title Transfer Workflow Service
 * Manages the legal title transfer process for vessel ownership
 *
 * @module services/snp-title-transfer
 */

import { prisma } from '../schema/context.js';

export interface TitleTransferStep {
  stepNumber: number;
  stepName: string;
  description: string;
  responsible: 'seller' | 'buyer' | 'registry' | 'class' | 'third_party';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dueDate?: Date;
  completedDate?: Date;
  documents: TitleDocument[];
  dependencies?: number[]; // Step numbers this depends on
  notes?: string;
}

export interface TitleDocument {
  documentType:
    | 'bill_of_sale'
    | 'deletion_certificate'
    | 'mortgage_discharge'
    | 'class_transfer'
    | 'registry_certificate'
    | 'protocol_of_delivery'
    | 'power_of_attorney'
    | 'corporate_resolution';
  documentName: string;
  required: boolean;
  status: 'not_started' | 'in_progress' | 'ready' | 'submitted' | 'approved';
  documentUrl?: string;
  issuedBy?: string;
  issuedDate?: Date;
  expiryDate?: Date;
}

export interface TitleTransferWorkflow {
  transactionId: string;
  vesselId: string;
  vesselName: string;
  imo: string;

  // Parties
  currentOwner: string;
  newOwner: string;

  // Registry
  currentFlag: string;
  newFlag?: string;
  currentRegistry: string;
  newRegistry?: string;

  // Status
  overallStatus:
    | 'not_started'
    | 'preparation'
    | 'documents_submitted'
    | 'pending_approval'
    | 'completed';
  startDate: Date;
  targetCompletionDate: Date;
  actualCompletionDate?: Date;

  // Steps
  steps: TitleTransferStep[];

  // Critical dates
  milestones: {
    moaSigned?: Date;
    depositPaid?: Date;
    deletionCertificateIssued?: Date;
    billOfSaleSigned?: Date;
    titleTransferRegistered?: Date;
    deliveryCompleted?: Date;
  };
}

class SNPTitleTransferService {
  /**
   * Initialize title transfer workflow
   */
  async initializeTitleTransfer(
    transactionId: string,
    vesselId: string,
    currentOwner: string,
    newOwner: string,
    currentFlag: string,
    newFlag: string,
    organizationId: string
  ): Promise<TitleTransferWorkflow> {
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
    });

    if (!vessel) {
      throw new Error('Vessel not found');
    }

    const workflow: TitleTransferWorkflow = {
      transactionId,
      vesselId,
      vesselName: vessel.name,
      imo: vessel.imo,
      currentOwner,
      newOwner,
      currentFlag,
      newFlag,
      currentRegistry: `${currentFlag} Maritime Registry`,
      newRegistry: `${newFlag} Maritime Registry`,
      overallStatus: 'not_started',
      startDate: new Date(),
      targetCompletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      steps: this.defineStandardSteps(currentFlag, newFlag),
      milestones: {},
    };

    return workflow;
  }

  /**
   * Define standard title transfer steps
   */
  private defineStandardSteps(
    currentFlag: string,
    newFlag: string
  ): TitleTransferStep[] {
    const isFlagChange = currentFlag !== newFlag;

    return [
      {
        stepNumber: 1,
        stepName: 'MOA Execution',
        description: 'Both parties sign the Memorandum of Agreement',
        responsible: 'seller',
        status: 'pending',
        documents: [
          {
            documentType: 'power_of_attorney',
            documentName: 'Power of Attorney (if signing by proxy)',
            required: false,
            status: 'not_started',
          },
        ],
      },
      {
        stepNumber: 2,
        stepName: 'Deposit Payment',
        description: 'Buyer pays 10% deposit to seller',
        responsible: 'buyer',
        status: 'pending',
        dependencies: [1],
        documents: [],
      },
      {
        stepNumber: 3,
        stepName: 'Mortgage Discharge',
        description: 'Seller discharges all mortgages and encumbrances',
        responsible: 'seller',
        status: 'pending',
        documents: [
          {
            documentType: 'mortgage_discharge',
            documentName: 'Mortgage Discharge Certificate',
            required: true,
            status: 'not_started',
          },
        ],
      },
      {
        stepNumber: 4,
        stepName: 'Registry Deletion Request',
        description: `Apply for deletion from ${currentFlag} registry`,
        responsible: 'seller',
        status: 'pending',
        dependencies: [3],
        documents: [
          {
            documentType: 'deletion_certificate',
            documentName: 'Registry Deletion Certificate',
            required: true,
            status: 'not_started',
          },
        ],
      },
      {
        stepNumber: 5,
        stepName: 'Class Transfer Notification',
        description: 'Notify classification society of ownership change',
        responsible: 'buyer',
        status: 'pending',
        documents: [
          {
            documentType: 'class_transfer',
            documentName: 'Class Transfer Confirmation',
            required: true,
            status: 'not_started',
          },
        ],
      },
      {
        stepNumber: 6,
        stepName: 'Bill of Sale Preparation',
        description: 'Prepare and review Bill of Sale document',
        responsible: 'seller',
        status: 'pending',
        dependencies: [4],
        documents: [
          {
            documentType: 'bill_of_sale',
            documentName: 'Bill of Sale',
            required: true,
            status: 'not_started',
          },
        ],
      },
      {
        stepNumber: 7,
        stepName: 'Final Payment',
        description: 'Buyer pays balance of purchase price',
        responsible: 'buyer',
        status: 'pending',
        dependencies: [6],
        documents: [],
      },
      {
        stepNumber: 8,
        stepName: 'Bill of Sale Execution',
        description: 'Both parties sign Bill of Sale at delivery',
        responsible: 'seller',
        status: 'pending',
        dependencies: [7],
        documents: [
          {
            documentType: 'bill_of_sale',
            documentName: 'Executed Bill of Sale',
            required: true,
            status: 'not_started',
          },
          {
            documentType: 'protocol_of_delivery',
            documentName: 'Protocol of Delivery and Acceptance',
            required: true,
            status: 'not_started',
          },
        ],
      },
      {
        stepNumber: 9,
        stepName: 'Registry Application',
        description: `Register vessel under ${newFlag} flag`,
        responsible: 'buyer',
        status: 'pending',
        dependencies: [8],
        documents: [
          {
            documentType: 'registry_certificate',
            documentName: `${newFlag} Registry Certificate`,
            required: true,
            status: 'not_started',
          },
          {
            documentType: 'corporate_resolution',
            documentName: 'Corporate Resolution (for company ownership)',
            required: false,
            status: 'not_started',
          },
        ],
      },
      {
        stepNumber: 10,
        stepName: 'Title Transfer Completion',
        description: 'Confirm new registry certificate issued and title transferred',
        responsible: 'registry',
        status: 'pending',
        dependencies: [9],
        documents: [],
      },
    ];
  }

  /**
   * Update step status
   */
  async updateStepStatus(
    transactionId: string,
    stepNumber: number,
    status: TitleTransferStep['status'],
    notes?: string,
    completedDate?: Date,
    organizationId?: string
  ): Promise<TitleTransferStep> {
    // In production, would update database
    // const workflow = await this.getWorkflow(transactionId);
    // const step = workflow.steps.find(s => s.stepNumber === stepNumber);

    const updatedStep: TitleTransferStep = {
      stepNumber,
      stepName: 'Updated Step',
      description: 'Updated description',
      responsible: 'seller',
      status,
      completedDate: status === 'completed' ? completedDate || new Date() : undefined,
      notes,
      documents: [],
    };

    // Check if this unblocks any dependent steps
    // await this.checkDependencies(workflow, stepNumber);

    // Create alert if step is blocked
    if (status === 'blocked' && organizationId) {
      await prisma.alert.create({
        data: {
          type: 'title_transfer_blocked',
          severity: 'high',
          title: `Title Transfer Step ${stepNumber} Blocked`,
          message: notes || 'A title transfer step has been blocked',
          metadata: { transactionId, stepNumber },
          organizationId,
        },
      });
    }

    return updatedStep;
  }

  /**
   * Upload document for step
   */
  async uploadStepDocument(
    transactionId: string,
    stepNumber: number,
    documentType: string,
    documentUrl: string,
    issuedBy?: string,
    issuedDate?: Date,
    organizationId?: string
  ): Promise<TitleDocument> {
    // Update document status
    const document: TitleDocument = {
      documentType: documentType as any,
      documentName: documentType,
      required: true,
      status: 'ready',
      documentUrl,
      issuedBy,
      issuedDate,
    };

    // Create activity log
    // await this.logActivity(transactionId, `Document uploaded: ${documentType}`);

    return document;
  }

  /**
   * Get workflow progress
   */
  async getWorkflowProgress(
    transactionId: string,
    organizationId: string
  ): Promise<{
    completedSteps: number;
    totalSteps: number;
    percentComplete: number;
    nextActions: string[];
    blockedSteps: number;
  }> {
    // Get workflow
    // const workflow = await this.getWorkflow(transactionId);

    // Mock for now
    const totalSteps = 10;
    const completedSteps = 3;
    const blockedSteps = 0;

    const nextActions = [
      'Upload Mortgage Discharge Certificate',
      'Apply for Registry Deletion',
      'Notify Classification Society',
    ];

    return {
      completedSteps,
      totalSteps,
      percentComplete: (completedSteps / totalSteps) * 100,
      nextActions,
      blockedSteps,
    };
  }

  /**
   * Generate title transfer checklist
   */
  generateChecklist(currentFlag: string, newFlag: string): string {
    return `
# Vessel Title Transfer Checklist

## Pre-Delivery Phase
- [ ] MOA signed by both parties
- [ ] Deposit (10%) received
- [ ] All mortgages and liens identified
- [ ] Discharge of mortgages arranged
- [ ] Apply for deletion from ${currentFlag} registry
- [ ] Notify P&I club of ownership change
- [ ] Notify class society of ownership change
- [ ] Prepare Bill of Sale
- [ ] Arrange notarization (if required)

## At Delivery
- [ ] Final payment confirmed received
- [ ] Physical delivery at agreed location
- [ ] Sign Bill of Sale
- [ ] Sign Protocol of Delivery
- [ ] Hand over ship's documents:
  - [ ] Original registry certificate
  - [ ] Class certificates
  - [ ] Survey reports
  - [ ] Ship's plans
  - [ ] Machinery manuals
  - [ ] Stability booklet
  - [ ] ISPS/ISM certificates
- [ ] Hand over ship's seals, flags
- [ ] Hand over stores and bunker inventory
- [ ] Take delivery photos/video

## Post-Delivery Phase
- [ ] Deletion certificate from ${currentFlag} registry
- [ ] Apply for ${newFlag} registry
- [ ] Obtain provisional registry certificate
- [ ] Update class society records
- [ ] Update P&I insurance
- [ ] Update H&M insurance
- [ ] Change vessel name (if applicable)
- [ ] Update AIS transponder
- [ ] Notify port state authorities
- [ ] Update crew contracts
- [ ] Receive final registry certificate

## Documentation Archive
- [ ] Executed MOA
- [ ] Bill of Sale (original)
- [ ] Deletion certificate
- [ ] New registry certificate
- [ ] Protocol of delivery
- [ ] Payment receipts
- [ ] All correspondence
    `.trim();
  }

  /**
   * Estimate title transfer duration
   */
  estimateTransferDuration(
    currentFlag: string,
    newFlag: string,
    hasEncumbrances: boolean
  ): { estimatedDays: number; breakdown: any } {
    const baseDuration = {
      'mortgage_discharge': hasEncumbrances ? 14 : 0,
      'deletion_certificate': this.getRegistryProcessingTime(currentFlag),
      'document_preparation': 7,
      'new_registry': this.getRegistryProcessingTime(newFlag),
      'buffer': 7,
    };

    const totalDays = Object.values(baseDuration).reduce(
      (sum, days) => sum + days,
      0
    );

    return {
      estimatedDays: totalDays,
      breakdown: baseDuration,
    };
  }

  private getRegistryProcessingTime(flag: string): number {
    const registryTimes: Record<string, number> = {
      'Marshall Islands': 7,
      'Liberia': 10,
      'Panama': 14,
      'Singapore': 7,
      'Hong Kong': 10,
      'Malta': 14,
      'Bahamas': 7,
      'Cyprus': 14,
      'Isle of Man': 10,
    };

    return registryTimes[flag] || 14; // Default 14 days
  }
}

export const snpTitleTransferService = new SNPTitleTransferService();
