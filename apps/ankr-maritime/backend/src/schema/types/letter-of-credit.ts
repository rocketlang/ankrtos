import { builder } from '../builder.js';

// === LCDocument ===
builder.prismaObject('LCDocument', {
  fields: (t) => ({
    id: t.exposeID('id'),
    letterOfCreditId: t.exposeString('letterOfCreditId'),
    documentType: t.exposeString('documentType'),
    required: t.exposeBoolean('required'),
    copies: t.exposeInt('copies', { nullable: true }),
    originals: t.exposeInt('originals', { nullable: true }),
    description: t.exposeString('description', { nullable: true }),
    status: t.exposeString('status'),
    submittedDate: t.expose('submittedDate', { type: 'DateTime', nullable: true }),
    discrepancy: t.exposeString('discrepancy', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === LCAmendment ===
builder.prismaObject('LCAmendment', {
  fields: (t) => ({
    id: t.exposeID('id'),
    letterOfCreditId: t.exposeString('letterOfCreditId'),
    amendmentNumber: t.exposeInt('amendmentNumber'),
    description: t.exposeString('description'),
    previousValue: t.exposeString('previousValue', { nullable: true }),
    newValue: t.exposeString('newValue', { nullable: true }),
    requestedBy: t.exposeString('requestedBy'),
    status: t.exposeString('status'),
    approvedDate: t.expose('approvedDate', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === LCDrawing ===
builder.prismaObject('LCDrawing', {
  fields: (t) => ({
    id: t.exposeID('id'),
    letterOfCreditId: t.exposeString('letterOfCreditId'),
    drawingNumber: t.exposeInt('drawingNumber'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    status: t.exposeString('status'),
    presentationDate: t.expose('presentationDate', { type: 'DateTime', nullable: true }),
    maturityDate: t.expose('maturityDate', { type: 'DateTime', nullable: true }),
    discrepancies: t.exposeString('discrepancies', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === LetterOfCredit ===
builder.prismaObject('LetterOfCredit', {
  fields: (t) => ({
    id: t.exposeID('id'),
    reference: t.exposeString('reference'),
    type: t.exposeString('type'),
    status: t.exposeString('status'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    issuingBank: t.exposeString('issuingBank'),
    advisingBank: t.exposeString('advisingBank', { nullable: true }),
    confirmingBank: t.exposeString('confirmingBank', { nullable: true }),
    beneficiary: t.exposeString('beneficiary'),
    applicant: t.exposeString('applicant', { nullable: true }),
    issueDate: t.expose('issueDate', { type: 'DateTime', nullable: true }),
    expiryDate: t.expose('expiryDate', { type: 'DateTime' }),
    portOfLoading: t.exposeString('portOfLoading', { nullable: true }),
    portOfDischarge: t.exposeString('portOfDischarge', { nullable: true }),
    cargoDescription: t.exposeString('cargoDescription', { nullable: true }),
    incoterms: t.exposeString('incoterms', { nullable: true }),
    paymentTerms: t.exposeString('paymentTerms', { nullable: true }),
    tolerancePercent: t.exposeFloat('tolerancePercent', { nullable: true }),
    partialShipment: t.exposeBoolean('partialShipment', { nullable: true }),
    transhipment: t.exposeBoolean('transhipment', { nullable: true }),
    voyageId: t.exposeString('voyageId', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    organization: t.relation('organization'),
    voyage: t.relation('voyage', { nullable: true }),
    documents: t.relation('documents'),
    amendments: t.relation('amendments'),
    drawings: t.relation('drawings'),
  }),
});

// === Queries ===

builder.queryField('lettersOfCredit', (t) =>
  t.prismaField({
    type: ['LetterOfCredit'],
    args: {
      status: t.arg.string(),
      voyageId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { ...ctx.orgFilter() };
      if (args.status) where.status = args.status;
      if (args.voyageId) where.voyageId = args.voyageId;
      return ctx.prisma.letterOfCredit.findMany({
        ...query,
        where,
        orderBy: { expiryDate: 'asc' },
      });
    },
  }),
);

builder.queryField('letterOfCredit', (t) =>
  t.prismaField({
    type: 'LetterOfCredit',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.letterOfCredit.findUnique({
        ...query,
        where: { id: args.id },
        include: {
          organization: true,
          voyage: true,
          documents: true,
          amendments: true,
          drawings: true,
        },
      }),
  }),
);

// === Mutations ===

builder.mutationField('createLetterOfCredit', (t) =>
  t.prismaField({
    type: 'LetterOfCredit',
    args: {
      reference: t.arg.string({ required: true }),
      type: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      currency: t.arg.string(),
      issuingBank: t.arg.string({ required: true }),
      beneficiary: t.arg.string({ required: true }),
      expiryDate: t.arg({ type: 'DateTime', required: true }),
      voyageId: t.arg.string(),
      advisingBank: t.arg.string(),
      confirmingBank: t.arg.string(),
      applicant: t.arg.string(),
      portOfLoading: t.arg.string(),
      portOfDischarge: t.arg.string(),
      cargoDescription: t.arg.string(),
      incoterms: t.arg.string(),
      paymentTerms: t.arg.string(),
      tolerancePercent: t.arg.float(),
      partialShipment: t.arg.boolean(),
      transhipment: t.arg.boolean(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.letterOfCredit.create({
        ...query,
        data: {
          reference: args.reference,
          type: args.type,
          status: 'draft',
          amount: args.amount,
          currency: args.currency ?? 'USD',
          issuingBank: args.issuingBank,
          beneficiary: args.beneficiary,
          expiryDate: args.expiryDate,
          voyageId: args.voyageId ?? undefined,
          advisingBank: args.advisingBank ?? undefined,
          confirmingBank: args.confirmingBank ?? undefined,
          applicant: args.applicant ?? undefined,
          portOfLoading: args.portOfLoading ?? undefined,
          portOfDischarge: args.portOfDischarge ?? undefined,
          cargoDescription: args.cargoDescription ?? undefined,
          incoterms: args.incoterms ?? undefined,
          paymentTerms: args.paymentTerms ?? undefined,
          tolerancePercent: args.tolerancePercent ?? undefined,
          partialShipment: args.partialShipment ?? undefined,
          transhipment: args.transhipment ?? undefined,
          organizationId: ctx.orgId(),
        },
      }),
  }),
);

builder.mutationField('updateLCStatus', (t) =>
  t.prismaField({
    type: 'LetterOfCredit',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, unknown> = { status: args.status };
      if (args.status === 'issued') {
        data.issueDate = new Date();
      }
      return ctx.prisma.letterOfCredit.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);

builder.mutationField('addLCDocument', (t) =>
  t.prismaField({
    type: 'LCDocument',
    args: {
      letterOfCreditId: t.arg.string({ required: true }),
      documentType: t.arg.string({ required: true }),
      required: t.arg.boolean(),
      copies: t.arg.int(),
      originals: t.arg.int(),
      description: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.lCDocument.create({
        ...query,
        data: {
          letterOfCreditId: args.letterOfCreditId,
          documentType: args.documentType,
          required: args.required ?? true,
          copies: args.copies ?? undefined,
          originals: args.originals ?? undefined,
          description: args.description ?? undefined,
          status: 'pending',
        },
      }),
  }),
);

builder.mutationField('submitLCDocument', (t) =>
  t.prismaField({
    type: 'LCDocument',
    args: {
      id: t.arg.string({ required: true }),
      submittedDate: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.lCDocument.update({
        ...query,
        where: { id: args.id },
        data: {
          submittedDate: args.submittedDate ?? new Date(),
          status: 'submitted',
        },
      }),
  }),
);

builder.mutationField('markDocumentDiscrepant', (t) =>
  t.prismaField({
    type: 'LCDocument',
    args: {
      id: t.arg.string({ required: true }),
      discrepancy: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.lCDocument.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'discrepant',
          discrepancy: args.discrepancy,
        },
      }),
  }),
);

builder.mutationField('createLCAmendment', (t) =>
  t.prismaField({
    type: 'LCAmendment',
    args: {
      letterOfCreditId: t.arg.string({ required: true }),
      description: t.arg.string({ required: true }),
      previousValue: t.arg.string(),
      newValue: t.arg.string(),
      requestedBy: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const count = await ctx.prisma.lCAmendment.count({
        where: { letterOfCreditId: args.letterOfCreditId },
      });
      return ctx.prisma.lCAmendment.create({
        ...query,
        data: {
          letterOfCreditId: args.letterOfCreditId,
          amendmentNumber: count + 1,
          description: args.description,
          previousValue: args.previousValue ?? undefined,
          newValue: args.newValue ?? undefined,
          requestedBy: args.requestedBy,
          status: 'requested',
        },
      });
    },
  }),
);

builder.mutationField('approveLCAmendment', (t) =>
  t.prismaField({
    type: 'LCAmendment',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.lCAmendment.update({
        ...query,
        where: { id: args.id },
        data: {
          approvedDate: new Date(),
          status: 'approved',
        },
      }),
  }),
);

builder.mutationField('createLCDrawing', (t) =>
  t.prismaField({
    type: 'LCDrawing',
    args: {
      letterOfCreditId: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      currency: t.arg.string(),
      presentationDate: t.arg({ type: 'DateTime' }),
      maturityDate: t.arg({ type: 'DateTime' }),
    },
    resolve: async (query, _root, args, ctx) => {
      const count = await ctx.prisma.lCDrawing.count({
        where: { letterOfCreditId: args.letterOfCreditId },
      });
      return ctx.prisma.lCDrawing.create({
        ...query,
        data: {
          letterOfCreditId: args.letterOfCreditId,
          drawingNumber: count + 1,
          amount: args.amount,
          currency: args.currency ?? 'USD',
          status: 'presented',
          presentationDate: args.presentationDate ?? new Date(),
          maturityDate: args.maturityDate ?? undefined,
        },
      });
    },
  }),
);

builder.mutationField('updateLCDrawingStatus', (t) =>
  t.prismaField({
    type: 'LCDrawing',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      discrepancies: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const data: Record<string, unknown> = { status: args.status };
      if (args.discrepancies) data.discrepancies = args.discrepancies;
      return ctx.prisma.lCDrawing.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  }),
);
