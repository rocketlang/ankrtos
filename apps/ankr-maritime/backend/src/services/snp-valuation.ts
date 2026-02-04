// snp-valuation.ts
// Ship Broking (S&P) vessel valuation service: comparable sales, DCF, replacement cost, scrap floor, ensemble.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VesselSpec {
  type: string // bulk_carrier, tanker, container, general_cargo
  dwt: number
  yearBuilt: number
  flag: string
  classificationSociety?: string
}

export interface ComparableSale {
  vesselType: string
  dwt: number
  yearBuilt: number
  salePrice: number
  saleDate: Date
}

export interface ValuationResult {
  method: string
  value: number
  currency: string
  confidence: 'high' | 'medium' | 'low'
  factors: Record<string, number>
  notes: string[]
}

export interface EnsembleValuation {
  comparableValue: ValuationResult | null
  dcfValue: ValuationResult | null
  replacementCostValue: ValuationResult | null
  scrapFloorValue: ValuationResult
  ensembleValue: number
  currency: string
  methodology: string
}

export interface TCParams {
  dailyTCE: number
  opex: number
  remainingLifeYears: number
  discountRate: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Standard economic life assumptions by vessel type (years). */
const DEFAULT_ECONOMIC_LIFE: Record<string, number> = {
  bulk_carrier: 25,
  tanker: 25,
  container: 25,
  general_cargo: 30,
}

/** LDT-to-DWT ratio by vessel type used for scrap value estimates. */
const LDT_FACTOR: Record<string, number> = {
  bulk_carrier: 0.30,
  tanker: 0.35,
  container: 0.25,
  general_cargo: 0.30,
}

/** Default scrap LDT price (USD/LDT) when not supplied — Indian subcontinent average. */
const DEFAULT_LDT_PRICE_USD = 500

/** Annual depreciation rate used for age-adjustment of comparable sales. */
const AGE_ADJUSTMENT_RATE = 0.05

/** DWT tolerance band for filtering comparables (plus / minus). */
const DWT_TOLERANCE = 0.20

/** Number of trading days per year used in DCF calculations. */
const TRADING_DAYS_PER_YEAR = 350

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

function currentYear(): number {
  return new Date().getFullYear()
}

function monthsBetween(a: Date, b: Date): number {
  const msPerMonth = 1000 * 60 * 60 * 24 * 30.44
  return Math.abs(b.getTime() - a.getTime()) / msPerMonth
}

function vesselAge(yearBuilt: number): number {
  return currentYear() - yearBuilt
}

function economicLifeFor(vesselType: string): number {
  return DEFAULT_ECONOMIC_LIFE[vesselType] ?? 25
}

function ldtFactorFor(vesselType: string): number {
  return LDT_FACTOR[vesselType] ?? 0.30
}

/**
 * Compute a recency weight for a comparable sale.
 * Sales within 6 months: 1.0, 6-12 months: 0.7, 12-24 months: 0.4, older: 0.1.
 */
function recencyWeight(saleDate: Date, referenceDate: Date): number {
  const months = monthsBetween(saleDate, referenceDate)
  if (months <= 6) return 1.0
  if (months <= 12) return 0.7
  if (months <= 24) return 0.4
  return 0.1
}

/**
 * Compute a base scrap value for a vessel using DWT, LDT factor, and LDT price.
 */
function computeScrapValue(dwt: number, vesselType: string, ldtPrice: number): number {
  const factor = ldtFactorFor(vesselType)
  return round(dwt * factor * ldtPrice, 0)
}

// ---------------------------------------------------------------------------
// 1. Comparable Sales Valuation
// ---------------------------------------------------------------------------

/**
 * Value a vessel based on recent comparable sales.
 *
 * Filtering:
 * - Same vessel type
 * - DWT within +/- 20% of the subject vessel
 *
 * Adjustments per comparable:
 * - Age adjustment: 5% discount per year of age difference
 * - Size adjustment: linear interpolation by DWT ratio
 * - Recency weighting: newer sales weighted more heavily
 *
 * Confidence:
 * - high   >= 5 filtered comparables
 * - medium >= 2
 * - low    < 2
 */
export function comparableValuation(
  vessel: VesselSpec,
  comparables: ComparableSale[],
): ValuationResult {
  const now = new Date()
  const notes: string[] = []
  const factors: Record<string, number> = {}

  // --- Filter ---
  const dwtLow = vessel.dwt * (1 - DWT_TOLERANCE)
  const dwtHigh = vessel.dwt * (1 + DWT_TOLERANCE)

  const filtered = comparables.filter(
    (c) => c.vesselType === vessel.type && c.dwt >= dwtLow && c.dwt <= dwtHigh,
  )

  factors['totalComparables'] = comparables.length
  factors['filteredComparables'] = filtered.length
  notes.push(`Filtered ${filtered.length} of ${comparables.length} comparables (type=${vessel.type}, DWT +/-${DWT_TOLERANCE * 100}%)`)

  if (filtered.length === 0) {
    notes.push('No suitable comparables found; returning zero value')
    return {
      method: 'comparable_sales',
      value: 0,
      currency: 'USD',
      confidence: 'low',
      factors,
      notes,
    }
  }

  // --- Confidence ---
  let confidence: 'high' | 'medium' | 'low'
  if (filtered.length >= 5) {
    confidence = 'high'
  } else if (filtered.length >= 2) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  // --- Adjust each comparable ---
  const subjectAge = vesselAge(vessel.yearBuilt)
  let weightedSum = 0
  let weightSum = 0

  for (const comp of filtered) {
    const compAge = vesselAge(comp.yearBuilt)
    const ageDiff = subjectAge - compAge // positive = subject is older
    const ageAdjustment = 1 - ageDiff * AGE_ADJUSTMENT_RATE
    const clampedAgeAdj = Math.max(ageAdjustment, 0.10) // floor at 10%

    // Size adjustment: linear ratio — if subject is bigger, price scales up
    const sizeRatio = vessel.dwt / comp.dwt

    // Recency
    const rWeight = recencyWeight(comp.saleDate, now)

    const adjustedPrice = comp.salePrice * clampedAgeAdj * sizeRatio
    weightedSum += adjustedPrice * rWeight
    weightSum += rWeight
  }

  const weightedAvg = weightSum > 0 ? round(weightedSum / weightSum, 0) : 0

  factors['subjectAge'] = subjectAge
  factors['ageAdjustmentRate'] = AGE_ADJUSTMENT_RATE
  factors['dwtTolerancePct'] = DWT_TOLERANCE * 100
  factors['weightedAverageValue'] = weightedAvg

  notes.push(`Subject vessel age: ${subjectAge} years`)
  notes.push(`Weighted average adjusted value: $${weightedAvg.toLocaleString()}`)

  return {
    method: 'comparable_sales',
    value: weightedAvg,
    currency: 'USD',
    confidence,
    factors,
    notes,
  }
}

// ---------------------------------------------------------------------------
// 2. DCF (Discounted Cash Flow) Valuation
// ---------------------------------------------------------------------------

/**
 * Value a vessel using discounted cash flow of future time-charter earnings.
 *
 * Annual net earnings = (dailyTCE - opex) * 350 trading days.
 * DCF = sum of netEarnings / (1 + discountRate)^year for each remaining year.
 * Terminal scrap value added at end of economic life (discounted).
 *
 * Confidence:
 * - high   if remainingLife >= 10 and daily TCE > opex by > 30%
 * - medium if remainingLife >= 5
 * - low    otherwise
 */
export function dcfValuation(
  vessel: VesselSpec,
  dailyTCE: number,
  opex: number,
  remainingLifeYears: number,
  discountRate: number,
): ValuationResult {
  const notes: string[] = []
  const factors: Record<string, number> = {}

  const annualNetEarnings = (dailyTCE - opex) * TRADING_DAYS_PER_YEAR
  factors['dailyTCE'] = dailyTCE
  factors['dailyOpex'] = opex
  factors['dailyNetEarnings'] = round(dailyTCE - opex, 2)
  factors['annualNetEarnings'] = round(annualNetEarnings, 0)
  factors['tradingDaysPerYear'] = TRADING_DAYS_PER_YEAR
  factors['discountRate'] = discountRate
  factors['remainingLifeYears'] = remainingLifeYears

  notes.push(`Daily net earnings: $${round(dailyTCE - opex, 0).toLocaleString()} (TCE $${dailyTCE.toLocaleString()} - OPEX $${opex.toLocaleString()})`)
  notes.push(`Annual net earnings (${TRADING_DAYS_PER_YEAR} trading days): $${round(annualNetEarnings, 0).toLocaleString()}`)

  // --- DCF summation ---
  let dcfTotal = 0
  for (let year = 1; year <= remainingLifeYears; year++) {
    const pv = annualNetEarnings / Math.pow(1 + discountRate, year)
    dcfTotal += pv
  }

  // Terminal / scrap value at end of life
  const scrapAtEnd = computeScrapValue(vessel.dwt, vessel.type, DEFAULT_LDT_PRICE_USD)
  const pvScrap = scrapAtEnd / Math.pow(1 + discountRate, remainingLifeYears)
  dcfTotal += pvScrap

  factors['pvOfEarnings'] = round(dcfTotal - pvScrap, 0)
  factors['pvOfScrap'] = round(pvScrap, 0)
  factors['scrapValueUndiscounted'] = scrapAtEnd

  const value = round(Math.max(dcfTotal, 0), 0)

  notes.push(`PV of earnings over ${remainingLifeYears} years: $${round(dcfTotal - pvScrap, 0).toLocaleString()}`)
  notes.push(`PV of terminal scrap: $${round(pvScrap, 0).toLocaleString()}`)
  notes.push(`Total DCF value: $${value.toLocaleString()}`)

  // --- Confidence ---
  let confidence: 'high' | 'medium' | 'low'
  const tceMargin = opex > 0 ? (dailyTCE - opex) / opex : 0
  if (remainingLifeYears >= 10 && tceMargin > 0.30) {
    confidence = 'high'
  } else if (remainingLifeYears >= 5) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  return {
    method: 'dcf',
    value,
    currency: 'USD',
    confidence,
    factors,
    notes,
  }
}

// ---------------------------------------------------------------------------
// 3. Replacement Cost (Depreciated) Valuation
// ---------------------------------------------------------------------------

/**
 * Value a vessel using depreciated replacement cost.
 *
 * Replacement value = newbuildPrice * (remainingUsefulLife / economicLife) * conditionFactor.
 * Floored at scrap value so result is never below steel value.
 *
 * Condition factor:
 * - 0.95 for vessels <= 10 years (assumed well-maintained)
 * - 0.90 for vessels <= 20 years
 * - 0.85 for older vessels
 */
export function replacementCostValuation(
  vessel: VesselSpec,
  newbuildPrice: number,
  economicLife?: number,
): ValuationResult {
  const notes: string[] = []
  const factors: Record<string, number> = {}

  const ecoLife = economicLife ?? economicLifeFor(vessel.type)
  const age = vesselAge(vessel.yearBuilt)
  const remainingLife = Math.max(ecoLife - age, 0)
  const remainingProportion = ecoLife > 0 ? remainingLife / ecoLife : 0

  // Condition factor based on age
  let conditionFactor: number
  if (age <= 10) {
    conditionFactor = 0.95
  } else if (age <= 20) {
    conditionFactor = 0.90
  } else {
    conditionFactor = 0.85
  }

  const rawValue = newbuildPrice * remainingProportion * conditionFactor
  const scrapFloor = computeScrapValue(vessel.dwt, vessel.type, DEFAULT_LDT_PRICE_USD)
  const value = round(Math.max(rawValue, scrapFloor), 0)

  factors['newbuildPrice'] = newbuildPrice
  factors['economicLife'] = ecoLife
  factors['vesselAge'] = age
  factors['remainingLife'] = remainingLife
  factors['remainingProportion'] = round(remainingProportion, 4)
  factors['conditionFactor'] = conditionFactor
  factors['rawDepreciatedValue'] = round(rawValue, 0)
  factors['scrapFloor'] = scrapFloor

  notes.push(`Vessel age: ${age} years, economic life: ${ecoLife} years`)
  notes.push(`Remaining useful life proportion: ${round(remainingProportion * 100, 1)}%`)
  notes.push(`Condition factor: ${conditionFactor} (age bracket ${age <= 10 ? '<=10y' : age <= 20 ? '11-20y' : '>20y'})`)
  notes.push(`Raw depreciated value: $${round(rawValue, 0).toLocaleString()}`)
  if (rawValue < scrapFloor) {
    notes.push(`Value floored at scrap: $${scrapFloor.toLocaleString()}`)
  }

  // Confidence: high if young vessel with known newbuild pricing
  let confidence: 'high' | 'medium' | 'low'
  if (age <= 10 && remainingProportion > 0.5) {
    confidence = 'high'
  } else if (remainingProportion > 0.2) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  return {
    method: 'replacement_cost',
    value,
    currency: 'USD',
    confidence,
    factors,
    notes,
  }
}

// ---------------------------------------------------------------------------
// 4. Scrap (Demolition) Valuation
// ---------------------------------------------------------------------------

/**
 * Floor valuation based on lightweight tonnage and prevailing scrap price.
 *
 * LDT estimate = DWT * ldtFactor (vessel-type specific).
 * Scrap value  = LDT * ldtPrice (USD per LDT).
 *
 * Always returns high confidence because scrap prices are market-observable.
 */
export function scrapValuation(
  vessel: VesselSpec,
  ldtPrice: number,
): ValuationResult {
  const notes: string[] = []
  const factors: Record<string, number> = {}

  const factor = ldtFactorFor(vessel.type)
  const estimatedLDT = round(vessel.dwt * factor, 0)
  const value = round(estimatedLDT * ldtPrice, 0)

  factors['dwt'] = vessel.dwt
  factors['ldtFactor'] = factor
  factors['estimatedLDT'] = estimatedLDT
  factors['ldtPricePerTon'] = ldtPrice

  notes.push(`Vessel type: ${vessel.type}, DWT: ${vessel.dwt.toLocaleString()}`)
  notes.push(`LDT factor: ${factor} => estimated LDT: ${estimatedLDT.toLocaleString()} tonnes`)
  notes.push(`Scrap value at $${ldtPrice}/LDT: $${value.toLocaleString()}`)

  return {
    method: 'scrap_demolition',
    value,
    currency: 'USD',
    confidence: 'high',
    factors,
    notes,
  }
}

// ---------------------------------------------------------------------------
// 5. Ensemble Valuation
// ---------------------------------------------------------------------------

/** Default ensemble weights. */
const ENSEMBLE_WEIGHTS = {
  comparable: 0.40,
  dcf: 0.30,
  replacement: 0.20,
  scrap: 0.10,
}

/**
 * Run all four valuation methods and combine into a weighted ensemble value.
 *
 * Weight redistribution rules:
 * - If comparable confidence is 'low', its weight (40%) is redistributed to DCF (+25%) and replacement (+15%).
 * - If DCF produces a null/zero result (e.g. negative earnings), redistribute to comparable and replacement.
 * - Final ensemble value is always floored at the scrap demolition value.
 */
export function ensembleValuation(
  vessel: VesselSpec,
  comparables: ComparableSale[],
  tcParams: TCParams,
  newbuildPrice: number,
  ldtPrice: number,
): EnsembleValuation {
  // --- Run individual methods ---
  const compResult = comparableValuation(vessel, comparables)
  const dcfResult = dcfValuation(
    vessel,
    tcParams.dailyTCE,
    tcParams.opex,
    tcParams.remainingLifeYears,
    tcParams.discountRate,
  )
  const replResult = replacementCostValuation(vessel, newbuildPrice)
  const scrapResult = scrapValuation(vessel, ldtPrice)

  // --- Determine effective weights ---
  let wComp = ENSEMBLE_WEIGHTS.comparable
  let wDcf = ENSEMBLE_WEIGHTS.dcf
  let wRepl = ENSEMBLE_WEIGHTS.replacement
  let wScrap = ENSEMBLE_WEIGHTS.scrap

  const methodologyParts: string[] = []

  // Redistribute if comparable confidence is low
  if (compResult.confidence === 'low' || compResult.value === 0) {
    methodologyParts.push('Comparable confidence low — redistributed weight to DCF and replacement cost')
    wDcf += wComp * 0.625  // 25 / 40
    wRepl += wComp * 0.375 // 15 / 40
    wComp = 0
  }

  // Redistribute if DCF produced zero or negative
  if (dcfResult.value <= 0) {
    methodologyParts.push('DCF value non-positive — redistributed weight to comparable and replacement cost')
    if (wComp > 0) {
      wComp += wDcf * 0.6
      wRepl += wDcf * 0.4
    } else {
      wRepl += wDcf
    }
    wDcf = 0
  }

  // Normalize weights to ensure they sum to 1.0
  const totalWeight = wComp + wDcf + wRepl + wScrap
  if (totalWeight > 0 && Math.abs(totalWeight - 1.0) > 0.001) {
    wComp /= totalWeight
    wDcf /= totalWeight
    wRepl /= totalWeight
    wScrap /= totalWeight
  }

  methodologyParts.push(
    `Final weights: comparable=${round(wComp * 100, 1)}%, DCF=${round(wDcf * 100, 1)}%, replacement=${round(wRepl * 100, 1)}%, scrap=${round(wScrap * 100, 1)}%`,
  )

  // --- Weighted average ---
  const rawEnsemble =
    compResult.value * wComp +
    dcfResult.value * wDcf +
    replResult.value * wRepl +
    scrapResult.value * wScrap

  // Floor at scrap
  const ensembleValue = round(Math.max(rawEnsemble, scrapResult.value), 0)

  if (rawEnsemble < scrapResult.value) {
    methodologyParts.push(`Ensemble value floored at scrap demolition value ($${scrapResult.value.toLocaleString()})`)
  }

  methodologyParts.push(`Ensemble value: $${ensembleValue.toLocaleString()}`)

  return {
    comparableValue: wComp > 0 ? compResult : null,
    dcfValue: wDcf > 0 ? dcfResult : null,
    replacementCostValue: replResult,
    scrapFloorValue: scrapResult,
    ensembleValue,
    currency: 'USD',
    methodology: methodologyParts.join('. '),
  }
}
