// ─── Charter Party Generation Service ─────────────────────────────────────────
// Pure functions: no DB access, no Prisma imports.
// Takes input data and returns computed CP documents, recaps, and duplicate checks.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CpGenerationInput {
  fixtureType: string; // voyage_charter, time_charter, coa
  vesselName: string;
  vesselImo?: string;
  vesselDwt: number;
  vesselFlag?: string;
  ownerName: string;
  chartererName: string;
  brokerName?: string;
  cargoDescription: string;
  cargoQuantity: number;
  cargoUnit: string;
  loadPort: string;
  dischargePort: string;
  laycanStart: string;
  laycanEnd: string;
  freightRate: number;
  freightUnit: string;
  demurrageRate: number;
  despatchRate?: number;
  loadRate?: number;
  dischargeRate?: number;
  commission?: number;
  additionalTerms?: string[];
}

export interface CharterPartyDraft {
  title: string;
  preamble: string;
  clauses: CpClause[];
  recap: string;
}

export interface CpClause {
  number: number;
  title: string;
  text: string;
}

export interface FixtureRecapInput {
  vesselName: string;
  ownerName: string;
  chartererName: string;
  brokerName?: string;
  cargoDescription: string;
  cargoQuantity: number;
  loadPort: string;
  dischargePort: string;
  laycanStart: string;
  laycanEnd: string;
  freightRate: number;
  freightUnit: string;
  demurrageRate: number;
  despatchRate?: number;
  loadRate?: number;
  dischargeRate?: number;
  commission?: number;
  additionalTerms?: string[];
  fixtureDate?: string;
}

export interface FixtureRecap {
  sections: RecapSection[];
  fullText: string;
}

export interface RecapSection {
  title: string;
  content: string;
}

export interface EnquiryData {
  id?: string;
  commodity: string;
  loadPort: string;
  dischargePort: string;
  quantity: number;
  laycanStart: string;
  laycanEnd: string;
  chartererName?: string;
}

export interface DuplicateResult {
  isDuplicate: boolean;
  confidence: number; // 0-100
  matchedId?: string;
  matchReasons: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFixtureType(fixtureType: string): string {
  switch (fixtureType) {
    case 'voyage_charter':
      return 'Voyage Charter Party';
    case 'time_charter':
      return 'Time Charter Party';
    case 'coa':
      return 'Contract of Affreightment';
    default:
      return 'Charter Party';
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function datesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();
  if (isNaN(sA) || isNaN(eA) || isNaN(sB) || isNaN(eB)) return false;
  return sA <= eB && sB <= eA;
}

function quantitiesWithinPercent(
  a: number,
  b: number,
  pct: number,
): boolean {
  if (a === 0 && b === 0) return true;
  const max = Math.max(Math.abs(a), Math.abs(b));
  if (max === 0) return true;
  return Math.abs(a - b) / max <= pct / 100;
}

// ─── generateCharterPartyDraft ────────────────────────────────────────────────

export function generateCharterPartyDraft(
  input: CpGenerationInput,
): CharterPartyDraft {
  const cpType = formatFixtureType(input.fixtureType);
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const title = `${cpType} — MV ${input.vesselName}`;

  const preamble = [
    `This ${cpType} is made and entered into on ${today}`,
    `between ${input.ownerName} (hereinafter referred to as "Owners")`,
    `and ${input.chartererName} (hereinafter referred to as "Charterers")`,
    input.brokerName
      ? `with ${input.brokerName} acting as broker.`
      : `without broker involvement.`,
    '',
    `It is hereby mutually agreed that the Owners shall let and the Charterers shall hire`,
    `MV ${input.vesselName} for the carriage of ${input.cargoDescription}`,
    `from ${input.loadPort} to ${input.dischargePort},`,
    `subject to the following terms and conditions:`,
  ].join('\n');

  // ── Build clauses ─────────────────────────────────────────────────────────

  const clauses: CpClause[] = [];
  let n = 0;

  // 1. Vessel
  const vesselDetails = [
    `Name: MV ${input.vesselName}`,
    input.vesselImo ? `IMO Number: ${input.vesselImo}` : null,
    `Deadweight (DWT): ${input.vesselDwt.toLocaleString()} MT`,
    input.vesselFlag ? `Flag: ${input.vesselFlag}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  clauses.push({
    number: ++n,
    title: 'Vessel',
    text: `The Owners shall provide the vessel with the following particulars:\n${vesselDetails}`,
  });

  // 2. Cargo
  clauses.push({
    number: ++n,
    title: 'Cargo',
    text: [
      `Description: ${input.cargoDescription}`,
      `Quantity: ${input.cargoQuantity.toLocaleString()} ${input.cargoUnit}`,
      `The Charterers shall provide full cargo as described above.`,
    ].join('\n'),
  });

  // 3. Loading Port
  clauses.push({
    number: ++n,
    title: 'Loading Port',
    text: `The cargo shall be loaded at ${input.loadPort} or so near thereto as the vessel may safely get and lie always afloat.`,
  });

  // 4. Discharging Port
  clauses.push({
    number: ++n,
    title: 'Discharging Port',
    text: `The cargo shall be discharged at ${input.dischargePort} or so near thereto as the vessel may safely get and lie always afloat.`,
  });

  // 5. Laycan
  clauses.push({
    number: ++n,
    title: 'Laycan',
    text: [
      `Laydays: ${formatDate(input.laycanStart)}`,
      `Cancelling Date: ${formatDate(input.laycanEnd)}`,
      `The vessel shall present Notice of Readiness (NOR) at the loading port`,
      `within the laycan period specified above. Should the vessel fail to tender`,
      `NOR by the cancelling date, the Charterers shall have the option of`,
      `cancelling this Charter Party.`,
    ].join('\n'),
  });

  // 6. Freight
  clauses.push({
    number: ++n,
    title: 'Freight',
    text: [
      `Rate: ${input.freightRate.toFixed(2)} ${input.freightUnit}`,
      `Total estimated freight: ${(input.freightRate * input.cargoQuantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Freight shall be deemed earned upon commencement of loading and shall be`,
      `paid in full within five (5) banking days of completion of discharge,`,
      `less any deductions as per this Charter Party.`,
    ].join('\n'),
  });

  // 7. Demurrage & Despatch
  const despatchLine =
    input.despatchRate != null
      ? `Despatch Rate: ${input.despatchRate.toFixed(2)} per day (despatch on all time saved).`
      : 'Despatch: Not applicable.';

  clauses.push({
    number: ++n,
    title: 'Demurrage & Despatch',
    text: [
      `Demurrage Rate: ${input.demurrageRate.toFixed(2)} per day or pro rata for part of a day.`,
      despatchLine,
      `Demurrage, if any, shall be paid by the Charterers within thirty (30)`,
      `days of completion of discharge upon receipt of Owners' invoice`,
      `supported by time sheets and statement of facts.`,
    ].join('\n'),
  });

  // 8. Loading / Discharging Rate
  const loadRateLine =
    input.loadRate != null
      ? `Loading Rate: ${input.loadRate.toLocaleString()} MT per weather working day (WWD).`
      : 'Loading Rate: As per port custom.';
  const dischRateLine =
    input.dischargeRate != null
      ? `Discharging Rate: ${input.dischargeRate.toLocaleString()} MT per weather working day (WWD).`
      : 'Discharging Rate: As per port custom.';

  clauses.push({
    number: ++n,
    title: 'Loading Rate / Discharging Rate',
    text: [
      loadRateLine,
      dischRateLine,
      `Laytime shall commence six (6) hours after NOR is tendered during`,
      `ordinary office hours, whether in berth or not (WIBON).`,
    ].join('\n'),
  });

  // 9. Commission
  const commPct = input.commission ?? 0;
  clauses.push({
    number: ++n,
    title: 'Commission',
    text:
      commPct > 0
        ? [
            `A commission of ${commPct.toFixed(2)}% on freight, deadfreight, and`,
            `demurrage (if any) shall be paid by the Owners to the broker(s)`,
            input.brokerName ? `(${input.brokerName})` : '',
            `upon collection of freight.`,
          ]
            .filter(Boolean)
            .join(' ')
        : 'No brokerage commission applies to this fixture.',
  });

  // 10. Additional Terms
  const terms = input.additionalTerms ?? [];
  clauses.push({
    number: ++n,
    title: 'Additional Terms',
    text:
      terms.length > 0
        ? terms.map((t, i) => `${i + 1}. ${t}`).join('\n')
        : 'No additional terms.',
  });

  // ── Build recap summary ───────────────────────────────────────────────────

  const recap = [
    `RECAP — ${title}`,
    `Owners: ${input.ownerName} | Charterers: ${input.chartererName}`,
    input.brokerName ? `Broker: ${input.brokerName}` : null,
    `Cargo: ${input.cargoQuantity.toLocaleString()} ${input.cargoUnit} of ${input.cargoDescription}`,
    `Route: ${input.loadPort} → ${input.dischargePort}`,
    `Laycan: ${formatDate(input.laycanStart)} – ${formatDate(input.laycanEnd)}`,
    `Freight: ${input.freightRate.toFixed(2)} ${input.freightUnit}`,
    `Demurrage: ${input.demurrageRate.toFixed(2)}/day`,
    commPct > 0 ? `Commission: ${commPct.toFixed(2)}%` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return { title, preamble, clauses, recap };
}

// ─── generateFixtureRecap ─────────────────────────────────────────────────────

export function generateFixtureRecap(input: FixtureRecapInput): FixtureRecap {
  const sections: RecapSection[] = [];

  // 1. Vessel
  sections.push({
    title: 'Vessel',
    content: `MV ${input.vesselName}`,
  });

  // 2. Owners
  sections.push({
    title: 'Owners',
    content: input.ownerName,
  });

  // 3. Charterers
  sections.push({
    title: 'Charterers',
    content: input.chartererName,
  });

  // 4. Cargo
  sections.push({
    title: 'Cargo',
    content: `${input.cargoQuantity.toLocaleString()} of ${input.cargoDescription}`,
  });

  // 5. Ports
  sections.push({
    title: 'Ports',
    content: `Load: ${input.loadPort} / Discharge: ${input.dischargePort}`,
  });

  // 6. Laycan
  sections.push({
    title: 'Laycan',
    content: `${formatDate(input.laycanStart)} – ${formatDate(input.laycanEnd)}`,
  });

  // 7. Freight
  sections.push({
    title: 'Freight',
    content: `${input.freightRate.toFixed(2)} ${input.freightUnit}`,
  });

  // 8. Demurrage
  const demLines = [`Demurrage: ${input.demurrageRate.toFixed(2)}/day`];
  if (input.despatchRate != null) {
    demLines.push(`Despatch: ${input.despatchRate.toFixed(2)}/day`);
  }
  if (input.loadRate != null) {
    demLines.push(`Load rate: ${input.loadRate.toLocaleString()} MT/WWD`);
  }
  if (input.dischargeRate != null) {
    demLines.push(
      `Discharge rate: ${input.dischargeRate.toLocaleString()} MT/WWD`,
    );
  }
  sections.push({
    title: 'Demurrage',
    content: demLines.join(' | '),
  });

  // 9. Commission
  const commPct = input.commission ?? 0;
  sections.push({
    title: 'Commission',
    content:
      commPct > 0
        ? `${commPct.toFixed(2)}%${input.brokerName ? ` to ${input.brokerName}` : ''}`
        : 'N/A',
  });

  // Additional terms appended as extra sections if present
  if (input.additionalTerms && input.additionalTerms.length > 0) {
    sections.push({
      title: 'Additional Terms',
      content: input.additionalTerms.join('; '),
    });
  }

  if (input.fixtureDate) {
    sections.push({
      title: 'Fixture Date',
      content: formatDate(input.fixtureDate),
    });
  }

  const fullText = sections
    .map((s) => `${s.title}: ${s.content}`)
    .join('\n');

  return { sections, fullText };
}

// ─── detectDuplicateEnquiry ───────────────────────────────────────────────────

export function detectDuplicateEnquiry(
  newEnquiry: EnquiryData,
  existingEnquiries: EnquiryData[],
): DuplicateResult {
  let bestScore = 0;
  let bestId: string | undefined;
  let bestReasons: string[] = [];

  for (const existing of existingEnquiries) {
    let score = 0;
    const reasons: string[] = [];

    // Same commodity (exact match, case-insensitive): +30
    if (
      newEnquiry.commodity.toLowerCase().trim() ===
      existing.commodity.toLowerCase().trim()
    ) {
      score += 30;
      reasons.push(`Same commodity: ${existing.commodity}`);
    }

    // Same load port: +25
    if (
      newEnquiry.loadPort.toLowerCase().trim() ===
      existing.loadPort.toLowerCase().trim()
    ) {
      score += 25;
      reasons.push(`Same load port: ${existing.loadPort}`);
    }

    // Same discharge port: +25
    if (
      newEnquiry.dischargePort.toLowerCase().trim() ===
      existing.dischargePort.toLowerCase().trim()
    ) {
      score += 25;
      reasons.push(`Same discharge port: ${existing.dischargePort}`);
    }

    // Overlapping laycan: +15
    if (
      datesOverlap(
        newEnquiry.laycanStart,
        newEnquiry.laycanEnd,
        existing.laycanStart,
        existing.laycanEnd,
      )
    ) {
      score += 15;
      reasons.push('Overlapping laycan period');
    }

    // Similar quantity (within 20%): +5
    if (quantitiesWithinPercent(newEnquiry.quantity, existing.quantity, 20)) {
      score += 5;
      reasons.push(
        `Similar quantity (${newEnquiry.quantity} vs ${existing.quantity})`,
      );
    }

    // Same charterer name: +10 bonus
    if (
      newEnquiry.chartererName &&
      existing.chartererName &&
      newEnquiry.chartererName.toLowerCase().trim() ===
        existing.chartererName.toLowerCase().trim()
    ) {
      score += 10;
      reasons.push(`Same charterer: ${existing.chartererName}`);
    }

    // Cap at 100
    score = Math.min(score, 100);

    if (score > bestScore) {
      bestScore = score;
      bestId = existing.id;
      bestReasons = reasons;
    }
  }

  return {
    isDuplicate: bestScore >= 70,
    confidence: bestScore,
    matchedId: bestId,
    matchReasons: bestReasons,
  };
}
