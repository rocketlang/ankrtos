import { builder } from '../builder.js';

builder.prismaObject('BillOfLading', {
  fields: (t) => ({
    id: t.exposeID('id'),
    bolNumber: t.exposeString('bolNumber'),
    type: t.exposeString('type'),
    voyageId: t.exposeString('voyageId'),
    cargoId: t.exposeString('cargoId', { nullable: true }),
    shipperId: t.exposeString('shipperId', { nullable: true }),
    consigneeId: t.exposeString('consigneeId', { nullable: true }),
    notifyPartyId: t.exposeString('notifyPartyId', { nullable: true }),
    portOfLoading: t.exposeString('portOfLoading', { nullable: true }),
    portOfDischarge: t.exposeString('portOfDischarge', { nullable: true }),
    placeOfReceipt: t.exposeString('placeOfReceipt', { nullable: true }),
    placeOfDelivery: t.exposeString('placeOfDelivery', { nullable: true }),
    status: t.exposeString('status'),
    freightTerms: t.exposeString('freightTerms'),
    numberOfOriginals: t.exposeInt('numberOfOriginals'),
    description: t.exposeString('description', { nullable: true }),
    grossWeight: t.exposeFloat('grossWeight', { nullable: true }),
    measurement: t.exposeFloat('measurement', { nullable: true }),
    issuedAt: t.expose('issuedAt', { type: 'DateTime', nullable: true }),
    issuedBy: t.exposeString('issuedBy', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    voyage: t.relation('voyage'),
  }),
});

builder.queryField('billsOfLading', (t) =>
  t.prismaField({
    type: ['BillOfLading'],
    args: {
      voyageId: t.arg.string(),
      type: t.arg.string(),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      return ctx.prisma.billOfLading.findMany({
        ...query,
        where: {
          ...(args.voyageId ? { voyageId: args.voyageId } : {}),
          ...(args.type ? { type: args.type } : {}),
          ...(args.status ? { status: args.status } : {}),
          ...(orgId ? { voyage: { vessel: { organizationId: orgId } } } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('billOfLading', (t) =>
  t.prismaField({
    type: 'BillOfLading',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.billOfLading.findUnique({
        ...query,
        where: { id: args.id },
      }),
  }),
);

builder.mutationField('createBillOfLading', (t) =>
  t.prismaField({
    type: 'BillOfLading',
    args: {
      bolNumber: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      voyageId: t.arg.string({ required: true }),
      cargoId: t.arg.string(),
      shipperId: t.arg.string(),
      consigneeId: t.arg.string(),
      notifyPartyId: t.arg.string(),
      portOfLoading: t.arg.string(),
      portOfDischarge: t.arg.string(),
      placeOfReceipt: t.arg.string(),
      placeOfDelivery: t.arg.string(),
      freightTerms: t.arg.string(),
      numberOfOriginals: t.arg.int(),
      description: t.arg.string(),
      grossWeight: t.arg.float(),
      measurement: t.arg.float(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.billOfLading.create({
        ...query,
        data: {
          bolNumber: args.bolNumber,
          type: args.type,
          voyageId: args.voyageId,
          cargoId: args.cargoId ?? undefined,
          shipperId: args.shipperId ?? undefined,
          consigneeId: args.consigneeId ?? undefined,
          notifyPartyId: args.notifyPartyId ?? undefined,
          portOfLoading: args.portOfLoading ?? undefined,
          portOfDischarge: args.portOfDischarge ?? undefined,
          placeOfReceipt: args.placeOfReceipt ?? undefined,
          placeOfDelivery: args.placeOfDelivery ?? undefined,
          freightTerms: args.freightTerms ?? 'prepaid',
          numberOfOriginals: args.numberOfOriginals ?? 3,
          description: args.description ?? undefined,
          grossWeight: args.grossWeight ?? undefined,
          measurement: args.measurement ?? undefined,
        },
      }),
  }),
);

builder.mutationField('updateBolStatus', (t) =>
  t.prismaField({
    type: 'BillOfLading',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      issuedBy: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.billOfLading.update({
        ...query,
        where: { id: args.id },
        data: {
          status: args.status,
          ...(args.status === 'issued' ? { issuedAt: new Date(), issuedBy: args.issuedBy ?? undefined } : {}),
        },
      }),
  }),
);
