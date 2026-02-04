import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('CharterPartyAddendum', {
  fields: (t) => ({
    id: t.exposeID('id'),
    charterPartyId: t.exposeString('charterPartyId'),
    version: t.exposeInt('version'),
    title: t.exposeString('title'),
    description: t.exposeString('description', { nullable: true }),
    content: t.exposeString('content', { nullable: true }),
    effectiveDate: t.expose('effectiveDate', { type: 'DateTime' }),
    signedDate: t.expose('signedDate', { type: 'DateTime', nullable: true }),
    status: t.exposeString('status'),
    charterParty: t.relation('charterParty'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('charterPartyAddenda', (t) =>
  t.prismaField({
    type: ['CharterPartyAddendum'],
    args: {
      charterPartyId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.charterPartyAddendum.findMany({
        ...query,
        where: { charterPartyId: args.charterPartyId },
        orderBy: { version: 'asc' },
      }),
  }),
);

builder.mutationField('createCharterPartyAddendum', (t) =>
  t.prismaField({
    type: 'CharterPartyAddendum',
    args: {
      charterPartyId: t.arg.string({ required: true }),
      title: t.arg.string({ required: true }),
      description: t.arg.string({ required: false }),
      content: t.arg.string({ required: false }),
      effectiveDate: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args) => {
      const lastAddendum = await prisma.charterPartyAddendum.findFirst({
        where: { charterPartyId: args.charterPartyId },
        orderBy: { version: 'desc' },
      });
      const version = (lastAddendum?.version ?? 0) + 1;

      return prisma.charterPartyAddendum.create({
        ...query,
        data: {
          charterPartyId: args.charterPartyId,
          version,
          title: args.title,
          description: args.description,
          content: args.content,
          effectiveDate: new Date(args.effectiveDate),
        },
      });
    },
  }),
);

builder.mutationField('signCharterPartyAddendum', (t) =>
  t.prismaField({
    type: 'CharterPartyAddendum',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.charterPartyAddendum.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'signed',
          signedDate: new Date(),
        },
      }),
  }),
);
