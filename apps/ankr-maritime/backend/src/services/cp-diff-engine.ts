/**
 * Charter Party Clause-Level Comparison Engine
 *
 * Pure functions for parsing, diffing, and scoring changes between
 * two versions of a charter party document. No database access.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CpClause {
  number: string;
  title: string;
  content: string;
}

export interface DiffResult {
  added: CpClause[];
  removed: CpClause[];
  modified: {
    clause: string;
    oldContent: string;
    newContent: string;
    changeType: 'wording' | 'amount' | 'date' | 'party';
  }[];
  unchanged: string[];
  summary: string;
}

export interface ChangeScore {
  severity: 'minor' | 'moderate' | 'major';
  riskAreas: string[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const CLAUSE_PATTERN = /(?:^|\n)\s*(?:Clause|Article)\s+(\d+(?:\.\d+)?)\s*[:\-–—]\s*/gi;

const CURRENCY_AMOUNT_RE =
  /(?:USD|EUR|GBP|JPY|CNY|\$|€|£|¥)\s?[\d,]+(?:\.\d{1,2})?|[\d,]+(?:\.\d{1,2})?\s?(?:USD|EUR|GBP|JPY|CNY)/gi;

const DATE_RE =
  /\b\d{1,2}[\s/\-.](?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2})[\s/\-.](?:19|20)\d{2}\b/gi;

const PARTY_KEYWORDS = [
  'owner',
  'owners',
  'charterer',
  'charterers',
  'disponent',
  'shipowner',
  'ship-owner',
  'carrier',
  'shipper',
  'consignee',
  'principal',
  'agent',
  'broker',
];

const HIGH_RISK_CLAUSE_TERMS = [
  'demurrage',
  'despatch',
  'liability',
  'indemnity',
  'indemnification',
  'limitation of liability',
  'termination',
  'force majeure',
  'arbitration',
  'governing law',
  'lien',
  'war risk',
  'deviation',
  'general average',
  'penalty',
  'damages',
  'insurance',
];

function extractAmounts(text: string): string[] {
  return (text.match(CURRENCY_AMOUNT_RE) ?? []).map((s) => s.trim());
}

function extractDates(text: string): string[] {
  return (text.match(DATE_RE) ?? []).map((s) => s.trim());
}

function detectPartyNameChanges(oldText: string, newText: string): boolean {
  const oldLower = oldText.toLowerCase();
  const newLower = newText.toLowerCase();

  for (const keyword of PARTY_KEYWORDS) {
    const oldIdx = oldLower.indexOf(keyword);
    const newIdx = newLower.indexOf(keyword);
    if (oldIdx === -1 && newIdx === -1) continue;
    if ((oldIdx === -1) !== (newIdx === -1)) return true;

    // Check surrounding context (30 chars after keyword) for differences
    const contextLen = 60;
    const oldContext = oldLower.substring(oldIdx, oldIdx + keyword.length + contextLen);
    const newContext = newLower.substring(newIdx, newIdx + keyword.length + contextLen);
    if (oldContext !== newContext) return true;
  }
  return false;
}

function classifyChange(
  oldContent: string,
  newContent: string,
): 'amount' | 'date' | 'party' | 'wording' {
  const oldAmounts = extractAmounts(oldContent);
  const newAmounts = extractAmounts(newContent);
  if (
    oldAmounts.length !== newAmounts.length ||
    oldAmounts.some((a, i) => a !== newAmounts[i])
  ) {
    return 'amount';
  }

  const oldDates = extractDates(oldContent);
  const newDates = extractDates(newContent);
  if (
    oldDates.length !== newDates.length ||
    oldDates.some((d, i) => d !== newDates[i])
  ) {
    return 'date';
  }

  if (detectPartyNameChanges(oldContent, newContent)) {
    return 'party';
  }

  return 'wording';
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Simple word-level diff producing tokens tagged as equal / added / removed.
 */
function wordDiff(
  oldText: string,
  newText: string,
): Array<{ type: 'equal' | 'add' | 'remove'; text: string }> {
  const oldWords = oldText.split(/\s+/);
  const newWords = newText.split(/\s+/);

  // Simple LCS-based diff (adequate for clause-length text)
  const m = oldWords.length;
  const n = newWords.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const result: Array<{ type: 'equal' | 'add' | 'remove'; text: string }> = [];
  let i = m;
  let j = n;
  const stack: Array<{ type: 'equal' | 'add' | 'remove'; text: string }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      stack.push({ type: 'equal', text: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'add', text: newWords[j - 1] });
      j--;
    } else {
      stack.push({ type: 'remove', text: oldWords[i - 1] });
      i--;
    }
  }

  // Reverse and merge consecutive same-type tokens
  for (let k = stack.length - 1; k >= 0; k--) {
    const token = stack[k];
    if (result.length > 0 && result[result.length - 1].type === token.type) {
      result[result.length - 1].text += ' ' + token.text;
    } else {
      result.push({ ...token });
    }
  }

  return result;
}

function isClauseTitleHighRisk(title: string): boolean {
  const lower = title.toLowerCase();
  return HIGH_RISK_CLAUSE_TERMS.some((term) => lower.includes(term));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a charter party text into individual clauses.
 * Recognises patterns like "Clause 1:", "Clause 1.2:", "Article 3:" etc.
 */
export function parseCharterParty(cpText: string): CpClause[] {
  const clauses: CpClause[] = [];
  const indices: { number: string; start: number; matchEnd: number }[] = [];

  let match: RegExpExecArray | null;
  const pattern = new RegExp(CLAUSE_PATTERN.source, 'gi');

  while ((match = pattern.exec(cpText)) !== null) {
    indices.push({
      number: match[1],
      start: match.index,
      matchEnd: match.index + match[0].length,
    });
  }

  if (indices.length === 0) {
    // Fallback: treat entire text as a single clause
    const trimmed = cpText.trim();
    if (trimmed.length > 0) {
      clauses.push({ number: '1', title: 'Full Text', content: trimmed });
    }
    return clauses;
  }

  for (let idx = 0; idx < indices.length; idx++) {
    const entry = indices[idx];
    const nextStart =
      idx + 1 < indices.length ? indices[idx + 1].start : cpText.length;
    const rawContent = cpText.substring(entry.matchEnd, nextStart).trim();

    // Try to extract a title from the first line
    const firstLineEnd = rawContent.indexOf('\n');
    let title: string;
    let content: string;

    if (firstLineEnd !== -1 && firstLineEnd < 120) {
      title = rawContent.substring(0, firstLineEnd).trim().replace(/[:\-–—]+$/, '').trim();
      content = rawContent.substring(firstLineEnd + 1).trim();
    } else {
      title = rawContent.substring(0, 80).replace(/[:\-–—]+$/, '').trim();
      content = rawContent;
    }

    clauses.push({ number: entry.number, title, content });
  }

  return clauses;
}

/**
 * Perform clause-by-clause comparison between two charter party versions.
 */
export function diffCharterParties(
  versionA: string,
  versionB: string,
): DiffResult {
  const clausesA = parseCharterParty(versionA);
  const clausesB = parseCharterParty(versionB);

  const mapA = new Map<string, CpClause>();
  const mapB = new Map<string, CpClause>();

  for (const c of clausesA) mapA.set(c.number, c);
  for (const c of clausesB) mapB.set(c.number, c);

  const allNumbers = new Set([...mapA.keys(), ...mapB.keys()]);

  const added: CpClause[] = [];
  const removed: CpClause[] = [];
  const modified: DiffResult['modified'] = [];
  const unchanged: string[] = [];

  for (const num of allNumbers) {
    const clauseA = mapA.get(num);
    const clauseB = mapB.get(num);

    if (!clauseA && clauseB) {
      added.push(clauseB);
    } else if (clauseA && !clauseB) {
      removed.push(clauseA);
    } else if (clauseA && clauseB) {
      const normA = normalizeWhitespace(clauseA.content);
      const normB = normalizeWhitespace(clauseB.content);

      if (normA === normB) {
        unchanged.push(num);
      } else {
        modified.push({
          clause: num,
          oldContent: clauseA.content,
          newContent: clauseB.content,
          changeType: classifyChange(clauseA.content, clauseB.content),
        });
      }
    }
  }

  // Build summary
  const parts: string[] = [];
  if (added.length > 0) parts.push(`${added.length} clause(s) added`);
  if (removed.length > 0) parts.push(`${removed.length} clause(s) removed`);
  if (modified.length > 0) parts.push(`${modified.length} clause(s) modified`);
  if (unchanged.length > 0) parts.push(`${unchanged.length} clause(s) unchanged`);

  const changeBreakdown = modified.reduce(
    (acc, m) => {
      acc[m.changeType] = (acc[m.changeType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const breakdownParts = Object.entries(changeBreakdown).map(
    ([type, count]) => `${count} ${type}`,
  );
  if (breakdownParts.length > 0) {
    parts.push(`Change types: ${breakdownParts.join(', ')}`);
  }

  const summary = parts.length > 0 ? parts.join('. ') + '.' : 'No differences found.';

  return { added, removed, modified, unchanged, summary };
}

/**
 * Generate an HTML redline showing deletions and insertions at the word level.
 */
export function generateRedlineHtml(
  versionA: string,
  versionB: string,
): string {
  const clausesA = parseCharterParty(versionA);
  const clausesB = parseCharterParty(versionB);

  const mapA = new Map<string, CpClause>();
  const mapB = new Map<string, CpClause>();
  for (const c of clausesA) mapA.set(c.number, c);
  for (const c of clausesB) mapB.set(c.number, c);

  const allNumbers = [
    ...new Set([...mapA.keys(), ...mapB.keys()]),
  ].sort((a, b) => parseFloat(a) - parseFloat(b));

  const htmlParts: string[] = [
    '<!DOCTYPE html>',
    '<html><head><meta charset="utf-8">',
    '<style>',
    '  body { font-family: "Times New Roman", serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }',
    '  .clause { margin-bottom: 1.5em; }',
    '  .clause-header { font-weight: bold; margin-bottom: 0.3em; }',
    '  del { background-color: #fdd; color: #900; text-decoration: line-through; }',
    '  ins { background-color: #dfd; color: #060; text-decoration: underline; }',
    '  .added-clause { border-left: 4px solid #090; padding-left: 12px; }',
    '  .removed-clause { border-left: 4px solid #c00; padding-left: 12px; }',
    '  .modified-clause { border-left: 4px solid #f90; padding-left: 12px; }',
    '  .unchanged-clause { border-left: 4px solid #ccc; padding-left: 12px; }',
    '</style></head><body>',
    '<h1>Charter Party Redline Comparison</h1>',
  ];

  for (const num of allNumbers) {
    const clauseA = mapA.get(num);
    const clauseB = mapB.get(num);

    if (!clauseA && clauseB) {
      htmlParts.push(
        `<div class="clause added-clause">`,
        `  <div class="clause-header">Clause ${escapeHtml(num)}: ${escapeHtml(clauseB.title)} [ADDED]</div>`,
        `  <ins>${escapeHtml(clauseB.content)}</ins>`,
        `</div>`,
      );
    } else if (clauseA && !clauseB) {
      htmlParts.push(
        `<div class="clause removed-clause">`,
        `  <div class="clause-header">Clause ${escapeHtml(num)}: ${escapeHtml(clauseA.title)} [REMOVED]</div>`,
        `  <del>${escapeHtml(clauseA.content)}</del>`,
        `</div>`,
      );
    } else if (clauseA && clauseB) {
      const normA = normalizeWhitespace(clauseA.content);
      const normB = normalizeWhitespace(clauseB.content);

      if (normA === normB) {
        htmlParts.push(
          `<div class="clause unchanged-clause">`,
          `  <div class="clause-header">Clause ${escapeHtml(num)}: ${escapeHtml(clauseA.title)}</div>`,
          `  <p>${escapeHtml(clauseA.content)}</p>`,
          `</div>`,
        );
      } else {
        const tokens = wordDiff(clauseA.content, clauseB.content);
        const diffHtml = tokens
          .map((t) => {
            switch (t.type) {
              case 'equal':
                return escapeHtml(t.text);
              case 'remove':
                return `<del>${escapeHtml(t.text)}</del>`;
              case 'add':
                return `<ins>${escapeHtml(t.text)}</ins>`;
            }
          })
          .join(' ');

        htmlParts.push(
          `<div class="clause modified-clause">`,
          `  <div class="clause-header">Clause ${escapeHtml(num)}: ${escapeHtml(clauseA.title)} [MODIFIED]</div>`,
          `  <p>${diffHtml}</p>`,
          `</div>`,
        );
      }
    }
  }

  htmlParts.push('</body></html>');
  return htmlParts.join('\n');
}

/**
 * Score the overall change impact of a diff result.
 */
export function calculateChangeScore(diff: DiffResult): ChangeScore {
  const riskAreas: string[] = [];

  // Check added/removed clauses for high-risk terms
  for (const clause of [...diff.added, ...diff.removed]) {
    if (isClauseTitleHighRisk(clause.title) || isClauseTitleHighRisk(clause.content)) {
      const area = diff.added.includes(clause)
        ? `Added clause ${clause.number} (${clause.title})`
        : `Removed clause ${clause.number} (${clause.title})`;
      riskAreas.push(area);
    }
  }

  // Check modified clauses
  for (const mod of diff.modified) {
    if (
      isClauseTitleHighRisk(mod.oldContent) ||
      isClauseTitleHighRisk(mod.newContent)
    ) {
      riskAreas.push(`Modified clause ${mod.clause} (${mod.changeType} change)`);
    }
    if (mod.changeType === 'amount') {
      riskAreas.push(`Financial change in clause ${mod.clause}`);
    }
    if (mod.changeType === 'party') {
      riskAreas.push(`Party name change in clause ${mod.clause}`);
    }
  }

  // Determine severity
  const totalChanges = diff.added.length + diff.removed.length + diff.modified.length;
  const amountChanges = diff.modified.filter((m) => m.changeType === 'amount').length;
  const partyChanges = diff.modified.filter((m) => m.changeType === 'party').length;
  const hasStructuralChanges = diff.added.length > 0 || diff.removed.length > 0;

  let severity: 'minor' | 'moderate' | 'major';

  if (
    riskAreas.length >= 3 ||
    diff.removed.length >= 2 ||
    amountChanges >= 2 ||
    partyChanges >= 1 ||
    totalChanges >= 8
  ) {
    severity = 'major';
  } else if (
    riskAreas.length >= 1 ||
    hasStructuralChanges ||
    amountChanges >= 1 ||
    totalChanges >= 4
  ) {
    severity = 'moderate';
  } else {
    severity = 'minor';
  }

  return { severity, riskAreas };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
