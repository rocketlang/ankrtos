import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('FixtureSubject', {
  fields: (t) => ({
    id: t.exposeID('id'),
    charterId: t.exposeString('charterId'),
    type: t.exposeString('type'),
    description: t.exposeString('description'),
    deadline: t.expose('deadline', { type: 'DateTime' }),
    liftedAt: t.expose('liftedAt', { type: 'DateTime', nullable: true }),
    liftedBy: t.exposeString('liftedBy', { nullable: true }),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    charter: t.relation('charter'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('fixtureSubjects', (t) =>
  t.prismaField({
    type: ['FixtureSubject'],
    args: {
      charterId: t.arg.string({ required: true }),
      status: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.fixtureSubject.findMany({
        ...query,
        where: {
          charterId: args.charterId,
          ...(args.status ? { status: args.status } : {}),
        },
        orderBy: { deadline: 'asc' },
      }),
  }),
);

builder.mutationField('addFixtureSubject', (t) =>
  t.prismaField({
    type: 'FixtureSubject',
    args: {
      charterId: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      description: t.arg.string({ required: true }),
      deadline: t.arg.string({ required: true }),
      notes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.fixtureSubject.create({
        ...query,
        data: {
          charterId: args.charterId,
          type: args.type,
          description: args.description,
          deadline: new Date(args.deadline),
          notes: args.notes,
        },
      }),
  }),
);

builder.mutationField('liftFixtureSubject', (t) =>
  t.prismaField({
    type: 'FixtureSubject',
    args: {
      id: t.arg.string({ required: true }),
      liftedBy: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.fixtureSubject.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'lifted',
          liftedAt: new Date(),
          liftedBy: args.liftedBy,
        },
      }),
  }),
);

builder.mutationField('failFixtureSubject', (t) =>
  t.prismaField({
    type: 'FixtureSubject',
    args: {
      id: t.arg.string({ required: true }),
      notes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.fixtureSubject.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'failed',
          notes: args.notes,
        },
      }),
  }),
);
