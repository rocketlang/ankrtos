import { builder } from '../builder.js';

// === Delivery Order ===
builder.prismaObject('DeliveryOrder', {
  fields: (t) => ({
    id: t.exposeID('id'),
    doNumber: t.exposeString('doNumber'),
    status: t.exposeString('status'),
    vesselId: t.exposeString('vesselId', { nullable: true }),
    vesselName: t.exposeString('vesselName', { nullable: true }),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    blNumber: t.exposeString('blNumber'),
    cargoDescription: t.exposeString('cargoDescription', { nullable: true }),
    containerNumbers: t.exposeStringList('containerNumbers'),
    numberOfPackages: t.exposeInt('numberOfPackages', { nullable: true }),
    grossWeight: t.exposeFloat('grossWeight', { nullable: true }),
    consigneeName: t.exposeString('consigneeName'),
    consigneeAddress: t.exposeString('consigneeAddress', { nullable: true }),
    chaName: t.exposeString('chaName', { nullable: true }),
    shippingLine: t.exposeString('shippingLine', { nullable: true }),
    freightStatus: t.exposeString('freightStatus', { nullable: true }),
    detentionCharges: t.exposeFloat('detentionCharges', { nullable: true }),
    demurrageCharges: t.exposeFloat('demurrageCharges', { nullable: true }),
    otherCharges: t.exposeFloat('otherCharges', { nullable: true }),
    totalCharges: t.exposeFloat('totalCharges', { nullable: true }),
    chargeCurrency: t.exposeString('chargeCurrency'),
    isPaid: t.exposeBoolean('isPaid'),
    issuedAt: t.expose('issuedAt', { type: 'DateTime', nullable: true }),
    validUntil: t.expose('validUntil', { type: 'DateTime', nullable: true }),
    collectedAt: t.expose('collectedAt', { type: 'DateTime', nullable: true }),
    customsRefNumber: t.exposeString('customsRefNumber', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('deliveryOrders', (t) =>
  t.prismaField({
    type: ['DeliveryOrder'],
    args: {
      status: t.arg.string(),
      vesselId: t.arg.string(),
      blNumber: t.arg.string(),
      consigneeName: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.status) where.status = args.status;
      if (args.vesselId) where.vesselId = args.vesselId;
      if (args.blNumber) where.blNumber = args.blNumber;
      if (args.consigneeName) where.consigneeName = { contains: args.consigneeName, mode: 'insensitive' };
      return ctx.prisma.deliveryOrder.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

// === DO Summary ===

const DOSummary = builder.objectRef<{
  total: number;
  pending: number;
  issued: number;
  released: number;
  collected: number;
  expired: number;
}>('DOSummary');

DOSummary.implement({
  fields: (t) => ({
    total: t.exposeInt('total'),
    pending: t.exposeInt('pending'),
    issued: t.exposeInt('issued'),
    released: t.exposeInt('released'),
    collected: t.exposeInt('collected'),
    expired: t.exposeInt('expired'),
  }),
});

builder.queryField('deliveryOrderSummary', (t) =>
  t.field({
    type: DOSummary,
    resolve: async (_root, _args, ctx) => {
      const orders = await ctx.prisma.deliveryOrder.findMany({
        where: ctx.orgFilter(),
      });
      let pending = 0;
      let issued = 0;
      let released = 0;
      let collected = 0;
      let expired = 0;
      for (const o of orders) {
        if (o.status === 'pending') pending++;
        else if (o.status === 'issued') issued++;
        else if (o.status === 'released') released++;
        else if (o.status === 'collected') collected++;
        else if (o.status === 'expired') expired++;
      }
      return {
        total: orders.length,
        pending,
        issued,
        released,
        collected,
        expired,
      };
    },
  }),
);

// === Mutations ===

builder.mutationField('createDeliveryOrder', (t) =>
  t.prismaField({
    type: 'DeliveryOrder',
    args: {
      doNumber: t.arg.string({ required: true }),
      vesselId: t.arg.string(),
      vesselName: t.arg.string(),
      voyageId: t.arg.string(),
      blNumber: t.arg.string({ required: true }),
      cargoDescription: t.arg.string(),
      containerNumbers: t.arg.stringList(),
      numberOfPackages: t.arg.int(),
      grossWeight: t.arg.float(),
      consigneeName: t.arg.string({ required: true }),
      consigneeAddress: t.arg.string(),
      chaName: t.arg.string(),
      shippingLine: t.arg.string(),
      freightStatus: t.arg.string(),
      validUntil: t.arg({ type: 'DateTime' }),
      customsRefNumber: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.deliveryOrder.create({
        ...query,
        data: {
          doNumber: args.doNumber,
          vesselId: args.vesselId ?? undefined,
          vesselName: args.vesselName ?? undefined,
          voyageId: args.voyageId ?? undefined,
          blNumber: args.blNumber,
          cargoDescription: args.cargoDescription ?? undefined,
          containerNumbers: args.containerNumbers ?? [],
          numberOfPackages: args.numberOfPackages ?? undefined,
          grossWeight: args.grossWeight ?? undefined,
          consigneeName: args.consigneeName,
          consigneeAddress: args.consigneeAddress ?? undefined,
          chaName: args.chaName ?? undefined,
          shippingLine: args.shippingLine ?? undefined,
          freightStatus: args.freightStatus ?? undefined,
          validUntil: args.validUntil ?? undefined,
          customsRefNumber: args.customsRefNumber ?? undefined,
          notes: args.notes ?? undefined,
          organizationId: ctx.orgId(),
        },
      }),
  }),
);

builder.mutationField('issueDeliveryOrder', (t) =>
  t.prismaField({
    type: 'DeliveryOrder',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.deliveryOrder.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'issued',
          issuedAt: new Date(),
        },
      }),
  }),
);

builder.mutationField('releaseDeliveryOrder', (t) =>
  t.prismaField({
    type: 'DeliveryOrder',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.deliveryOrder.update({
        ...query,
        where: { id: args.id },
        data: { status: 'released' },
      }),
  }),
);

builder.mutationField('collectDeliveryOrder', (t) =>
  t.prismaField({
    type: 'DeliveryOrder',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.deliveryOrder.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'collected',
          collectedAt: new Date(),
        },
      }),
  }),
);

builder.mutationField('cancelDeliveryOrder', (t) =>
  t.prismaField({
    type: 'DeliveryOrder',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.deliveryOrder.update({
        ...query,
        where: { id: args.id },
        data: { status: 'cancelled' },
      }),
  }),
);

builder.mutationField('recordDOPayment', (t) =>
  t.prismaField({
    type: 'DeliveryOrder',
    args: {
      id: t.arg.string({ required: true }),
      detentionCharges: t.arg.float({ required: true }),
      demurrageCharges: t.arg.float({ required: true }),
      otherCharges: t.arg.float({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      const totalCharges = args.detentionCharges + args.demurrageCharges + args.otherCharges;
      return ctx.prisma.deliveryOrder.update({
        ...query,
        where: { id: args.id },
        data: {
          detentionCharges: args.detentionCharges,
          demurrageCharges: args.demurrageCharges,
          otherCharges: args.otherCharges,
          totalCharges,
          isPaid: true,
        },
      });
    },
  }),
);
