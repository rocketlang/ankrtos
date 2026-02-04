// payroll-engine.ts
// HRMS payroll calculations: salary breakdown, statutory deductions, TDS, leave encashment, payroll summary.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Country = 'IN' | 'SG' | 'UK' | 'AE' | string;
export type TaxRegime = 'old' | 'new';

export interface SalaryBreakdown {
  basic: number;
  hra: number;
  da: number;
  specialAllow: number;
  otherAllow: number;
  grossEarnings: number;
}

export interface DeductionResult {
  pf: number;
  esi: number;
  professionalTax: number;
  otherDeductions: number;
  totalDeductions: number;
}

export interface TdsResult {
  annualTax: number;
  monthlyTds: number;
  effectiveRate: number;
  regime: TaxRegime;
}

export interface PayslipInput {
  employeeId: string;
  department: string;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  month: number;  // 1-12
  year: number;
}

export interface DepartmentPayrollSummary {
  department: string;
  headcount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  avgGross: number;
}

export interface PayrollSummary {
  totals: {
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    headcount: number;
  };
  byDepartment: DepartmentPayrollSummary[];
  costPerHead: number;
  payrollToRevenue: number | null;
}

export interface LeaveEncashmentInput {
  dailyRate: number;
  balance: number;
  maxEncashable: number;
  country?: Country;
  avgMonthlySalary?: number; // needed for India exemption calculation
  completedYears?: number;   // years of service for exemption
}

export interface LeaveEncashmentResult {
  encashableDays: number;
  grossAmount: number;
  taxableAmount: number;
  netAmount: number;
  exemptAmount: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** India salary structure ratios relative to annual CTC. */
const IN_BASIC_RATIO = 0.40;
const IN_HRA_RATIO_OF_BASIC = 0.50;
const IN_DA_RATIO_OF_BASIC = 0.10;

/** Simplified structure for SG/UK/UAE: basic is 85% of CTC. */
const SIMPLE_BASIC_RATIO = 0.85;
const SIMPLE_OTHER_RATIO = 0.15;

/** India PF constants. */
const IN_PF_RATE = 0.12;
const IN_PF_MAX_BASIC_MONTHLY = 15_000;

/** India ESI constants. */
const IN_ESI_EMPLOYEE_RATE = 0.0075;
const IN_ESI_GROSS_THRESHOLD_MONTHLY = 21_000;

/** India Professional Tax (Maharashtra rate, common default). */
const IN_PT_MONTHLY = 200;

/** Singapore CPF rates (for citizens/PRs under 55). */
const SG_CPF_EMPLOYEE_RATE = 0.20;
const SG_CPF_EMPLOYER_RATE = 0.17;

/** UK National Insurance thresholds and rates (2025-26 approximate). */
const UK_NI_LOWER_ANNUAL = 12_571;
const UK_NI_UPPER_ANNUAL = 50_270;
const UK_NI_MAIN_RATE = 0.12;
const UK_NI_ADDITIONAL_RATE = 0.02;

/** India TDS old regime slabs. */
const IN_OLD_REGIME_SLABS: { limit: number; rate: number }[] = [
  { limit: 250_000, rate: 0.00 },
  { limit: 500_000, rate: 0.05 },
  { limit: 1_000_000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 },
];

/** India TDS new regime slabs (FY 2024-25 onwards). */
const IN_NEW_REGIME_SLABS: { limit: number; rate: number }[] = [
  { limit: 300_000, rate: 0.00 },
  { limit: 600_000, rate: 0.05 },
  { limit: 900_000, rate: 0.10 },
  { limit: 1_200_000, rate: 0.15 },
  { limit: 1_500_000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 },
];

/** Standard deduction under Indian income tax. */
const IN_STANDARD_DEDUCTION = 50_000;

/** Health and Education Cess on income tax (India). */
const IN_CESS_RATE = 0.04;

/** Leave encashment exemption cap (India) — INR 25 lakh. */
const IN_LEAVE_ENCASHMENT_MAX_EXEMPT = 2_500_000;

/** Maximum months of average salary considered for leave encashment exemption (India). */
const IN_LEAVE_ENCASHMENT_EXEMPT_MONTHS = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Normalize a country string to an uppercase two-letter code.
 */
function normalizeCountry(country: string): string {
  const c = country.trim().toUpperCase();
  // Handle common aliases
  const ALIASES: Record<string, string> = {
    INDIA: 'IN',
    SINGAPORE: 'SG',
    'UNITED KINGDOM': 'UK',
    ENGLAND: 'UK',
    GB: 'UK',
    UAE: 'AE',
    'UNITED ARAB EMIRATES': 'AE',
  };
  return ALIASES[c] ?? c;
}

/**
 * Compute tax using progressive slab brackets.
 * Each slab entry defines the *upper limit* of that bracket and the rate applied
 * to income falling within that bracket.
 */
function computeSlabTax(taxableIncome: number, slabs: { limit: number; rate: number }[]): number {
  let tax = 0;
  let previousLimit = 0;

  for (const slab of slabs) {
    if (taxableIncome <= previousLimit) break;

    const bracketUpper = Math.min(taxableIncome, slab.limit);
    const bracketIncome = bracketUpper - previousLimit;
    tax += bracketIncome * slab.rate;
    previousLimit = slab.limit;
  }

  return round(tax, 2);
}

/**
 * Group an array by a key-extraction function.
 */
function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate monthly salary component breakdown from annual CTC and country.
 *
 * India structure:
 *   basic = 40% of CTC, HRA = 50% of basic, DA = 10% of basic,
 *   special allowance = CTC - basic - HRA - DA.
 *
 * SG / UK / UAE (simplified):
 *   basic = 85% of CTC, other allowances = 15% of CTC.
 *
 * All values are returned as monthly amounts (annual / 12).
 *
 * @param ctc     - Annual Cost to Company in local currency
 * @param country - Country code or name (e.g. 'IN', 'India', 'SG', 'UK', 'AE')
 */
export function calculateSalaryBreakdown(ctc: number, country: string): SalaryBreakdown {
  const code = normalizeCountry(country);
  const monthly = (annual: number) => round(annual / 12, 2);

  if (code === 'IN') {
    const annualBasic = round(ctc * IN_BASIC_RATIO, 2);
    const annualHra = round(annualBasic * IN_HRA_RATIO_OF_BASIC, 2);
    const annualDa = round(annualBasic * IN_DA_RATIO_OF_BASIC, 2);
    const annualSpecial = round(ctc - annualBasic - annualHra - annualDa, 2);

    return {
      basic: monthly(annualBasic),
      hra: monthly(annualHra),
      da: monthly(annualDa),
      specialAllow: monthly(annualSpecial),
      otherAllow: 0,
      grossEarnings: monthly(ctc),
    };
  }

  // Simplified structure for SG, UK, UAE, and other countries
  const annualBasic = round(ctc * SIMPLE_BASIC_RATIO, 2);
  const annualOther = round(ctc * SIMPLE_OTHER_RATIO, 2);

  return {
    basic: monthly(annualBasic),
    hra: 0,
    da: 0,
    specialAllow: 0,
    otherAllow: monthly(annualOther),
    grossEarnings: monthly(ctc),
  };
}

/**
 * Calculate statutory deductions based on earnings and country-specific rules.
 *
 * India:
 *   PF  = 12% of basic (capped at basic 15,000/month)
 *   ESI = 0.75% of gross (only if monthly gross < 21,000)
 *   PT  = Rs 200/month (Maharashtra default)
 *
 * Singapore:
 *   CPF employee contribution = 20% (under 55)
 *   CPF employer contribution = 17% (tracked but not deducted from salary)
 *
 * UK:
 *   NI = 12% on income between 12,571 and 50,270/year; 2% above 50,270/year.
 *   Returned as a monthly figure.
 *
 * @param earnings  - Monthly salary breakdown (as returned by calculateSalaryBreakdown)
 * @param country   - Country code or name
 * @param pfOptOut  - If true, PF is not deducted (India only, voluntary for salary > 15k basic)
 */
export function calculateDeductions(
  earnings: SalaryBreakdown,
  country: string,
  pfOptOut: boolean = false,
): DeductionResult {
  const code = normalizeCountry(country);

  if (code === 'IN') {
    return calculateIndiaDeductions(earnings, pfOptOut);
  }
  if (code === 'SG') {
    return calculateSingaporeDeductions(earnings);
  }
  if (code === 'UK') {
    return calculateUkDeductions(earnings);
  }

  // UAE and other tax-free jurisdictions
  return {
    pf: 0,
    esi: 0,
    professionalTax: 0,
    otherDeductions: 0,
    totalDeductions: 0,
  };
}

/**
 * Calculate India-specific statutory deductions.
 */
function calculateIndiaDeductions(earnings: SalaryBreakdown, pfOptOut: boolean): DeductionResult {
  // PF: 12% of basic, capped at basic of 15,000/month
  let pf = 0;
  if (!pfOptOut) {
    const pfBasic = Math.min(earnings.basic, IN_PF_MAX_BASIC_MONTHLY);
    pf = round(pfBasic * IN_PF_RATE, 2);
  }

  // ESI: 0.75% of gross earnings, applicable only if gross < 21,000/month
  let esi = 0;
  if (earnings.grossEarnings < IN_ESI_GROSS_THRESHOLD_MONTHLY) {
    esi = round(earnings.grossEarnings * IN_ESI_EMPLOYEE_RATE, 2);
  }

  // Professional Tax (fixed per month, Maharashtra default)
  const professionalTax = IN_PT_MONTHLY;

  const totalDeductions = round(pf + esi + professionalTax, 2);

  return {
    pf,
    esi,
    professionalTax,
    otherDeductions: 0,
    totalDeductions,
  };
}

/**
 * Calculate Singapore CPF employee deduction (under 55 years).
 * The employer contribution is tracked but not deducted from salary.
 */
function calculateSingaporeDeductions(earnings: SalaryBreakdown): DeductionResult {
  const cpfEmployee = round(earnings.grossEarnings * SG_CPF_EMPLOYEE_RATE, 2);
  // Employer portion recorded under otherDeductions for visibility but is
  // employer-borne and not deducted from employee net salary.
  const cpfEmployer = round(earnings.grossEarnings * SG_CPF_EMPLOYER_RATE, 2);

  return {
    pf: cpfEmployee,
    esi: 0,
    professionalTax: 0,
    otherDeductions: cpfEmployer, // employer-borne CPF tracked here for cost accounting
    totalDeductions: cpfEmployee, // only employee portion is deducted from salary
  };
}

/**
 * Calculate UK National Insurance contribution (employee).
 * Thresholds are annual; result is divided by 12 for monthly amount.
 */
function calculateUkDeductions(earnings: SalaryBreakdown): DeductionResult {
  const annualGross = earnings.grossEarnings * 12;

  let annualNI = 0;

  // Main rate band: 12% on earnings between lower and upper thresholds
  if (annualGross > UK_NI_LOWER_ANNUAL) {
    const mainBand = Math.min(annualGross, UK_NI_UPPER_ANNUAL) - UK_NI_LOWER_ANNUAL;
    annualNI += mainBand * UK_NI_MAIN_RATE;
  }

  // Additional rate: 2% on earnings above upper threshold
  if (annualGross > UK_NI_UPPER_ANNUAL) {
    const additionalBand = annualGross - UK_NI_UPPER_ANNUAL;
    annualNI += additionalBand * UK_NI_ADDITIONAL_RATE;
  }

  const monthlyNI = round(annualNI / 12, 2);

  return {
    pf: 0,
    esi: 0,
    professionalTax: 0,
    otherDeductions: monthlyNI,
    totalDeductions: monthlyNI,
  };
}

/**
 * Calculate India Tax Deducted at Source (TDS) under the old or new regime.
 *
 * Old regime slabs:
 *   0 - 2.5L   : 0%
 *   2.5L - 5L  : 5%
 *   5L - 10L   : 20%
 *   > 10L      : 30%
 *
 * New regime slabs (FY 2024-25 onwards):
 *   0 - 3L     : 0%
 *   3L - 6L    : 5%
 *   6L - 9L    : 10%
 *   9L - 12L   : 15%
 *   12L - 15L  : 20%
 *   > 15L      : 30%
 *
 * Standard deduction of Rs 50,000 is applied before slab computation.
 * Health and Education Cess of 4% is added on top of the slab tax.
 *
 * @param annualIncome - Gross annual income (before deductions)
 * @param regime       - 'old' or 'new' tax regime
 */
export function calculateTDS(annualIncome: number, regime: TaxRegime = 'new'): TdsResult {
  // Apply standard deduction
  const taxableIncome = Math.max(0, annualIncome - IN_STANDARD_DEDUCTION);

  const slabs = regime === 'old' ? IN_OLD_REGIME_SLABS : IN_NEW_REGIME_SLABS;
  const slabTax = computeSlabTax(taxableIncome, slabs);

  // Add cess
  const cess = round(slabTax * IN_CESS_RATE, 2);
  const annualTax = round(slabTax + cess, 2);

  // Monthly TDS
  const monthlyTds = round(annualTax / 12, 2);

  // Effective rate
  const effectiveRate = annualIncome > 0
    ? round((annualTax / annualIncome) * 100, 2)
    : 0;

  return {
    annualTax,
    monthlyTds,
    effectiveRate,
    regime,
  };
}

/**
 * Generate a consolidated payroll summary from an array of payslips.
 *
 * Computes:
 *   - Grand totals (gross, deductions, net)
 *   - Per-department breakdown with headcount and averages
 *   - Cost per head
 *   - Payroll-to-revenue ratio (null if revenue is not provided)
 *
 * @param payslips       - Array of payslip records
 * @param companyRevenue - Optional monthly company revenue for ratio calculation
 */
export function generatePayrollSummary(
  payslips: PayslipInput[],
  companyRevenue?: number,
): PayrollSummary {
  if (payslips.length === 0) {
    return {
      totals: { totalGross: 0, totalDeductions: 0, totalNet: 0, headcount: 0 },
      byDepartment: [],
      costPerHead: 0,
      payrollToRevenue: null,
    };
  }

  // Deduplicate employees for headcount
  const uniqueEmployees = new Set(payslips.map((p) => p.employeeId));
  const headcount = uniqueEmployees.size;

  const totalGross = round(payslips.reduce((sum, p) => sum + p.grossEarnings, 0), 2);
  const totalDeductions = round(payslips.reduce((sum, p) => sum + p.totalDeductions, 0), 2);
  const totalNet = round(payslips.reduce((sum, p) => sum + p.netPay, 0), 2);

  // Department breakdown
  const grouped = groupBy(payslips, (p) => p.department);
  const byDepartment: DepartmentPayrollSummary[] = Object.entries(grouped).map(
    ([department, deptPayslips]) => {
      const deptEmployees = new Set(deptPayslips.map((p) => p.employeeId));
      const deptHeadcount = deptEmployees.size;
      const deptGross = round(deptPayslips.reduce((s, p) => s + p.grossEarnings, 0), 2);
      const deptDeductions = round(deptPayslips.reduce((s, p) => s + p.totalDeductions, 0), 2);
      const deptNet = round(deptPayslips.reduce((s, p) => s + p.netPay, 0), 2);

      return {
        department,
        headcount: deptHeadcount,
        totalGross: deptGross,
        totalDeductions: deptDeductions,
        totalNet: deptNet,
        avgGross: round(deptGross / deptHeadcount, 2),
      };
    },
  );

  // Sort departments by total gross descending
  byDepartment.sort((a, b) => b.totalGross - a.totalGross);

  const costPerHead = round(totalGross / headcount, 2);

  const payrollToRevenue =
    companyRevenue && companyRevenue > 0
      ? round((totalGross / companyRevenue) * 100, 2)
      : null;

  return {
    totals: { totalGross, totalDeductions, totalNet, headcount },
    byDepartment,
    costPerHead,
    payrollToRevenue,
  };
}

/**
 * Calculate leave encashment amount and associated tax implications.
 *
 * Encashable days = min(leave balance, maxEncashable).
 * Gross amount = encashable days * daily rate.
 *
 * India tax exemption (on retirement / resignation):
 *   Exempt = least of:
 *     (a) Actual encashment amount
 *     (b) 10 months of average salary
 *     (c) INR 25,00,000 (ceiling)
 *     (d) Leave balance * (daily rate equivalent) — based on max 30 days per year of service
 *   Taxable = gross - exempt.
 *
 * For other countries, the full amount is generally taxable as income.
 *
 * @param input - LeaveEncashmentInput with daily rate, balance, max encashable, etc.
 */
export function calculateLeaveEncashment(input: LeaveEncashmentInput): LeaveEncashmentResult {
  const { dailyRate, balance, maxEncashable, country, avgMonthlySalary, completedYears } = input;

  const encashableDays = Math.min(balance, maxEncashable);
  const grossAmount = round(encashableDays * dailyRate, 2);

  const code = normalizeCountry(country ?? 'IN');

  if (code === 'IN') {
    return calculateIndiaLeaveEncashment(
      encashableDays,
      grossAmount,
      dailyRate,
      avgMonthlySalary ?? dailyRate * 30,
      completedYears ?? 0,
    );
  }

  // For non-India countries, leave encashment is fully taxable income
  return {
    encashableDays,
    grossAmount,
    taxableAmount: grossAmount,
    netAmount: grossAmount, // net before income tax; actual tax depends on slab
    exemptAmount: 0,
  };
}

/**
 * India-specific leave encashment exemption calculation (Section 10(10AA)).
 */
function calculateIndiaLeaveEncashment(
  encashableDays: number,
  grossAmount: number,
  dailyRate: number,
  avgMonthlySalary: number,
  completedYears: number,
): LeaveEncashmentResult {
  // (a) Actual encashment received
  const limitA = grossAmount;

  // (b) 10 months of average salary
  const limitB = round(avgMonthlySalary * IN_LEAVE_ENCASHMENT_EXEMPT_MONTHS, 2);

  // (c) Statutory ceiling
  const limitC = IN_LEAVE_ENCASHMENT_MAX_EXEMPT;

  // (d) Leave entitlement based on service: 30 days per completed year, valued at daily rate
  const maxDaysByService = completedYears * 30;
  const limitD = round(Math.min(encashableDays, maxDaysByService) * dailyRate, 2);

  const exemptAmount = round(Math.min(limitA, limitB, limitC, limitD), 2);
  const taxableAmount = round(Math.max(0, grossAmount - exemptAmount), 2);

  return {
    encashableDays,
    grossAmount,
    taxableAmount,
    netAmount: grossAmount, // gross before tax; deductions depend on slab
    exemptAmount,
  };
}
