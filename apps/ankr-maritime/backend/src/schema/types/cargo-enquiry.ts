import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('CargoEnquiry', {
  fields: (t) => ({
    id: t.exposeID('id'),
    reference: t.exposeString('reference'),
    chartererId: t.exposeString('chartererId', { nullable: true }),
    brokerId: t.exposeString('brokerId', { nullable: true }),
    cargoType: t.exposeString('cargoType'),
    hsCode: t.exposeString('hsCode', { nullable: true }),
    quantity: t.exposeFloat('quantity'),
    tolerance: t.exposeFloat('tolerance', { nullable: true }),
    packaging: t.exposeString('packaging'),
    loadPortId: t.exposeString('loadPortId', { nullable: true }),
    dischargePortId: t.exposeString('dischargePortId', { nullable: true }),
    laycanFrom: t.expose('laycanFrom', { type: 'DateTime', nullable: true }),
    laycanTo: t.expose('laycanTo', { type: 'DateTime', nullable: true }),
    rateIndication: t.exposeFloat('rateIndication', { nullable: true }),
    rateUnit: t.exposeString('rateUnit', { nullable: true }),
    currency: t.exposeString('currency'),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    receivedVia: t.exposeString('receivedVia', { nullable: true }),
    receivedAt: t.expose('receivedAt', { type: 'DateTime' }),
    loadPort: t.relation('loadPort', { nullable: true }),
    dischargePort: t.relation('dischargePort', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('cargoEnquiries', (t) =>
  t.prismaField({
    type: ['CargoEnquiry'],
    args: {
      status: t.arg.string({ required: false }),
      cargoType: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) =>
      prisma.cargoEnquiry.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.status ? { status: args.status } : {}),
          ...(args.cargoType ? { cargoType: { contains: args.cargoType, mode: 'insensitive' } } : {}),
        },
        orderBy: { receivedAt: 'desc' },
      }),
  }),
);

builder.queryField('cargoEnquiry', (t) =>
  t.prismaField({
    type: 'CargoEnquiry',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.cargoEnquiry.findUnique({ ...query, where: { id: args.id } }),
  }),
);

builder.mutationField('createCargoEnquiry', (t) =>
  t.prismaField({
    type: 'CargoEnquiry',
    args: {
      cargoType: t.arg.string({ required: true }),
      quantity: t.arg.float({ required: true }),
      tolerance: t.arg.float({ required: false }),
      packaging: t.arg.string({ required: false }),
      loadPortId: t.arg.string({ required: false }),
      dischargePortId: t.arg.string({ required: false }),
      laycanFrom: t.arg.string({ required: false }),
      laycanTo: t.arg.string({ required: false }),
      rateIndication: t.arg.float({ required: false }),
      rateUnit: t.arg.string({ required: false }),
      currency: t.arg.string({ required: false }),
      chartererId: t.arg.string({ required: false }),
      brokerId: t.arg.string({ required: false }),
      hsCode: t.arg.string({ required: false }),
      receivedVia: t.arg.string({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      const count = await prisma.cargoEnquiry.count();
      const reference = `ENQ-${String(count + 1).padStart(5, '0')}`;
      return prisma.cargoEnquiry.create({
        ...query,
        data: {
          reference,
          cargoType: args.cargoType,
          quantity: args.quantity,
          tolerance: args.tolerance,
          packaging: args.packaging ?? 'bulk',
          loadPortId: args.loadPortId,
          dischargePortId: args.dischargePortId,
          laycanFrom: args.laycanFrom ? new Date(args.laycanFrom) : null,
          laycanTo: args.laycanTo ? new Date(args.laycanTo) : null,
          rateIndication: args.rateIndication,
          rateUnit: args.rateUnit,
          currency: args.currency ?? 'USD',
          chartererId: args.chartererId,
          brokerId: args.brokerId,
          hsCode: args.hsCode,
          receivedVia: args.receivedVia ?? 'platform',
          notes: args.notes,
          organizationId: ctx.orgId(),
        },
      });
    },
  }),
);

builder.mutationField('updateCargoEnquiryStatus', (t) =>
  t.prismaField({
    type: 'CargoEnquiry',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.cargoEnquiry.update({
        ...query,
        where: { id: args.id },
        data: { status: args.status },
      }),
  }),
);
