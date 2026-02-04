// hr-analytics.ts
// HR analytics calculations: attrition, headcount, absenteeism, training metrics, dashboard.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmployeeRecord {
  employeeId: string;
  name: string;
  department: string;
  role: string;
  location: string;
  status: 'active' | 'on_leave' | 'resigned' | 'terminated';
  dateOfJoining: Date;
  dateOfExit?: Date | null;
}

export interface AttritionByDepartment {
  department: string;
  exits: number;
  avgHeadcount: number;
  rate: number;
}

export interface AttritionTrendPoint {
  month: string; // YYYY-MM
  exits: number;
  rate: number;
}

export interface AttritionResult {
  monthlyRate: number;
  annualRate: number;
  byDepartment: AttritionByDepartment[];
  trend: AttritionTrendPoint[];
}

export interface HeadcountMetrics {
  total: number;
  active: number;
  onLeave: number;
  resigned: number;
  terminated: number;
  byDepartment: Record<string, number>;
  byRole: Record<string, number>;
  byLocation: Record<string, number>;
  avgTenureMonths: number;
  newJoiners: {
    thisMonth: number;
    thisQuarter: number;
  };
}

export interface AttendanceLog {
  employeeId: string;
  date: Date;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'unplanned_leave' | 'work_from_home';
  dayOfWeek?: number; // 0=Sunday, 1=Monday, ... 6=Saturday
}

export interface ChronicAbsentee {
  employeeId: string;
  name: string;
  department: string;
  unplannedCount: number;
  totalAbsent: number;
}

export interface AbsenteeismPattern {
  type: string;
  description: string;
  employeeIds: string[];
  count: number;
}

export interface AbsenteeismResult {
  overallRate: number;
  byDepartment: Record<string, number>;
  chronicAbsentees: ChronicAbsentee[];
  patterns: AbsenteeismPattern[];
}

export interface TrainingRecord {
  trainingId: string;
  employeeId: string;
  courseName: string;
  category: 'mandatory' | 'elective' | 'compliance';
  complianceCode?: string; // SOLAS, MARPOL, ISM, ISPS, MLC, etc.
  status: 'assigned' | 'in_progress' | 'completed' | 'expired' | 'failed';
  score?: number;        // 0-100
  hoursSpent?: number;
  completedAt?: Date | null;
  expiresAt?: Date | null;
}

export interface ComplianceCourse {
  code: string;
  name: string;
  completedCount: number;
  totalAssigned: number;
  completionRate: number;
}

export interface ExpiringCertification {
  employeeId: string;
  courseName: string;
  complianceCode: string;
  expiresAt: Date;
  daysUntilExpiry: number;
}

export interface TrainingMetrics {
  completionRate: number;
  avgScore: number;
  hoursPerEmployee: number;
  complianceStatus: ComplianceCourse[];
  expiringCerts: ExpiringCertification[];
}

export interface HRDashboardInput {
  employees: EmployeeRecord[];
  attendanceLogs: AttendanceLog[];
  trainings: TrainingRecord[];
  payrollSummary?: {
    totalGross: number;
    totalNet: number;
    costPerHead: number;
  };
}

export interface HRDashboardHighlight {
  label: string;
  value: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface HRDashboard {
  headcount: HeadcountMetrics;
  attrition: AttritionResult;
  absenteeism: AbsenteeismResult;
  training: TrainingMetrics;
  payroll: {
    totalGross: number;
    totalNet: number;
    costPerHead: number;
  } | null;
  highlights: HRDashboardHighlight[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Threshold: an employee with more than this many unplanned absences in 3 months is "chronic". */
const CHRONIC_ABSENCE_THRESHOLD = 5;

/** Lookback window for chronic absenteeism check (in days). */
const CHRONIC_ABSENCE_WINDOW_DAYS = 90;

/** Maritime mandatory compliance training codes. */
const MANDATORY_COMPLIANCE_CODES = ['SOLAS', 'MARPOL', 'ISM', 'ISPS', 'MLC', 'STCW'];

/** Days before expiry to flag a certification as expiring soon. */
const EXPIRY_WARNING_DAYS = 90;

/** Days of the week that are considered working days (Mon-Fri). */
const WORKING_DAYS = new Set([1, 2, 3, 4, 5]); // Monday through Friday

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Format a date as YYYY-MM string.
 */
function toYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Calculate months difference between two dates.
 */
function monthsDiff(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

/**
 * Count occurrences in an array grouped by a key function.
 */
function countBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

/**
 * Build employee lookup map by ID for fast access.
 */
function buildEmployeeMap(employees: EmployeeRecord[]): Map<string, EmployeeRecord> {
  const map = new Map<string, EmployeeRecord>();
  for (const emp of employees) {
    map.set(emp.employeeId, emp);
  }
  return map;
}

/**
 * Get the start of the current month.
 */
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the start of the current quarter.
 */
function startOfQuarter(date: Date): Date {
  const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), quarterStartMonth, 1);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate employee attrition rate over a given period.
 *
 * Monthly attrition = (exits in month / average headcount) * 100
 * Annual attrition = rolling 12-month exits / avg headcount * 100
 *
 * Also provides a per-department breakdown and a monthly trend array
 * for the trailing 12 months.
 *
 * @param employees - Full employee list (including ex-employees with dateOfExit)
 * @param period    - The reference date for calculation (defaults to now)
 */
export function calculateAttritionRate(
  employees: EmployeeRecord[],
  period: Date = new Date(),
): AttritionResult {
  const now = period;
  const currentMonth = toYearMonth(now);
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  // All exits within the last 12 months
  const recentExits = employees.filter((e) => {
    if (!e.dateOfExit) return false;
    const exitDate = new Date(e.dateOfExit);
    return exitDate >= twelveMonthsAgo && exitDate <= now;
  });

  // Exits this month
  const monthlyExits = recentExits.filter(
    (e) => toYearMonth(new Date(e.dateOfExit!)) === currentMonth,
  );

  // Average headcount: employees who were active at any point during the period.
  // Simplified: count of (total employees - those who exited before the period started).
  const activeAtStart = employees.filter((e) => {
    if (!e.dateOfExit) return true;
    return new Date(e.dateOfExit) >= twelveMonthsAgo;
  }).length;
  const activeAtEnd = employees.filter((e) => !e.dateOfExit || new Date(e.dateOfExit) > now).length;
  const avgHeadcount = (activeAtStart + activeAtEnd) / 2;

  const monthlyRate = avgHeadcount > 0
    ? round((monthlyExits.length / avgHeadcount) * 100, 2)
    : 0;

  const annualRate = avgHeadcount > 0
    ? round((recentExits.length / avgHeadcount) * 100, 2)
    : 0;

  // By department
  const departments = Array.from(new Set(employees.map((e) => e.department)));
  const byDepartment: AttritionByDepartment[] = departments.map((dept) => {
    const deptEmployees = employees.filter((e) => e.department === dept);
    const deptExits = recentExits.filter((e) => e.department === dept);
    const deptActiveStart = deptEmployees.filter((e) => {
      if (!e.dateOfExit) return true;
      return new Date(e.dateOfExit) >= twelveMonthsAgo;
    }).length;
    const deptActiveEnd = deptEmployees.filter(
      (e) => !e.dateOfExit || new Date(e.dateOfExit) > now,
    ).length;
    const deptAvg = (deptActiveStart + deptActiveEnd) / 2;

    return {
      department: dept,
      exits: deptExits.length,
      avgHeadcount: round(deptAvg, 1),
      rate: deptAvg > 0 ? round((deptExits.length / deptAvg) * 100, 2) : 0,
    };
  }).filter((d) => d.avgHeadcount > 0);

  byDepartment.sort((a, b) => b.rate - a.rate);

  // Monthly trend (trailing 12 months)
  const trend: AttritionTrendPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = toYearMonth(monthDate);
    const exitsInMonth = recentExits.filter(
      (e) => toYearMonth(new Date(e.dateOfExit!)) === monthKey,
    ).length;
    trend.push({
      month: monthKey,
      exits: exitsInMonth,
      rate: avgHeadcount > 0 ? round((exitsInMonth / avgHeadcount) * 100, 2) : 0,
    });
  }

  return { monthlyRate, annualRate, byDepartment, trend };
}

/**
 * Calculate comprehensive headcount metrics from an employee list.
 *
 * Includes:
 *   - Total, active, on_leave, resigned, terminated counts
 *   - Breakdown by department, role, and office location
 *   - Average tenure in months (for active employees)
 *   - New joiners this month and this quarter
 *
 * @param employees - Full employee list
 */
export function calculateHeadcountMetrics(employees: EmployeeRecord[]): HeadcountMetrics {
  const now = new Date();

  const total = employees.length;
  const active = employees.filter((e) => e.status === 'active').length;
  const onLeave = employees.filter((e) => e.status === 'on_leave').length;
  const resigned = employees.filter((e) => e.status === 'resigned').length;
  const terminated = employees.filter((e) => e.status === 'terminated').length;

  const byDepartment = countBy(employees, (e) => e.department);
  const byRole = countBy(employees, (e) => e.role);
  const byLocation = countBy(employees, (e) => e.location);

  // Average tenure for currently active employees (in months)
  const activeEmployees = employees.filter(
    (e) => e.status === 'active' || e.status === 'on_leave',
  );
  const totalTenureMonths = activeEmployees.reduce((sum, e) => {
    return sum + monthsDiff(new Date(e.dateOfJoining), now);
  }, 0);
  const avgTenureMonths = activeEmployees.length > 0
    ? round(totalTenureMonths / activeEmployees.length, 1)
    : 0;

  // New joiners
  const monthStart = startOfMonth(now);
  const quarterStart = startOfQuarter(now);

  const thisMonth = employees.filter(
    (e) => new Date(e.dateOfJoining) >= monthStart && new Date(e.dateOfJoining) <= now,
  ).length;

  const thisQuarter = employees.filter(
    (e) => new Date(e.dateOfJoining) >= quarterStart && new Date(e.dateOfJoining) <= now,
  ).length;

  return {
    total,
    active,
    onLeave,
    resigned,
    terminated,
    byDepartment,
    byRole,
    byLocation,
    avgTenureMonths,
    newJoiners: { thisMonth, thisQuarter },
  };
}

/**
 * Analyze employee absenteeism from attendance logs.
 *
 * Metrics:
 *   - Overall rate: (absent + unplanned) / total working days * 100
 *   - Department-level breakdown
 *   - Chronic absentees: employees with > 5 unplanned absences in 90 days
 *   - Pattern detection: frequent Monday/Friday absences suggesting long weekends
 *
 * @param attendanceLogs - Array of daily attendance records
 * @param employees      - Employee list (for name/department lookup)
 */
export function analyzeAbsenteeism(
  attendanceLogs: AttendanceLog[],
  employees: EmployeeRecord[],
): AbsenteeismResult {
  const employeeMap = buildEmployeeMap(employees);
  const now = new Date();
  const windowStart = new Date(now.getTime() - CHRONIC_ABSENCE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  if (attendanceLogs.length === 0) {
    return {
      overallRate: 0,
      byDepartment: {},
      chronicAbsentees: [],
      patterns: [],
    };
  }

  // Enrich logs with day of week if missing
  const enrichedLogs = attendanceLogs.map((log) => ({
    ...log,
    dayOfWeek: log.dayOfWeek ?? new Date(log.date).getDay(),
  }));

  // Only consider working days
  const workingDayLogs = enrichedLogs.filter((log) => WORKING_DAYS.has(log.dayOfWeek!));

  // Overall absenteeism rate
  const totalWorkingEntries = workingDayLogs.length;
  const absentEntries = workingDayLogs.filter(
    (log) => log.status === 'absent' || log.status === 'unplanned_leave',
  );
  const overallRate = totalWorkingEntries > 0
    ? round((absentEntries.length / totalWorkingEntries) * 100, 2)
    : 0;

  // By department
  const byDepartment: Record<string, number> = {};
  const deptTotals: Record<string, number> = {};
  const deptAbsent: Record<string, number> = {};

  for (const log of workingDayLogs) {
    const emp = employeeMap.get(log.employeeId);
    const dept = emp?.department ?? 'Unknown';
    deptTotals[dept] = (deptTotals[dept] ?? 0) + 1;
    if (log.status === 'absent' || log.status === 'unplanned_leave') {
      deptAbsent[dept] = (deptAbsent[dept] ?? 0) + 1;
    }
  }

  for (const dept of Object.keys(deptTotals)) {
    byDepartment[dept] = deptTotals[dept] > 0
      ? round(((deptAbsent[dept] ?? 0) / deptTotals[dept]) * 100, 2)
      : 0;
  }

  // Chronic absentees (> threshold unplanned in 90-day window)
  const recentLogs = workingDayLogs.filter((log) => new Date(log.date) >= windowStart);
  const unplannedByEmployee: Record<string, number> = {};
  const absentByEmployee: Record<string, number> = {};

  for (const log of recentLogs) {
    if (log.status === 'unplanned_leave') {
      unplannedByEmployee[log.employeeId] = (unplannedByEmployee[log.employeeId] ?? 0) + 1;
    }
    if (log.status === 'absent' || log.status === 'unplanned_leave') {
      absentByEmployee[log.employeeId] = (absentByEmployee[log.employeeId] ?? 0) + 1;
    }
  }

  const chronicAbsentees: ChronicAbsentee[] = [];
  for (const [empId, count] of Object.entries(unplannedByEmployee)) {
    if (count > CHRONIC_ABSENCE_THRESHOLD) {
      const emp = employeeMap.get(empId);
      chronicAbsentees.push({
        employeeId: empId,
        name: emp?.name ?? 'Unknown',
        department: emp?.department ?? 'Unknown',
        unplannedCount: count,
        totalAbsent: absentByEmployee[empId] ?? count,
      });
    }
  }

  chronicAbsentees.sort((a, b) => b.unplannedCount - a.unplannedCount);

  // Pattern detection: Monday/Friday absences
  const patterns: AbsenteeismPattern[] = [];

  // Monday absences
  const mondayAbsences: Record<string, number> = {};
  const fridayAbsences: Record<string, number> = {};

  for (const log of recentLogs) {
    if (log.status !== 'absent' && log.status !== 'unplanned_leave') continue;

    if (log.dayOfWeek === 1) {
      mondayAbsences[log.employeeId] = (mondayAbsences[log.employeeId] ?? 0) + 1;
    }
    if (log.dayOfWeek === 5) {
      fridayAbsences[log.employeeId] = (fridayAbsences[log.employeeId] ?? 0) + 1;
    }
  }

  // Flag employees with 3+ Monday or Friday absences in the window
  const PATTERN_THRESHOLD = 3;

  const mondayPatternEmps = Object.entries(mondayAbsences)
    .filter(([, count]) => count >= PATTERN_THRESHOLD)
    .map(([empId]) => empId);

  if (mondayPatternEmps.length > 0) {
    patterns.push({
      type: 'monday_pattern',
      description: `${mondayPatternEmps.length} employee(s) with ${PATTERN_THRESHOLD}+ Monday absences in the last ${CHRONIC_ABSENCE_WINDOW_DAYS} days — possible long-weekend pattern`,
      employeeIds: mondayPatternEmps,
      count: mondayPatternEmps.length,
    });
  }

  const fridayPatternEmps = Object.entries(fridayAbsences)
    .filter(([, count]) => count >= PATTERN_THRESHOLD)
    .map(([empId]) => empId);

  if (fridayPatternEmps.length > 0) {
    patterns.push({
      type: 'friday_pattern',
      description: `${fridayPatternEmps.length} employee(s) with ${PATTERN_THRESHOLD}+ Friday absences in the last ${CHRONIC_ABSENCE_WINDOW_DAYS} days — possible long-weekend pattern`,
      employeeIds: fridayPatternEmps,
      count: fridayPatternEmps.length,
    });
  }

  // Combined Mon+Fri pattern (stronger signal)
  const combinedPatternEmps = mondayPatternEmps.filter((id) => fridayPatternEmps.includes(id));
  if (combinedPatternEmps.length > 0) {
    patterns.push({
      type: 'monday_friday_combined',
      description: `${combinedPatternEmps.length} employee(s) with frequent Monday AND Friday absences — strong long-weekend pattern`,
      employeeIds: combinedPatternEmps,
      count: combinedPatternEmps.length,
    });
  }

  return { overallRate, byDepartment, chronicAbsentees, patterns };
}

/**
 * Calculate training and certification metrics.
 *
 * Metrics:
 *   - Overall completion rate (completed / total assigned)
 *   - Average score across completed trainings
 *   - Average hours per unique employee
 *   - Maritime compliance status (SOLAS, MARPOL, ISM, ISPS, MLC, STCW)
 *   - Certifications expiring within 90 days
 *
 * @param trainings - Array of training records
 */
export function calculateTrainingMetrics(trainings: TrainingRecord[]): TrainingMetrics {
  if (trainings.length === 0) {
    return {
      completionRate: 0,
      avgScore: 0,
      hoursPerEmployee: 0,
      complianceStatus: [],
      expiringCerts: [],
    };
  }

  const now = new Date();

  // Completion rate
  const completed = trainings.filter((t) => t.status === 'completed');
  const completionRate = round((completed.length / trainings.length) * 100, 2);

  // Average score (only for completed trainings with a score)
  const scoredTrainings = completed.filter((t) => t.score != null);
  const avgScore = scoredTrainings.length > 0
    ? round(scoredTrainings.reduce((s, t) => s + (t.score ?? 0), 0) / scoredTrainings.length, 1)
    : 0;

  // Hours per employee
  const totalHours = trainings.reduce((s, t) => s + (t.hoursSpent ?? 0), 0);
  const uniqueEmployees = new Set(trainings.map((t) => t.employeeId));
  const hoursPerEmployee = uniqueEmployees.size > 0
    ? round(totalHours / uniqueEmployees.size, 1)
    : 0;

  // Maritime compliance status
  const complianceTrainings = trainings.filter(
    (t) => t.category === 'compliance' && t.complianceCode,
  );

  const complianceStatus: ComplianceCourse[] = MANDATORY_COMPLIANCE_CODES.map((code) => {
    const courseTrainings = complianceTrainings.filter(
      (t) => t.complianceCode?.toUpperCase() === code,
    );
    const courseCompleted = courseTrainings.filter((t) => t.status === 'completed').length;
    const totalAssigned = courseTrainings.length;

    return {
      code,
      name: code, // the code itself serves as a recognizable name for maritime
      completedCount: courseCompleted,
      totalAssigned,
      completionRate: totalAssigned > 0 ? round((courseCompleted / totalAssigned) * 100, 2) : 0,
    };
  });

  // Expiring certifications (within EXPIRY_WARNING_DAYS)
  const expiryThreshold = new Date(now.getTime() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
  const expiringCerts: ExpiringCertification[] = [];

  for (const training of trainings) {
    if (
      training.status === 'completed' &&
      training.expiresAt &&
      training.complianceCode
    ) {
      const expiryDate = new Date(training.expiresAt);
      if (expiryDate >= now && expiryDate <= expiryThreshold) {
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        expiringCerts.push({
          employeeId: training.employeeId,
          courseName: training.courseName,
          complianceCode: training.complianceCode,
          expiresAt: expiryDate,
          daysUntilExpiry,
        });
      }
    }
  }

  expiringCerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  return { completionRate, avgScore, hoursPerEmployee, complianceStatus, expiringCerts };
}

/**
 * Generate a composite HR dashboard by aggregating headcount, attrition,
 * absenteeism, training, and payroll metrics.
 *
 * Also produces a highlights array surfacing items that need attention:
 *   - High attrition (> 20% annualized)
 *   - High absenteeism (> 5%)
 *   - Low training completion (< 80%)
 *   - Expiring compliance certifications
 *   - Departments with zero new hires
 *
 * @param data - Composite input containing employees, attendance, trainings, and optional payroll
 */
export function generateHRDashboard(data: HRDashboardInput): HRDashboard {
  const { employees, attendanceLogs, trainings, payrollSummary } = data;

  const headcount = calculateHeadcountMetrics(employees);
  const attrition = calculateAttritionRate(employees);
  const absenteeism = analyzeAbsenteeism(attendanceLogs, employees);
  const training = calculateTrainingMetrics(trainings);

  const payroll = payrollSummary
    ? {
        totalGross: payrollSummary.totalGross,
        totalNet: payrollSummary.totalNet,
        costPerHead: payrollSummary.costPerHead,
      }
    : null;

  // Generate highlights
  const highlights: HRDashboardHighlight[] = [];

  // Attrition alerts
  if (attrition.annualRate > 20) {
    highlights.push({
      label: 'High annual attrition',
      value: `${attrition.annualRate}% — above 20% threshold`,
      severity: 'critical',
    });
  } else if (attrition.annualRate > 15) {
    highlights.push({
      label: 'Elevated annual attrition',
      value: `${attrition.annualRate}% — approaching concern level`,
      severity: 'warning',
    });
  }

  // Absenteeism alerts
  if (absenteeism.overallRate > 5) {
    highlights.push({
      label: 'High absenteeism',
      value: `${absenteeism.overallRate}% — above 5% threshold`,
      severity: 'critical',
    });
  } else if (absenteeism.overallRate > 3) {
    highlights.push({
      label: 'Elevated absenteeism',
      value: `${absenteeism.overallRate}% — monitor closely`,
      severity: 'warning',
    });
  }

  if (absenteeism.chronicAbsentees.length > 0) {
    highlights.push({
      label: 'Chronic absentees detected',
      value: `${absenteeism.chronicAbsentees.length} employee(s) with excessive unplanned absences`,
      severity: 'warning',
    });
  }

  if (absenteeism.patterns.length > 0) {
    highlights.push({
      label: 'Absence patterns detected',
      value: `${absenteeism.patterns.length} pattern(s) flagged — review Monday/Friday trends`,
      severity: 'info',
    });
  }

  // Training alerts
  if (training.completionRate < 80) {
    highlights.push({
      label: 'Low training completion',
      value: `${training.completionRate}% — below 80% target`,
      severity: 'warning',
    });
  }

  if (training.expiringCerts.length > 0) {
    const criticalExpiring = training.expiringCerts.filter((c) => c.daysUntilExpiry <= 30);
    if (criticalExpiring.length > 0) {
      highlights.push({
        label: 'Certifications expiring within 30 days',
        value: `${criticalExpiring.length} certification(s) need immediate renewal`,
        severity: 'critical',
      });
    } else {
      highlights.push({
        label: 'Certifications expiring within 90 days',
        value: `${training.expiringCerts.length} certification(s) need renewal planning`,
        severity: 'warning',
      });
    }
  }

  // Low compliance completion
  const lowCompliance = training.complianceStatus.filter(
    (c) => c.totalAssigned > 0 && c.completionRate < 100,
  );
  if (lowCompliance.length > 0) {
    highlights.push({
      label: 'Incomplete mandatory compliance training',
      value: `${lowCompliance.map((c) => c.code).join(', ')} — not at 100% completion`,
      severity: 'warning',
    });
  }

  // Headcount info
  highlights.push({
    label: 'Total active headcount',
    value: `${headcount.active} active of ${headcount.total} total`,
    severity: 'info',
  });

  if (headcount.newJoiners.thisMonth > 0) {
    highlights.push({
      label: 'New joiners this month',
      value: `${headcount.newJoiners.thisMonth} new employee(s)`,
      severity: 'info',
    });
  }

  return { headcount, attrition, absenteeism, training, payroll, highlights };
}
