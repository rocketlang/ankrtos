/**
 * Claim Document Package Assembler
 *
 * Pure functions that determine which documents are required for each
 * maritime claim type, assess completeness, and generate formal claim
 * letter content. No database access.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClaimDocRequirement {
  docType: string;
  description: string;
  mandatory: boolean;
  sourceHint: string;
}

export interface CompletenessResult {
  score: number;
  missing: string[];
  present: string[];
  mandatoryMissing: string[];
}

export interface ClaimLetterData {
  claimNumber: string;
  vesselName: string;
  voyageRef: string;
  claimant: string;
  respondent: string;
  amount: number;
  currency: string;
  description: string;
  filedDate: string;
}

// ---------------------------------------------------------------------------
// Document requirement definitions per claim type
// ---------------------------------------------------------------------------

const DEMURRAGE_DOCS: ClaimDocRequirement[] = [
  {
    docType: 'SOF',
    description: 'Statement of Facts',
    mandatory: true,
    sourceHint: 'Port agent or vessel master',
  },
  {
    docType: 'NOR',
    description: 'Notice of Readiness',
    mandatory: true,
    sourceHint: 'Vessel master, tendered upon arrival',
  },
  {
    docType: 'LAYTIME_CALC',
    description: 'Laytime Calculation Sheet',
    mandatory: true,
    sourceHint: 'Operations / demurrage department',
  },
  {
    docType: 'CP_COPY',
    description: 'Charter Party Copy',
    mandatory: true,
    sourceHint: 'Chartering department / broker recap',
  },
  {
    docType: 'WEATHER_LOG',
    description: 'Weather Log (if Weather Working Days apply)',
    mandatory: false,
    sourceHint: 'Meteorological service or port authority',
  },
  {
    docType: 'CORRESPONDENCE',
    description: 'Relevant Correspondence',
    mandatory: false,
    sourceHint: 'Email archives, broker messages',
  },
  {
    docType: 'PHOTOS',
    description: 'Photographic Evidence',
    mandatory: false,
    sourceHint: 'Vessel crew, port agent, surveyor',
  },
];

const CARGO_DAMAGE_DOCS: ClaimDocRequirement[] = [
  {
    docType: 'SURVEY_REPORT',
    description: 'Cargo Survey Report',
    mandatory: true,
    sourceHint: 'Independent surveyor appointed at discharge port',
  },
  {
    docType: 'BL_COPY',
    description: 'Bill of Lading Copy',
    mandatory: true,
    sourceHint: 'Shipping line or chartering department',
  },
  {
    docType: 'PHOTOS',
    description: 'Photographic Evidence of Damage',
    mandatory: true,
    sourceHint: 'Surveyor, vessel crew, or consignee',
  },
  {
    docType: 'NOTICE_OF_CLAIM',
    description: 'Notice of Claim Letter',
    mandatory: true,
    sourceHint: 'Claimant legal/claims department',
  },
  {
    docType: 'CP_COPY',
    description: 'Charter Party Copy',
    mandatory: false,
    sourceHint: 'Chartering department / broker recap',
  },
  {
    docType: 'STOWAGE_PLAN',
    description: 'Stowage Plan',
    mandatory: false,
    sourceHint: 'Vessel master or operations department',
  },
  {
    docType: 'TEMPERATURE_LOGS',
    description: 'Temperature Logs (for reefer cargo)',
    mandatory: false,
    sourceHint: 'Vessel reefer engineer or monitoring system',
  },
  {
    docType: 'CORRESPONDENCE',
    description: 'Relevant Correspondence',
    mandatory: false,
    sourceHint: 'Email archives, broker messages',
  },
];

const CARGO_SHORTAGE_DOCS: ClaimDocRequirement[] = [
  {
    docType: 'BL_COPY',
    description: 'Bill of Lading Copy',
    mandatory: true,
    sourceHint: 'Shipping line or chartering department',
  },
  {
    docType: 'OUTTURN_REPORT',
    description: 'Outturn Report',
    mandatory: true,
    sourceHint: 'Discharge port terminal or surveyor',
  },
  {
    docType: 'DRAFT_SURVEY',
    description: 'Draft Survey Report',
    mandatory: true,
    sourceHint: 'Independent surveyor at load and/or discharge port',
  },
  {
    docType: 'NOTICE_OF_CLAIM',
    description: 'Notice of Claim Letter',
    mandatory: true,
    sourceHint: 'Claimant legal/claims department',
  },
  {
    docType: 'SHORE_TALLY',
    description: 'Shore Tally Sheets',
    mandatory: false,
    sourceHint: 'Terminal operator or tally clerk',
  },
  {
    docType: 'CORRESPONDENCE',
    description: 'Relevant Correspondence',
    mandatory: false,
    sourceHint: 'Email archives, broker messages',
  },
];

const DEAD_FREIGHT_DOCS: ClaimDocRequirement[] = [
  {
    docType: 'CP_COPY',
    description: 'Charter Party Copy',
    mandatory: true,
    sourceHint: 'Chartering department / broker recap',
  },
  {
    docType: 'STOWAGE_PLAN',
    description: 'Stowage Plan',
    mandatory: true,
    sourceHint: 'Vessel master or operations department',
  },
  {
    docType: 'BL_COPY',
    description: 'Bill of Lading Copy',
    mandatory: true,
    sourceHint: 'Shipping line or chartering department',
  },
  {
    docType: 'CARGO_MANIFEST',
    description: 'Cargo Manifest',
    mandatory: false,
    sourceHint: 'Shipper or vessel operations',
  },
  {
    docType: 'NOTICE_OF_CLAIM',
    description: 'Notice of Claim Letter',
    mandatory: true,
    sourceHint: 'Claimant legal/claims department',
  },
];

const DEVIATION_DOCS: ClaimDocRequirement[] = [
  {
    docType: 'CP_COPY',
    description: 'Charter Party Copy',
    mandatory: true,
    sourceHint: 'Chartering department / broker recap',
  },
  {
    docType: 'VESSEL_TRACK',
    description: 'Vessel Tracking / AIS Data',
    mandatory: true,
    sourceHint: 'AIS provider, vessel tracking system',
  },
  {
    docType: 'WEATHER_REPORT',
    description: 'Weather Report for Voyage Period',
    mandatory: false,
    sourceHint: 'Meteorological service or routing provider',
  },
  {
    docType: 'MASTERS_REPORT',
    description: "Master's Voyage Report",
    mandatory: true,
    sourceHint: 'Vessel master',
  },
  {
    docType: 'CORRESPONDENCE',
    description: 'Relevant Correspondence',
    mandatory: false,
    sourceHint: 'Email archives, broker messages',
  },
];

const GENERAL_AVERAGE_DOCS: ClaimDocRequirement[] = [
  {
    docType: 'GA_DECLARATION',
    description: 'General Average Declaration',
    mandatory: true,
    sourceHint: 'Shipowner or GA adjuster',
  },
  {
    docType: 'AVERAGE_BOND',
    description: 'Average Bond',
    mandatory: true,
    sourceHint: 'GA adjuster, signed by cargo interests',
  },
  {
    docType: 'GA_ADJUSTMENT',
    description: 'General Average Adjustment Statement',
    mandatory: true,
    sourceHint: 'GA adjuster (e.g. Richards Hogg Lindley)',
  },
  {
    docType: 'BL_COPY',
    description: 'Bill of Lading Copy',
    mandatory: true,
    sourceHint: 'Shipping line or chartering department',
  },
  {
    docType: 'CARGO_INVOICE',
    description: 'Commercial Invoice of Cargo',
    mandatory: true,
    sourceHint: 'Shipper or cargo owner',
  },
];

const CLAIM_TYPE_MAP: Record<string, ClaimDocRequirement[]> = {
  demurrage: DEMURRAGE_DOCS,
  cargo_damage: CARGO_DAMAGE_DOCS,
  cargo_shortage: CARGO_SHORTAGE_DOCS,
  dead_freight: DEAD_FREIGHT_DOCS,
  deviation: DEVIATION_DOCS,
  general_average: GENERAL_AVERAGE_DOCS,
};

// ---------------------------------------------------------------------------
// Claim type display names
// ---------------------------------------------------------------------------

const CLAIM_TYPE_LABELS: Record<string, string> = {
  demurrage: 'Demurrage',
  cargo_damage: 'Cargo Damage',
  cargo_shortage: 'Cargo Shortage',
  dead_freight: 'Dead Freight',
  deviation: 'Deviation',
  general_average: 'General Average',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return the list of required documents for a given claim type.
 * Returns an empty array if the claim type is not recognised.
 */
export function getRequiredDocuments(claimType: string): ClaimDocRequirement[] {
  const key = claimType.toLowerCase().replace(/[\s-]+/g, '_');
  const docs = CLAIM_TYPE_MAP[key];
  if (!docs) return [];
  // Return a deep copy so callers cannot mutate the canonical list
  return docs.map((d) => ({ ...d }));
}

/**
 * Calculate completeness of a claim package by comparing required documents
 * against a list of document types that are actually present.
 *
 * The score is a percentage (0-100) based on:
 *  - All mandatory documents present = minimum viable (weighted 70%)
 *  - All optional documents present  = full score   (weighted 30%)
 *
 * Returns detailed lists of missing, present, and mandatory-missing doc types.
 */
export function calculateCompleteness(
  required: ClaimDocRequirement[],
  presentDocs: string[],
): CompletenessResult {
  if (required.length === 0) {
    return { score: 100, missing: [], present: [], mandatoryMissing: [] };
  }

  const presentSet = new Set(presentDocs.map((d) => d.toUpperCase().replace(/[\s-]+/g, '_')));

  const missing: string[] = [];
  const present: string[] = [];
  const mandatoryMissing: string[] = [];

  const mandatoryDocs = required.filter((r) => r.mandatory);
  const optionalDocs = required.filter((r) => !r.mandatory);

  for (const doc of required) {
    const normalised = doc.docType.toUpperCase().replace(/[\s-]+/g, '_');
    if (presentSet.has(normalised)) {
      present.push(doc.docType);
    } else {
      missing.push(doc.docType);
      if (doc.mandatory) {
        mandatoryMissing.push(doc.docType);
      }
    }
  }

  // Weighted score
  const mandatoryWeight = 0.7;
  const optionalWeight = 0.3;

  let mandatoryScore = 0;
  if (mandatoryDocs.length > 0) {
    const mandatoryPresent = mandatoryDocs.filter((d) =>
      presentSet.has(d.docType.toUpperCase().replace(/[\s-]+/g, '_')),
    ).length;
    mandatoryScore = (mandatoryPresent / mandatoryDocs.length) * mandatoryWeight;
  } else {
    mandatoryScore = mandatoryWeight; // No mandatory docs = full mandatory score
  }

  let optionalScore = 0;
  if (optionalDocs.length > 0) {
    const optionalPresent = optionalDocs.filter((d) =>
      presentSet.has(d.docType.toUpperCase().replace(/[\s-]+/g, '_')),
    ).length;
    optionalScore = (optionalPresent / optionalDocs.length) * optionalWeight;
  } else {
    optionalScore = optionalWeight;
  }

  const score = Math.round((mandatoryScore + optionalScore) * 10000) / 100;

  return {
    score: Math.min(score, 100),
    missing,
    present,
    mandatoryMissing,
  };
}

/**
 * Generate formal claim letter content for a given claim type and data.
 * Returns a plain-text letter suitable for PDF rendering or email.
 */
export function generateClaimLetterContent(
  claimType: string,
  data: ClaimLetterData,
): string {
  const typeLabel = CLAIM_TYPE_LABELS[claimType.toLowerCase().replace(/[\s-]+/g, '_')] ?? claimType;
  const formattedAmount = formatCurrency(data.amount, data.currency);

  const lines: string[] = [
    `CLAIM NOTIFICATION`,
    ``,
    `Date: ${data.filedDate}`,
    `Claim Reference: ${data.claimNumber}`,
    ``,
    `To:`,
    `${data.respondent}`,
    ``,
    `From:`,
    `${data.claimant}`,
    ``,
    `RE: ${typeLabel} Claim — M/V "${data.vesselName}" — Voyage ${data.voyageRef}`,
    ``,
    `Dear Sirs,`,
    ``,
    `We hereby give notice of our ${typeLabel.toLowerCase()} claim in connection with the above-referenced vessel and voyage.`,
    ``,
    `VESSEL PARTICULARS`,
    `  Vessel Name:    ${data.vesselName}`,
    `  Voyage Ref:     ${data.voyageRef}`,
    `  Claim Type:     ${typeLabel}`,
    `  Claim Number:   ${data.claimNumber}`,
    ``,
    `CLAIM DETAILS`,
    ``,
    `${data.description}`,
    ``,
    `AMOUNT CLAIMED`,
    ``,
    `We claim the sum of ${formattedAmount} in respect of the above.`,
    ``,
  ];

  // Add claim-type-specific paragraphs
  const specificContent = getClaimSpecificContent(claimType);
  if (specificContent) {
    lines.push(specificContent, ``);
  }

  lines.push(
    `SUPPORTING DOCUMENTS`,
    ``,
    `The following supporting documents are enclosed or will be provided under separate cover:`,
    ``,
  );

  const requiredDocs = getRequiredDocuments(claimType);
  if (requiredDocs.length > 0) {
    for (let i = 0; i < requiredDocs.length; i++) {
      const doc = requiredDocs[i];
      const mandatoryTag = doc.mandatory ? ' (mandatory)' : '';
      lines.push(`  ${i + 1}. ${doc.description}${mandatoryTag}`);
    }
  } else {
    lines.push(`  (Supporting documents to be detailed separately)`);
  }

  lines.push(
    ``,
    `RESERVATION OF RIGHTS`,
    ``,
    `We reserve the right to amend, supplement, or revise this claim and the amount claimed`,
    `upon receipt of additional information or documents. All rights under the applicable`,
    `charter party, bills of lading, and at law and in equity are expressly reserved.`,
    ``,
    `We look forward to your prompt response and trust that this matter can be resolved`,
    `amicably and without undue delay.`,
    ``,
    `Yours faithfully,`,
    ``,
    `${data.claimant}`,
    ``,
    `---`,
    `This claim letter was generated for reference: ${data.claimNumber}`,
    `Filed on: ${data.filedDate}`,
  );

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP',
    JPY: 'JPY',
    CNY: 'CNY',
  };
  const code = symbols[currency.toUpperCase()] ?? currency.toUpperCase();
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${code} ${formatted}`;
}

function getClaimSpecificContent(claimType: string): string | null {
  const key = claimType.toLowerCase().replace(/[\s-]+/g, '_');

  switch (key) {
    case 'demurrage':
      return [
        `LAYTIME AND DEMURRAGE`,
        ``,
        `The laytime allowed under the charter party has been exceeded, and demurrage has`,
        `accordingly accrued. A detailed laytime calculation sheet is attached herewith,`,
        `showing the commencement and expiry of laytime and the period of demurrage claimed.`,
        `The Statement of Facts and Notice of Readiness are enclosed as supporting evidence.`,
      ].join('\n');

    case 'cargo_damage':
      return [
        `CARGO DAMAGE`,
        ``,
        `The cargo was found to be damaged upon discharge, as evidenced by the independent`,
        `survey report enclosed herewith. The damage occurred during the sea voyage and/or`,
        `during loading/discharge operations. Photographs documenting the condition of the`,
        `cargo at the time of discharge are attached.`,
      ].join('\n');

    case 'cargo_shortage':
      return [
        `CARGO SHORTAGE`,
        ``,
        `A shortage of cargo has been identified upon discharge, as evidenced by the outturn`,
        `report and draft survey results enclosed herewith. The quantity discharged is less`,
        `than the quantity stated on the bill of lading and/or loaded at the port of loading.`,
      ].join('\n');

    case 'dead_freight':
      return [
        `DEAD FREIGHT`,
        ``,
        `The charterer has failed to provide the full cargo quantity as stipulated under the`,
        `charter party, resulting in dead freight. The stowage plan and bill of lading`,
        `demonstrate the shortfall between the contracted and actual cargo loaded.`,
      ].join('\n');

    case 'deviation':
      return [
        `DEVIATION`,
        ``,
        `The vessel deviated from the customary or contractual route without authorization,`,
        `resulting in additional time and costs. The vessel tracking data and master's report`,
        `are enclosed to evidence the deviation from the agreed voyage.`,
      ].join('\n');

    case 'general_average':
      return [
        `GENERAL AVERAGE`,
        ``,
        `General Average has been declared in respect of the above voyage. The General Average`,
        `declaration, average bond, and adjustment statement are enclosed herewith. All cargo`,
        `interests are requested to provide security in accordance with the terms of the`,
        `General Average declaration and applicable York-Antwerp Rules.`,
      ].join('\n');

    default:
      return null;
  }
}
