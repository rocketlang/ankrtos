import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('ContractOfAffreightment', {
  fields: (t) => ({
    id: t.exposeID('id'),
    reference: t.exposeString('reference'),
    charterId: t.exposeString('charterId'),
    cargoType: t.exposeString('cargoType'),
    totalQuantity: t.exposeFloat('totalQuantity'),
    tolerance: t.exposeFloat('tolerance'),
    nominatedQty: t.exposeFloat('nominatedQty'),
    shippedQty: t.exposeFloat('shippedQty'),
    shipmentCount: t.exposeInt('shipmentCount'),
    maxShipments: t.exposeInt('maxShipments', { nullable: true }),
    loadPortRange: t.exposeString('loadPortRange', { nullable: true }),
    dischargePortRange: t.exposeString('dischargePortRange', { nullable: true }),
    startDate: t.expose('startDate', { type: 'DateTime' }),
    endDate: t.expose('endDate', { type: 'DateTime' }),
    freightRate: t.exposeFloat('freightRate', { nullable: true }),
    freightUnit: t.exposeString('freightUnit', { nullable: true }),
    currency: t.exposeString('currency'),
    status: t.exposeString('status'),
    organizationId: t.exposeString('organizationId'),
    notes: t.exposeString('notes', { nullable: true }),
    charter: t.relation('charter'),
    nominations: t.relation('nominations'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('COANomination', {
  fields: (t) => ({
    id: t.exposeID('id'),
    coaId: t.exposeString('coaId'),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    shipmentNo: t.exposeInt('shipmentNo'),
    quantity: t.exposeFloat('quantity'),
    tolerance: t.exposeFloat('tolerance', { nullable: true }),
    loadPort: t.exposeString('loadPort', { nullable: true }),
    dischargePort: t.exposeString('dischargePort', { nullable: true }),
    laycanStart: t.expose('laycanStart', { type: 'DateTime', nullable: true }),
    laycanEnd: t.expose('laycanEnd', { type: 'DateTime', nullable: true }),
    vesselName: t.exposeString('vesselName', { nullable: true }),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    coa: t.relation('coa'),
    voyage: t.relation('voyage', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// Queries

builder.queryField('contractsOfAffreightment', (t) =>
  t.prismaField({
    type: ['ContractOfAffreightment'],
    args: {
      status: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) =>
      prisma.contractOfAffreightment.findMany({
        ...query,
        where: {
          organizationId: ctx.orgId(),
          ...(args.status ? { status: args.status } : {}),
        },
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

builder.queryField('contractOfAffreightment', (t) =>
  t.prismaField({
    type: 'ContractOfAffreightment',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      prisma.contractOfAffreightment.findFirst({
        ...query,
        where: { id: args.id, organizationId: ctx.orgId() },
      }),
  }),
);

builder.queryField('coaNominations', (t) =>
  t.prismaField({
    type: ['COANomination'],
    args: {
      coaId: t.arg.string({ required: true }),
      status: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.cOANomination.findMany({
        ...query,
        where: {
          coaId: args.coaId,
          ...(args.status ? { status: args.status } : {}),
        },
        orderBy: { shipmentNo: 'asc' },
      }),
  }),
);

// Mutations

builder.mutationField('createContractOfAffreightment', (t) =>
  t.prismaField({
    type: 'ContractOfAffreightment',
    args: {
      charterId: t.arg.string({ required: true }),
      cargoType: t.arg.string({ required: true }),
      totalQuantity: t.arg.float({ required: true }),
      tolerance: t.arg.float({ required: false }),
      maxShipments: t.arg.int({ required: false }),
      loadPortRange: t.arg.string({ required: false }),
      dischargePortRange: t.arg.string({ required: false }),
      startDate: t.arg.string({ required: true }),
      endDate: t.arg.string({ required: true }),
      freightRate: t.arg.float({ required: false }),
      freightUnit: t.arg.string({ required: false }),
      currency: t.arg.string({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      const count = await prisma.contractOfAffreightment.count({ where: { organizationId: ctx.orgId() } });
      const reference = `COA-${String(count + 1).padStart(4, '0')}`;
      return prisma.contractOfAffreightment.create({
        ...query,
        data: {
          reference,
          charterId: args.charterId,
          cargoType: args.cargoType,
          totalQuantity: args.totalQuantity,
          tolerance: args.tolerance ?? 5,
          maxShipments: args.maxShipments,
          loadPortRange: args.loadPortRange,
          dischargePortRange: args.dischargePortRange,
          startDate: new Date(args.startDate),
          endDate: new Date(args.endDate),
          freightRate: args.freightRate,
          freightUnit: args.freightUnit,
          currency: args.currency ?? 'USD',
          notes: args.notes,
          organizationId: ctx.orgId(),
        },
      });
    },
  }),
);

builder.mutationField('createCOANomination', (t) =>
  t.prismaField({
    type: 'COANomination',
    args: {
      coaId: t.arg.string({ required: true }),
      quantity: t.arg.float({ required: true }),
      tolerance: t.arg.float({ required: false }),
      loadPort: t.arg.string({ required: false }),
      dischargePort: t.arg.string({ required: false }),
      laycanStart: t.arg.string({ required: false }),
      laycanEnd: t.arg.string({ required: false }),
      vesselName: t.arg.string({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args) => {
      const lastNom = await prisma.cOANomination.findFirst({
        where: { coaId: args.coaId },
        orderBy: { shipmentNo: 'desc' },
      });
      const shipmentNo = (lastNom?.shipmentNo ?? 0) + 1;

      const nomination = await prisma.cOANomination.create({
        ...query,
        data: {
          coaId: args.coaId,
          shipmentNo,
          quantity: args.quantity,
          tolerance: args.tolerance,
          loadPort: args.loadPort,
          dischargePort: args.dischargePort,
          laycanStart: args.laycanStart ? new Date(args.laycanStart) : null,
          laycanEnd: args.laycanEnd ? new Date(args.laycanEnd) : null,
          vesselName: args.vesselName,
          notes: args.notes,
        },
      });

      // Update COA nominated quantity and shipment count
      await prisma.contractOfAffreightment.update({
        where: { id: args.coaId },
        data: {
          nominatedQty: { increment: args.quantity },
          shipmentCount: { increment: 1 },
        },
      });

      return nomination;
    },
  }),
);
