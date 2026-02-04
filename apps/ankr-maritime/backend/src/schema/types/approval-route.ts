import { builder } from '../builder.js'

// ── Prisma Objects ───────────────────────────────────────────

builder.prismaObject('ApprovalRoute', {
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),
    name: t.exposeString('name'),
    entityType: t.exposeString('entityType'),
    triggerCondition: t.exposeString('triggerCondition', { nullable: true }),
    autoApprove: t.exposeBoolean('autoApprove'),
    autoApproveBelow: t.exposeFloat('autoApproveBelow', { nullable: true }),
    active: t.exposeBoolean('active'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    steps: t.relation('steps'),
  }),
})

builder.prismaObject('ApprovalStep', {
  fields: (t) => ({
    id: t.exposeID('id'),
    approvalRouteId: t.exposeString('approvalRouteId'),
    stepOrder: t.exposeInt('stepOrder'),
    approverRole: t.exposeString('approverRole'),
    approverUserId: t.exposeString('approverUserId', { nullable: true }),
    action: t.exposeString('action'),
    actionBy: t.exposeString('actionBy', { nullable: true }),
    actionAt: t.expose('actionAt', { type: 'DateTime', nullable: true }),
    comments: t.exposeString('comments', { nullable: true }),
    entityType: t.exposeString('entityType', { nullable: true }),
    entityId: t.exposeString('entityId', { nullable: true }),
    deadline: t.expose('deadline', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    approvalRoute: t.relation('approvalRoute'),
  }),
})

// ── Input Type for Steps ─────────────────────────────────────

const ApprovalStepInput = builder.inputType('ApprovalStepInput', {
  fields: (t) => ({
    stepOrder: t.int({ required: true }),
    approverRole: t.string({ required: true }),
  }),
})

// ── Queries ──────────────────────────────────────────────────

builder.queryField('approvalRoutes', (t) =>
  t.prismaField({
    type: ['ApprovalRoute'],
    args: {
      entityType: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.approvalRoute.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.entityType && { entityType: args.entityType }),
        },
        orderBy: { createdAt: 'desc' },
      }),
  }),
)

builder.queryField('approvalStepsForEntity', (t) =>
  t.prismaField({
    type: ['ApprovalStep'],
    args: {
      entityType: t.arg.string({ required: true }),
      entityId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId
      return ctx.prisma.approvalStep.findMany({
        ...query,
        where: {
          entityType: args.entityType,
          entityId: args.entityId,
          ...(orgId && { approvalRoute: { organizationId: orgId } }),
        },
        orderBy: { stepOrder: 'asc' },
      })
    },
  }),
)

builder.queryField('pendingApprovals', (t) =>
  t.prismaField({
    type: ['ApprovalStep'],
    resolve: (query, _root, _args, ctx) => {
      const userRole = ctx.user?.role
      const orgId = ctx.user?.organizationId
      if (!userRole || !orgId) throw new Error('Authentication required')
      return ctx.prisma.approvalStep.findMany({
        ...query,
        where: {
          action: 'pending',
          approverRole: userRole,
          approvalRoute: { organizationId: orgId },
        },
        orderBy: { createdAt: 'asc' },
      })
    },
  }),
)

// ── Mutations ────────────────────────────────────────────────

builder.mutationField('createApprovalRoute', (t) =>
  t.prismaField({
    type: 'ApprovalRoute',
    args: {
      name: t.arg.string({ required: true }),
      entityType: t.arg.string({ required: true }),
      triggerCondition: t.arg.string(),
      autoApprove: t.arg.boolean(),
      autoApproveBelow: t.arg.float(),
      steps: t.arg({ type: [ApprovalStepInput], required: false }),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId()
      return ctx.prisma.approvalRoute.create({
        ...query,
        data: {
          organizationId: orgId,
          name: args.name,
          entityType: args.entityType,
          triggerCondition: args.triggerCondition ?? undefined,
          autoApprove: args.autoApprove ?? false,
          autoApproveBelow: args.autoApproveBelow ?? undefined,
          ...(args.steps && args.steps.length > 0 && {
            steps: {
              create: args.steps.map((s) => ({
                stepOrder: s.stepOrder,
                approverRole: s.approverRole,
              })),
            },
          }),
        },
      })
    },
  }),
)

builder.mutationField('addApprovalStep', (t) =>
  t.prismaField({
    type: 'ApprovalStep',
    args: {
      approvalRouteId: t.arg.string({ required: true }),
      stepOrder: t.arg.int({ required: true }),
      approverRole: t.arg.string({ required: true }),
      approverUserId: t.arg.string(),
      deadline: t.arg({ type: 'DateTime', required: false }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.approvalStep.create({
        ...query,
        data: {
          approvalRouteId: args.approvalRouteId,
          stepOrder: args.stepOrder,
          approverRole: args.approverRole,
          approverUserId: args.approverUserId ?? undefined,
          deadline: args.deadline ?? undefined,
        },
      }),
  }),
)

builder.mutationField('processApprovalStep', (t) =>
  t.prismaField({
    type: 'ApprovalStep',
    args: {
      stepId: t.arg.string({ required: true }),
      action: t.arg.string({ required: true }), // 'approved' | 'rejected'
      comments: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const validActions = ['approved', 'rejected']
      if (!validActions.includes(args.action)) {
        throw new Error(`Invalid action "${args.action}". Must be: ${validActions.join(', ')}`)
      }
      const userName = ctx.user?.name ?? 'Unknown'
      return ctx.prisma.approvalStep.update({
        ...query,
        where: { id: args.stepId },
        data: {
          action: args.action,
          actionBy: userName,
          actionAt: new Date(),
          comments: args.comments ?? undefined,
        },
      })
    },
  }),
)

builder.mutationField('deleteApprovalRoute', (t) =>
  t.field({
    type: 'Boolean',
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      // Delete steps first (cascade), then the route
      await ctx.prisma.approvalStep.deleteMany({
        where: { approvalRouteId: args.id },
      })
      await ctx.prisma.approvalRoute.delete({
        where: { id: args.id },
      })
      return true
    },
  }),
)
