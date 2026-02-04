import { builder } from '../builder.js';

// === E-way Bill ===
builder.prismaObject('EwayBill', {
  fields: (t) => ({
    id: t.exposeID('id'),
    ewayBillNumber: t.exposeString('ewayBillNumber', { nullable: true }),
    status: t.exposeString('status'),
    supplyType: t.exposeString('supplyType'),
    subSupplyType: t.exposeString('subSupplyType', { nullable: true }),
    documentType: t.exposeString('documentType', { nullable: true }),
    documentNumber: t.exposeString('documentNumber', { nullable: true }),
    documentDate: t.expose('documentDate', { type: 'DateTime', nullable: true }),
    fromName: t.exposeString('fromName', { nullable: true }),
    fromGstin: t.exposeString('fromGstin', { nullable: true }),
    fromAddress: t.exposeString('fromAddress', { nullable: true }),
    fromCity: t.exposeString('fromCity', { nullable: true }),
    fromState: t.exposeString('fromState', { nullable: true }),
    fromPincode: t.exposeString('fromPincode', { nullable: true }),
    toName: t.exposeString('toName', { nullable: true }),
    toGstin: t.exposeString('toGstin', { nullable: true }),
    toAddress: t.exposeString('toAddress', { nullable: true }),
    toCity: t.exposeString('toCity', { nullable: true }),
    toState: t.exposeString('toState', { nullable: true }),
    toPincode: t.exposeString('toPincode', { nullable: true }),
    hsCode: t.exposeString('hsCode', { nullable: true }),
    productDescription: t.exposeString('productDescription', { nullable: true }),
    quantity: t.exposeFloat('quantity', { nullable: true }),
    unit: t.exposeString('unit', { nullable: true }),
    taxableAmount: t.exposeFloat('taxableAmount', { nullable: true }),
    cgstRate: t.exposeFloat('cgstRate', { nullable: true }),
    sgstRate: t.exposeFloat('sgstRate', { nullable: true }),
    igstRate: t.exposeFloat('igstRate', { nullable: true }),
    cessRate: t.exposeFloat('cessRate', { nullable: true }),
    totalInvoiceValue: t.exposeFloat('totalInvoiceValue', { nullable: true }),
    transporterName: t.exposeString('transporterName', { nullable: true }),
    transporterId: t.exposeString('transporterId', { nullable: true }),
    transportMode: t.exposeString('transportMode', { nullable: true }),
    vehicleNumber: t.exposeString('vehicleNumber', { nullable: true }),
    vehicleType: t.exposeString('vehicleType', { nullable: true }),
    distanceKm: t.exposeFloat('distanceKm', { nullable: true }),
    generatedAt: t.expose('generatedAt', { type: 'DateTime', nullable: true }),
    validUntil: t.expose('validUntil', { type: 'DateTime', nullable: true }),
    cancelledAt: t.expose('cancelledAt', { type: 'DateTime', nullable: true }),
    cancelReason: t.exposeString('cancelReason', { nullable: true }),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    customsRefNumber: t.exposeString('customsRefNumber', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('ewayBills', (t) =>
  t.prismaField({
    type: ['EwayBill'],
    args: {
      status: t.arg.string(),
      vehicleNumber: t.arg.string(),
      fromState: t.arg.string(),
      toState: t.arg.string(),
      transportMode: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.status) where.status = args.status;
      if (args.vehicleNumber) where.vehicleNumber = args.vehicleNumber;
      if (args.fromState) where.fromState = args.fromState;
      if (args.toState) where.toState = args.toState;
      if (args.transportMode) where.transportMode = args.transportMode;
      return ctx.prisma.ewayBill.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('ewayBill', (t) =>
  t.prismaField({
    type: 'EwayBill',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.ewayBill.findUnique({ ...query, where: { id: args.id } }),
  }),
);

// === Mutations ===

builder.mutationField('createEwayBill', (t) =>
  t.prismaField({
    type: 'EwayBill',
    args: {
      ewayBillNumber: t.arg.string(),
      supplyType: t.arg.string({ required: true }),
      subSupplyType: t.arg.string(),
      documentType: t.arg.string(),
      documentNumber: t.arg.string(),
      documentDate: t.arg({ type: 'DateTime' }),
      fromName: t.arg.string(),
      fromGstin: t.arg.string(),
      fromAddress: t.arg.string(),
      fromCity: t.arg.string(),
      fromState: t.arg.string(),
      fromPincode: t.arg.string(),
      toName: t.arg.string(),
      toGstin: t.arg.string(),
      toAddress: t.arg.string(),
      toCity: t.arg.string(),
      toState: t.arg.string(),
      toPincode: t.arg.string(),
      hsCode: t.arg.string(),
      productDescription: t.arg.string(),
      quantity: t.arg.float(),
      unit: t.arg.string(),
      taxableAmount: t.arg.float(),
      cgstRate: t.arg.float(),
      sgstRate: t.arg.float(),
      igstRate: t.arg.float(),
      cessRate: t.arg.float(),
      totalInvoiceValue: t.arg.float(),
      transporterName: t.arg.string(),
      transporterId: t.arg.string(),
      transportMode: t.arg.string(),
      vehicleNumber: t.arg.string(),
      vehicleType: t.arg.string(),
      distanceKm: t.arg.float(),
      voyageId: t.arg.string(),
      customsRefNumber: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.ewayBill.create({
        ...query,
        data: {
          ewayBillNumber: args.ewayBillNumber ?? undefined,
          supplyType: args.supplyType,
          subSupplyType: args.subSupplyType ?? undefined,
          documentType: args.documentType ?? undefined,
          documentNumber: args.documentNumber ?? undefined,
          documentDate: args.documentDate ?? undefined,
          fromName: args.fromName ?? undefined,
          fromGstin: args.fromGstin ?? undefined,
          fromAddress: args.fromAddress ?? undefined,
          fromCity: args.fromCity ?? undefined,
          fromState: args.fromState ?? undefined,
          fromPincode: args.fromPincode ?? undefined,
          toName: args.toName ?? undefined,
          toGstin: args.toGstin ?? undefined,
          toAddress: args.toAddress ?? undefined,
          toCity: args.toCity ?? undefined,
          toState: args.toState ?? undefined,
          toPincode: args.toPincode ?? undefined,
          hsCode: args.hsCode ?? undefined,
          productDescription: args.productDescription ?? undefined,
          quantity: args.quantity ?? undefined,
          unit: args.unit ?? undefined,
          taxableAmount: args.taxableAmount ?? undefined,
          cgstRate: args.cgstRate ?? undefined,
          sgstRate: args.sgstRate ?? undefined,
          igstRate: args.igstRate ?? undefined,
          cessRate: args.cessRate ?? undefined,
          totalInvoiceValue: args.totalInvoiceValue ?? undefined,
          transporterName: args.transporterName ?? undefined,
          transporterId: args.transporterId ?? undefined,
          transportMode: args.transportMode ?? undefined,
          vehicleNumber: args.vehicleNumber ?? undefined,
          vehicleType: args.vehicleType ?? undefined,
          distanceKm: args.distanceKm ?? undefined,
          voyageId: args.voyageId ?? undefined,
          customsRefNumber: args.customsRefNumber ?? undefined,
          organizationId: ctx.orgId(),
        },
      }),
  }),
);

builder.mutationField('generateEwayBill', (t) =>
  t.prismaField({
    type: 'EwayBill',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const bill = await ctx.prisma.ewayBill.findUnique({ where: { id: args.id } });
      if (!bill) throw new Error('E-way bill not found');

      const generatedAt = new Date();
      // Validity: 1 day per 100 km, minimum 1 day
      const distanceKm = bill.distanceKm ?? 0;
      const validDays = Math.max(1, Math.ceil(distanceKm / 100));
      const validUntil = new Date(generatedAt.getTime() + validDays * 24 * 60 * 60 * 1000);

      return ctx.prisma.ewayBill.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'generated',
          generatedAt,
          validUntil,
        },
      });
    },
  }),
);

builder.mutationField('updateEwayBillVehicle', (t) =>
  t.prismaField({
    type: 'EwayBill',
    args: {
      id: t.arg.string({ required: true }),
      vehicleNumber: t.arg.string({ required: true }),
      vehicleType: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.ewayBill.update({
        ...query,
        where: { id: args.id },
        data: {
          vehicleNumber: args.vehicleNumber,
          ...(args.vehicleType && { vehicleType: args.vehicleType }),
        },
      }),
  }),
);

builder.mutationField('cancelEwayBill', (t) =>
  t.prismaField({
    type: 'EwayBill',
    args: {
      id: t.arg.string({ required: true }),
      reason: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.ewayBill.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: args.reason,
        },
      }),
  }),
);

builder.mutationField('extendEwayBill', (t) =>
  t.prismaField({
    type: 'EwayBill',
    args: {
      id: t.arg.string({ required: true }),
      additionalDays: t.arg.int({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const bill = await ctx.prisma.ewayBill.findUnique({ where: { id: args.id } });
      if (!bill) throw new Error('E-way bill not found');
      if (!bill.validUntil) throw new Error('E-way bill has no validity date to extend');

      const newValidUntil = new Date(
        bill.validUntil.getTime() + args.additionalDays * 24 * 60 * 60 * 1000,
      );

      return ctx.prisma.ewayBill.update({
        ...query,
        where: { id: args.id },
        data: { validUntil: newValidUntil },
      });
    },
  }),
);

builder.mutationField('deliverEwayBill', (t) =>
  t.prismaField({
    type: 'EwayBill',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.ewayBill.update({
        ...query,
        where: { id: args.id },
        data: { status: 'delivered' },
      }),
  }),
);
