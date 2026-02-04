import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('Nomination', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageId: t.exposeString('voyageId'),
    portCallId: t.exposeString('portCallId', { nullable: true }),
    type: t.exposeString('type'),
    entityName: t.exposeString('entityName'),
    entityId: t.exposeString('entityId', { nullable: true }),
    status: t.exposeString('status'),
    nominatedBy: t.exposeString('nominatedBy', { nullable: true }),
    nominatedAt: t.expose('nominatedAt', { type: 'DateTime' }),
    confirmedAt: t.expose('confirmedAt', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    voyage: t.relation('voyage'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('nominations', (t) =>
  t.prismaField({
    type: ['Nomination'],
    args: {
      voyageId: t.arg.string({ required: true }),
      type: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      prisma.nomination.findMany({
        ...query,
        where: {
          voyageId: args.voyageId,
          ...(args.type ? { type: args.type } : {}),
        },
        orderBy: { nominatedAt: 'desc' },
      }),
  }),
);

builder.mutationField('createNomination', (t) =>
  t.prismaField({
    type: 'Nomination',
    args: {
      voyageId: t.arg.string({ required: true }),
      portCallId: t.arg.string(),
      type: t.arg.string({ required: true }),
      entityName: t.arg.string({ required: true }),
      entityId: t.arg.string(),
      nominatedBy: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      prisma.nomination.create({
        ...query,
        data: {
          voyageId: args.voyageId,
          portCallId: args.portCallId ?? undefined,
          type: args.type,
          entityName: args.entityName,
          entityId: args.entityId ?? undefined,
          nominatedBy: args.nominatedBy ?? undefined,
          notes: args.notes ?? undefined,
        },
      }),
  }),
);

builder.mutationField('confirmNomination', (t) =>
  t.prismaField({
    type: 'Nomination',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.nomination.update({
        ...query,
        where: { id: args.id },
        data: { status: 'confirmed', confirmedAt: new Date() },
      }),
  }),
);

builder.mutationField('rejectNomination', (t) =>
  t.prismaField({
    type: 'Nomination',
    args: {
      id: t.arg.string({ required: true }),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      prisma.nomination.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'rejected',
          notes: args.notes ?? undefined,
        },
      }),
  }),
);
