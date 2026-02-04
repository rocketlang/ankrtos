import { builder } from '../builder.js';

// === Mari8xLLM — Maritime AI Assistant ===

const LlmMessage = builder.objectRef<{
  role: string;
  content: string;
  timestamp: string;
  sources?: { type: string; id: string; label: string }[];
}>('LlmMessage');

LlmMessage.implement({
  fields: (t) => ({
    role: t.exposeString('role'),
    content: t.exposeString('content'),
    timestamp: t.exposeString('timestamp'),
    sources: t.field({
      type: [LlmSource],
      nullable: true,
      resolve: (parent) => parent.sources ?? null,
    }),
  }),
});

const LlmSource = builder.objectRef<{ type: string; id: string; label: string }>('LlmSource');
LlmSource.implement({
  fields: (t) => ({
    type: t.exposeString('type'),
    id: t.exposeString('id'),
    label: t.exposeString('label'),
  }),
});

// Preset quick queries
const presetQueries = [
  'Show fleet financial summary',
  'List all open claims',
  'What is the current demurrage exposure?',
  'Which voyages are in progress?',
  'DA cost breakdown by category',
  'Show bills of lading for active voyages',
  'Vessel utilization summary',
  'Laytime status across all voyages',
];

builder.queryField('llmPresetQueries', (t) =>
  t.stringList({
    resolve: () => presetQueries,
  }),
);

// The main LLM query — processes natural language and returns structured maritime data
builder.queryField('askMari8x', (t) =>
  t.field({
    type: LlmMessage,
    args: { question: t.arg.string({ required: true }) },
    resolve: async (_root, { question }, ctx) => {
      const q = question.toLowerCase();
      const sources: { type: string; id: string; label: string }[] = [];

      // Intent detection + data retrieval
      if (q.includes('fleet') || q.includes('summary') || q.includes('revenue') || q.includes('profit')) {
        const voyages = await ctx.prisma.voyage.findMany({
          include: { charter: true, cargo: true, vessel: true, disbursementAccounts: { include: { lineItems: true } }, laytimeCalculations: true },
        });
        let rev = 0, costs = 0, dem = 0, desp = 0, completed = 0, active = 0;
        for (const v of voyages) {
          if (v.status === 'completed') completed++;
          if (v.status === 'in_progress') active++;
          if (v.charter?.freightRate && v.charter.freightUnit === 'lumpsum') rev += v.charter.freightRate;
          else if (v.charter?.freightRate && v.cargo?.quantity) rev += v.charter.freightRate * v.cargo.quantity;
          for (const da of v.disbursementAccounts) for (const li of da.lineItems) costs += li.amount;
          for (const lt of v.laytimeCalculations) {
            if (lt.result === 'on_demurrage' && lt.amountDue > 0) dem += lt.amountDue;
            if (lt.result === 'on_despatch' && lt.amountDue < 0) desp += Math.abs(lt.amountDue);
          }
          sources.push({ type: 'voyage', id: v.id, label: v.voyageNumber });
        }
        const net = rev + desp - costs - dem;
        return {
          role: 'assistant',
          content: `**Fleet Financial Summary**\n\n` +
            `| Metric | Value |\n|---|---|\n` +
            `| Total Voyages | ${voyages.length} |\n` +
            `| Completed | ${completed} |\n` +
            `| Active | ${active} |\n` +
            `| Revenue | $${rev.toLocaleString()} |\n` +
            `| DA Costs | $${costs.toLocaleString()} |\n` +
            `| Demurrage | $${dem.toLocaleString()} |\n` +
            `| Despatch | $${desp.toLocaleString()} |\n` +
            `| **Net Profit** | **$${net.toLocaleString()}** |\n`,
          timestamp: new Date().toISOString(),
          sources,
        };
      }

      if (q.includes('claim')) {
        const claims = await ctx.prisma.claim.findMany({
          include: { voyage: { include: { vessel: true } } },
          orderBy: { createdAt: 'desc' },
        });
        const open = claims.filter(c => ['open', 'under_investigation', 'negotiation'].includes(c.status));
        const totalAmt = claims.reduce((s, c) => s + c.amount, 0);
        let content = `**Claims Overview** — ${claims.length} total, ${open.length} open\n\nTotal exposure: $${totalAmt.toLocaleString()}\n\n`;
        content += `| # | Type | Voyage | Amount | Status | Priority |\n|---|---|---|---|---|---|\n`;
        for (const c of claims) {
          content += `| ${c.claimNumber} | ${c.type.replace(/_/g, ' ')} | ${c.voyage.voyageNumber} | $${c.amount.toLocaleString()} | ${c.status.replace(/_/g, ' ')} | ${c.priority} |\n`;
          sources.push({ type: 'claim', id: c.id, label: c.claimNumber });
        }
        return { role: 'assistant', content, timestamp: new Date().toISOString(), sources };
      }

      if (q.includes('voyage') && (q.includes('progress') || q.includes('active') || q.includes('current'))) {
        const voyages = await ctx.prisma.voyage.findMany({
          where: { status: 'in_progress' },
          include: { vessel: true, departurePort: true, arrivalPort: true, charter: true },
        });
        let content = `**Active Voyages** — ${voyages.length} in progress\n\n`;
        content += `| Voyage | Vessel | Route | ETA |\n|---|---|---|---|\n`;
        for (const v of voyages) {
          content += `| ${v.voyageNumber} | ${v.vessel.name} | ${v.departurePort?.name ?? '?'} → ${v.arrivalPort?.name ?? '?'} | ${v.eta?.toLocaleDateString() ?? 'TBD'} |\n`;
          sources.push({ type: 'voyage', id: v.id, label: v.voyageNumber });
        }
        return { role: 'assistant', content, timestamp: new Date().toISOString(), sources };
      }

      if (q.includes('da') || q.includes('disbursement') || q.includes('cost breakdown')) {
        const items = await ctx.prisma.daLineItem.findMany();
        const map = new Map<string, number>();
        for (const item of items) map.set(item.category, (map.get(item.category) ?? 0) + item.amount);
        const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
        const total = sorted.reduce((s, [, v]) => s + v, 0);
        let content = `**DA Cost Breakdown** — Total: $${total.toLocaleString()}\n\n`;
        content += `| Category | Amount | % |\n|---|---|---|\n`;
        for (const [cat, amt] of sorted) {
          content += `| ${cat.replace(/_/g, ' ')} | $${amt.toLocaleString()} | ${((amt / total) * 100).toFixed(1)}% |\n`;
        }
        return { role: 'assistant', content, timestamp: new Date().toISOString(), sources: [] };
      }

      if (q.includes('bill') || q.includes('lading') || q.includes('bol') || q.includes('b/l')) {
        const bols = await ctx.prisma.billOfLading.findMany({
          include: { voyage: { include: { vessel: true } } },
          orderBy: { createdAt: 'desc' },
        });
        let content = `**Bills of Lading** — ${bols.length} total\n\n`;
        content += `| B/L # | Type | Voyage | POL | POD | Status |\n|---|---|---|---|---|---|\n`;
        for (const b of bols) {
          content += `| ${b.bolNumber} | ${b.type.toUpperCase()} | ${b.voyage.voyageNumber} | ${b.portOfLoading ?? '-'} | ${b.portOfDischarge ?? '-'} | ${b.status} |\n`;
          sources.push({ type: 'bol', id: b.id, label: b.bolNumber });
        }
        return { role: 'assistant', content, timestamp: new Date().toISOString(), sources };
      }

      if (q.includes('vessel') || q.includes('ship') || q.includes('fleet')) {
        const vessels = await ctx.prisma.vessel.findMany();
        let content = `**Fleet Overview** — ${vessels.length} vessels\n\n`;
        content += `| Vessel | IMO | Type | DWT | Flag | Status |\n|---|---|---|---|---|---|\n`;
        for (const v of vessels) {
          content += `| ${v.name} | ${v.imo} | ${v.type.replace(/_/g, ' ')} | ${v.dwt?.toLocaleString() ?? '-'} | ${v.flag} | ${v.status} |\n`;
          sources.push({ type: 'vessel', id: v.id, label: v.name });
        }
        return { role: 'assistant', content, timestamp: new Date().toISOString(), sources };
      }

      if (q.includes('laytime') || q.includes('demurrage') || q.includes('despatch')) {
        const calcs = await ctx.prisma.laytimeCalculation.findMany({
          include: { voyage: { include: { vessel: true } } },
        });
        let content = `**Laytime Status** — ${calcs.length} calculations\n\n`;
        content += `| Voyage | Type | Allowed | Used | Result | Amount |\n|---|---|---|---|---|---|\n`;
        for (const c of calcs) {
          content += `| ${c.voyage.voyageNumber} | ${c.type} | ${c.allowedHours}h | ${c.usedHours}h | ${c.result.replace(/_/g, ' ')} | $${Math.abs(c.amountDue).toLocaleString()} |\n`;
          sources.push({ type: 'laytime', id: c.id, label: `${c.voyage.voyageNumber} ${c.type}` });
        }
        return { role: 'assistant', content, timestamp: new Date().toISOString(), sources };
      }

      // Default: general help
      return {
        role: 'assistant',
        content: `I'm **Mari8xLLM**, your maritime operations assistant. I can help you with:\n\n` +
          `- **Fleet summary** — revenue, costs, P&L\n` +
          `- **Voyage status** — active voyages, routes, ETAs\n` +
          `- **Claims** — open claims, exposure analysis\n` +
          `- **DA costs** — cost breakdown by category\n` +
          `- **Bills of Lading** — B/L status and details\n` +
          `- **Vessels** — fleet overview and utilization\n` +
          `- **Laytime** — demurrage/despatch status\n\n` +
          `Try asking: *"Show fleet financial summary"* or *"What are the open claims?"*`,
        timestamp: new Date().toISOString(),
        sources: [],
      };
    },
  }),
);

// Enhanced LLM query with RAG support
builder.queryField('askMari8xEnhanced', (t) =>
  t.field({
    type: LlmMessage,
    args: {
      question: t.arg.string({ required: true }),
      useRAG: t.arg.boolean({ defaultValue: true }),
    },
    resolve: async (_root, { question, useRAG }, ctx) => {
      const user = ctx.request.user;
      if (!user) throw new Error('Not authenticated');

      // Try RAG first if enabled
      if (useRAG) {
        try {
          const { maritimeRAG } = await import('../../services/maritime-rag.js');
          const ragAnswer = await maritimeRAG.ask(
            question,
            { limit: 5 },
            user.organizationId
          );

          // Convert RAG sources to LlmSource format
          const sources = ragAnswer.sources.map((s) => ({
            type: 'document',
            id: s.documentId,
            label: s.title,
          }));

          return {
            role: 'assistant',
            content: ragAnswer.answer,
            timestamp: ragAnswer.timestamp.toISOString(),
            sources,
          };
        } catch (error) {
          console.error('[askMari8xEnhanced] RAG error:', error);
          // Fall through to keyword-based search
        }
      }

      // Fallback to original askMari8x logic
      const q = question.toLowerCase();
      const sources: { type: string; id: string; label: string }[] = [];

      // Simple keyword-based response as fallback
      return {
        role: 'assistant',
        content: `I'm processing your question: "${question}"\n\nFor better answers, please enable RAG or try using specific queries like "Show fleet financial summary".`,
        timestamp: new Date().toISOString(),
        sources: [],
      };
    },
  }),
);
