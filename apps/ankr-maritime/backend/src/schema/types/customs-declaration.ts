import { builder } from '../builder.js';

// === Customs Declaration ===
builder.prismaObject('CustomsDeclaration', {
  fields: (t) => ({
    id: t.exposeID('id'),
    declarationType: t.exposeString('declarationType'),
    referenceNumber: t.exposeString('referenceNumber'),
    status: t.exposeString('status'),
    vesselId: t.exposeString('vesselId', { nullable: true }),
    vesselName: t.exposeString('vesselName', { nullable: true }),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    voyageNumber: t.exposeString('voyageNumber', { nullable: true }),
    portOfOrigin: t.exposeString('portOfOrigin', { nullable: true }),
    portOfDestination: t.exposeString('portOfDestination', { nullable: true }),
    portOfDischarge: t.exposeString('portOfDischarge', { nullable: true }),
    cargoDescription: t.exposeString('cargoDescription', { nullable: true }),
    hsCode: t.exposeString('hsCode', { nullable: true }),
    hsCodeDescription: t.exposeString('hsCodeDescription', { nullable: true }),
    quantity: t.exposeFloat('quantity', { nullable: true }),
    unit: t.exposeString('unit', { nullable: true }),
    grossWeight: t.exposeFloat('grossWeight', { nullable: true }),
    netWeight: t.exposeFloat('netWeight', { nullable: true }),
    numberOfPackages: t.exposeInt('numberOfPackages', { nullable: true }),
    containerNumbers: t.exposeStringList('containerNumbers'),
    invoiceValue: t.exposeFloat('invoiceValue', { nullable: true }),
    invoiceCurrency: t.exposeString('invoiceCurrency', { nullable: true }),
    assessableValue: t.exposeFloat('assessableValue', { nullable: true }),
    exchangeRate: t.exposeFloat('exchangeRate', { nullable: true }),
    cif: t.exposeFloat('cif', { nullable: true }),
    basicDuty: t.exposeFloat('basicDuty', { nullable: true }),
    socialWelfare: t.exposeFloat('socialWelfare', { nullable: true }),
    igst: t.exposeFloat('igst', { nullable: true }),
    cess: t.exposeFloat('cess', { nullable: true }),
    totalDuty: t.exposeFloat('totalDuty', { nullable: true }),
    dutyCurrency: t.exposeString('dutyCurrency'),
    importerExporter: t.exposeString('importerExporter', { nullable: true }),
    ieCode: t.exposeString('ieCode', { nullable: true }),
    chaName: t.exposeString('chaName', { nullable: true }),
    chaLicense: t.exposeString('chaLicense', { nullable: true }),
    shippingLine: t.exposeString('shippingLine', { nullable: true }),
    blNumber: t.exposeString('blNumber', { nullable: true }),
    filedAt: t.expose('filedAt', { type: 'DateTime', nullable: true }),
    assessedAt: t.expose('assessedAt', { type: 'DateTime', nullable: true }),
    clearedAt: t.expose('clearedAt', { type: 'DateTime', nullable: true }),
    icegateRefId: t.exposeString('icegateRefId', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('customsDeclarations', (t) =>
  t.prismaField({
    type: ['CustomsDeclaration'],
    args: {
      declarationType: t.arg.string(),
      status: t.arg.string(),
      vesselId: t.arg.string(),
      hsCode: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.declarationType) where.declarationType = args.declarationType;
      if (args.status) where.status = args.status;
      if (args.vesselId) where.vesselId = args.vesselId;
      if (args.hsCode) where.hsCode = args.hsCode;
      return ctx.prisma.customsDeclaration.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
);

builder.queryField('customsDeclaration', (t) =>
  t.prismaField({
    type: 'CustomsDeclaration',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.customsDeclaration.findUnique({ ...query, where: { id: args.id } }),
  }),
);

// === Customs Summary ===

const CustomsSummary = builder.objectRef<{
  totalDeclarations: number;
  pending: number;
  cleared: number;
  held: number;
  totalDutyCollected: number;
}>('CustomsSummary');

CustomsSummary.implement({
  fields: (t) => ({
    totalDeclarations: t.exposeInt('totalDeclarations'),
    pending: t.exposeInt('pending'),
    cleared: t.exposeInt('cleared'),
    held: t.exposeInt('held'),
    totalDutyCollected: t.exposeFloat('totalDutyCollected'),
  }),
});

builder.queryField('customsSummary', (t) =>
  t.field({
    type: CustomsSummary,
    resolve: async (_root, _args, ctx) => {
      const declarations = await ctx.prisma.customsDeclaration.findMany({
        where: ctx.orgFilter(),
      });
      let pending = 0;
      let cleared = 0;
      let held = 0;
      let totalDutyCollected = 0;
      for (const d of declarations) {
        if (['draft', 'filed', 'under_assessment', 'assessed'].includes(d.status)) pending++;
        if (d.status === 'cleared') {
          cleared++;
          totalDutyCollected += d.totalDuty ?? 0;
        }
        if (d.status === 'held') held++;
      }
      return {
        totalDeclarations: declarations.length,
        pending,
        cleared,
        held,
        totalDutyCollected,
      };
    },
  }),
);

// === Mutations ===

builder.mutationField('createCustomsDeclaration', (t) =>
  t.prismaField({
    type: 'CustomsDeclaration',
    args: {
      declarationType: t.arg.string({ required: true }),
      referenceNumber: t.arg.string({ required: true }),
      vesselId: t.arg.string(),
      vesselName: t.arg.string(),
      voyageId: t.arg.string(),
      voyageNumber: t.arg.string(),
      portOfOrigin: t.arg.string(),
      portOfDestination: t.arg.string(),
      portOfDischarge: t.arg.string(),
      cargoDescription: t.arg.string(),
      hsCode: t.arg.string(),
      hsCodeDescription: t.arg.string(),
      quantity: t.arg.float(),
      unit: t.arg.string(),
      grossWeight: t.arg.float(),
      netWeight: t.arg.float(),
      numberOfPackages: t.arg.int(),
      containerNumbers: t.arg.stringList(),
      invoiceValue: t.arg.float(),
      invoiceCurrency: t.arg.string(),
      assessableValue: t.arg.float(),
      exchangeRate: t.arg.float(),
      cif: t.arg.float(),
      importerExporter: t.arg.string(),
      ieCode: t.arg.string(),
      chaName: t.arg.string(),
      chaLicense: t.arg.string(),
      shippingLine: t.arg.string(),
      blNumber: t.arg.string(),
      icegateRefId: t.arg.string(),
      notes: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.customsDeclaration.create({
        ...query,
        data: {
          declarationType: args.declarationType,
          referenceNumber: args.referenceNumber,
          vesselId: args.vesselId ?? undefined,
          vesselName: args.vesselName ?? undefined,
          voyageId: args.voyageId ?? undefined,
          voyageNumber: args.voyageNumber ?? undefined,
          portOfOrigin: args.portOfOrigin ?? undefined,
          portOfDestination: args.portOfDestination ?? undefined,
          portOfDischarge: args.portOfDischarge ?? undefined,
          cargoDescription: args.cargoDescription ?? undefined,
          hsCode: args.hsCode ?? undefined,
          hsCodeDescription: args.hsCodeDescription ?? undefined,
          quantity: args.quantity ?? undefined,
          unit: args.unit ?? undefined,
          grossWeight: args.grossWeight ?? undefined,
          netWeight: args.netWeight ?? undefined,
          numberOfPackages: args.numberOfPackages ?? undefined,
          containerNumbers: args.containerNumbers ?? [],
          invoiceValue: args.invoiceValue ?? undefined,
          invoiceCurrency: args.invoiceCurrency ?? undefined,
          assessableValue: args.assessableValue ?? undefined,
          exchangeRate: args.exchangeRate ?? undefined,
          cif: args.cif ?? undefined,
          importerExporter: args.importerExporter ?? undefined,
          ieCode: args.ieCode ?? undefined,
          chaName: args.chaName ?? undefined,
          chaLicense: args.chaLicense ?? undefined,
          shippingLine: args.shippingLine ?? undefined,
          blNumber: args.blNumber ?? undefined,
          icegateRefId: args.icegateRefId ?? undefined,
          notes: args.notes ?? undefined,
          organizationId: ctx.orgId(),
        },
      }),
  }),
);

// Status state machine
const CUSTOMS_VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['filed'],
  filed: ['under_assessment'],
  under_assessment: ['assessed'],
  assessed: ['cleared'],
  cleared: [],
  held: [],
  cancelled: [],
};

// Any status can transition to 'held' or 'cancelled'
const CUSTOMS_UNIVERSAL_TARGETS = ['held', 'cancelled'];

builder.mutationField('updateCustomsStatus', (t) =>
  t.prismaField({
    type: 'CustomsDeclaration',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const decl = await ctx.prisma.customsDeclaration.findUnique({ where: { id: args.id } });
      if (!decl) throw new Error('Customs declaration not found');

      const allowed = CUSTOMS_VALID_TRANSITIONS[decl.status] ?? [];
      if (!allowed.includes(args.status) && !CUSTOMS_UNIVERSAL_TARGETS.includes(args.status)) {
        throw new Error(
          `Cannot transition from "${decl.status}" to "${args.status}". Allowed: ${[...allowed, ...CUSTOMS_UNIVERSAL_TARGETS].join(', ')}`,
        );
      }

      return ctx.prisma.customsDeclaration.update({
        ...query,
        where: { id: args.id },
        data: { status: args.status },
      });
    },
  }),
);

builder.mutationField('assessDuty', (t) =>
  t.prismaField({
    type: 'CustomsDeclaration',
    args: {
      id: t.arg.string({ required: true }),
      basicDuty: t.arg.float({ required: true }),
      socialWelfare: t.arg.float({ required: true }),
      igst: t.arg.float({ required: true }),
      cess: t.arg.float({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      const totalDuty = args.basicDuty + args.socialWelfare + args.igst + args.cess;
      return ctx.prisma.customsDeclaration.update({
        ...query,
        where: { id: args.id },
        data: {
          basicDuty: args.basicDuty,
          socialWelfare: args.socialWelfare,
          igst: args.igst,
          cess: args.cess,
          totalDuty,
          status: 'assessed',
          assessedAt: new Date(),
        },
      });
    },
  }),
);

builder.mutationField('fileDeclaration', (t) =>
  t.prismaField({
    type: 'CustomsDeclaration',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.customsDeclaration.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'filed',
          filedAt: new Date(),
        },
      }),
  }),
);

builder.mutationField('clearDeclaration', (t) =>
  t.prismaField({
    type: 'CustomsDeclaration',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.customsDeclaration.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'cleared',
          clearedAt: new Date(),
        },
      }),
  }),
);
