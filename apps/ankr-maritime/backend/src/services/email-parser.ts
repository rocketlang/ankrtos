// email-parser.ts
// Maritime email intelligence parser — extracts entities, classifies categories,
// analyses sentiment, and parses deal terms from shipping-related emails.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailEntities {
  vesselNames: string[]
  portNames: string[]
  cargoTypes: string[]
  dates: { date: string; context: string }[]
  amounts: { value: number; currency: string; context: string }[]
}

export interface DealTerms {
  rate?: { value: number; unit: string }
  laycan?: { from: string; to: string }
  loadPort?: string
  dischargePort?: string
  quantity?: { value: number; unit: string }
  commission?: number
}

export type EmailCategory =
  | 'fixture_negotiation'
  | 'da_request'
  | 'cargo_enquiry'
  | 'laytime_claim'
  | 'bunker_inquiry'
  | 'crew_matter'
  | 'compliance_alert'
  | 'market_report'
  | 'general'

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'urgent'

// ---------------------------------------------------------------------------
// Constants — Regex Patterns
// ---------------------------------------------------------------------------

/**
 * Matches vessel name prefixes commonly used in maritime correspondence.
 * M/V, MV, MT (motor tanker), SS (steamship) followed by the vessel name.
 * Captures the prefix and vessel name separately.
 */
const VESSEL_PATTERN = /\b(?:M\/V|MV|MT|SS)\s+["']?([A-Z][A-Za-z0-9\s\-.]{1,40}?)["']?(?=\s*[,.\-;()\n]|$)/g

/**
 * Common major port names referenced in maritime emails.
 * This list covers the most frequently cited bulk / tanker ports globally.
 */
const PORT_NAMES = [
  'Singapore', 'Rotterdam', 'Fujairah', 'Houston', 'Shanghai', 'Busan',
  'Antwerp', 'Hamburg', 'Piraeus', 'Jeddah', 'Durban', 'Santos',
  'Richards Bay', 'Newcastle', 'Tubarao', 'Dampier', 'Port Hedland',
  'Hay Point', 'Gladstone', 'Qingdao', 'Tianjin', 'Dalian', 'Ningbo',
  'Kaohsiung', 'Colombo', 'Mumbai', 'Kandla', 'Mundra', 'Vizag',
  'Paradip', 'Haldia', 'Chittagong', 'Port Klang', 'Tanjung Pelepas',
  'Laem Chabang', 'Ho Chi Minh', 'Manila', 'Jakarta', 'Surabaya',
  'Port Said', 'Aden', 'Djibouti', 'Mombasa', 'Dar es Salaam',
  'Cape Town', 'Algeciras', 'Marseille', 'Genoa', 'Valencia',
  'Felixstowe', 'Immingham', 'Milford Haven', 'Amsterdam', 'Ghent',
  'Gdansk', 'Novorossiysk', 'Constanta', 'Istanbul', 'Iskenderun',
  'Bandar Abbas', 'Ras Tanura', 'Yanbu', 'Salalah', 'Sohar',
  'Abu Dhabi', 'Khor Fakkan', 'Karachi', 'Gwadar',
  'Vancouver', 'Long Beach', 'Los Angeles', 'New Orleans', 'Baltimore',
  'Norfolk', 'Savannah', 'Charleston', 'New York', 'Philadelphia',
  'Corpus Christi', 'Galveston', 'Portland', 'Seattle', 'Tacoma',
  'Prince Rupert', 'Thunder Bay', 'Sept-Iles', 'Quebec City',
  'Buenos Aires', 'Rosario', 'San Lorenzo', 'Paranagua', 'Vitoria',
  'Callao', 'San Antonio', 'Valparaiso',
]

/** Pre-built case-insensitive regex for port matching. */
const PORT_PATTERN = new RegExp(
  `\\b(${PORT_NAMES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'gi',
)

/** Cargo types commonly referenced in chartering emails. */
const CARGO_TYPES = [
  'crude oil', 'fuel oil', 'gas oil', 'diesel', 'naphtha', 'jet fuel',
  'gasoline', 'kerosene', 'LNG', 'LPG', 'condensate', 'bitumen',
  'iron ore', 'coal', 'thermal coal', 'coking coal', 'met coke',
  'bauxite', 'alumina', 'manganese ore', 'nickel ore', 'copper concentrate',
  'grain', 'wheat', 'corn', 'maize', 'soybeans', 'soybean meal',
  'rice', 'barley', 'sorghum', 'sugar', 'raw sugar',
  'fertilizer', 'urea', 'DAP', 'MOP', 'phosphate', 'potash', 'sulphur',
  'cement', 'clinker', 'gypsum', 'limestone', 'salt',
  'steel coils', 'steel slabs', 'steel billets', 'pig iron', 'scrap',
  'petcoke', 'petroleum coke', 'woodchips', 'logs', 'lumber',
  'palm oil', 'vegetable oil', 'sunflower oil', 'rapeseed',
  'containers', 'general cargo', 'project cargo', 'breakbulk',
]

const CARGO_PATTERN = new RegExp(
  `\\b(${CARGO_TYPES.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'gi',
)

/**
 * Date patterns recognised:
 *   - ISO: 2025-01-15, 2025/01/15
 *   - Written: Jan 15, January 15, 15 Jan, 15th January, 15th Jan 2025
 *   - Slash: 15/01/2025, 01/15/2025
 */
const MONTHS_SHORT = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec'
const MONTHS_LONG = 'January|February|March|April|May|June|July|August|September|October|November|December'
const DATE_PATTERNS: RegExp[] = [
  // ISO: 2025-01-15 or 2025/01/15
  /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g,
  // Written: Jan 15, 2025 or January 15 2025
  new RegExp(`\\b((?:${MONTHS_SHORT}|${MONTHS_LONG})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:[,\\s]+\\d{4})?)\\b`, 'gi'),
  // Reversed: 15 Jan 2025, 15th January 2025
  new RegExp(`\\b(\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTHS_SHORT}|${MONTHS_LONG})\\.?(?:[,\\s]+\\d{4})?)\\b`, 'gi'),
  // Slash: 15/01/2025 or 01/15/2025
  /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g,
]

/**
 * Money amounts recognised:
 *   - $5,000 / $5,000.00
 *   - USD 50,000 / EUR 12,500
 *   - $12.5M / USD 3.2M / EUR 1.5B
 *   - USD 15,000/day
 */
const MONEY_PATTERN = /(\$|USD|EUR|GBP|JPY|SGD|AED|INR)\s*([\d,]+(?:\.\d+)?)\s*([MmBbKk])?(?:\s*\/\s*(\w+))?/g

// ---------------------------------------------------------------------------
// Category keywords
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<EmailCategory, string[]> = {
  fixture_negotiation: [
    'fixture', 'offer', 'counter', 'firm offer', 'subjects', 'on subs',
    'clean fixed', 'fixing', 'laycan', 'freight rate', 'hire rate',
    'charter party', 'C/P', 'recap', 'main terms', 'stem',
    'owners offer', 'charterers offer', 'last done', 'open tonnage',
  ],
  da_request: [
    'disbursement', 'proforma DA', 'PDA', 'FDA', 'final DA',
    'port charges', 'agency fees', 'towage', 'pilotage', 'berthing',
    'port dues', 'light dues',
  ],
  cargo_enquiry: [
    'cargo enquiry', 'cargo inquiry', 'cargo availability', 'stem',
    'requirement', 'shipment', 'loading window', 'qty available',
    'cargo description', 'COA enquiry',
  ],
  laytime_claim: [
    'laytime', 'demurrage', 'despatch', 'NOR', 'notice of readiness',
    'time sheet', 'statement of facts', 'SOF', 'time on demurrage',
    'laytime calculation', 'laytime claim', 'demurrage claim',
  ],
  bunker_inquiry: [
    'bunker', 'VLSFO', 'HSFO', 'MGO', 'LSMGO', 'fuel oil',
    'bunkering', 'bunker stem', 'bunker inquiry', 'bunker quotation',
    'bunker delivery', 'ROB', 'bunker survey',
  ],
  crew_matter: [
    'crew change', 'sign on', 'sign off', 'manning', 'seafarer',
    'crew visa', 'medical', 'repatriation', 'P&I', 'crew certificate',
    'seaman', 'master', 'chief officer', 'chief engineer',
  ],
  compliance_alert: [
    'compliance', 'sanctions', 'OFAC', 'EU sanctions', 'screening',
    'AML', 'KYC', 'due diligence', 'blacklist', 'designated',
    'restricted', 'flag state', 'PSC', 'port state control',
    'ISM', 'ISPS', 'MLC', 'SOLAS', 'MARPOL', 'CII', 'EEXI', 'EU ETS',
  ],
  market_report: [
    'market report', 'freight market', 'market update', 'BDI',
    'capesize', 'panamax', 'supramax', 'handysize', 'VLCC', 'suezmax',
    'aframax', 'MR tanker', 'LR1', 'LR2', 'TC average',
    'market outlook', 'weekly report', 'market recap',
  ],
  general: [],
}

// ---------------------------------------------------------------------------
// Sentiment keywords
// ---------------------------------------------------------------------------

const URGENT_KEYWORDS = [
  'URGENT', 'ASAP', 'IMMEDIATELY', 'TIME-SENSITIVE', 'CRITICAL',
  'DEADLINE', 'EXPIRE', 'EXPIRING', 'LAST CHANCE', 'ACT NOW',
  'TIME IS OF THE ESSENCE', 'WITHOUT DELAY',
]

const POSITIVE_KEYWORDS = [
  'pleased', 'confirmed', 'agreed', 'accepted', 'approved',
  'happy to confirm', 'well done', 'thank you', 'good news',
  'satisfactory', 'successful', 'completed', 'on schedule', 'on time',
]

const NEGATIVE_KEYWORDS = [
  'reject', 'rejected', 'dispute', 'disputed', 'claim', 'delay',
  'delayed', 'penalty', 'breach', 'violation', 'non-compliance',
  'failure', 'failed', 'damage', 'damaged', 'loss', 'overdue',
  'disappointed', 'unsatisfactory', 'concern', 'problem', 'issue',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Remove duplicate strings (case-insensitive), preserving the first occurrence's casing. */
function dedup(arr: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of arr) {
    const key = item.toLowerCase().trim()
    if (key && !seen.has(key)) {
      seen.add(key)
      result.push(item.trim())
    }
  }
  return result
}

/**
 * Resolve a money suffix multiplier: M = 1,000,000, K = 1,000, B = 1,000,000,000.
 */
function resolveMultiplier(suffix: string | undefined): number {
  if (!suffix) return 1
  switch (suffix.toUpperCase()) {
    case 'K':
      return 1_000
    case 'M':
      return 1_000_000
    case 'B':
      return 1_000_000_000
    default:
      return 1
  }
}

/** Map a symbol to an ISO currency code. */
function normaliseCurrency(raw: string): string {
  if (raw === '$') return 'USD'
  return raw.toUpperCase()
}

/** Strip HTML tags, decode common entities, collapse whitespace. */
function stripHtml(text: string): string {
  let clean = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
  // Decode common HTML entities
  clean = clean
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/gi, ' ')
  // Collapse whitespace
  clean = clean.replace(/[ \t]+/g, ' ')
  clean = clean.replace(/\n{3,}/g, '\n\n')
  return clean.trim()
}

/**
 * Extract surrounding context (up to ~60 chars) around a match position.
 */
function extractContext(text: string, matchStart: number, matchEnd: number): string {
  const contextRadius = 30
  const start = Math.max(0, matchStart - contextRadius)
  const end = Math.min(text.length, matchEnd + contextRadius)
  let ctx = text.slice(start, end).replace(/\n/g, ' ').trim()
  if (start > 0) ctx = '...' + ctx
  if (end < text.length) ctx = ctx + '...'
  return ctx
}

// ---------------------------------------------------------------------------
// 1. Parse Email for Entities
// ---------------------------------------------------------------------------

/**
 * Extract structured maritime entities from an email's subject and body.
 *
 * Identifies vessel names, port names, cargo types, dates, and monetary amounts
 * using regex-based pattern matching against common maritime conventions.
 *
 * @param subject - Email subject line
 * @param body    - Email body (may contain HTML)
 * @returns Extracted entities grouped by category
 */
export function parseEmailForEntities(subject: string, body: string): EmailEntities {
  const cleanBody = stripHtml(body)
  const combined = `${subject}\n${cleanBody}`

  // --- Vessel names ---
  const vesselNames: string[] = []
  let match: RegExpExecArray | null
  const vesselRegex = new RegExp(VESSEL_PATTERN.source, VESSEL_PATTERN.flags)
  while ((match = vesselRegex.exec(combined)) !== null) {
    vesselNames.push(match[1].trim())
  }

  // --- Port names ---
  const portNames: string[] = []
  const portRegex = new RegExp(PORT_PATTERN.source, PORT_PATTERN.flags)
  while ((match = portRegex.exec(combined)) !== null) {
    portNames.push(match[1])
  }

  // --- Cargo types ---
  const cargoTypes: string[] = []
  const cargoRegex = new RegExp(CARGO_PATTERN.source, CARGO_PATTERN.flags)
  while ((match = cargoRegex.exec(combined)) !== null) {
    cargoTypes.push(match[1])
  }

  // --- Dates ---
  const dates: { date: string; context: string }[] = []
  const seenDates = new Set<string>()
  for (const pattern of DATE_PATTERNS) {
    const dateRegex = new RegExp(pattern.source, pattern.flags)
    while ((match = dateRegex.exec(combined)) !== null) {
      const dateStr = match[1].trim()
      const key = dateStr.toLowerCase()
      if (!seenDates.has(key)) {
        seenDates.add(key)
        dates.push({
          date: dateStr,
          context: extractContext(combined, match.index, match.index + match[0].length),
        })
      }
    }
  }

  // --- Amounts ---
  const amounts: { value: number; currency: string; context: string }[] = []
  const moneyRegex = new RegExp(MONEY_PATTERN.source, MONEY_PATTERN.flags)
  while ((match = moneyRegex.exec(combined)) !== null) {
    const currency = normaliseCurrency(match[1])
    const rawValue = match[2].replace(/,/g, '')
    const multiplier = resolveMultiplier(match[3])
    const value = parseFloat(rawValue) * multiplier
    if (!isNaN(value)) {
      amounts.push({
        value,
        currency,
        context: extractContext(combined, match.index, match.index + match[0].length),
      })
    }
  }

  return {
    vesselNames: dedup(vesselNames),
    portNames: dedup(portNames),
    cargoTypes: dedup(cargoTypes),
    dates,
    amounts,
  }
}

// ---------------------------------------------------------------------------
// 2. Classify Email Category
// ---------------------------------------------------------------------------

/**
 * Classify a maritime email into a business category based on keyword analysis.
 *
 * Scores the combined subject and body text against each category's keyword
 * list. Subject matches are weighted 3x higher than body matches to reflect
 * the subject line's greater significance in indicating intent.
 *
 * @param subject - Email subject line
 * @param body    - Email body (may contain HTML)
 * @returns The best-matching category, or 'general' if no strong match
 */
export function classifyEmailCategory(subject: string, body: string): EmailCategory {
  const cleanBody = stripHtml(body)
  const subjectLower = subject.toLowerCase()
  const bodyLower = cleanBody.toLowerCase()

  const scores: Record<string, number> = {}

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'general') continue
    let score = 0
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase()
      // Subject matches weighted 3x
      if (subjectLower.includes(kw)) {
        score += 3
      }
      if (bodyLower.includes(kw)) {
        score += 1
      }
    }
    scores[category] = score
  }

  // Find the category with the highest score
  let bestCategory: EmailCategory = 'general'
  let bestScore = 0
  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestCategory = category as EmailCategory
    }
  }

  // Require a minimum score threshold to avoid false positives
  if (bestScore < 2) {
    return 'general'
  }

  return bestCategory
}

// ---------------------------------------------------------------------------
// 3. Analyse Sentiment
// ---------------------------------------------------------------------------

/**
 * Analyse the sentiment of a text string using keyword-based scoring.
 *
 * Priority order: urgent > negative > positive > neutral.
 * If urgent keywords appear, 'urgent' is returned regardless of other signals.
 *
 * @param text - The text to analyse
 * @returns Sentiment classification
 */
export function analyzeSentiment(text: string): Sentiment {
  const upper = text.toUpperCase()
  const lower = text.toLowerCase()

  // Urgent takes priority — check against uppercase to respect the typical
  // all-caps convention for urgency markers in maritime emails
  for (const keyword of URGENT_KEYWORDS) {
    if (upper.includes(keyword)) {
      return 'urgent'
    }
  }

  let positiveScore = 0
  let negativeScore = 0

  for (const keyword of POSITIVE_KEYWORDS) {
    if (lower.includes(keyword)) {
      positiveScore++
    }
  }

  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lower.includes(keyword)) {
      negativeScore++
    }
  }

  if (negativeScore > positiveScore && negativeScore > 0) {
    return 'negative'
  }
  if (positiveScore > negativeScore && positiveScore > 0) {
    return 'positive'
  }
  // Tie or no signals
  if (negativeScore > 0 && negativeScore === positiveScore) {
    return 'negative'
  }

  return 'neutral'
}

// ---------------------------------------------------------------------------
// 4. Extract Deal Terms
// ---------------------------------------------------------------------------

/**
 * Extract fixture negotiation terms from an email body.
 *
 * Recognises common patterns for:
 * - Freight / hire rates (e.g. "$12,500/day", "USD 15.50/mt")
 * - Laycan windows (e.g. "laycan 15-20 Jan 2025")
 * - Load / discharge ports (e.g. "loading at Rotterdam", "disch port: Qingdao")
 * - Cargo quantity (e.g. "50,000 mt", "150,000 bbls")
 * - Broker commission (e.g. "2.5% comm", "commission 3.75%")
 *
 * @param body - Email body text (may contain HTML)
 * @returns Extracted deal terms (fields are undefined when not found)
 */
export function extractDealTerms(body: string): DealTerms {
  const text = stripHtml(body)
  const terms: DealTerms = {}

  // --- Rate ---
  // Matches: "$12,500/day", "USD 15.50/mt", "USD 25,000 pdpr", "hire USD 12,500"
  const ratePatterns = [
    /(?:rate|hire|freight)\s*[:=]?\s*(?:\$|USD|EUR)\s*([\d,]+(?:\.\d+)?)\s*\/?\s*(day|pd|pdpr|mt|mton|wmt|bbl|lumpsum)?/i,
    /(?:\$|USD|EUR)\s*([\d,]+(?:\.\d+)?)\s*\/\s*(day|pd|pdpr|mt|mton|wmt|bbl)/i,
  ]
  for (const pattern of ratePatterns) {
    const rateMatch = pattern.exec(text)
    if (rateMatch) {
      const value = parseFloat(rateMatch[1].replace(/,/g, ''))
      const unit = (rateMatch[2] || 'lumpsum').toLowerCase()
      if (!isNaN(value)) {
        terms.rate = { value, unit }
        break
      }
    }
  }

  // --- Laycan ---
  // Matches: "laycan 15-20 Jan 2025", "laycan Jan 15 - Jan 20, 2025", "L/C: 10-15 February"
  const laycanPatterns = [
    /(?:laycan|l\/c|lay\s*can)\s*[:=]?\s*(\d{1,2})\s*[-/]\s*(\d{1,2})\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(?:\d{4})?)/i,
    /(?:laycan|l\/c|lay\s*can)\s*[:=]?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?)\s*[-/]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:[,\s]+\d{4})?)/i,
  ]
  for (const pattern of laycanPatterns) {
    const laycanMatch = pattern.exec(text)
    if (laycanMatch) {
      if (laycanMatch.length === 4 && /^\d+$/.test(laycanMatch[1])) {
        // Pattern 1: "15-20 Jan 2025"
        const month = laycanMatch[3]
        terms.laycan = {
          from: `${laycanMatch[1]} ${month}`,
          to: `${laycanMatch[2]} ${month}`,
        }
      } else {
        // Pattern 2: "Jan 15 - Jan 20, 2025"
        terms.laycan = {
          from: laycanMatch[1].trim(),
          to: laycanMatch[2].trim(),
        }
      }
      break
    }
  }

  // --- Load port ---
  const loadPortPatterns = [
    /(?:load(?:ing)?\s+(?:port|at|from))\s*[:=]?\s*([A-Z][A-Za-z\s]{2,30}?)(?=[,.\n;]|$)/im,
    /(?:load\s*port)\s*[:=]?\s*([A-Z][A-Za-z\s]{2,30}?)(?=[,.\n;]|$)/im,
  ]
  for (const pattern of loadPortPatterns) {
    const lpMatch = pattern.exec(text)
    if (lpMatch) {
      terms.loadPort = lpMatch[1].trim()
      break
    }
  }

  // --- Discharge port ---
  const dischPortPatterns = [
    /(?:disch(?:arge)?\s+(?:port|at))\s*[:=]?\s*([A-Z][A-Za-z\s]{2,30}?)(?=[,.\n;]|$)/im,
    /(?:disch?\s*port)\s*[:=]?\s*([A-Z][A-Za-z\s]{2,30}?)(?=[,.\n;]|$)/im,
  ]
  for (const pattern of dischPortPatterns) {
    const dpMatch = pattern.exec(text)
    if (dpMatch) {
      terms.dischargePort = dpMatch[1].trim()
      break
    }
  }

  // --- Quantity ---
  // Matches: "50,000 mt", "150,000 bbls", "abt 75,000 wmt"
  const qtyPattern = /(?:qty|quantity|cargo|abt\.?|about)?\s*([\d,]+(?:\.\d+)?)\s*(mt|mts|wmt|dmt|cbm|bbls?|tonnes?|tons?)/i
  const qtyMatch = qtyPattern.exec(text)
  if (qtyMatch) {
    const value = parseFloat(qtyMatch[1].replace(/,/g, ''))
    if (!isNaN(value)) {
      terms.quantity = { value, unit: qtyMatch[2].toLowerCase() }
    }
  }

  // --- Commission ---
  // Matches: "2.5% comm", "commission 3.75%", "add comm 1.25%", "brokerage 2.5%"
  const commPatterns = [
    /(?:comm(?:ission)?|brokerage|add\s*comm)\s*[:=]?\s*([\d.]+)\s*%/i,
    /([\d.]+)\s*%\s*(?:comm(?:ission)?|brokerage|add\s*comm)/i,
  ]
  for (const pattern of commPatterns) {
    const commMatch = pattern.exec(text)
    if (commMatch) {
      const value = parseFloat(commMatch[1])
      if (!isNaN(value) && value > 0 && value <= 10) {
        terms.commission = value
        break
      }
    }
  }

  return terms
}

// ---------------------------------------------------------------------------
// 5. Generate Email Summary
// ---------------------------------------------------------------------------

/**
 * Generate a condensed plain-text summary of a maritime email.
 *
 * Strips HTML, splits into sentences, scores each sentence by relevance
 * (presence of key maritime terms), and selects the top sentences up to
 * the specified maximum length.
 *
 * @param subject   - Email subject line
 * @param body      - Email body (may contain HTML)
 * @param maxLength - Maximum character length of the summary (default 200)
 * @returns Condensed summary string
 */
export function generateEmailSummary(
  subject: string,
  body: string,
  maxLength: number = 200,
): string {
  const cleanBody = stripHtml(body)

  // Split into sentences (handles common abbreviations poorly, but acceptable
  // for a summary heuristic)
  const sentences = cleanBody
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10)

  if (sentences.length === 0) {
    // Fallback: use subject as summary
    return subject.length > maxLength ? subject.slice(0, maxLength - 3) + '...' : subject
  }

  // Score each sentence by maritime relevance
  const relevanceTerms = [
    'vessel', 'cargo', 'port', 'charter', 'freight', 'hire', 'rate',
    'laycan', 'demurrage', 'laytime', 'bunker', 'loading', 'discharge',
    'voyage', 'fixture', 'offer', 'confirm', 'agree', 'claim',
    'quantity', 'commission', 'ETA', 'ETD', 'NOR', 'SOF',
  ]

  const scored = sentences.map((sentence, index) => {
    let score = 0
    const lower = sentence.toLowerCase()
    for (const term of relevanceTerms) {
      if (lower.includes(term.toLowerCase())) {
        score++
      }
    }
    // Slight boost for earlier sentences (they tend to be more important)
    score += Math.max(0, 5 - index) * 0.3
    return { sentence, score }
  })

  // Sort by score descending, take top sentences
  scored.sort((a, b) => b.score - a.score)

  let summary = `${subject}: `
  for (const { sentence } of scored) {
    if (summary.length + sentence.length + 2 > maxLength) {
      break
    }
    summary += sentence + ' '
  }

  summary = summary.trim()

  // Truncate if still over limit
  if (summary.length > maxLength) {
    summary = summary.slice(0, maxLength - 3) + '...'
  }

  return summary
}
