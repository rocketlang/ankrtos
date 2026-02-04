import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('VesselHistoryEntry', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    changeType: t.exposeString('changeType'),
    changeDate: t.expose('changeDate', { type: 'DateTime' }),
    fromValue: t.exposeString('fromValue', { nullable: true }),
    toValue: t.exposeString('toValue', { nullable: true }),
    remarks: t.exposeString('remarks', { nullable: true }),
    source: t.exposeString('source', { nullable: true }),
    vessel: t.relation('vessel'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.queryField('vesselHistory', (t) =>
  t.prismaField({
    type: ['VesselHistoryEntry'],
    args: {
      vesselId: t.arg.string({ required: true }),
      changeType: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.vesselHistoryEntry.findMany({
        ...query,
        where: {
          vesselId: args.vesselId,
          ...(args.changeType ? { changeType: args.changeType } : {}),
        },
        orderBy: { changeDate: 'desc' },
      }),
  }),
);

builder.mutationField('addVesselHistoryEntry', (t) =>
  t.prismaField({
    type: 'VesselHistoryEntry',
    args: {
      vesselId: t.arg.string({ required: true }),
      changeType: t.arg.string({ required: true }),
      changeDate: t.arg.string({ required: true }),
      fromValue: t.arg.string({ required: false }),
      toValue: t.arg.string({ required: false }),
      remarks: t.arg.string({ required: false }),
      source: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.vesselHistoryEntry.create({
        ...query,
        data: {
          vesselId: args.vesselId,
          changeType: args.changeType,
          changeDate: new Date(args.changeDate),
          fromValue: args.fromValue,
          toValue: args.toValue,
          remarks: args.remarks,
          source: args.source ?? 'manual',
        },
      }),
  }),
);
