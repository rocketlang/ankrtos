import { builder } from '../builder.js';

// ─── PrismaObject ────────────────────────────────────────────────────────────

builder.prismaObject('CommunicationLog', {
  fields: (t) => ({
    id: t.exposeID('id'),
    type: t.exposeString('type'),
    direction: t.exposeString('direction', { nullable: true }),
    subject: t.exposeString('subject', { nullable: true }),
    body: t.exposeString('body', { nullable: true }),
    contactId: t.exposeString('contactId', { nullable: true }),
    companyId: t.exposeString('companyId', { nullable: true }),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    charterId: t.exposeString('charterId', { nullable: true }),
    claimId: t.exposeString('claimId', { nullable: true }),
    leadId: t.exposeString('leadId', { nullable: true }),
    fromAddress: t.exposeString('fromAddress', { nullable: true }),
    toAddresses: t.exposeStringList('toAddresses'),
    ccAddresses: t.exposeStringList('ccAddresses'),
    duration: t.exposeInt('duration', { nullable: true }),
    location: t.exposeString('location', { nullable: true }),
    meetingDate: t.expose('meetingDate', { type: 'DateTime', nullable: true }),
    attachments: t.exposeStringList('attachments'),
    tags: t.exposeStringList('tags'),
    sentiment: t.exposeString('sentiment', { nullable: true }),
    loggedBy: t.exposeString('loggedBy', { nullable: true }),
    isAutoLogged: t.exposeBoolean('isAutoLogged'),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

builder.queryField('communicationLogs', (t) =>
  t.prismaField({
    type: ['CommunicationLog'],
    args: {
      type: t.arg.string(),
      contactId: t.arg.string(),
      companyId: t.arg.string(),
      voyageId: t.arg.string(),
      startDate: t.arg({ type: 'DateTime' }),
      endDate: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };

      if (args.type) where.type = args.type;
      if (args.contactId) where.contactId = args.contactId;
      if (args.companyId) where.companyId = args.companyId;
      if (args.voyageId) where.voyageId = args.voyageId;

      if (args.startDate || args.endDate) {
        const dateFilter: Record<string, unknown> = {};
        if (args.startDate) dateFilter.gte = args.startDate;
        if (args.endDate) dateFilter.lte = args.endDate;
        where.createdAt = dateFilter;
      }

      return ctx.prisma.communicationLog.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

// ─── Grouped by Contact ──────────────────────────────────────────────────────

const ContactCommunicationGroup = builder.objectRef<{
  contactId: string;
  contactName: string | null;
  count: number;
  lastDate: Date | null;
}>('ContactCommunicationGroup');

ContactCommunicationGroup.implement({
  fields: (t) => ({
    contactId: t.exposeString('contactId'),
    contactName: t.exposeString('contactName', { nullable: true }),
    count: t.exposeInt('count'),
    lastDate: t.expose('lastDate', { type: 'DateTime', nullable: true }),
  }),
});

builder.queryField('communicationLogsByContact', (t) =>
  t.field({
    type: [ContactCommunicationGroup],
    resolve: async (_root, _args, ctx) => {
      const logs = await ctx.prisma.communicationLog.findMany({
        where: { ...ctx.orgFilter(), contactId: { not: null } },
        orderBy: { createdAt: 'desc' },
      });

      const groups = new Map<
        string,
        { contactId: string; contactName: string | null; count: number; lastDate: Date | null }
      >();

      for (const log of logs) {
        if (!log.contactId) continue;
        const existing = groups.get(log.contactId);
        if (existing) {
          existing.count++;
        } else {
          groups.set(log.contactId, {
            contactId: log.contactId,
            contactName: null,
            count: 1,
            lastDate: log.createdAt,
          });
        }
      }

      // Enrich with contact names
      const contactIds = Array.from(groups.keys());
      if (contactIds.length > 0) {
        const contacts = await ctx.prisma.contact.findMany({
          where: { id: { in: contactIds } },
          select: { id: true, firstName: true, lastName: true },
        });
        for (const c of contacts) {
          const group = groups.get(c.id);
          if (group) group.contactName = `${c.firstName} ${c.lastName}`;
        }
      }

      return Array.from(groups.values()).sort((a, b) => b.count - a.count);
    },
  }),
);

// ─── Mutations ───────────────────────────────────────────────────────────────

builder.mutationField('createCommunicationLog', (t) =>
  t.prismaField({
    type: 'CommunicationLog',
    args: {
      type: t.arg.string({ required: true }),
      direction: t.arg.string(),
      subject: t.arg.string(),
      body: t.arg.string(),
      contactId: t.arg.string(),
      companyId: t.arg.string(),
      voyageId: t.arg.string(),
      charterId: t.arg.string(),
      claimId: t.arg.string(),
      leadId: t.arg.string(),
      fromAddress: t.arg.string(),
      toAddresses: t.arg.stringList(),
      ccAddresses: t.arg.stringList(),
      duration: t.arg.int(),
      location: t.arg.string(),
      meetingDate: t.arg({ type: 'DateTime' }),
      attachments: t.arg.stringList(),
      tags: t.arg.stringList(),
      sentiment: t.arg.string(),
      loggedBy: t.arg.string(),
      isAutoLogged: t.arg.boolean(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      return ctx.prisma.communicationLog.create({
        ...query,
        data: {
          type: args.type,
          direction: args.direction ?? undefined,
          subject: args.subject ?? undefined,
          body: args.body ?? undefined,
          contactId: args.contactId ?? undefined,
          companyId: args.companyId ?? undefined,
          voyageId: args.voyageId ?? undefined,
          charterId: args.charterId ?? undefined,
          claimId: args.claimId ?? undefined,
          leadId: args.leadId ?? undefined,
          fromAddress: args.fromAddress ?? undefined,
          toAddresses: args.toAddresses ?? [],
          ccAddresses: args.ccAddresses ?? [],
          duration: args.duration ?? undefined,
          location: args.location ?? undefined,
          meetingDate: args.meetingDate ?? undefined,
          attachments: args.attachments ?? [],
          tags: args.tags ?? [],
          sentiment: args.sentiment ?? undefined,
          loggedBy: args.loggedBy ?? ctx.user?.id ?? undefined,
          isAutoLogged: args.isAutoLogged ?? false,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('deleteCommunicationLog', (t) =>
  t.prismaField({
    type: 'CommunicationLog',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.communicationLog.delete({ ...query, where: { id: args.id } }),
  }),
);
