import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('VoyagePortCall', {
  fields: (t) => ({
    id: t.exposeID('id'),
    voyageId: t.exposeString('voyageId'),
    portId: t.exposeString('portId'),
    sequence: t.exposeInt('sequence'),
    purpose: t.exposeString('purpose'),
    eta: t.expose('eta', { type: 'DateTime', nullable: true }),
    etd: t.expose('etd', { type: 'DateTime', nullable: true }),
    ata: t.expose('ata', { type: 'DateTime', nullable: true }),
    atd: t.expose('atd', { type: 'DateTime', nullable: true }),
    berthName: t.exposeString('berthName', { nullable: true }),
    cargoOp: t.exposeString('cargoOp', { nullable: true }),
    cargoQty: t.exposeFloat('cargoQty', { nullable: true }),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    voyage: t.relation('voyage'),
    port: t.relation('port'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('voyagePortCalls', (t) =>
  t.prismaField({
    type: ['VoyagePortCall'],
    args: { voyageId: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.voyagePortCall.findMany({
        ...query,
        where: { voyageId: args.voyageId },
        orderBy: { sequence: 'asc' },
      }),
  }),
);

builder.mutationField('addPortCall', (t) =>
  t.prismaField({
    type: 'VoyagePortCall',
    args: {
      voyageId: t.arg.string({ required: true }),
      portId: t.arg.string({ required: true }),
      purpose: t.arg.string({ required: true }),
      eta: t.arg.string(),
      etd: t.arg.string(),
      berthName: t.arg.string(),
      cargoOp: t.arg.string(),
      cargoQty: t.arg.float(),
      notes: t.arg.string(),
    },
    resolve: async (query, _root, args) => {
      // Auto-assign next sequence number
      const last = await prisma.voyagePortCall.findFirst({
        where: { voyageId: args.voyageId },
        orderBy: { sequence: 'desc' },
      });
      const sequence = (last?.sequence ?? 0) + 1;

      return prisma.voyagePortCall.create({
        ...query,
        data: {
          voyageId: args.voyageId,
          portId: args.portId,
          sequence,
          purpose: args.purpose,
          eta: args.eta ? new Date(args.eta) : undefined,
          etd: args.etd ? new Date(args.etd) : undefined,
          berthName: args.berthName ?? undefined,
          cargoOp: args.cargoOp ?? undefined,
          cargoQty: args.cargoQty ?? undefined,
          notes: args.notes ?? undefined,
        },
      });
    },
  }),
);

builder.mutationField('removePortCall', (t) =>
  t.prismaField({
    type: 'VoyagePortCall',
    args: { id: t.arg.string({ required: true }) },
    resolve: async (query, _root, args) => {
      const pc = await prisma.voyagePortCall.delete({
        ...query,
        where: { id: args.id },
      });
      // Resequence remaining port calls
      const remaining = await prisma.voyagePortCall.findMany({
        where: { voyageId: pc.voyageId },
        orderBy: { sequence: 'asc' },
      });
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].sequence !== i + 1) {
          await prisma.voyagePortCall.update({
            where: { id: remaining[i].id },
            data: { sequence: i + 1 },
          });
        }
      }
      return pc;
    },
  }),
);

builder.mutationField('reorderPortCall', (t) =>
  t.prismaField({
    type: 'VoyagePortCall',
    args: {
      id: t.arg.string({ required: true }),
      newSequence: t.arg.int({ required: true }),
    },
    resolve: async (query, _root, args) => {
      const pc = await prisma.voyagePortCall.findUniqueOrThrow({
        where: { id: args.id },
      });
      const oldSeq = pc.sequence;
      const newSeq = args.newSequence;

      if (oldSeq === newSeq) return prisma.voyagePortCall.findUniqueOrThrow({ ...query, where: { id: args.id } });

      // Shift other port calls
      if (newSeq < oldSeq) {
        await prisma.voyagePortCall.updateMany({
          where: {
            voyageId: pc.voyageId,
            sequence: { gte: newSeq, lt: oldSeq },
          },
          data: { sequence: { increment: 1 } },
        });
      } else {
        await prisma.voyagePortCall.updateMany({
          where: {
            voyageId: pc.voyageId,
            sequence: { gt: oldSeq, lte: newSeq },
          },
          data: { sequence: { decrement: 1 } },
        });
      }

      return prisma.voyagePortCall.update({
        ...query,
        where: { id: args.id },
        data: { sequence: newSeq },
      });
    },
  }),
);

builder.mutationField('updatePortCallStatus', (t) =>
  t.prismaField({
    type: 'VoyagePortCall',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      ata: t.arg.string(),
      atd: t.arg.string(),
    },
    resolve: (query, _root, args) =>
      prisma.voyagePortCall.update({
        ...query,
        where: { id: args.id },
        data: {
          status: args.status,
          ata: args.ata ? new Date(args.ata) : undefined,
          atd: args.atd ? new Date(args.atd) : undefined,
        },
      }),
  }),
);
