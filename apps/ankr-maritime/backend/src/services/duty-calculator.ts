// duty-calculator.ts
// Customs duty calculation engine for India: import/export duty, CIF, anti-dumping, HS lookup, receipts.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImportDutyParams {
  assessableValue: number;
  basicDutyRate: number;       // percentage, e.g. 7.5 means 7.5%
  socialWelfareRate?: number;  // defaults to 10%
  igstRate?: number;           // defaults to 18%
  cessRate?: number;           // defaults to 0%
  exchangeRate?: number;       // informational — caller should pre-convert assessableValue
}

export interface ImportDutyResult {
  assessableValue: number;
  basicDuty: number;
  socialWelfareSurcharge: number;
  igst: number;
  cess: number;
  totalDuty: number;
  effectiveDutyRate: number;   // percentage of total duty relative to assessable value
}

export interface ExportDutyParams {
  fobValue: number;
  dutyRate: number;            // percentage
  cessRate?: number;           // defaults to 0%
}

export interface ExportDutyResult {
  fobValue: number;
  exportDuty: number;
  cess: number;
  total: number;
}

export interface CIFInvoice {
  fobValue: number;
  freight: number;
  insurance: number;
  currency: string;
  exchangeRate: number;        // units of local currency per 1 unit of invoice currency
}

export interface HSLookupResult {
  chapter: string;
  description: string;
  basicDutyRate: number;
  socialWelfareRate: number;
  igstRate: number;
}

export interface AntiDumpingResult {
  applies: boolean;
  hsCode: string;
  originCountry: string;
  normalValue: number;
  exportPrice: number;
  dumpingMargin: number;
  antiDumpingDuty: number;
}

export interface DutyReceiptParams {
  referenceNumber: string;
  importerName: string;
  hsCode: string;
  assessableValue: number;
  duties: Record<string, number>;
  totalDuty: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Default duty rates by HS chapter (first 2 digits).
 * Rates are approximate and for calculation/estimation purposes.
 * Real rates must be verified against the latest Customs Tariff schedule.
 */
const HS_CHAPTER_DUTY_MAP: Record<string, { description: string; bcdRate: number; igstRate: number }> = {
  '01': { description: 'Live animals', bcdRate: 30, igstRate: 0 },
  '02': { description: 'Meat and edible meat offal', bcdRate: 30, igstRate: 12 },
  '03': { description: 'Fish and crustaceans', bcdRate: 30, igstRate: 5 },
  '04': { description: 'Dairy produce; eggs; honey', bcdRate: 30, igstRate: 12 },
  '05': { description: 'Products of animal origin', bcdRate: 10, igstRate: 5 },
  '06': { description: 'Live trees and plants', bcdRate: 10, igstRate: 5 },
  '07': { description: 'Edible vegetables', bcdRate: 30, igstRate: 5 },
  '08': { description: 'Edible fruit and nuts', bcdRate: 30, igstRate: 12 },
  '09': { description: 'Coffee, tea, spices', bcdRate: 30, igstRate: 5 },
  '10': { description: 'Cereals', bcdRate: 30, igstRate: 5 },
  '11': { description: 'Milling industry products', bcdRate: 30, igstRate: 5 },
  '12': { description: 'Oil seeds; misc. grains', bcdRate: 30, igstRate: 5 },
  '13': { description: 'Lac; gums; resins', bcdRate: 10, igstRate: 18 },
  '15': { description: 'Animal or vegetable fats', bcdRate: 30, igstRate: 5 },
  '17': { description: 'Sugars and sugar confectionery', bcdRate: 50, igstRate: 18 },
  '22': { description: 'Beverages, spirits, vinegar', bcdRate: 150, igstRate: 28 },
  '25': { description: 'Salt; sulphur; earth; stone', bcdRate: 5, igstRate: 5 },
  '26': { description: 'Ores, slag and ash', bcdRate: 2.5, igstRate: 5 },
  '27': { description: 'Mineral fuels, oils', bcdRate: 5, igstRate: 18 },
  '28': { description: 'Inorganic chemicals', bcdRate: 7.5, igstRate: 18 },
  '29': { description: 'Organic chemicals', bcdRate: 7.5, igstRate: 18 },
  '30': { description: 'Pharmaceutical products', bcdRate: 10, igstRate: 12 },
  '31': { description: 'Fertilisers', bcdRate: 5, igstRate: 5 },
  '32': { description: 'Tanning or dyeing extracts', bcdRate: 10, igstRate: 18 },
  '38': { description: 'Miscellaneous chemical products', bcdRate: 10, igstRate: 18 },
  '39': { description: 'Plastics and articles thereof', bcdRate: 10, igstRate: 18 },
  '40': { description: 'Rubber and articles thereof', bcdRate: 10, igstRate: 18 },
  '44': { description: 'Wood and articles of wood', bcdRate: 5, igstRate: 18 },
  '47': { description: 'Pulp of wood', bcdRate: 0, igstRate: 12 },
  '48': { description: 'Paper and paperboard', bcdRate: 10, igstRate: 18 },
  '52': { description: 'Cotton', bcdRate: 10, igstRate: 5 },
  '54': { description: 'Man-made filaments', bcdRate: 10, igstRate: 12 },
  '61': { description: 'Knitted or crocheted apparel', bcdRate: 20, igstRate: 12 },
  '62': { description: 'Non-knitted apparel', bcdRate: 20, igstRate: 12 },
  '63': { description: 'Other made-up textile articles', bcdRate: 20, igstRate: 12 },
  '68': { description: 'Articles of stone, plaster, cement', bcdRate: 10, igstRate: 18 },
  '70': { description: 'Glass and glassware', bcdRate: 10, igstRate: 18 },
  '71': { description: 'Precious stones, metals, jewellery', bcdRate: 10, igstRate: 3 },
  '72': { description: 'Iron and steel', bcdRate: 7.5, igstRate: 18 },
  '73': { description: 'Articles of iron or steel', bcdRate: 10, igstRate: 18 },
  '74': { description: 'Copper and articles thereof', bcdRate: 5, igstRate: 18 },
  '75': { description: 'Nickel and articles thereof', bcdRate: 5, igstRate: 18 },
  '76': { description: 'Aluminium and articles thereof', bcdRate: 7.5, igstRate: 18 },
  '79': { description: 'Zinc and articles thereof', bcdRate: 5, igstRate: 18 },
  '84': { description: 'Machinery and mechanical appliances', bcdRate: 7.5, igstRate: 18 },
  '85': { description: 'Electrical machinery and equipment', bcdRate: 10, igstRate: 18 },
  '86': { description: 'Railway or tramway locomotives', bcdRate: 7.5, igstRate: 18 },
  '87': { description: 'Vehicles other than railway', bcdRate: 15, igstRate: 28 },
  '88': { description: 'Aircraft and spacecraft', bcdRate: 3, igstRate: 5 },
  '89': { description: 'Ships, boats', bcdRate: 0, igstRate: 5 },
  '90': { description: 'Optical, photographic, measuring instruments', bcdRate: 10, igstRate: 18 },
  '93': { description: 'Arms and ammunition', bcdRate: 10, igstRate: 18 },
  '94': { description: 'Furniture, bedding, mattresses', bcdRate: 20, igstRate: 18 },
  '95': { description: 'Toys, games, sports equipment', bcdRate: 20, igstRate: 18 },
  '97': { description: 'Works of art, antiques', bcdRate: 10, igstRate: 12 },
};

/** Known anti-dumping duty pairs: hsChapter+country -> duty per unit. */
const ANTI_DUMPING_ORDERS: Record<string, { minDutyPerUnit: number; description: string }> = {
  '72_CN': { minDutyPerUnit: 0, description: 'HR steel coils from China' },
  '72_KR': { minDutyPerUnit: 0, description: 'HR steel coils from Korea' },
  '54_CN': { minDutyPerUnit: 0, description: 'Nylon tyre cord from China' },
  '29_CN': { minDutyPerUnit: 0, description: 'Organic chemicals from China' },
  '39_CN': { minDutyPerUnit: 0, description: 'PVC paste resin from China' },
  '39_KR': { minDutyPerUnit: 0, description: 'PVC paste resin from Korea' },
  '70_CN': { minDutyPerUnit: 0, description: 'Float glass from China' },
  '28_CN': { minDutyPerUnit: 0, description: 'Caustic soda from China' },
  '73_CN': { minDutyPerUnit: 0, description: 'Stainless steel articles from China' },
  '85_CN': { minDutyPerUnit: 0, description: 'Solar cells from China' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function extractChapter(hsCode: string): string {
  const clean = hsCode.replace(/[\s.]/g, '');
  return clean.substring(0, 2).padStart(2, '0');
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Calculate Indian import customs duty.
 *
 * BCD  = assessableValue * basicDutyRate / 100
 * SWS  = BCD * socialWelfareRate / 100
 * IGST = (assessableValue + BCD + SWS) * igstRate / 100
 * Cess = assessableValue * cessRate / 100
 * Total = BCD + SWS + IGST + Cess
 */
export function calculateImportDuty(params: ImportDutyParams): ImportDutyResult {
  const {
    assessableValue,
    basicDutyRate,
    socialWelfareRate = 10,
    igstRate = 18,
    cessRate = 0,
  } = params;

  if (assessableValue < 0) {
    throw new Error('Assessable value must be non-negative');
  }
  if (basicDutyRate < 0 || basicDutyRate > 300) {
    throw new Error('Basic duty rate must be between 0 and 300%');
  }

  const basicDuty = round2(assessableValue * basicDutyRate / 100);
  const socialWelfareSurcharge = round2(basicDuty * socialWelfareRate / 100);
  const igstBase = assessableValue + basicDuty + socialWelfareSurcharge;
  const igst = round2(igstBase * igstRate / 100);
  const cess = round2(assessableValue * cessRate / 100);
  const totalDuty = round2(basicDuty + socialWelfareSurcharge + igst + cess);
  const effectiveDutyRate = assessableValue > 0
    ? round2((totalDuty / assessableValue) * 100)
    : 0;

  return {
    assessableValue,
    basicDuty,
    socialWelfareSurcharge,
    igst,
    cess,
    totalDuty,
    effectiveDutyRate,
  };
}

/**
 * Calculate export duty (much simpler than import).
 * ExportDuty = fobValue * dutyRate / 100
 * Cess       = fobValue * cessRate / 100
 */
export function calculateExportDuty(params: ExportDutyParams): ExportDutyResult {
  const { fobValue, dutyRate, cessRate = 0 } = params;

  if (fobValue < 0) {
    throw new Error('FOB value must be non-negative');
  }

  const exportDuty = round2(fobValue * dutyRate / 100);
  const cess = round2(fobValue * cessRate / 100);
  const total = round2(exportDuty + cess);

  return { fobValue, exportDuty, cess, total };
}

/**
 * Calculate CIF (Cost, Insurance, Freight) value in local currency.
 * CIF = (FOB + Freight + Insurance) * exchangeRate
 */
export function calculateCIF(invoice: CIFInvoice): number {
  const { fobValue, freight, insurance, exchangeRate } = invoice;

  if (fobValue < 0 || freight < 0 || insurance < 0) {
    throw new Error('Invoice components must be non-negative');
  }
  if (exchangeRate <= 0) {
    throw new Error('Exchange rate must be positive');
  }

  return round2((fobValue + freight + insurance) * exchangeRate);
}

/**
 * Look up default duty rates by HS code.
 * Uses the chapter (first 2 digits) to find approximate rates.
 */
export function lookupDutyRateByHS(hsCode: string): HSLookupResult {
  const chapter = extractChapter(hsCode);
  const entry = HS_CHAPTER_DUTY_MAP[chapter];

  if (entry) {
    return {
      chapter,
      description: entry.description,
      basicDutyRate: entry.bcdRate,
      socialWelfareRate: 10,
      igstRate: entry.igstRate,
    };
  }

  // Default rates for unmapped chapters
  return {
    chapter,
    description: `HS Chapter ${chapter} (rate not mapped)`,
    basicDutyRate: 10,
    socialWelfareRate: 10,
    igstRate: 18,
  };
}

/**
 * Calculate anti-dumping duty (ADD).
 *
 * ADD = max(0, normalValue - exportPrice).
 * Only applies to HS chapter + origin country combinations that are under
 * active anti-dumping orders.  Returns 0 for unmatched combos.
 */
export function calculateAntiDumpingDuty(
  hsCode: string,
  originCountry: string,
  normalValue: number,
  exportPrice: number,
): AntiDumpingResult {
  const chapter = extractChapter(hsCode);
  const countryUpper = originCountry.toUpperCase().substring(0, 2);
  const key = `${chapter}_${countryUpper}`;
  const order = ANTI_DUMPING_ORDERS[key];

  const dumpingMargin = round2(Math.max(0, normalValue - exportPrice));

  if (!order) {
    return {
      applies: false,
      hsCode,
      originCountry,
      normalValue,
      exportPrice,
      dumpingMargin: 0,
      antiDumpingDuty: 0,
    };
  }

  return {
    applies: dumpingMargin > 0,
    hsCode,
    originCountry,
    normalValue,
    exportPrice,
    dumpingMargin,
    antiDumpingDuty: dumpingMargin,
  };
}

/**
 * Generate a formatted text duty receipt.
 */
export function generateDutyReceipt(params: DutyReceiptParams): string {
  const { referenceNumber, importerName, hsCode, assessableValue, duties, totalDuty } = params;
  const timestamp = new Date().toISOString();

  const lines: string[] = [
    '================================================================================',
    '                        CUSTOMS DUTY ASSESSMENT RECEIPT',
    '================================================================================',
    '',
    `Reference Number : ${referenceNumber}`,
    `Date/Time        : ${timestamp}`,
    `Importer         : ${importerName}`,
    `HS Code          : ${hsCode}`,
    '',
    '--------------------------------------------------------------------------------',
    '  ASSESSABLE VALUE',
    '--------------------------------------------------------------------------------',
    `  CIF / Assessable Value          : INR ${assessableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    '',
    '--------------------------------------------------------------------------------',
    '  DUTY BREAKDOWN',
    '--------------------------------------------------------------------------------',
  ];

  const dutyKeys = Object.keys(duties);
  const maxKeyLen = Math.max(...dutyKeys.map(k => k.length), 10);

  for (const [key, value] of Object.entries(duties)) {
    const label = key.padEnd(maxKeyLen + 2);
    lines.push(`  ${label}: INR ${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
  }

  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push(`  TOTAL DUTY PAYABLE              : INR ${totalDuty.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
  lines.push('--------------------------------------------------------------------------------');
  lines.push('');
  lines.push('  Note: This is a system-generated estimate. Actual duty may vary based on');
  lines.push('  applicable notifications, exemptions, and assessment by Customs authorities.');
  lines.push('');
  lines.push('================================================================================');

  return lines.join('\n');
}
