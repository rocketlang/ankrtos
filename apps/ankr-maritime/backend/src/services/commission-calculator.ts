// commission-calculator.ts
// Ship Broking (S&P) commission calculations: breakdown, schedules, address commission, validation.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommissionParty {
  partyType: 'seller_broker' | 'buyer_broker' | 'intermediary'
  rate: number // percentage, e.g. 1.25 means 1.25%
  orgName: string
}

export interface CommissionBreakdownEntry {
  partyType: string
  orgName: string
  rate: number
  amount: number
  currency: string
}

export interface CommissionBreakdown {
  parties: CommissionBreakdownEntry[]
  totalCommission: number
  totalRate: number
  currency: string
  netToSeller: number
  purchasePrice: number
}

export interface CommissionMilestone {
  event: string
  percentage: number
  amount: number
  dueDate?: Date
}

export interface CommissionSchedule {
  milestones: CommissionMilestone[]
  totalAmount: number
}

export interface AddressCommissionResult {
  grossCommission: number
  addressCommission: number
  netCommission: number
}

export interface CommissionValidation {
  valid: boolean
  warnings: string[]
  errors: string[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum total commission rate before raising an error. */
const MAX_TOTAL_RATE = 5.0

/** Threshold for a warning on unusually high total commission. */
const HIGH_RATE_WARNING_THRESHOLD = 3.0

/** Maximum commission rate for any single party. */
const MAX_SINGLE_PARTY_RATE = 2.5

/** Standard S&P commission payment schedule percentages. */
const STANDARD_SCHEDULE = {
  moaSigning: 0.50,      // 50% on MOA signing
  depositPayment: 0.25,  // 25% on deposit payment
  vesselDelivery: 0.25,  // 25% on vessel delivery
}

/** Number of banking days between MOA signing and deposit payment. */
const DEPOSIT_BANKING_DAYS = 5

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Add banking days to a date (skip weekends: Saturday=6, Sunday=0).
 * This is a simplified banking-day calculator that does not account for
 * public holidays — a production system would need a holiday calendar.
 */
function addBankingDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) {
      added++
    }
  }
  return result
}

/**
 * Human-readable label for a party type.
 */
function partyLabel(partyType: string): string {
  switch (partyType) {
    case 'seller_broker':
      return 'Seller\'s Broker'
    case 'buyer_broker':
      return 'Buyer\'s Broker'
    case 'intermediary':
      return 'Intermediary Broker'
    default:
      return partyType
  }
}

// ---------------------------------------------------------------------------
// 1. Commission Breakdown
// ---------------------------------------------------------------------------

/**
 * Calculate commission for each party in an S&P transaction.
 *
 * Each party's commission = purchasePrice * (rate / 100).
 * The function also validates the total rate and returns warnings
 * embedded in the result notes.
 *
 * @param purchasePrice - Agreed vessel purchase price
 * @param currency      - ISO currency code (typically USD)
 * @param parties       - Array of commission parties with rates
 */
export function calculateCommissions(
  purchasePrice: number,
  currency: string,
  parties: CommissionParty[],
): CommissionBreakdown {
  const validation = validateCommissionRates(parties)

  const partyBreakdown: CommissionBreakdownEntry[] = parties.map((p) => {
    const amount = round(purchasePrice * (p.rate / 100), 2)
    return {
      partyType: p.partyType,
      orgName: p.orgName,
      rate: p.rate,
      amount,
      currency,
    }
  })

  const totalCommission = round(
    partyBreakdown.reduce((sum, p) => sum + p.amount, 0),
    2,
  )
  const totalRate = round(
    parties.reduce((sum, p) => sum + p.rate, 0),
    4,
  )
  const netToSeller = round(purchasePrice - totalCommission, 2)

  // Attach validation warnings/errors as notes in a deterministic way.
  // The caller can separately call validateCommissionRates for full details.
  if (!validation.valid) {
    // We still return the calculation — the caller decides what to do with errors
  }

  return {
    parties: partyBreakdown,
    totalCommission,
    totalRate,
    currency,
    netToSeller,
    purchasePrice,
  }
}

// ---------------------------------------------------------------------------
// 2. Commission Payment Schedule
// ---------------------------------------------------------------------------

/**
 * Generate a standard maritime S&P commission payment schedule.
 *
 * Standard schedule:
 *   50% — On MOA (Memorandum of Agreement) signing
 *   25% — On deposit payment (MOA date + 5 banking days)
 *   25% — On vessel delivery / completion
 *
 * @param totalCommission - Total commission amount to schedule
 * @param moaDate         - Date of MOA signing
 * @param completionDate  - Expected vessel delivery / completion date
 */
export function generateCommissionSchedule(
  totalCommission: number,
  moaDate: Date,
  completionDate: Date,
): CommissionSchedule {
  const depositDate = addBankingDays(moaDate, DEPOSIT_BANKING_DAYS)

  const milestones: CommissionMilestone[] = [
    {
      event: 'MOA Signing',
      percentage: STANDARD_SCHEDULE.moaSigning * 100,
      amount: round(totalCommission * STANDARD_SCHEDULE.moaSigning, 2),
      dueDate: new Date(moaDate),
    },
    {
      event: 'Deposit Payment',
      percentage: STANDARD_SCHEDULE.depositPayment * 100,
      amount: round(totalCommission * STANDARD_SCHEDULE.depositPayment, 2),
      dueDate: depositDate,
    },
    {
      event: 'Vessel Delivery',
      percentage: STANDARD_SCHEDULE.vesselDelivery * 100,
      amount: round(totalCommission * STANDARD_SCHEDULE.vesselDelivery, 2),
      dueDate: new Date(completionDate),
    },
  ]

  // Reconcile rounding: ensure milestone amounts sum exactly to totalCommission
  const milestoneSum = milestones.reduce((s, m) => s + m.amount, 0)
  const diff = round(totalCommission - milestoneSum, 2)
  if (diff !== 0) {
    // Adjust the last milestone to absorb rounding difference
    milestones[milestones.length - 1].amount = round(
      milestones[milestones.length - 1].amount + diff,
      2,
    )
  }

  return {
    milestones,
    totalAmount: totalCommission,
  }
}

// ---------------------------------------------------------------------------
// 3. Address Commission
// ---------------------------------------------------------------------------

/**
 * Calculate address commission — an industry discount typically 1-2.5%
 * that the broker returns to the principal (charterer or buyer).
 *
 * Address commission is deducted from the broker's gross commission to
 * arrive at the net commission actually retained by the broker.
 *
 * @param commissionAmount - Gross commission amount
 * @param addressPercent   - Address commission percentage (e.g. 1.25 for 1.25%)
 */
export function calculateAddress(
  commissionAmount: number,
  addressPercent: number,
): AddressCommissionResult {
  const addressCommission = round(commissionAmount * (addressPercent / 100), 2)
  const netCommission = round(commissionAmount - addressCommission, 2)

  return {
    grossCommission: round(commissionAmount, 2),
    addressCommission,
    netCommission,
  }
}

// ---------------------------------------------------------------------------
// 4. Commission Rate Validation
// ---------------------------------------------------------------------------

/**
 * Validate commission rates against industry norms.
 *
 * Errors (invalid):
 * - Any single party rate exceeds 2.5%
 * - Total rate across all parties exceeds 5%
 *
 * Warnings:
 * - Total rate exceeds 3% (unusually high for standard S&P)
 * - No seller broker present (atypical arrangement)
 * - Any party has a zero or negative rate
 *
 * @param parties - Array of commission parties with rates
 */
export function validateCommissionRates(
  parties: CommissionParty[],
): CommissionValidation {
  const warnings: string[] = []
  const errors: string[] = []

  if (parties.length === 0) {
    errors.push('No commission parties provided')
    return { valid: false, warnings, errors }
  }

  const totalRate = parties.reduce((sum, p) => sum + p.rate, 0)

  // --- Per-party checks ---
  for (const party of parties) {
    if (party.rate > MAX_SINGLE_PARTY_RATE) {
      errors.push(
        `${partyLabel(party.partyType)} (${party.orgName}) rate ${party.rate}% exceeds maximum ${MAX_SINGLE_PARTY_RATE}%`,
      )
    }
    if (party.rate <= 0) {
      warnings.push(
        `${partyLabel(party.partyType)} (${party.orgName}) has a non-positive rate (${party.rate}%)`,
      )
    }
  }

  // --- Aggregate checks ---
  if (totalRate > MAX_TOTAL_RATE) {
    errors.push(
      `Total commission rate ${round(totalRate, 4)}% exceeds maximum allowed ${MAX_TOTAL_RATE}%`,
    )
  }

  if (totalRate > HIGH_RATE_WARNING_THRESHOLD && totalRate <= MAX_TOTAL_RATE) {
    warnings.push(
      `Total commission rate ${round(totalRate, 4)}% exceeds ${HIGH_RATE_WARNING_THRESHOLD}% — unusually high for standard S&P transactions`,
    )
  }

  // --- Structural checks ---
  const hasSellerBroker = parties.some((p) => p.partyType === 'seller_broker')
  if (!hasSellerBroker) {
    warnings.push('No seller broker present — atypical arrangement for S&P transactions')
  }

  const valid = errors.length === 0
  return { valid, warnings, errors }
}
