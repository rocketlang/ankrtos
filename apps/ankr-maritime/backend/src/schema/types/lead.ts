import { builder } from '../builder.js';

// ─── PrismaObjects ───────────────────────────────────────────────────────────

builder.prismaObject('LeadActivity', {
  fields: (t) => ({
    id: t.exposeID('id'),
    leadId: t.exposeString('leadId'),
    type: t.exposeString('type'),
    title: t.exposeString('title'),
    description: t.exposeString('description', { nullable: true }),
    dueDate: t.expose('dueDate', { type: 'DateTime', nullable: true }),
    completedAt: t.expose('completedAt', { type: 'DateTime', nullable: true }),
    status: t.exposeString('status'),
    assignedTo: t.exposeString('assignedTo', { nullable: true }),
    priority: t.exposeString('priority'),
    outcome: t.exposeString('outcome', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('Lead', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    source: t.exposeString('source'),
    stage: t.exposeString('stage'),
    companyId: t.exposeString('companyId', { nullable: true }),
    companyName: t.exposeString('companyName', { nullable: true }),
    contactId: t.exposeString('contactId', { nullable: true }),
    contactName: t.exposeString('contactName', { nullable: true }),
    vesselType: t.exposeString('vesselType', { nullable: true }),
    cargoType: t.exposeString('cargoType', { nullable: true }),
    route: t.exposeString('route', { nullable: true }),
    estimatedValue: t.exposeFloat('estimatedValue', { nullable: true }),
    probability: t.exposeFloat('probability', { nullable: true }),
    weightedValue: t.exposeFloat('weightedValue', { nullable: true }),
    expectedClose: t.expose('expectedClose', { type: 'DateTime', nullable: true }),
    actualClose: t.expose('actualClose', { type: 'DateTime', nullable: true }),
    lostReason: t.exposeString('lostReason', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    assignedTo: t.exposeString('assignedTo', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    activities: t.relation('activities', { query: { orderBy: { createdAt: 'desc' } } }),
  }),
});

// ─── Custom Types ────────────────────────────────────────────────────────────

const LeadPipelineStage = builder.objectRef<{
  stage: string;
  count: number;
  totalValue: number;
}>('LeadPipelineStage');

LeadPipelineStage.implement({
  fields: (t) => ({
    stage: t.exposeString('stage'),
    count: t.exposeInt('count'),
    totalValue: t.exposeFloat('totalValue'),
  }),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

builder.queryField('leads', (t) =>
  t.prismaField({
    type: ['Lead'],
    args: {
      stage: t.arg.string(),
      assignedTo: t.arg.string(),
      companyId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };

      if (args.stage) where.stage = args.stage;
      if (args.assignedTo) where.assignedTo = args.assignedTo;
      if (args.companyId) where.companyId = args.companyId;

      return ctx.prisma.lead.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('leadsByStage', (t) =>
  t.field({
    type: [LeadPipelineStage],
    resolve: async (_root, _args, ctx) => {
      const leads = await ctx.prisma.lead.findMany({
        where: ctx.orgFilter(),
        select: { stage: true, estimatedValue: true },
      });

      const stageMap = new Map<string, { count: number; totalValue: number }>();
      const stageOrder = ['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

      // Initialize all stages
      for (const s of stageOrder) {
        stageMap.set(s, { count: 0, totalValue: 0 });
      }

      for (const lead of leads) {
        const entry = stageMap.get(lead.stage) ?? { count: 0, totalValue: 0 };
        entry.count++;
        entry.totalValue += lead.estimatedValue ?? 0;
        stageMap.set(lead.stage, entry);
      }

      return stageOrder
        .filter((s) => stageMap.has(s))
        .map((stage) => ({
          stage,
          count: stageMap.get(stage)!.count,
          totalValue: stageMap.get(stage)!.totalValue,
        }));
    },
  }),
);

// ─── Mutations ───────────────────────────────────────────────────────────────

builder.mutationField('createLead', (t) =>
  t.prismaField({
    type: 'Lead',
    args: {
      title: t.arg.string({ required: true }),
      source: t.arg.string({ required: true }),
      companyId: t.arg.string(),
      companyName: t.arg.string(),
      contactId: t.arg.string(),
      contactName: t.arg.string(),
      vesselType: t.arg.string(),
      cargoType: t.arg.string(),
      route: t.arg.string(),
      estimatedValue: t.arg.float(),
      probability: t.arg.float(),
      expectedClose: t.arg({ type: 'DateTime' }),
      notes: t.arg.string(),
      assignedTo: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const probability = args.probability ?? undefined;
      const estimatedValue = args.estimatedValue ?? undefined;
      const weightedValue =
        estimatedValue != null && probability != null
          ? (estimatedValue * probability) / 100
          : undefined;

      return ctx.prisma.lead.create({
        ...query,
        data: {
          title: args.title,
          source: args.source,
          stage: 'prospect',
          companyId: args.companyId ?? undefined,
          companyName: args.companyName ?? undefined,
          contactId: args.contactId ?? undefined,
          contactName: args.contactName ?? undefined,
          vesselType: args.vesselType ?? undefined,
          cargoType: args.cargoType ?? undefined,
          route: args.route ?? undefined,
          estimatedValue,
          probability,
          weightedValue,
          expectedClose: args.expectedClose ?? undefined,
          notes: args.notes ?? undefined,
          assignedTo: args.assignedTo ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

// Lead stage state machine
const VALID_STAGE_TRANSITIONS: Record<string, string[]> = {
  prospect: ['qualified'],
  qualified: ['proposal', 'lost'],
  proposal: ['negotiation', 'lost'],
  negotiation: ['won', 'lost'],
  won: [],
  lost: [],
};

builder.mutationField('updateLeadStage', (t) =>
  t.prismaField({
    type: 'Lead',
    args: {
      id: t.arg.string({ required: true }),
      stage: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const lead = await ctx.prisma.lead.findUnique({ where: { id: args.id } });
      if (!lead) throw new Error('Lead not found');

      const allowed = VALID_STAGE_TRANSITIONS[lead.stage] ?? [];
      if (!allowed.includes(args.stage)) {
        throw new Error(
          `Cannot transition from "${lead.stage}" to "${args.stage}". Allowed: ${allowed.join(', ') || 'none'}`,
        );
      }

      return ctx.prisma.lead.update({
        ...query,
        where: { id: args.id },
        data: { stage: args.stage },
      });
    },
  }),
);

builder.mutationField('assignLead', (t) =>
  t.prismaField({
    type: 'Lead',
    args: {
      id: t.arg.string({ required: true }),
      assignedTo: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.lead.update({
        ...query,
        where: { id: args.id },
        data: { assignedTo: args.assignedTo },
      }),
  }),
);

builder.mutationField('markLeadWon', (t) =>
  t.prismaField({
    type: 'Lead',
    args: { id: t.arg.string({ required: true }) },
    resolve: async (query, _root, args, ctx) => {
      const lead = await ctx.prisma.lead.findUnique({ where: { id: args.id } });
      if (!lead) throw new Error('Lead not found');
      if (lead.stage === 'won') throw new Error('Lead is already marked as won');
      if (lead.stage === 'lost') throw new Error('Cannot mark a lost lead as won');

      return ctx.prisma.lead.update({
        ...query,
        where: { id: args.id },
        data: {
          stage: 'won',
          actualClose: new Date(),
        },
      });
    },
  }),
);

builder.mutationField('markLeadLost', (t) =>
  t.prismaField({
    type: 'Lead',
    args: {
      id: t.arg.string({ required: true }),
      lostReason: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const lead = await ctx.prisma.lead.findUnique({ where: { id: args.id } });
      if (!lead) throw new Error('Lead not found');
      if (lead.stage === 'lost') throw new Error('Lead is already marked as lost');
      if (lead.stage === 'won') throw new Error('Cannot mark a won lead as lost');

      return ctx.prisma.lead.update({
        ...query,
        where: { id: args.id },
        data: {
          stage: 'lost',
          lostReason: args.lostReason,
          actualClose: new Date(),
        },
      });
    },
  }),
);

// ─── Lead Activity Mutations ─────────────────────────────────────────────────

builder.mutationField('createLeadActivity', (t) =>
  t.prismaField({
    type: 'LeadActivity',
    args: {
      leadId: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      title: t.arg.string({ required: true }),
      description: t.arg.string(),
      dueDate: t.arg({ type: 'DateTime' }),
      assignedTo: t.arg.string(),
      priority: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      return ctx.prisma.leadActivity.create({
        ...query,
        data: {
          leadId: args.leadId,
          type: args.type,
          title: args.title,
          description: args.description ?? undefined,
          dueDate: args.dueDate ?? undefined,
          assignedTo: args.assignedTo ?? undefined,
          priority: args.priority ?? 'medium',
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('completeLeadActivity', (t) =>
  t.prismaField({
    type: 'LeadActivity',
    args: {
      id: t.arg.string({ required: true }),
      outcome: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.leadActivity.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          outcome: args.outcome ?? undefined,
        },
      }),
  }),
);
