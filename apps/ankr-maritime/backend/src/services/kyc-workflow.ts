/**
 * KYC Onboarding & Management Workflow
 *
 * Generates KYC stages, calculates completion status, verifies
 * Ultimate Beneficial Ownership (UBO) structures, and schedules
 * periodic refresh cycles based on counterparty risk categories.
 *
 * Pure business logic — no database or Prisma dependency.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KYCStage {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  requiredDocs: string[];
  completedDocs: string[];
  dueDate?: Date;
}

export interface KYCOnboardingResult {
  stages: KYCStage[];
  overallStatus: string;
  completionPercent: number;
  nextAction: string;
  estimatedCompletionDate?: Date;
}

export interface UBOVerificationResult {
  isCompliant: boolean;
  totalOwnership: number;
  significantOwners: number;
  unverifiedOwners: number;
  pepOwners: number;
  sanctionedOwners: number;
  gaps: string[];
}

export interface RefreshSchedule {
  companyId: string;
  lastRefresh: Date;
  nextRefresh: Date;
  refreshType: string;
  priority: string;
  daysUntilDue: number;
  isOverdue: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Refresh frequency in days by risk category.
 */
const REFRESH_FREQUENCY_DAYS: Record<string, number> = {
  critical: 90,
  high: 180,
  medium: 365,
  low: 730,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Stage definitions
// ---------------------------------------------------------------------------

/**
 * Return the default ordered KYC stages for a company entity.
 * Each stage starts as 'pending' with an empty completedDocs array.
 */
function companyStages(): KYCStage[] {
  return [
    {
      name: 'Entity Registration',
      status: 'pending',
      requiredDocs: ['Certificate of Incorporation', 'Articles of Association'],
      completedDocs: [],
    },
    {
      name: 'UBO Identification',
      status: 'pending',
      requiredDocs: ['UBO declarations', 'Ownership structure chart'],
      completedDocs: [],
    },
    {
      name: 'Sanctions Screening',
      status: 'pending',
      requiredDocs: ['Sanctions check', 'PEP check', 'Adverse media'],
      completedDocs: [],
    },
    {
      name: 'Financial Due Diligence',
      status: 'pending',
      requiredDocs: ['Financial statements', 'Bank references'],
      completedDocs: [],
    },
    {
      name: 'Compliance Review',
      status: 'pending',
      requiredDocs: ['Compliance officer review', 'Risk assessment'],
      completedDocs: [],
    },
    {
      name: 'Approval',
      status: 'pending',
      requiredDocs: ['Final approval', 'Relationship setup'],
      completedDocs: [],
    },
  ];
}

/**
 * Return the default ordered KYC stages for an individual entity.
 */
function individualStages(): KYCStage[] {
  return [
    {
      name: 'Identity Verification',
      status: 'pending',
      requiredDocs: ['Passport', 'National ID'],
      completedDocs: [],
    },
    {
      name: 'Address Verification',
      status: 'pending',
      requiredDocs: ['Utility bill', 'Bank statement'],
      completedDocs: [],
    },
    {
      name: 'Sanctions & PEP',
      status: 'pending',
      requiredDocs: ['Sanctions check', 'PEP declaration'],
      completedDocs: [],
    },
    {
      name: 'Risk Assessment',
      status: 'pending',
      requiredDocs: ['Risk scoring'],
      completedDocs: [],
    },
    {
      name: 'Approval',
      status: 'pending',
      requiredDocs: ['Final approval'],
      completedDocs: [],
    },
  ];
}

// ---------------------------------------------------------------------------
// Main functions
// ---------------------------------------------------------------------------

/**
 * Generate the ordered KYC onboarding stages for a given entity type.
 * All stages start in 'pending' status with no completed documents.
 *
 * @param entityType - 'company' or 'individual'
 * @returns Ordered array of KYCStage objects
 */
export function generateOnboardingStages(
  entityType: 'company' | 'individual',
): KYCStage[] {
  if (entityType === 'company') {
    return companyStages();
  }
  return individualStages();
}

/**
 * Calculate the overall KYC completion status from a set of stages.
 *
 * - completionPercent: ratio of 'completed' stages to total.
 * - overallStatus: 'approved' if all completed, 'failed' if any failed,
 *   'in_progress' if any in progress, otherwise 'pending'.
 * - nextAction: the name of the first non-completed stage.
 * - estimatedCompletionDate: latest dueDate among remaining stages.
 *
 * @param stages - Current KYC stages with their statuses
 * @returns Aggregated onboarding result
 */
export function calculateKYCCompletion(stages: KYCStage[]): KYCOnboardingResult {
  if (stages.length === 0) {
    return {
      stages: [],
      overallStatus: 'pending',
      completionPercent: 0,
      nextAction: 'No stages defined',
    };
  }

  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const completionPercent = Math.round((completedCount / stages.length) * 100);

  // Determine overall status
  let overallStatus: string;
  const allCompleted = stages.every((s) => s.status === 'completed');
  const anyFailed = stages.some((s) => s.status === 'failed');
  const anyInProgress = stages.some((s) => s.status === 'in_progress');

  if (allCompleted) {
    overallStatus = 'approved';
  } else if (anyFailed) {
    overallStatus = 'failed';
  } else if (anyInProgress) {
    overallStatus = 'in_progress';
  } else {
    overallStatus = 'pending';
  }

  // Next action: first non-completed stage
  const nextStage = stages.find((s) => s.status !== 'completed');
  const nextAction = nextStage ? nextStage.name : 'All stages complete';

  // Estimated completion: latest due date among remaining (non-completed) stages
  let estimatedCompletionDate: Date | undefined;
  const remainingStages = stages.filter((s) => s.status !== 'completed');
  const dueDates = remainingStages
    .filter((s) => s.dueDate !== undefined)
    .map((s) => new Date(s.dueDate!).getTime());

  if (dueDates.length > 0) {
    estimatedCompletionDate = new Date(Math.max(...dueDates));
  }

  return {
    stages,
    overallStatus,
    completionPercent,
    nextAction,
    estimatedCompletionDate,
  };
}

/**
 * Verify an Ultimate Beneficial Ownership (UBO) structure against
 * regulatory requirements.
 *
 * Rules:
 * - Total declared ownership must be >= 75% to be considered adequate.
 * - No sanctioned owners are permitted.
 * - All significant owners (>10% stake) must be verified.
 * - PEP owners require enhanced due diligence (flagged but not blocking).
 *
 * @param owners - Array of beneficial owners with ownership and screening data
 * @returns Verification result with compliance status, counts, and gaps
 */
export function verifyUBOStructure(
  owners: Array<{
    ownerName: string;
    ownershipPercent: number;
    pepStatus: boolean;
    sanctionStatus: string;
    verificationStatus: string;
  }>,
): UBOVerificationResult {
  const gaps: string[] = [];

  // Aggregate ownership
  const totalOwnership = owners.reduce((sum, o) => sum + o.ownershipPercent, 0);

  if (totalOwnership < 75) {
    gaps.push(
      `Ownership only accounts for ${totalOwnership.toFixed(1)}% — minimum 75% required`,
    );
  }

  if (totalOwnership > 100) {
    gaps.push(
      `Ownership exceeds 100% (${totalOwnership.toFixed(1)}%) — review declarations`,
    );
  }

  // Significant owners: >10% stake
  const significantOwners = owners.filter((o) => o.ownershipPercent > 10);

  // Unverified significant owners
  const unverifiedSignificant = significantOwners.filter(
    (o) => o.verificationStatus.toLowerCase() !== 'verified',
  );
  for (const uv of unverifiedSignificant) {
    gaps.push(
      `Unverified owner: ${uv.ownerName} (${uv.ownershipPercent}% stake) — verification required`,
    );
  }

  // All unverified owners (including non-significant)
  const unverifiedOwners = owners.filter(
    (o) => o.verificationStatus.toLowerCase() !== 'verified',
  ).length;

  // PEP owners
  const pepOwnersList = owners.filter((o) => o.pepStatus);
  const pepOwners = pepOwnersList.length;
  for (const pep of pepOwnersList) {
    gaps.push(
      `PEP owner requires enhanced due diligence: ${pep.ownerName} (${pep.ownershipPercent}%)`,
    );
  }

  // Sanctioned owners
  const sanctionedOwnersList = owners.filter(
    (o) =>
      o.sanctionStatus.toLowerCase() === 'sanctioned' ||
      o.sanctionStatus.toLowerCase() === 'blocked' ||
      o.sanctionStatus.toLowerCase() === 'designated',
  );
  const sanctionedOwners = sanctionedOwnersList.length;
  for (const so of sanctionedOwnersList) {
    gaps.push(
      `SANCTIONED OWNER: ${so.ownerName} (${so.ownershipPercent}%) — relationship must be declined`,
    );
  }

  // Compliance determination
  const isCompliant =
    totalOwnership >= 75 &&
    sanctionedOwners === 0 &&
    unverifiedSignificant.length === 0;

  return {
    isCompliant,
    totalOwnership: Math.round(totalOwnership * 100) / 100,
    significantOwners: significantOwners.length,
    unverifiedOwners,
    pepOwners,
    sanctionedOwners,
    gaps,
  };
}

/**
 * Generate a periodic KYC / sanctions-screening refresh schedule for a
 * portfolio of companies, based on each company's risk category.
 *
 * Refresh frequencies:
 * - critical: every 90 days
 * - high:     every 180 days
 * - medium:   every 365 days
 * - low:      every 730 days
 *
 * Results are sorted by daysUntilDue ascending (most urgent first).
 *
 * @param companies     - Array of companies with their risk and last screening date
 * @param referenceDate - Date to calculate from (defaults to now)
 * @returns Sorted array of refresh schedule entries
 */
export function generateRefreshSchedule(
  companies: Array<{
    companyId: string;
    riskCategory: string;
    lastScreeningDate?: Date;
  }>,
  referenceDate?: Date,
): RefreshSchedule[] {
  const now = referenceDate ? new Date(referenceDate) : new Date();
  const nowMs = now.getTime();

  const schedules: RefreshSchedule[] = companies.map((company) => {
    const riskKey = company.riskCategory.toLowerCase();
    const frequencyDays = REFRESH_FREQUENCY_DAYS[riskKey] ?? REFRESH_FREQUENCY_DAYS['medium'];

    // If no last screening date, treat it as overdue from epoch
    const lastRefresh = company.lastScreeningDate
      ? new Date(company.lastScreeningDate)
      : new Date(0);
    const lastRefreshMs = lastRefresh.getTime();

    // Calculate next refresh
    const nextRefreshMs = lastRefreshMs + frequencyDays * MS_PER_DAY;
    const nextRefresh = new Date(nextRefreshMs);

    // Days until due (negative if overdue)
    const daysUntilDue = Math.round((nextRefreshMs - nowMs) / MS_PER_DAY);
    const isOverdue = daysUntilDue < 0;

    // Refresh type description
    const refreshType = `${riskKey} risk — ${frequencyDays}-day cycle`;

    // Priority
    let priority: string;
    if (isOverdue) {
      priority = 'critical';
    } else if (daysUntilDue <= 30) {
      priority = 'high';
    } else if (daysUntilDue <= 90) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    return {
      companyId: company.companyId,
      lastRefresh,
      nextRefresh,
      refreshType,
      priority,
      daysUntilDue,
      isOverdue,
    };
  });

  // Sort most urgent first
  schedules.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return schedules;
}
