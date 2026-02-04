import { builder } from '../builder.js';

// ─── Custom Object Types ─────────────────────────────────────────────────────

const PipelineCount = builder.objectRef<{
  stage: string;
  count: number;
  totalValue: number;
}>('PipelineCount');

PipelineCount.implement({
  fields: (t) => ({
    stage: t.exposeString('stage'),
    count: t.exposeInt('count'),
    totalValue: t.exposeFloat('totalValue'),
  }),
});

const TopCustomer = builder.objectRef<{
  companyId: string;
  companyName: string;
  totalRevenue: number;
  totalFixtures: number;
}>('TopCustomer');

TopCustomer.implement({
  fields: (t) => ({
    companyId: t.exposeString('companyId'),
    companyName: t.exposeString('companyName'),
    totalRevenue: t.exposeFloat('totalRevenue'),
    totalFixtures: t.exposeInt('totalFixtures'),
  }),
});

const CRMDashboard = builder.objectRef<{
  totalLeads: number;
  leadsByStage: { stage: string; count: number; totalValue: number }[];
  totalPipelineValue: number;
  avgDealSize: number;
  recentCommunications7d: number;
  recentCommunications30d: number;
  topCustomers: { companyId: string; companyName: string; totalRevenue: number; totalFixtures: number }[];
  conversionRate: number;
}>('CRMDashboard');

CRMDashboard.implement({
  fields: (t) => ({
    totalLeads: t.exposeInt('totalLeads'),
    leadsByStage: t.field({
      type: [PipelineCount],
      resolve: (parent) => parent.leadsByStage,
    }),
    totalPipelineValue: t.exposeFloat('totalPipelineValue'),
    avgDealSize: t.exposeFloat('avgDealSize'),
    recentCommunications7d: t.exposeInt('recentCommunications7d'),
    recentCommunications30d: t.exposeInt('recentCommunications30d'),
    topCustomers: t.field({
      type: [TopCustomer],
      resolve: (parent) => parent.topCustomers,
    }),
    conversionRate: t.exposeFloat('conversionRate'),
  }),
});

// ─── Query ───────────────────────────────────────────────────────────────────

builder.queryField('crmDashboard', (t) =>
  t.field({
    type: CRMDashboard,
    resolve: async (_root, _args, ctx) => {
      const orgFilter = ctx.orgFilter();
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch all data in parallel
      const [leads, comms7d, comms30d, profiles] = await Promise.all([
        ctx.prisma.lead.findMany({
          where: orgFilter,
          select: { stage: true, estimatedValue: true },
        }),
        ctx.prisma.communicationLog.count({
          where: { ...orgFilter, createdAt: { gte: sevenDaysAgo } },
        }),
        ctx.prisma.communicationLog.count({
          where: { ...orgFilter, createdAt: { gte: thirtyDaysAgo } },
        }),
        ctx.prisma.customerProfile.findMany({
          where: orgFilter,
          orderBy: { totalRevenue: 'desc' },
          take: 5,
          select: { companyId: true, companyName: true, totalRevenue: true, totalFixtures: true },
        }),
      ]);

      // Aggregate leads by stage
      const stageMap = new Map<string, { count: number; totalValue: number }>();
      let totalPipelineValue = 0;

      for (const lead of leads) {
        const entry = stageMap.get(lead.stage) ?? { count: 0, totalValue: 0 };
        entry.count++;
        entry.totalValue += lead.estimatedValue ?? 0;
        stageMap.set(lead.stage, entry);

        // Pipeline value includes only active stages (not won/lost)
        if (lead.stage !== 'won' && lead.stage !== 'lost') {
          totalPipelineValue += lead.estimatedValue ?? 0;
        }
      }

      const leadsByStage = Array.from(stageMap.entries()).map(([stage, data]) => ({
        stage,
        count: data.count,
        totalValue: data.totalValue,
      }));

      // Conversion rate: won / (won + lost)
      const wonCount = stageMap.get('won')?.count ?? 0;
      const lostCount = stageMap.get('lost')?.count ?? 0;
      const totalClosed = wonCount + lostCount;
      const conversionRate = totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0;

      // Average deal size (from active pipeline leads)
      const activeLeads = leads.filter((l) => l.stage !== 'won' && l.stage !== 'lost');
      const activeCount = activeLeads.length;
      const avgDealSize = activeCount > 0 ? totalPipelineValue / activeCount : 0;

      return {
        totalLeads: leads.length,
        leadsByStage,
        totalPipelineValue,
        avgDealSize,
        recentCommunications7d: comms7d,
        recentCommunications30d: comms30d,
        topCustomers: profiles.map((p) => ({
          companyId: p.companyId,
          companyName: p.companyName,
          totalRevenue: p.totalRevenue,
          totalFixtures: p.totalFixtures,
        })),
        conversionRate,
      };
    },
  }),
);
