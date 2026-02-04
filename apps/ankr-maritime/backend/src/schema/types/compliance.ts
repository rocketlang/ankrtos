import { builder } from '../builder.js';

builder.prismaObject('ComplianceItem', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    category: t.exposeString('category'),
    title: t.exposeString('title'),
    description: t.exposeString('description', { nullable: true }),
    status: t.exposeString('status'),
    dueDate: t.expose('dueDate', { type: 'DateTime', nullable: true }),
    completedDate: t.expose('completedDate', { type: 'DateTime', nullable: true }),
    inspector: t.exposeString('inspector', { nullable: true }),
    findings: t.exposeString('findings', { nullable: true }),
    priority: t.exposeString('priority'),
    vessel: t.relation('vessel'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// Queries
builder.queryField('complianceItems', (t) =>
  t.prismaField({
    type: ['ComplianceItem'],
    args: { vesselId: t.arg.string(), category: t.arg.string(), status: t.arg.string() },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      return ctx.prisma.complianceItem.findMany({
        ...query,
        where: {
          ...(orgId ? { organizationId: orgId } : {}),
          ...(args.vesselId ? { vesselId: args.vesselId } : {}),
          ...(args.category ? { category: args.category } : {}),
          ...(args.status ? { status: args.status } : {}),
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        include: { vessel: true },
      });
    },
  }),
);

// Summary
const ComplianceSummary = builder.objectRef<{
  total: number;
  compliant: number;
  nonCompliant: number;
  pendingReview: number;
  expired: number;
  dueSoon: number;
}>('ComplianceSummary');

ComplianceSummary.implement({
  fields: (t) => ({
    total: t.exposeInt('total'),
    compliant: t.exposeInt('compliant'),
    nonCompliant: t.exposeInt('nonCompliant'),
    pendingReview: t.exposeInt('pendingReview'),
    expired: t.exposeInt('expired'),
    dueSoon: t.exposeInt('dueSoon'),
  }),
});

builder.queryField('complianceSummary', (t) =>
  t.field({
    type: ComplianceSummary,
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.user?.organizationId;
      const where = orgId ? { organizationId: orgId } : {};
      const [total, compliant, nonCompliant, pendingReview, expired] = await Promise.all([
        ctx.prisma.complianceItem.count({ where }),
        ctx.prisma.complianceItem.count({ where: { ...where, status: 'compliant' } }),
        ctx.prisma.complianceItem.count({ where: { ...where, status: 'non_compliant' } }),
        ctx.prisma.complianceItem.count({ where: { ...where, status: 'pending_review' } }),
        ctx.prisma.complianceItem.count({ where: { ...where, status: 'expired' } }),
      ]);
      const thirtyDays = new Date(Date.now() + 30 * 86400000);
      const dueSoon = await ctx.prisma.complianceItem.count({
        where: { ...where, dueDate: { lte: thirtyDays }, status: { not: 'compliant' } },
      });
      return { total, compliant, nonCompliant, pendingReview, expired, dueSoon };
    },
  }),
);

// Mutations
builder.mutationField('createComplianceItem', (t) =>
  t.prismaField({
    type: 'ComplianceItem',
    args: {
      vesselId: t.arg.string({ required: true }),
      category: t.arg.string({ required: true }),
      title: t.arg.string({ required: true }),
      description: t.arg.string(),
      priority: t.arg.string(),
      dueDate: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      if (!orgId) throw new Error('Authentication required');
      return ctx.prisma.complianceItem.create({
        ...query,
        data: {
          vesselId: args.vesselId,
          category: args.category,
          title: args.title,
          description: args.description ?? undefined,
          priority: args.priority ?? 'medium',
          dueDate: args.dueDate ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('updateComplianceStatus', (t) =>
  t.prismaField({
    type: 'ComplianceItem',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      findings: t.arg.string(),
      inspector: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.complianceItem.update({
        ...query,
        where: { id: args.id },
        data: {
          status: args.status,
          findings: args.findings ?? undefined,
          inspector: args.inspector ?? undefined,
          completedDate: args.status === 'compliant' ? new Date() : undefined,
        },
      }),
  }),
);
