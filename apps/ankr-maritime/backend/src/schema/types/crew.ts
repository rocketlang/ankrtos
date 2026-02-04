import { builder } from '../builder.js';

builder.prismaObject('CrewMember', {
  fields: (t) => ({
    id: t.exposeID('id'),
    firstName: t.exposeString('firstName'),
    lastName: t.exposeString('lastName'),
    rank: t.exposeString('rank'),
    nationality: t.exposeString('nationality'),
    cdcNumber: t.exposeString('cdcNumber', { nullable: true }),
    passportNumber: t.exposeString('passportNumber', { nullable: true }),
    passportExpiry: t.expose('passportExpiry', { type: 'DateTime', nullable: true }),
    seamanBookNo: t.exposeString('seamanBookNo', { nullable: true }),
    dateOfBirth: t.expose('dateOfBirth', { type: 'DateTime', nullable: true }),
    phone: t.exposeString('phone', { nullable: true }),
    email: t.exposeString('email', { nullable: true }),
    status: t.exposeString('status'),
    organizationId: t.exposeString('organizationId'),
    assignments: t.relation('assignments'),
    certificates: t.relation('certificates'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('CrewAssignment', {
  fields: (t) => ({
    id: t.exposeID('id'),
    crewMemberId: t.exposeString('crewMemberId'),
    vesselId: t.exposeString('vesselId'),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    rank: t.exposeString('rank'),
    signOnDate: t.expose('signOnDate', { type: 'DateTime' }),
    signOffDate: t.expose('signOffDate', { type: 'DateTime', nullable: true }),
    status: t.exposeString('status'),
    crewMember: t.relation('crewMember'),
    vessel: t.relation('vessel'),
    voyage: t.relation('voyage', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('CrewCertificate', {
  fields: (t) => ({
    id: t.exposeID('id'),
    crewMemberId: t.exposeString('crewMemberId'),
    name: t.exposeString('name'),
    issueDate: t.expose('issueDate', { type: 'DateTime', nullable: true }),
    expiryDate: t.expose('expiryDate', { type: 'DateTime', nullable: true }),
    issuingAuth: t.exposeString('issuingAuth', { nullable: true }),
    certNumber: t.exposeString('certNumber', { nullable: true }),
    status: t.exposeString('status'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// Queries
builder.queryField('crewMembers', (t) =>
  t.prismaField({
    type: ['CrewMember'],
    args: { status: t.arg.string(), rank: t.arg.string(), vesselId: t.arg.string() },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      return ctx.prisma.crewMember.findMany({
        ...query,
        where: {
          ...(orgId ? { organizationId: orgId } : {}),
          ...(args.status ? { status: args.status } : {}),
          ...(args.rank ? { rank: args.rank } : {}),
          ...(args.vesselId ? { assignments: { some: { vesselId: args.vesselId, status: 'active' } } } : {}),
        },
        orderBy: { lastName: 'asc' },
        include: { assignments: { include: { vessel: true }, orderBy: { signOnDate: 'desc' }, take: 1 }, certificates: true },
      });
    },
  }),
);

builder.queryField('crewMember', (t) =>
  t.prismaField({
    type: 'CrewMember',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.crewMember.findUnique({
        ...query,
        where: { id: args.id },
        include: { assignments: { include: { vessel: true, voyage: true }, orderBy: { signOnDate: 'desc' } }, certificates: true },
      }),
  }),
);

builder.queryField('crewAssignments', (t) =>
  t.prismaField({
    type: ['CrewAssignment'],
    args: { vesselId: t.arg.string(), status: t.arg.string() },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      return ctx.prisma.crewAssignment.findMany({
        ...query,
        where: {
          ...(args.vesselId ? { vesselId: args.vesselId } : {}),
          ...(args.status ? { status: args.status } : {}),
          ...(orgId ? { vessel: { organizationId: orgId } } : {}),
        },
        orderBy: { signOnDate: 'desc' },
        include: { crewMember: true, vessel: true },
      });
    },
  }),
);

// Summary type
const CrewSummary = builder.objectRef<{
  totalCrew: number;
  onBoard: number;
  available: number;
  onLeave: number;
  expiringCerts: number;
}>('CrewSummary');

CrewSummary.implement({
  fields: (t) => ({
    totalCrew: t.exposeInt('totalCrew'),
    onBoard: t.exposeInt('onBoard'),
    available: t.exposeInt('available'),
    onLeave: t.exposeInt('onLeave'),
    expiringCerts: t.exposeInt('expiringCerts'),
  }),
});

builder.queryField('crewSummary', (t) =>
  t.field({
    type: CrewSummary,
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.user?.organizationId;
      const where = orgId ? { organizationId: orgId } : {};
      const [totalCrew, onBoard, available, onLeave] = await Promise.all([
        ctx.prisma.crewMember.count({ where }),
        ctx.prisma.crewMember.count({ where: { ...where, status: 'on_board' } }),
        ctx.prisma.crewMember.count({ where: { ...where, status: 'available' } }),
        ctx.prisma.crewMember.count({ where: { ...where, status: 'on_leave' } }),
      ]);
      const thirtyDays = new Date(Date.now() + 30 * 86400000);
      const expiringCerts = await ctx.prisma.crewCertificate.count({
        where: {
          expiryDate: { lte: thirtyDays },
          status: 'valid',
          ...(orgId ? { crewMember: { organizationId: orgId } } : {}),
        },
      });
      return { totalCrew, onBoard, available, onLeave, expiringCerts };
    },
  }),
);

// Mutations
builder.mutationField('createCrewMember', (t) =>
  t.prismaField({
    type: 'CrewMember',
    args: {
      firstName: t.arg.string({ required: true }),
      lastName: t.arg.string({ required: true }),
      rank: t.arg.string({ required: true }),
      nationality: t.arg.string({ required: true }),
      cdcNumber: t.arg.string(),
      passportNumber: t.arg.string(),
      phone: t.arg.string(),
      email: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      if (!orgId) throw new Error('Authentication required');
      return ctx.prisma.crewMember.create({
        ...query,
        data: {
          firstName: args.firstName,
          lastName: args.lastName,
          rank: args.rank,
          nationality: args.nationality,
          cdcNumber: args.cdcNumber ?? undefined,
          passportNumber: args.passportNumber ?? undefined,
          phone: args.phone ?? undefined,
          email: args.email ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('assignCrewToVessel', (t) =>
  t.prismaField({
    type: 'CrewAssignment',
    args: {
      crewMemberId: t.arg.string({ required: true }),
      vesselId: t.arg.string({ required: true }),
      voyageId: t.arg.string(),
      rank: t.arg.string({ required: true }),
      signOnDate: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      await ctx.prisma.crewMember.update({ where: { id: args.crewMemberId }, data: { status: 'on_board' } });
      return ctx.prisma.crewAssignment.create({
        ...query,
        data: {
          crewMemberId: args.crewMemberId,
          vesselId: args.vesselId,
          voyageId: args.voyageId ?? undefined,
          rank: args.rank,
          signOnDate: args.signOnDate,
        },
      });
    },
  }),
);

builder.mutationField('signOffCrew', (t) =>
  t.prismaField({
    type: 'CrewAssignment',
    args: {
      assignmentId: t.arg.string({ required: true }),
      signOffDate: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const assignment = await ctx.prisma.crewAssignment.findUniqueOrThrow({ where: { id: args.assignmentId } });
      await ctx.prisma.crewMember.update({ where: { id: assignment.crewMemberId }, data: { status: 'available' } });
      return ctx.prisma.crewAssignment.update({
        ...query,
        where: { id: args.assignmentId },
        data: { signOffDate: args.signOffDate, status: 'completed' },
      });
    },
  }),
);
