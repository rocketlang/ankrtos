import { builder } from '../builder.js'

// === Port Agent ===
builder.prismaObject('PortAgent', {
  fields: (t) => ({
    id: t.exposeID('id'),
    companyName: t.exposeString('companyName'),
    contactPerson: t.exposeString('contactPerson', { nullable: true }),
    email: t.exposeString('email', { nullable: true }),
    phone: t.exposeString('phone', { nullable: true }),
    country: t.exposeString('country'),
    city: t.exposeString('city'),
    portIds: t.exposeStringList('portIds'),
    serviceTypes: t.exposeStringList('serviceTypes'),
    rating: t.exposeFloat('rating'),
    totalJobs: t.exposeInt('totalJobs'),
    avgResponseHrs: t.exposeFloat('avgResponseHrs'),
    isVerified: t.exposeBoolean('isVerified'),
    verifiedDate: t.expose('verifiedDate', { type: 'DateTime', nullable: true }),
    licenseNumber: t.exposeString('licenseNumber', { nullable: true }),
    insuranceCover: t.exposeFloat('insuranceCover', { nullable: true }),
    insuranceExpiry: t.expose('insuranceExpiry', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    active: t.exposeBoolean('active'),
    appointments: t.relation('appointments'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// === Queries ===

builder.queryField('portAgents', (t) =>
  t.prismaField({
    type: ['PortAgent'],
    args: {
      country: t.arg.string(),
      city: t.arg.string(),
      serviceType: t.arg.string(),
      minRating: t.arg.float(),
      portId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { active: true }
      if (args.country) where.country = args.country
      if (args.city) where.city = { contains: args.city, mode: 'insensitive' as const }
      if (args.serviceType) where.serviceTypes = { has: args.serviceType }
      if (args.minRating != null) where.rating = { gte: args.minRating }
      if (args.portId) where.portIds = { has: args.portId }

      return ctx.prisma.portAgent.findMany({
        ...query,
        where,
        orderBy: { rating: 'desc' },
      })
    },
  }),
)

builder.queryField('portAgent', (t) =>
  t.prismaField({
    type: 'PortAgent',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.portAgent.findUnique({
        ...query,
        where: { id: args.id },
      }),
  }),
)

builder.queryField('portAgentSearch', (t) =>
  t.prismaField({
    type: ['PortAgent'],
    args: { query: t.arg.string({ required: true }) },
    resolve: (queryOpts, _root, args, ctx) =>
      ctx.prisma.portAgent.findMany({
        ...queryOpts,
        where: {
          active: true,
          OR: [
            { companyName: { contains: args.query, mode: 'insensitive' as const } },
            { city: { contains: args.query, mode: 'insensitive' as const } },
            { country: { contains: args.query, mode: 'insensitive' as const } },
            { contactPerson: { contains: args.query, mode: 'insensitive' as const } },
          ],
        },
        orderBy: { rating: 'desc' },
        take: 25,
      }),
  }),
)

// === Mutations ===

builder.mutationField('createPortAgent', (t) =>
  t.prismaField({
    type: 'PortAgent',
    args: {
      companyName: t.arg.string({ required: true }),
      contactPerson: t.arg.string(),
      email: t.arg.string(),
      phone: t.arg.string(),
      country: t.arg.string({ required: true }),
      city: t.arg.string({ required: true }),
      portIds: t.arg.stringList(),
      serviceTypes: t.arg.stringList(),
      licenseNumber: t.arg.string(),
      insuranceCover: t.arg.float(),
      insuranceExpiry: t.arg({ type: 'DateTime' }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.portAgent.create({
        ...query,
        data: {
          companyName: args.companyName,
          contactPerson: args.contactPerson ?? undefined,
          email: args.email ?? undefined,
          phone: args.phone ?? undefined,
          country: args.country,
          city: args.city,
          portIds: args.portIds ?? [],
          serviceTypes: args.serviceTypes ?? [],
          licenseNumber: args.licenseNumber ?? undefined,
          insuranceCover: args.insuranceCover ?? undefined,
          insuranceExpiry: args.insuranceExpiry ?? undefined,
          notes: args.notes ?? undefined,
        },
      }),
  }),
)

builder.mutationField('updatePortAgent', (t) =>
  t.prismaField({
    type: 'PortAgent',
    args: {
      id: t.arg.string({ required: true }),
      companyName: t.arg.string(),
      contactPerson: t.arg.string(),
      email: t.arg.string(),
      phone: t.arg.string(),
      country: t.arg.string(),
      city: t.arg.string(),
      portIds: t.arg.stringList(),
      serviceTypes: t.arg.stringList(),
      licenseNumber: t.arg.string(),
      insuranceCover: t.arg.float(),
      insuranceExpiry: t.arg({ type: 'DateTime' }),
      notes: t.arg.string(),
      active: t.arg.boolean(),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, unknown> = {}
      if (args.companyName) data.companyName = args.companyName
      if (args.contactPerson !== undefined) data.contactPerson = args.contactPerson
      if (args.email !== undefined) data.email = args.email
      if (args.phone !== undefined) data.phone = args.phone
      if (args.country) data.country = args.country
      if (args.city) data.city = args.city
      if (args.portIds) data.portIds = args.portIds
      if (args.serviceTypes) data.serviceTypes = args.serviceTypes
      if (args.licenseNumber !== undefined) data.licenseNumber = args.licenseNumber
      if (args.insuranceCover != null) data.insuranceCover = args.insuranceCover
      if (args.insuranceExpiry !== undefined) data.insuranceExpiry = args.insuranceExpiry
      if (args.notes !== undefined) data.notes = args.notes
      if (args.active != null) data.active = args.active

      return ctx.prisma.portAgent.update({
        ...query,
        where: { id: args.id },
        data,
      })
    },
  }),
)

builder.mutationField('verifyPortAgent', (t) =>
  t.prismaField({
    type: 'PortAgent',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.portAgent.update({
        ...query,
        where: { id: args.id },
        data: {
          isVerified: true,
          verifiedDate: new Date(),
        },
      }),
  }),
)

builder.mutationField('ratePortAgent', (t) =>
  t.prismaField({
    type: 'PortAgent',
    args: {
      id: t.arg.string({ required: true }),
      rating: t.arg.float({ required: true }),
      notes: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      if (args.rating < 0 || args.rating > 5) throw new Error('Rating must be 0-5')

      const agent = await ctx.prisma.portAgent.findUniqueOrThrow({
        where: { id: args.id },
      })

      // Update running average: newAvg = (oldAvg * totalJobs + newRating) / (totalJobs + 1)
      const newTotalJobs = agent.totalJobs + 1
      const newRating = (agent.rating * agent.totalJobs + args.rating) / newTotalJobs

      return ctx.prisma.portAgent.update({
        ...query,
        where: { id: args.id },
        data: {
          rating: Math.round(newRating * 100) / 100,
          totalJobs: newTotalJobs,
          ...(args.notes ? { notes: args.notes } : {}),
        },
      })
    },
  }),
)
