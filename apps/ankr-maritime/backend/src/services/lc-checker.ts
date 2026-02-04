// lc-checker.ts
// Letter of Credit compliance and validation service: document requirements,
// LC validation, Incoterms 2020 reference, and utilization calculations.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LCRequirement {
  documentType: string
  required: boolean
  copies: number
  originals: number
}

export interface LCValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  missingDocuments: string[]
  expiryStatus: 'active' | 'expiring_soon' | 'expired'
  daysToExpiry: number
  drawingCapacity: { drawn: number; available: number; currency: string }
}

export interface IncotermsInfo {
  code: string
  name: string
  riskTransfer: string
  sellerObligations: string[]
  buyerObligations: string[]
  requiredDocuments: string[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of days before expiry that triggers an "expiring_soon" warning. */
const EXPIRY_WARNING_DAYS = 30

/** Milliseconds in one calendar day. */
const MS_PER_DAY = 1000 * 60 * 60 * 24

/** Incoterms codes that require insurance certificates under CIF/CIP rules. */
const INSURANCE_REQUIRED_INCOTERMS = ['CIF', 'CIP']

/** Full Incoterms 2020 reference table. */
const INCOTERMS_2020: Record<string, IncotermsInfo> = {
  EXW: {
    code: 'EXW',
    name: 'Ex Works',
    riskTransfer: 'At seller\'s premises when goods are placed at buyer\'s disposal',
    sellerObligations: [
      'Make goods available at premises',
      'Provide commercial invoice',
      'Assist with export formalities if requested by buyer',
    ],
    buyerObligations: [
      'Collect goods from seller\'s premises',
      'Arrange and pay for all transport',
      'Handle export and import clearance',
      'Bear all risks from seller\'s premises',
    ],
    requiredDocuments: ['commercial_invoice', 'packing_list'],
  },
  FCA: {
    code: 'FCA',
    name: 'Free Carrier',
    riskTransfer: 'When goods are delivered to the carrier at the named place',
    sellerObligations: [
      'Deliver goods to carrier at named place',
      'Clear goods for export',
      'Provide commercial invoice and transport document',
    ],
    buyerObligations: [
      'Arrange and pay for main carriage',
      'Handle import clearance',
      'Bear risks after delivery to carrier',
    ],
    requiredDocuments: ['commercial_invoice', 'packing_list', 'certificate_of_origin'],
  },
  FAS: {
    code: 'FAS',
    name: 'Free Alongside Ship',
    riskTransfer: 'When goods are placed alongside the vessel at the named port of shipment',
    sellerObligations: [
      'Deliver goods alongside the vessel',
      'Clear goods for export',
      'Provide proof of delivery alongside vessel',
    ],
    buyerObligations: [
      'Arrange and pay for ocean freight',
      'Load goods onto vessel',
      'Handle import clearance',
      'Bear risks after goods placed alongside vessel',
    ],
    requiredDocuments: ['commercial_invoice', 'packing_list', 'certificate_of_origin'],
  },
  FOB: {
    code: 'FOB',
    name: 'Free On Board',
    riskTransfer: 'When goods pass the ship\'s rail at the named port of shipment',
    sellerObligations: [
      'Deliver goods on board the vessel',
      'Clear goods for export',
      'Provide bill of lading or transport document',
    ],
    buyerObligations: [
      'Arrange and pay for ocean freight',
      'Handle import clearance',
      'Bear risks after goods are on board',
    ],
    requiredDocuments: ['commercial_invoice', 'packing_list', 'bill_of_lading', 'certificate_of_origin'],
  },
  CFR: {
    code: 'CFR',
    name: 'Cost and Freight',
    riskTransfer: 'When goods pass the ship\'s rail at the port of shipment',
    sellerObligations: [
      'Deliver goods on board the vessel',
      'Arrange and pay freight to destination port',
      'Clear goods for export',
      'Provide bill of lading',
    ],
    buyerObligations: [
      'Handle import clearance',
      'Bear risks after goods are on board at port of shipment',
      'Arrange and pay for insurance (if desired)',
    ],
    requiredDocuments: ['commercial_invoice', 'packing_list', 'bill_of_lading', 'certificate_of_origin'],
  },
  CIF: {
    code: 'CIF',
    name: 'Cost, Insurance and Freight',
    riskTransfer: 'When goods pass the ship\'s rail at the port of shipment',
    sellerObligations: [
      'Deliver goods on board the vessel',
      'Arrange and pay freight to destination port',
      'Procure marine insurance (minimum ICC clause C)',
      'Clear goods for export',
      'Provide bill of lading and insurance certificate',
    ],
    buyerObligations: [
      'Handle import clearance',
      'Bear risks after goods are on board at port of shipment',
    ],
    requiredDocuments: [
      'commercial_invoice', 'packing_list', 'bill_of_lading',
      'certificate_of_origin', 'insurance_certificate',
    ],
  },
  CPT: {
    code: 'CPT',
    name: 'Carriage Paid To',
    riskTransfer: 'When goods are delivered to the first carrier',
    sellerObligations: [
      'Deliver goods to carrier',
      'Arrange and pay for carriage to destination',
      'Clear goods for export',
    ],
    buyerObligations: [
      'Handle import clearance',
      'Bear risks after delivery to first carrier',
      'Arrange insurance if desired',
    ],
    requiredDocuments: ['commercial_invoice', 'packing_list', 'transport_document', 'certificate_of_origin'],
  },
  CIP: {
    code: 'CIP',
    name: 'Carriage and Insurance Paid To',
    riskTransfer: 'When goods are delivered to the first carrier',
    sellerObligations: [
      'Deliver goods to carrier',
      'Arrange and pay for carriage to destination',
      'Procure insurance (minimum ICC clause A — all risks)',
      'Clear goods for export',
    ],
    buyerObligations: [
      'Handle import clearance',
      'Bear risks after delivery to first carrier',
    ],
    requiredDocuments: [
      'commercial_invoice', 'packing_list', 'transport_document',
      'certificate_of_origin', 'insurance_certificate',
    ],
  },
  DAP: {
    code: 'DAP',
    name: 'Delivered at Place',
    riskTransfer: 'When goods are placed at buyer\'s disposal at the named destination, ready for unloading',
    sellerObligations: [
      'Deliver goods to named place of destination',
      'Arrange and pay for carriage to destination',
      'Clear goods for export',
      'Bear all risks until goods reach destination',
    ],
    buyerObligations: [
      'Unload goods at destination',
      'Handle import clearance and duties',
    ],
    requiredDocuments: ['commercial_invoice', 'packing_list', 'transport_document', 'certificate_of_origin'],
  },
  DPU: {
    code: 'DPU',
    name: 'Delivered at Place Unloaded',
    riskTransfer: 'When goods are unloaded at the named destination',
    sellerObligations: [
      'Deliver and unload goods at named destination',
      'Arrange and pay for carriage to destination',
      'Clear goods for export',
      'Bear all risks until goods are unloaded',
    ],
    buyerObligations: [
      'Handle import clearance and duties',
    ],
    requiredDocuments: ['commercial_invoice', 'packing_list', 'transport_document', 'certificate_of_origin'],
  },
  DDP: {
    code: 'DDP',
    name: 'Delivered Duty Paid',
    riskTransfer: 'When goods are placed at buyer\'s disposal at the named destination, cleared for import',
    sellerObligations: [
      'Deliver goods to named destination',
      'Arrange and pay for all carriage',
      'Clear goods for both export and import',
      'Pay all duties, taxes, and customs formalities',
      'Bear all risks until destination',
    ],
    buyerObligations: [
      'Unload goods at destination (unless otherwise agreed)',
    ],
    requiredDocuments: [
      'commercial_invoice', 'packing_list', 'transport_document',
      'certificate_of_origin', 'import_clearance_documents',
    ],
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Calculate the number of calendar days between two dates.
 * Returns a negative value when `target` is in the past relative to `from`.
 */
function daysBetween(from: Date, target: Date): number {
  const diffMs = target.getTime() - from.getTime()
  return Math.floor(diffMs / MS_PER_DAY)
}

// ---------------------------------------------------------------------------
// 1. Standard Document Requirements
// ---------------------------------------------------------------------------

/**
 * Return the standard set of document requirements for a given LC type and
 * Incoterms rule.
 *
 * LC types supported:
 *   - "irrevocable" (most common) — full documentary set
 *   - "standby" — demand-based, minimal document set
 *   - Anything else defaults to irrevocable requirements
 *
 * The `incoterms` parameter adjusts requirements:
 *   - CIF / CIP: insurance certificate is required
 *   - FOB / FCA / CFR / others: insurance certificate is not required
 *
 * @param lcType    - Type of letter of credit
 * @param incoterms - Optional Incoterms 2020 code (e.g. "CIF", "FOB")
 */
export function getStandardDocuments(
  lcType: string,
  incoterms?: string,
): LCRequirement[] {
  const normalizedType = lcType.toLowerCase().trim()
  const normalizedIncoterms = incoterms?.toUpperCase().trim()

  // --- Standby LC: minimal requirement set ---
  if (normalizedType === 'standby') {
    return [
      { documentType: 'demand_letter', required: true, copies: 1, originals: 1 },
      { documentType: 'statement_of_default', required: true, copies: 1, originals: 1 },
    ]
  }

  // --- Irrevocable / default: full documentary credit requirement set ---
  const needsInsurance = normalizedIncoterms
    ? INSURANCE_REQUIRED_INCOTERMS.includes(normalizedIncoterms)
    : false

  const documents: LCRequirement[] = [
    { documentType: 'commercial_invoice', required: true, copies: 3, originals: 1 },
    { documentType: 'packing_list', required: true, copies: 3, originals: 1 },
    { documentType: 'bill_of_lading', required: true, copies: 0, originals: 3 },
    { documentType: 'certificate_of_origin', required: true, copies: 2, originals: 1 },
  ]

  if (needsInsurance) {
    documents.push({
      documentType: 'insurance_certificate',
      required: true,
      copies: 1,
      originals: 1,
    })
  }

  // If incoterms reference includes additional known document requirements,
  // enrich the list without duplicating.
  if (normalizedIncoterms && INCOTERMS_2020[normalizedIncoterms]) {
    const incoDocs = INCOTERMS_2020[normalizedIncoterms].requiredDocuments
    const existingTypes = new Set(documents.map((d) => d.documentType))
    for (const docType of incoDocs) {
      if (!existingTypes.has(docType)) {
        documents.push({ documentType: docType, required: true, copies: 1, originals: 1 })
      }
    }
  }

  return documents
}

// ---------------------------------------------------------------------------
// 2. LC Compliance Validation
// ---------------------------------------------------------------------------

/**
 * Perform a comprehensive compliance check on a Letter of Credit.
 *
 * Validates:
 *   - All required documents are submitted and not discrepant
 *   - LC has not expired; warns if expiring within 30 days
 *   - Latest shipment date has not been exceeded
 *   - Drawing capacity remains within the LC amount plus tolerance
 *
 * @param lc        - Core LC data
 * @param documents - Documents presented against the LC
 * @param drawings  - Drawings (payments) already made or pending
 */
export function validateLCCompliance(
  lc: {
    amount: number
    currency: string
    expiryDate: Date
    latestShipment: Date
    type: string
    status: string
    tolerancePercent: number
  },
  documents: Array<{
    documentType: string
    status: string
    required: boolean
  }>,
  drawings: Array<{
    amount: number
    status: string
  }>,
): LCValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const missingDocuments: string[] = []

  const now = new Date()

  // --- 1. Expiry assessment ---
  const daysToExpiry = daysBetween(now, new Date(lc.expiryDate))
  let expiryStatus: 'active' | 'expiring_soon' | 'expired'

  if (daysToExpiry < 0) {
    expiryStatus = 'expired'
    errors.push(`LC expired ${Math.abs(daysToExpiry)} day(s) ago on ${new Date(lc.expiryDate).toISOString().slice(0, 10)}`)
  } else if (daysToExpiry <= EXPIRY_WARNING_DAYS) {
    expiryStatus = 'expiring_soon'
    warnings.push(`LC expiring in ${daysToExpiry} day(s) on ${new Date(lc.expiryDate).toISOString().slice(0, 10)}`)
  } else {
    expiryStatus = 'active'
  }

  // --- 2. Latest shipment date check ---
  const daysToLatestShipment = daysBetween(now, new Date(lc.latestShipment))
  if (daysToLatestShipment < 0) {
    errors.push(
      `Latest shipment date exceeded by ${Math.abs(daysToLatestShipment)} day(s) — was ${new Date(lc.latestShipment).toISOString().slice(0, 10)}`,
    )
  } else if (daysToLatestShipment <= 7) {
    warnings.push(
      `Latest shipment date is in ${daysToLatestShipment} day(s) on ${new Date(lc.latestShipment).toISOString().slice(0, 10)}`,
    )
  }

  // --- 3. Document compliance ---
  const requiredDocs = documents.filter((d) => d.required)
  const submittedTypes = new Set(
    documents
      .filter((d) => d.status === 'submitted' || d.status === 'approved' || d.status === 'accepted')
      .map((d) => d.documentType),
  )

  for (const doc of requiredDocs) {
    if (!submittedTypes.has(doc.documentType)) {
      missingDocuments.push(doc.documentType)
    }
  }

  if (missingDocuments.length > 0) {
    errors.push(`${missingDocuments.length} required document(s) not submitted: ${missingDocuments.join(', ')}`)
  }

  // Check for discrepant documents
  const discrepantDocs = documents.filter((d) => d.status === 'discrepant')
  if (discrepantDocs.length > 0) {
    const discrepantTypes = discrepantDocs.map((d) => d.documentType).join(', ')
    errors.push(`${discrepantDocs.length} document(s) marked as discrepant: ${discrepantTypes}`)
  }

  // Check for documents still under review
  const pendingDocs = documents.filter(
    (d) => d.required && (d.status === 'pending' || d.status === 'under_review'),
  )
  if (pendingDocs.length > 0) {
    warnings.push(`${pendingDocs.length} required document(s) still pending review`)
  }

  // --- 4. Drawing capacity ---
  const utilization = calculateLCUtilization(lc.amount, lc.tolerancePercent, drawings)

  if (utilization.available < 0) {
    errors.push(
      `LC over-drawn by ${lc.currency} ${round(Math.abs(utilization.available))} — ` +
      `total drawn ${lc.currency} ${round(utilization.totalDrawn)} exceeds ` +
      `maximum ${lc.currency} ${round(lc.amount * (1 + lc.tolerancePercent / 100))}`,
    )
  }

  if (!utilization.withinTolerance) {
    warnings.push(
      `Drawing utilization at ${round(utilization.utilizationPercent)}% — approaching LC limit`,
    )
  }

  // --- 5. LC status check ---
  const activeStatuses = ['active', 'confirmed', 'advised']
  if (!activeStatuses.includes(lc.status.toLowerCase())) {
    errors.push(`LC status is "${lc.status}" — must be active, confirmed, or advised for presentation`)
  }

  const valid = errors.length === 0

  return {
    valid,
    errors,
    warnings,
    missingDocuments,
    expiryStatus,
    daysToExpiry,
    drawingCapacity: {
      drawn: round(utilization.totalDrawn),
      available: round(utilization.available),
      currency: lc.currency,
    },
  }
}

// ---------------------------------------------------------------------------
// 3. Incoterms 2020 Reference
// ---------------------------------------------------------------------------

/**
 * Return detailed information for an Incoterms 2020 rule.
 *
 * Covers all 11 Incoterms 2020 codes:
 *   EXW, FCA, FAS, FOB, CFR, CIF, CPT, CIP, DAP, DPU, DDP
 *
 * @param code - Incoterms code (case-insensitive)
 * @returns    IncotermsInfo or null if the code is not recognized
 */
export function getIncotermsInfo(code: string): IncotermsInfo | null {
  const normalized = code.toUpperCase().trim()
  return INCOTERMS_2020[normalized] ?? null
}

// ---------------------------------------------------------------------------
// 4. LC Utilization Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate LC utilization metrics based on accepted/paid drawings.
 *
 * The maximum drawable amount accounts for the tolerance percentage:
 *   maxAmount = amount * (1 + tolerancePercent / 100)
 *
 * Only drawings with status "accepted" or "paid" are counted toward
 * the total drawn amount. Pending or rejected drawings are excluded.
 *
 * @param amount           - LC face value
 * @param tolerancePercent - Tolerance percentage (e.g. 10 for +/- 10%)
 * @param drawings         - Array of drawings with amount and status
 */
export function calculateLCUtilization(
  amount: number,
  tolerancePercent: number,
  drawings: Array<{ amount: number; status: string }>,
): {
  totalDrawn: number
  available: number
  utilizationPercent: number
  withinTolerance: boolean
} {
  const maxAmount = amount * (1 + tolerancePercent / 100)

  const countedStatuses = ['accepted', 'paid', 'honoured', 'settled']
  const totalDrawn = drawings
    .filter((d) => countedStatuses.includes(d.status.toLowerCase()))
    .reduce((sum, d) => sum + d.amount, 0)

  const available = round(maxAmount - totalDrawn)
  const utilizationPercent = maxAmount > 0 ? round((totalDrawn / maxAmount) * 100, 2) : 0
  const withinTolerance = totalDrawn <= maxAmount

  return {
    totalDrawn: round(totalDrawn),
    available,
    utilizationPercent,
    withinTolerance,
  }
}
