/**
 * Document Checker Service
 *
 * Automatically detects missing pre-arrival documents for vessels approaching ports.
 * Calculates deadlines, tracks status, and generates document checklists.
 *
 * Core Features:
 * - Document requirement matrix per port
 * - Automatic deadline calculation (24h, 48h, 72h before ETA)
 * - Status tracking (NOT_STARTED, IN_PROGRESS, SUBMITTED, APPROVED, REJECTED, OVERDUE)
 * - Priority scoring (CRITICAL, IMPORTANT, ROUTINE)
 * - Compliance score calculation (0-100)
 */

import { PrismaClient } from '@prisma/client';

/**
 * Standard maritime pre-arrival documents
 * Based on IMO FAL Convention and common port requirements
 */
export const STANDARD_DOCUMENTS = {
  // FAL Forms (IMO Convention)
  FAL1: {
    name: 'FAL Form 1 - General Declaration',
    description: 'General information about the vessel, voyage, and cargo',
    mandatory: true,
    priority: 'CRITICAL' as const,
    defaultDeadline: 24 // hours before ETA
  },
  FAL2: {
    name: 'FAL Form 2 - Cargo Declaration',
    description: 'Details of cargo on board',
    mandatory: true,
    priority: 'CRITICAL' as const,
    defaultDeadline: 24
  },
  FAL3: {
    name: 'FAL Form 3 - Ship\'s Stores Declaration',
    description: 'Declaration of ship\'s stores',
    mandatory: true,
    priority: 'IMPORTANT' as const,
    defaultDeadline: 24
  },
  FAL4: {
    name: 'FAL Form 4 - Crew\'s Effects Declaration',
    description: 'Declaration of crew personal effects',
    mandatory: true,
    priority: 'IMPORTANT' as const,
    defaultDeadline: 24
  },
  FAL5: {
    name: 'FAL Form 5 - Crew List',
    description: 'Complete list of crew members',
    mandatory: true,
    priority: 'CRITICAL' as const,
    defaultDeadline: 24
  },
  FAL6: {
    name: 'FAL Form 6 - Passenger List',
    description: 'List of passengers (if applicable)',
    mandatory: false,
    priority: 'IMPORTANT' as const,
    defaultDeadline: 24
  },
  FAL7: {
    name: 'FAL Form 7 - Dangerous Goods Manifest',
    description: 'Declaration of dangerous goods',
    mandatory: false, // Only if carrying dangerous goods
    priority: 'CRITICAL' as const,
    defaultDeadline: 72 // Usually requires more notice
  },

  // Security & Safety
  ISPS: {
    name: 'ISPS Ship Security Declaration',
    description: 'International Ship and Port Facility Security declaration',
    mandatory: true,
    priority: 'CRITICAL' as const,
    defaultDeadline: 24
  },
  HEALTH_DECLARATION: {
    name: 'Maritime Declaration of Health',
    description: 'Health status of crew and passengers',
    mandatory: true,
    priority: 'CRITICAL' as const,
    defaultDeadline: 24
  },

  // Environmental
  BALLAST_WATER: {
    name: 'Ballast Water Management Declaration',
    description: 'Ballast water management record',
    mandatory: true,
    priority: 'CRITICAL' as const,
    defaultDeadline: 48
  },
  WASTE_DECLARATION: {
    name: 'Waste Declaration',
    description: 'Declaration of waste to be discharged',
    mandatory: true,
    priority: 'IMPORTANT' as const,
    defaultDeadline: 24
  },

  // Customs
  CUSTOMS_DECLARATION: {
    name: 'Customs Declaration',
    description: 'Customs declaration for cargo and supplies',
    mandatory: true,
    priority: 'CRITICAL' as const,
    defaultDeadline: 24
  },

  // Port-Specific
  PRE_ARRIVAL_NOTIFICATION: {
    name: 'Pre-Arrival Notification',
    description: 'Formal notification of intended arrival',
    mandatory: true,
    priority: 'CRITICAL' as const,
    defaultDeadline: 48
  },
  PILOT_REQUEST: {
    name: 'Pilot Booking Request',
    description: 'Request for pilot services',
    mandatory: true,
    priority: 'CRITICAL' as const,
    defaultDeadline: 24
  },
  BERTH_REQUEST: {
    name: 'Berth Booking Request',
    description: 'Request for berth allocation',
    mandatory: true,
    priority: 'CRITICAL' as const,
    defaultDeadline: 48
  }
};

export interface DocumentCheckResult {
  arrivalId: string;
  documentsRequired: number;
  documentsMissing: number;
  documentsSubmitted: number;
  documentsApproved: number;
  complianceScore: number;
  criticalDocsMissing: string[];
  nextDeadline: Date | null;
  documentStatuses: any[];
}

export class DocumentCheckerService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate document requirements for a new arrival
   * Creates DocumentStatus records for all required documents
   */
  async generateDocumentRequirements(arrivalId: string): Promise<DocumentCheckResult> {
    const arrival = await this.prisma.vesselArrival.findUnique({
      where: { id: arrivalId },
      include: {
        vessel: true,
        port: true
      }
    });

    if (!arrival) {
      throw new Error(`Arrival ${arrivalId} not found`);
    }

    console.log(`[DocumentChecker] Generating requirements for ${arrival.vessel.name} → ${arrival.port.name}`);

    // Get port-specific document requirements
    const portRequirements = await this.getPortDocumentRequirements(arrival.port.id);

    // If no port-specific requirements, use standard set
    const requirements = portRequirements.length > 0
      ? portRequirements
      : this.getStandardRequirements();

    // Create DocumentStatus records for each required document
    const documentStatuses = [];

    for (const req of requirements) {
      const deadline = this.calculateDeadline(arrival.etaMostLikely, req.deadlineHours);
      const hoursRemaining = this.calculateHoursRemaining(deadline);

      // Check if document already exists
      const existing = await this.prisma.documentStatus.findUnique({
        where: {
          arrivalId_documentType: {
            arrivalId,
            documentType: req.type
          }
        }
      });

      if (!existing) {
        const docStatus = await this.prisma.documentStatus.create({
          data: {
            arrivalId,
            documentType: req.type,
            required: req.required,
            mandatory: req.mandatory,
            priority: req.priority,
            deadline,
            hoursRemaining,
            status: 'NOT_STARTED'
          }
        });

        documentStatuses.push(docStatus);
      } else {
        documentStatuses.push(existing);
      }
    }

    // Calculate compliance metrics
    const result = await this.calculateComplianceMetrics(arrivalId);

    // Update ArrivalIntelligence with document metrics
    await this.updateArrivalIntelligence(arrivalId, result);

    // Log event
    await this.prisma.arrivalTimelineEvent.create({
      data: {
        arrivalId,
        eventType: 'INTELLIGENCE_GENERATED',
        actor: 'SYSTEM',
        action: `Document requirements generated: ${result.documentsRequired} documents required`,
        impact: 'IMPORTANT',
        metadata: {
          documentsRequired: result.documentsRequired,
          criticalDocsMissing: result.criticalDocsMissing
        }
      }
    });

    console.log(`[DocumentChecker] Generated ${documentStatuses.length} document requirements`);
    return result;
  }

  /**
   * Get port-specific document requirements from database
   */
  private async getPortDocumentRequirements(portId: string) {
    const requirements = await this.prisma.portDocumentRequirement.findMany({
      where: { portId }
    });

    return requirements.map(req => ({
      type: req.documentType,
      required: req.required || true,
      mandatory: req.mandatory,
      priority: req.priority,
      deadlineHours: req.deadlineHours
    }));
  }

  /**
   * Get standard document requirements (used when port-specific not available)
   */
  private getStandardRequirements() {
    return Object.entries(STANDARD_DOCUMENTS).map(([type, doc]) => ({
      type,
      required: true,
      mandatory: doc.mandatory,
      priority: doc.priority,
      deadlineHours: doc.defaultDeadline
    }));
  }

  /**
   * Calculate compliance metrics for an arrival
   */
  async calculateComplianceMetrics(arrivalId: string): Promise<DocumentCheckResult> {
    const documents = await this.prisma.documentStatus.findMany({
      where: { arrivalId },
      orderBy: { deadline: 'asc' }
    });

    const documentsRequired = documents.length;
    const documentsMissing = documents.filter(
      d => d.status === 'NOT_STARTED' || d.status === 'IN_PROGRESS'
    ).length;
    const documentsSubmitted = documents.filter(
      d => d.status === 'SUBMITTED' || d.status === 'APPROVED'
    ).length;
    const documentsApproved = documents.filter(
      d => d.status === 'APPROVED'
    ).length;

    // Calculate compliance score (0-100)
    const complianceScore = documentsRequired > 0
      ? Math.round((documentsApproved / documentsRequired) * 100)
      : 100;

    // Find critical documents that are missing
    const criticalDocsMissing = documents
      .filter(d => d.priority === 'CRITICAL' && d.status === 'NOT_STARTED')
      .map(d => d.documentType);

    // Find next approaching deadline
    const nextDeadline = documents.find(
      d => d.status === 'NOT_STARTED' || d.status === 'IN_PROGRESS'
    )?.deadline || null;

    return {
      arrivalId,
      documentsRequired,
      documentsMissing,
      documentsSubmitted,
      documentsApproved,
      complianceScore,
      criticalDocsMissing,
      nextDeadline,
      documentStatuses: documents
    };
  }

  /**
   * Update ArrivalIntelligence with document metrics
   */
  private async updateArrivalIntelligence(
    arrivalId: string,
    metrics: DocumentCheckResult
  ): Promise<void> {
    // Check if intelligence record exists
    const existing = await this.prisma.arrivalIntelligence.findUnique({
      where: { arrivalId }
    });

    if (existing) {
      // Update existing
      await this.prisma.arrivalIntelligence.update({
        where: { arrivalId },
        data: {
          documentsRequired: metrics.documentsRequired,
          documentsMissing: metrics.documentsMissing,
          documentsSubmitted: metrics.documentsSubmitted,
          documentsApproved: metrics.documentsApproved,
          complianceScore: metrics.complianceScore,
          criticalDocsMissing: metrics.criticalDocsMissing,
          nextDocumentDeadline: metrics.nextDeadline
        }
      });
    } else {
      // Create new
      await this.prisma.arrivalIntelligence.create({
        data: {
          arrivalId,
          documentsRequired: metrics.documentsRequired,
          documentsMissing: metrics.documentsMissing,
          documentsSubmitted: metrics.documentsSubmitted,
          documentsApproved: metrics.documentsApproved,
          complianceScore: metrics.complianceScore,
          criticalDocsMissing: metrics.criticalDocsMissing,
          nextDocumentDeadline: metrics.nextDeadline,
          // Initialize other fields with defaults
          congestionStatus: 'GREEN',
          portReadinessScore: 'green'
        }
      });
    }
  }

  /**
   * Calculate deadline based on ETA and hours before
   */
  private calculateDeadline(eta: Date, hoursBefore: number): Date {
    const deadline = new Date(eta);
    deadline.setHours(deadline.getHours() - hoursBefore);
    return deadline;
  }

  /**
   * Calculate hours remaining until deadline
   */
  private calculateHoursRemaining(deadline: Date): number {
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    return diffMs / (1000 * 60 * 60);
  }

  /**
   * Check for overdue documents and update statuses
   */
  async checkOverdueDocuments(arrivalId: string): Promise<void> {
    const documents = await this.prisma.documentStatus.findMany({
      where: {
        arrivalId,
        status: {
          in: ['NOT_STARTED', 'IN_PROGRESS']
        }
      }
    });

    const now = new Date();

    for (const doc of documents) {
      if (doc.deadline < now) {
        // Mark as overdue
        await this.prisma.documentStatus.update({
          where: { id: doc.id },
          data: {
            status: 'OVERDUE',
            hoursRemaining: this.calculateHoursRemaining(doc.deadline)
          }
        });

        // Log overdue event
        await this.prisma.arrivalTimelineEvent.create({
          data: {
            arrivalId,
            eventType: 'DOCUMENT_OVERDUE',
            actor: 'SYSTEM',
            action: `Document ${doc.documentType} is now overdue`,
            impact: doc.priority === 'CRITICAL' ? 'CRITICAL' : 'IMPORTANT',
            metadata: {
              documentType: doc.documentType,
              deadline: doc.deadline,
              hoursOverdue: Math.abs(this.calculateHoursRemaining(doc.deadline))
            }
          }
        });

        console.warn(`[DocumentChecker] Document ${doc.documentType} is overdue for arrival ${arrivalId}`);
      }
    }
  }

  /**
   * Mark document as submitted
   */
  async submitDocument(
    arrivalId: string,
    documentType: string,
    submittedBy: string,
    fileUrl?: string,
    fileName?: string
  ): Promise<void> {
    const docStatus = await this.prisma.documentStatus.update({
      where: {
        arrivalId_documentType: {
          arrivalId,
          documentType
        }
      },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedBy,
        fileUrl,
        fileName
      }
    });

    // Log submission event
    await this.prisma.arrivalTimelineEvent.create({
      data: {
        arrivalId,
        eventType: 'DOCUMENT_SUBMITTED',
        actor: 'MASTER', // Assuming master submitted
        action: `Document ${documentType} submitted`,
        impact: 'INFO',
        metadata: {
          documentType,
          fileName,
          submittedBy
        }
      }
    });

    // Recalculate compliance metrics
    await this.calculateComplianceMetrics(arrivalId);

    console.log(`[DocumentChecker] Document ${documentType} submitted for arrival ${arrivalId}`);
  }

  /**
   * Approve document
   */
  async approveDocument(
    arrivalId: string,
    documentType: string,
    approvedBy: string
  ): Promise<void> {
    await this.prisma.documentStatus.update({
      where: {
        arrivalId_documentType: {
          arrivalId,
          documentType
        }
      },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy
      }
    });

    // Log approval event
    await this.prisma.arrivalTimelineEvent.create({
      data: {
        arrivalId,
        eventType: 'DOCUMENT_APPROVED',
        actor: 'AGENT', // Assuming agent approved
        action: `Document ${documentType} approved`,
        impact: 'INFO',
        metadata: {
          documentType,
          approvedBy
        }
      }
    });

    // Recalculate compliance metrics
    const metrics = await this.calculateComplianceMetrics(arrivalId);
    await this.updateArrivalIntelligence(arrivalId, metrics);

    console.log(`[DocumentChecker] Document ${documentType} approved for arrival ${arrivalId}`);
  }

  /**
   * Get document checklist summary for display
   */
  async getDocumentChecklist(arrivalId: string) {
    const metrics = await this.calculateComplianceMetrics(arrivalId);
    const arrival = await this.prisma.vesselArrival.findUnique({
      where: { id: arrivalId },
      include: {
        vessel: true,
        port: true
      }
    });

    return {
      vessel: arrival?.vessel.name,
      port: arrival?.port.name,
      eta: arrival?.etaMostLikely,
      complianceScore: metrics.complianceScore,
      summary: {
        total: metrics.documentsRequired,
        missing: metrics.documentsMissing,
        submitted: metrics.documentsSubmitted,
        approved: metrics.documentsApproved
      },
      criticalMissing: metrics.criticalDocsMissing,
      nextDeadline: metrics.nextDeadline,
      documents: metrics.documentStatuses.map(doc => ({
        type: doc.documentType,
        name: STANDARD_DOCUMENTS[doc.documentType as keyof typeof STANDARD_DOCUMENTS]?.name || doc.documentType,
        status: doc.status,
        priority: doc.priority,
        deadline: doc.deadline,
        hoursRemaining: this.calculateHoursRemaining(doc.deadline),
        isOverdue: doc.deadline < new Date(),
        submittedAt: doc.submittedAt,
        approvedAt: doc.approvedAt
      }))
    };
  }
}
