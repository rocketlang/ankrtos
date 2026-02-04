import { builder } from '../builder.js';

// === TeamInvitation prisma object ===
builder.prismaObject('TeamInvitation', {
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),
    email: t.exposeString('email'),
    role: t.exposeString('role'),
    invitedBy: t.exposeString('invitedBy'),
    token: t.exposeString('token'),
    status: t.exposeString('status'),
    expiresAt: t.expose('expiresAt', { type: 'DateTime' }),
    acceptedAt: t.expose('acceptedAt', { type: 'DateTime', nullable: true }),
    message: t.exposeString('message', { nullable: true }),
    organization: t.relation('organization'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('teamInvitations', (t) =>
  t.prismaField({
    type: ['TeamInvitation'],
    args: {
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.status) where.status = args.status;
      return ctx.prisma.teamInvitation.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

const PendingInvitationCount = builder.objectRef<{
  count: number;
}>('PendingInvitationCount');

PendingInvitationCount.implement({
  fields: (t) => ({
    count: t.exposeInt('count'),
  }),
});

builder.queryField('pendingInvitations', (t) =>
  t.field({
    type: PendingInvitationCount,
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.orgId();
      const count = await ctx.prisma.teamInvitation.count({
        where: {
          organizationId: orgId,
          status: 'pending',
        },
      });
      return { count };
    },
  }),
);

// === Mutations ===

builder.mutationField('inviteTeamMember', (t) =>
  t.prismaField({
    type: 'TeamInvitation',
    args: {
      email: t.arg.string({ required: true }),
      role: t.arg.string({ required: true }),
      message: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Authentication required');

      // Check for existing pending invitation for same email in same org
      const existing = await ctx.prisma.teamInvitation.findFirst({
        where: {
          organizationId: orgId,
          email: args.email,
          status: 'pending',
        },
      });
      if (existing) throw new Error('A pending invitation already exists for this email');

      // 7-day expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      return ctx.prisma.teamInvitation.create({
        ...query,
        data: {
          organizationId: orgId,
          email: args.email,
          role: args.role,
          invitedBy: userId,
          expiresAt,
          message: args.message ?? undefined,
          status: 'pending',
        },
      });
    },
  }),
);

builder.mutationField('cancelInvitation', (t) =>
  t.prismaField({
    type: 'TeamInvitation',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const invitation = await ctx.prisma.teamInvitation.findUnique({ where: { id: args.id } });
      if (!invitation) throw new Error('Invitation not found');
      if (invitation.status !== 'pending') throw new Error(`Cannot cancel invitation in status "${invitation.status}"`);

      return ctx.prisma.teamInvitation.update({
        ...query,
        where: { id: args.id },
        data: { status: 'cancelled' },
      });
    },
  }),
);

builder.mutationField('acceptInvitation', (t) =>
  t.prismaField({
    type: 'TeamInvitation',
    args: {
      token: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const invitation = await ctx.prisma.teamInvitation.findUnique({
        where: { token: args.token },
      });

      if (!invitation) throw new Error('Invalid invitation token');
      if (invitation.status !== 'pending') throw new Error(`Invitation is no longer pending (status: "${invitation.status}")`);

      // Check expiry
      if (new Date() > invitation.expiresAt) {
        // Mark as expired
        await ctx.prisma.teamInvitation.update({
          where: { id: invitation.id },
          data: { status: 'expired' },
        });
        throw new Error('Invitation has expired');
      }

      return ctx.prisma.teamInvitation.update({
        ...query,
        where: { id: invitation.id },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
        },
      });
    },
  }),
);
