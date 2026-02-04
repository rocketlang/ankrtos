/**
 * SNP Inspection Scheduler Service
 * Manages vessel inspection scheduling for S&P transactions
 *
 * @module services/snp-inspection-scheduler
 */

import { prisma } from '../schema/context.js';

export interface InspectionRequest {
  transactionId: string;
  inspectionType:
    | 'pre_purchase'
    | 'condition_survey'
    | 'valuation_survey'
    | 'oil_major_vetting'
    | 'class_survey';
  preferredDates: Date[];
  port: string;
  country: string;
  surveyorCompany?: string;
  specialRequirements?: string[];
  estimatedDuration: number; // hours
  budget?: number;
}

export interface InspectionSchedule {
  id: string;
  transactionId: string;
  inspectionType: string;
  status:
    | 'requested'
    | 'surveyor_assigned'
    | 'scheduled'
    | 'in_progress'
    | 'completed'
    | 'cancelled';
  scheduledDate?: Date;
  port: string;
  surveyorCompany?: string;
  surveyorName?: string;
  surveyorContact?: string;
  estimatedCost?: number;
  actualCost?: number;
  reportUrl?: string;
  findings?: InspectionFinding[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InspectionFinding {
  category: 'critical' | 'major' | 'minor' | 'observation';
  description: string;
  location: string;
  estimatedRepairCost?: number;
  photos?: string[];
  recommendation: string;
}

export interface SurveyorAvailability {
  surveyorCompany: string;
  available: boolean;
  earliestDate: Date;
  estimatedCost: number;
  currency: string;
  responseTime: number; // hours
  rating: number; // 1-5
  previousJobs: number;
}

class SNPInspectionSchedulerService {
  /**
   * Recommended surveyor companies by region
   */
  private surveyorDatabase = {
    'Singapore': [
      {
        company: 'Lloyd\'s Register',
        rating: 4.8,
        typicalCost: 5000,
        responseTime: 24,
      },
      {
        company: 'Bureau Veritas',
        rating: 4.6,
        typicalCost: 4500,
        responseTime: 48,
      },
      {
        company: 'DNV',
        rating: 4.7,
        typicalCost: 5200,
        responseTime: 36,
      },
    ],
    'Rotterdam': [
      {
        company: 'Lloyd\'s Register',
        rating: 4.7,
        typicalCost: 4000,
        responseTime: 24,
      },
      {
        company: 'ABS',
        rating: 4.5,
        typicalCost: 3800,
        responseTime: 48,
      },
    ],
    'Dubai': [
      {
        company: 'Bureau Veritas',
        rating: 4.6,
        typicalCost: 4200,
        responseTime: 36,
      },
      {
        company: 'ClassNK',
        rating: 4.4,
        typicalCost: 3900,
        responseTime: 48,
      },
    ],
    'Houston': [
      {
        company: 'ABS',
        rating: 4.8,
        typicalCost: 4500,
        responseTime: 24,
      },
      {
        company: 'Lloyd\'s Register',
        rating: 4.6,
        typicalCost: 4800,
        responseTime: 36,
      },
    ],
  };

  /**
   * Create inspection request
   */
  async createInspectionRequest(
    request: InspectionRequest,
    organizationId: string
  ): Promise<InspectionSchedule> {
    // Validate transaction
    const transaction = await prisma.sNPTransaction.findUnique({
      where: { id: request.transactionId },
    });

    if (!transaction) {
      throw new Error('S&P transaction not found');
    }

    // Find suitable surveyors
    const surveyors = await this.findSurveyors(
      request.port,
      request.inspectionType
    );

    // Create inspection schedule
    const inspection: InspectionSchedule = {
      id: `INSP-${Date.now()}`,
      transactionId: request.transactionId,
      inspectionType: request.inspectionType,
      status: 'requested',
      port: request.port,
      surveyorCompany: request.surveyorCompany || surveyors[0]?.company,
      estimatedCost: surveyors[0]?.typicalCost,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // TODO: Send email to surveyor company with inspection request
    // await this.sendInspectionRequest(inspection, surveyors[0]);

    return inspection;
  }

  /**
   * Find available surveyors
   */
  async findSurveyors(
    port: string,
    inspectionType: string
  ): Promise<SurveyorAvailability[]> {
    // Determine region from port
    const region = this.getRegionFromPort(port);

    // Get surveyors for region
    const surveyors = this.surveyorDatabase[region] || this.surveyorDatabase['Singapore'];

    return surveyors.map((s) => ({
      surveyorCompany: s.company,
      available: true,
      earliestDate: new Date(Date.now() + s.responseTime * 60 * 60 * 1000),
      estimatedCost: s.typicalCost,
      currency: 'USD',
      responseTime: s.responseTime,
      rating: s.rating,
      previousJobs: Math.floor(Math.random() * 500) + 100, // Placeholder
    }));
  }

  private getRegionFromPort(port: string): string {
    const portMapping: Record<string, string> = {
      Singapore: 'Singapore',
      'Hong Kong': 'Singapore',
      Shanghai: 'Singapore',
      Rotterdam: 'Rotterdam',
      Antwerp: 'Rotterdam',
      Hamburg: 'Rotterdam',
      Dubai: 'Dubai',
      'Fujairah': 'Dubai',
      Houston: 'Houston',
      'New Orleans': 'Houston',
    };

    return portMapping[port] || 'Singapore';
  }

  /**
   * Schedule inspection
   */
  async scheduleInspection(
    inspectionId: string,
    scheduledDate: Date,
    surveyorDetails: {
      surveyorName: string;
      surveyorContact: string;
      confirmedCost: number;
    },
    organizationId: string
  ): Promise<InspectionSchedule> {
    // Update inspection status
    // In production, would update database

    // Send confirmation emails to all parties
    // await this.sendScheduleConfirmation(inspection);

    return {
      id: inspectionId,
      transactionId: '',
      inspectionType: 'pre_purchase',
      status: 'scheduled',
      scheduledDate,
      port: '',
      surveyorCompany: '',
      surveyorName: surveyorDetails.surveyorName,
      surveyorContact: surveyorDetails.surveyorContact,
      estimatedCost: surveyorDetails.confirmedCost,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Upload inspection report
   */
  async uploadInspectionReport(
    inspectionId: string,
    reportUrl: string,
    findings: InspectionFinding[],
    actualCost: number,
    organizationId: string
  ): Promise<InspectionSchedule> {
    // Analyze findings for critical issues
    const criticalFindings = findings.filter((f) => f.category === 'critical');
    const majorFindings = findings.filter((f) => f.category === 'major');

    // Calculate total estimated repair costs
    const totalRepairCost = findings.reduce(
      (sum, f) => sum + (f.estimatedRepairCost || 0),
      0
    );

    // Create alert if critical findings found
    if (criticalFindings.length > 0) {
      await prisma.alert.create({
        data: {
          type: 'inspection_critical_findings',
          severity: 'high',
          title: `Critical Findings in Vessel Inspection`,
          message: `${criticalFindings.length} critical issues found during pre-purchase inspection. Estimated repair cost: $${totalRepairCost.toLocaleString()}`,
          metadata: {
            inspectionId,
            criticalCount: criticalFindings.length,
            majorCount: majorFindings.length,
            totalRepairCost,
          },
          organizationId,
        },
      });
    }

    // Update inspection status
    return {
      id: inspectionId,
      transactionId: '',
      inspectionType: 'pre_purchase',
      status: 'completed',
      port: '',
      reportUrl,
      findings,
      actualCost,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate inspection summary
   */
  async generateInspectionSummary(
    inspectionId: string,
    organizationId: string
  ): Promise<any> {
    // Mock inspection summary
    return {
      inspectionId,
      overallRating: 'SATISFACTORY',
      criticalIssues: 0,
      majorIssues: 2,
      minorIssues: 5,
      observations: 12,
      totalRepairCost: 45000,
      recommendation:
        'Vessel is suitable for purchase subject to completion of minor repairs',
      keyFindings: [
        'Hull condition: Good',
        'Engine: Satisfactory, minor oil leak detected',
        'Navigation equipment: Excellent',
        'Cargo holds: 2 minor cracks requiring welding',
        'Safety equipment: All certified and in date',
      ],
    };
  }

  /**
   * Get inspection checklist
   */
  getInspectionChecklist(inspectionType: string): string[] {
    const checklists: Record<string, string[]> = {
      pre_purchase: [
        'Hull condition and thickness measurements',
        'Main engine condition and service records',
        'Auxiliary engines and generators',
        'Propulsion system and shaft',
        'Steering gear',
        'Anchors and mooring equipment',
        'Cargo holds/tanks condition',
        'Ballast tanks',
        'Accommodation and galley',
        'Bridge and navigation equipment',
        'Safety and firefighting equipment',
        'Class certificates and surveys',
        'Lifesaving equipment',
        'Pollution prevention equipment',
        'Electrical systems',
        'Fuel and lube oil analysis',
        'Documentation review',
      ],
      condition_survey: [
        'Overall vessel condition assessment',
        'Hull and superstructure',
        'Machinery condition',
        'Equipment functionality',
        'Defects and deficiencies list',
        'Estimated repair costs',
      ],
      valuation_survey: [
        'Market value assessment',
        'Condition-based valuation',
        'Comparable vessels analysis',
        'Depreciation assessment',
        'Scrap value calculation',
      ],
    };

    return checklists[inspectionType] || checklists.pre_purchase;
  }
}

export const snpInspectionSchedulerService = new SNPInspectionSchedulerService();
