/**
 * Fixture Recap Generator
 *
 * Generates a structured fixture recap document from charter data.
 * A fixture recap is a summary of a chartering deal's key terms,
 * typically circulated after main terms are agreed ("on subs" or "fixed").
 *
 * Pure business logic — no database access.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FixtureRecapInput {
  charterRef: string;
  chartererName: string;
  ownerName: string;
  vesselName: string;
  vesselImo?: string;
  vesselDwt?: number;
  cargoType: string;
  cargoQuantity: number;
  cargoUnit: string; // MT, CBM, etc.
  loadPort: string;
  dischargePort: string;
  laycanStart: Date;
  laycanEnd: Date;
  freightRate: number;
  freightBasis: string; // per_mt, lumpsum, worldscale
  demurrageRate?: number;
  despatchRate?: number;
  laytimeHours?: number;
  commission?: number; // percentage
  addressCommission?: number; // percentage
  specialTerms?: string[];
  cpForm?: string; // e.g., "GENCON 2022", "ASBATANKVOY"
}

export interface FixtureRecapSection {
  heading: string;
  items: { label: string; value: string }[];
}

export interface FixtureRecap {
  title: string;
  reference: string;
  generatedAt: Date;
  sections: FixtureRecapSection[];
  plainText: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  const d = new Date(date);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatFreightBasis(basis: string): string {
  switch (basis) {
    case 'per_mt':
      return 'per Metric Ton';
    case 'lumpsum':
      return 'Lumpsum';
    case 'worldscale':
      return 'Worldscale';
    default:
      return basis;
  }
}

function buildPlainText(title: string, reference: string, sections: FixtureRecapSection[]): string {
  const lines: string[] = [];
  const separator = '='.repeat(60);

  lines.push(separator);
  lines.push(title);
  lines.push(`Reference: ${reference}`);
  lines.push(separator);
  lines.push('');

  for (const section of sections) {
    lines.push(`--- ${section.heading} ---`);
    for (const item of section.items) {
      lines.push(`  ${item.label}: ${item.value}`);
    }
    lines.push('');
  }

  lines.push(separator);
  lines.push('This fixture recap is for reference only and does not');
  lines.push('constitute a binding contract. The governing document');
  lines.push('is the signed Charter Party.');
  lines.push(separator);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildVesselDetails(input: FixtureRecapInput): FixtureRecapSection {
  const items: { label: string; value: string }[] = [
    { label: 'Vessel Name', value: input.vesselName },
  ];

  if (input.vesselImo) {
    items.push({ label: 'IMO Number', value: input.vesselImo });
  }

  if (input.vesselDwt !== undefined) {
    items.push({ label: 'DWT', value: `${formatNumber(input.vesselDwt)} MT` });
  }

  items.push({ label: 'Owner', value: input.ownerName });

  return { heading: 'Vessel Details', items };
}

function buildCargoDetails(input: FixtureRecapInput): FixtureRecapSection {
  return {
    heading: 'Cargo Details',
    items: [
      { label: 'Cargo Type', value: input.cargoType },
      {
        label: 'Quantity',
        value: `${formatNumber(input.cargoQuantity)} ${input.cargoUnit}`,
      },
      { label: 'Charterer', value: input.chartererName },
    ],
  };
}

function buildPortRotation(input: FixtureRecapInput): FixtureRecapSection {
  return {
    heading: 'Port Rotation',
    items: [
      { label: 'Load Port', value: input.loadPort },
      { label: 'Discharge Port', value: input.dischargePort },
    ],
  };
}

function buildLaycan(input: FixtureRecapInput): FixtureRecapSection {
  return {
    heading: 'Laycan',
    items: [
      { label: 'Laycan Start', value: formatDate(input.laycanStart) },
      { label: 'Laycan End', value: formatDate(input.laycanEnd) },
    ],
  };
}

function buildFreightTerms(input: FixtureRecapInput): FixtureRecapSection {
  const basisLabel = formatFreightBasis(input.freightBasis);
  const rateDisplay =
    input.freightBasis === 'worldscale'
      ? `WS ${formatNumber(input.freightRate)}`
      : `USD ${formatNumber(input.freightRate)} ${basisLabel}`;

  return {
    heading: 'Freight Terms',
    items: [
      { label: 'Freight Rate', value: rateDisplay },
      { label: 'Freight Basis', value: basisLabel },
    ],
  };
}

function buildLaytimeAndDemurrage(input: FixtureRecapInput): FixtureRecapSection {
  const items: { label: string; value: string }[] = [];

  if (input.laytimeHours !== undefined) {
    items.push({
      label: 'Laytime Allowed',
      value: `${formatNumber(input.laytimeHours)} hours`,
    });
  }

  if (input.demurrageRate !== undefined) {
    items.push({
      label: 'Demurrage Rate',
      value: `USD ${formatNumber(input.demurrageRate)} per day`,
    });
  }

  if (input.despatchRate !== undefined) {
    items.push({
      label: 'Despatch Rate',
      value: `USD ${formatNumber(input.despatchRate)} per day`,
    });
  }

  if (items.length === 0) {
    items.push({ label: 'Terms', value: 'As per Charter Party' });
  }

  return { heading: 'Laytime & Demurrage', items };
}

function buildCommission(input: FixtureRecapInput): FixtureRecapSection {
  const items: { label: string; value: string }[] = [];

  if (input.commission !== undefined) {
    items.push({
      label: 'Brokerage Commission',
      value: `${formatNumber(input.commission)}%`,
    });
  }

  if (input.addressCommission !== undefined) {
    items.push({
      label: 'Address Commission',
      value: `${formatNumber(input.addressCommission)}%`,
    });
  }

  if (items.length === 0) {
    items.push({ label: 'Commission', value: 'As per agreement' });
  }

  return { heading: 'Commission', items };
}

function buildCharterPartyForm(input: FixtureRecapInput): FixtureRecapSection {
  return {
    heading: 'Charter Party Form',
    items: [
      {
        label: 'CP Form',
        value: input.cpForm ?? 'To be agreed',
      },
    ],
  };
}

function buildSpecialTerms(input: FixtureRecapInput): FixtureRecapSection {
  const terms = input.specialTerms ?? [];

  if (terms.length === 0) {
    return {
      heading: 'Special Terms',
      items: [{ label: 'Special Terms', value: 'None' }],
    };
  }

  return {
    heading: 'Special Terms',
    items: terms.map((term, idx) => ({
      label: `Term ${idx + 1}`,
      value: term,
    })),
  };
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export function generateFixtureRecap(input: FixtureRecapInput): FixtureRecap {
  const title = `FIXTURE RECAP — ${input.vesselName} / ${input.chartererName}`;
  const reference = input.charterRef;
  const generatedAt = new Date();

  const sections: FixtureRecapSection[] = [
    buildVesselDetails(input),
    buildCargoDetails(input),
    buildPortRotation(input),
    buildLaycan(input),
    buildFreightTerms(input),
    buildLaytimeAndDemurrage(input),
    buildCommission(input),
    buildCharterPartyForm(input),
    buildSpecialTerms(input),
  ];

  const plainText = buildPlainText(title, reference, sections);

  return {
    title,
    reference,
    generatedAt,
    sections,
    plainText,
  };
}
