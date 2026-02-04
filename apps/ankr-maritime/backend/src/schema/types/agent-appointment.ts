import { builder } from '../builder.js'

// === Agent Appointment ===
builder.prismaObject('AgentAppointment', {
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),
    agentId: t.exposeString('agentId'),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    portId: t.exposeString('portId', { nullable: true }),
    portName: t.exposeString('portName', { nullable: true }),
    serviceType: t.exposeString('serviceType'),
    status: t.exposeString('status'),
    appointedDate: t.expose('appointedDate', { type: 'DateTime' }),
    startDate: t.expose('startDate', { type: 'DateTime', nullable: true }),
    endDate: t.expose('endDate', { type: 'DateTime', nullable: true }),
    estimatedCost: t.exposeFloat('estimatedCost', { nullable: true }),
    actualCost: t.exposeFloat('actualCost', { nullable: true }),
    currency: t.exposeString('currency'),
    instructions: t.exposeString('instructions', { nullable: true }),
    performanceRating: t.exposeFloat('performanceRating', { nullable: true }),
    performanceNotes: t.exposeString('performanceNotes', { nullable: true }),
    agent: t.relation('agent'),
    organization: t.relation('organization'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// === Queries ===

builder.queryField('agentAppointments', (t) =>
  t.prismaField({
    type: ['AgentAppointment'],
    args: {
      organizationId: t.arg.string(),
      status: t.arg.string(),
      voyageId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {}
      if (args.organizationId) where.organizationId = args.organizationId
      if (args.status) where.status = args.status
      if (args.voyageId) where.voyageId = args.voyageId
      // Scope to org if authenticated
      const orgId = ctx.user?.organizationId
      if (orgId && !args.organizationId) where.organizationId = orgId

      return ctx.prisma.agentAppointment.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      })
    },
  }),
)

builder.queryField('agentAppointment', (t) =>
  t.prismaField({
    type: 'AgentAppointment',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.agentAppointment.findUnique({
        ...query,
        where: { id: args.id },
      }),
  }),
)

// === Mutations ===

builder.mutationField('appointAgent', (t) =>
  t.prismaField({
    type: 'AgentAppointment',
    args: {
      agentId: t.arg.string({ required: true }),
      voyageId: t.arg.string(),
      portId: t.arg.string(),
      portName: t.arg.string(),
      serviceType: t.arg.string({ required: true }),
      instructions: t.arg.string(),
      estimatedCost: t.arg.float(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId()
      return ctx.prisma.agentAppointment.create({
        ...query,
        data: {
          organizationId: orgId,
          agentId: args.agentId,
          voyageId: args.voyageId ?? undefined,
          portId: args.portId ?? undefined,
          portName: args.portName ?? undefined,
          serviceType: args.serviceType,
          instructions: args.instructions ?? undefined,
          estimatedCost: args.estimatedCost ?? undefined,
        },
      })
    },
  }),
)

builder.mutationField('confirmAppointment', (t) =>
  t.prismaField({
    type: 'AgentAppointment',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.agentAppointment.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'confirmed',
          startDate: new Date(),
        },
      }),
  }),
)

builder.mutationField('completeAppointment', (t) =>
  t.prismaField({
    type: 'AgentAppointment',
    args: {
      id: t.arg.string({ required: true }),
      actualCost: t.arg.float({ required: true }),
      performanceRating: t.arg.float(),
      performanceNotes: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const appointment = await ctx.prisma.agentAppointment.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'completed',
          endDate: new Date(),
          actualCost: args.actualCost,
          performanceRating: args.performanceRating ?? undefined,
          performanceNotes: args.performanceNotes ?? undefined,
        },
      })

      // Update the agent's running rating average if a performance rating was given
      if (args.performanceRating != null) {
        const agent = await ctx.prisma.portAgent.findUniqueOrThrow({
          where: { id: appointment.agentId },
        })
        const newTotalJobs = agent.totalJobs + 1
        const newRating = (agent.rating * agent.totalJobs + args.performanceRating) / newTotalJobs
        await ctx.prisma.portAgent.update({
          where: { id: agent.id },
          data: {
            rating: Math.round(newRating * 100) / 100,
            totalJobs: newTotalJobs,
          },
        })
      }

      return appointment
    },
  }),
)

builder.mutationField('cancelAppointment', (t) =>
  t.prismaField({
    type: 'AgentAppointment',
    args: {
      id: t.arg.string({ required: true }),
      reason: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.agentAppointment.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'cancelled',
          endDate: new Date(),
          ...(args.reason ? { performanceNotes: args.reason } : {}),
        },
      }),
  }),
)
