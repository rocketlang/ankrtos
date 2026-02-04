import { builder } from '../builder.js';

// ============================================================================
// PORT AGENCY PORTAL - GraphQL Types
// ============================================================================

// === 1. Port Agent Appointment ===

builder.prismaObject('PortAgentAppointment', {
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),
    vesselId: t.exposeString('vesselId'),
    portCode: t.exposeString('portCode'),
    eta: t.expose('eta', { type: 'DateTime' }),
    etb: t.expose('etb', { type: 'DateTime', nullable: true }),
    etd: t.expose('etd', { type: 'DateTime', nullable: true }),
    serviceType: t.exposeString('serviceType'),
    status: t.exposeString('status'),
    nominatedBy: t.exposeString('nominatedBy', { nullable: true }),
    nominatedAt: t.expose('nominatedAt', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),

    // Relations
    organization: t.relation('organization'),
    vessel: t.relation('vessel'),
    pdas: t.relation('pdas'),
    fdas: t.relation('fdas'),
    serviceRequests: t.relation('serviceRequests'),
  }),
});

// === 2. Proforma Disbursement Account (PDA) ===

builder.prismaObject('ProformaDisbursementAccount', {
  fields: (t) => ({
    id: t.exposeID('id'),
    appointmentId: t.exposeString('appointmentId'),
    reference: t.exposeString('reference'),
    version: t.exposeInt('version'),
    status: t.exposeString('status'),

    // Port Details
    portCode: t.exposeString('portCode'),
    portName: t.exposeString('portName'),
    arrivalDate: t.expose('arrivalDate', { type: 'DateTime' }),
    departureDate: t.expose('departureDate', { type: 'DateTime', nullable: true }),
    stayDuration: t.exposeFloat('stayDuration', { nullable: true }),

    // Vessel Details
    vesselId: t.exposeString('vesselId'),
    vesselName: t.exposeString('vesselName'),
    imo: t.exposeString('imo'),
    flag: t.exposeString('flag', { nullable: true }),
    grt: t.exposeFloat('grt', { nullable: true }),
    nrt: t.exposeFloat('nrt', { nullable: true }),
    loa: t.exposeFloat('loa', { nullable: true }),
    beam: t.exposeFloat('beam', { nullable: true }),
    draft: t.exposeFloat('draft', { nullable: true }),

    // Financial
    baseCurrency: t.exposeString('baseCurrency'),
    totalAmount: t.exposeFloat('totalAmount'),
    totalAmountLocal: t.exposeFloat('totalAmountLocal', { nullable: true }),
    localCurrency: t.exposeString('localCurrency', { nullable: true }),
    fxRate: t.exposeFloat('fxRate'),

    // Metadata
    generatedBy: t.exposeString('generatedBy', { nullable: true }),
    generatedAt: t.expose('generatedAt', { type: 'DateTime' }),
    sentAt: t.expose('sentAt', { type: 'DateTime', nullable: true }),
    approvedAt: t.expose('approvedAt', { type: 'DateTime', nullable: true }),
    approvedBy: t.exposeString('approvedBy', { nullable: true }),

    // ML Prediction
    confidenceScore: t.exposeFloat('confidenceScore', { nullable: true }),
    predictionModel: t.exposeString('predictionModel', { nullable: true }),

    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),

    // Relations
    appointment: t.relation('appointment'),
    vessel: t.relation('vessel'),
    lineItems: t.relation('lineItems'),
    fda: t.relation('fda', { nullable: true }),
  }),
});

// === 3. PDA Line Item ===

builder.prismaObject('ProformaDisbursementLineItem', {
  fields: (t) => ({
    id: t.exposeID('id'),
    pdaId: t.exposeString('pdaId'),
    category: t.exposeString('category'),
    description: t.exposeString('description'),
    quantity: t.exposeFloat('quantity', { nullable: true }),
    unit: t.exposeString('unit', { nullable: true }),
    unitPrice: t.exposeFloat('unitPrice', { nullable: true }),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),

    // Tariff Reference
    tariffId: t.exposeString('tariffId', { nullable: true }),
    tariffSource: t.exposeString('tariffSource', { nullable: true }),

    // Vendor Quote
    vendorId: t.exposeString('vendorId', { nullable: true }),
    vendorQuoteId: t.exposeString('vendorQuoteId', { nullable: true }),
    quoteValidUntil: t.expose('quoteValidUntil', { type: 'DateTime', nullable: true }),

    // Prediction
    isPredicted: t.exposeBoolean('isPredicted'),
    confidence: t.exposeFloat('confidence', { nullable: true }),

    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),

    // Relations
    pda: t.relation('pda'),
    tariff: t.relation('tariff', { nullable: true }),
    vendor: t.relation('vendor', { nullable: true }),
  }),
});

// === 4. Final Disbursement Account (FDA) ===

builder.prismaObject('FinalDisbursementAccount', {
  fields: (t) => ({
    id: t.exposeID('id'),
    pdaId: t.exposeString('pdaId'),
    appointmentId: t.exposeString('appointmentId'),
    reference: t.exposeString('reference'),

    // Financial
    baseCurrency: t.exposeString('baseCurrency'),
    totalAmount: t.exposeFloat('totalAmount'),
    totalAmountLocal: t.exposeFloat('totalAmountLocal', { nullable: true }),
    localCurrency: t.exposeString('localCurrency', { nullable: true }),
    fxRate: t.exposeFloat('fxRate'),

    // Variance Analysis
    pdaTotal: t.exposeFloat('pdaTotal'),
    variance: t.exposeFloat('variance'),
    variancePercent: t.exposeFloat('variancePercent'),

    // Status
    status: t.exposeString('status'),
    submittedAt: t.expose('submittedAt', { type: 'DateTime', nullable: true }),
    approvedAt: t.expose('approvedAt', { type: 'DateTime', nullable: true }),
    settledAt: t.expose('settledAt', { type: 'DateTime', nullable: true }),

    // Payment
    paymentMethod: t.exposeString('paymentMethod', { nullable: true }),
    paymentReference: t.exposeString('paymentReference', { nullable: true }),

    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),

    // Relations
    pda: t.relation('pda'),
    appointment: t.relation('appointment'),
    lineItems: t.relation('lineItems'),
    variances: t.relation('variances'),
  }),
});

// === 5. FDA Line Item ===

builder.prismaObject('FinalDisbursementLineItem', {
  fields: (t) => ({
    id: t.exposeID('id'),
    fdaId: t.exposeString('fdaId'),
    category: t.exposeString('category'),
    description: t.exposeString('description'),
    quantity: t.exposeFloat('quantity', { nullable: true }),
    unit: t.exposeString('unit', { nullable: true }),
    unitPrice: t.exposeFloat('unitPrice', { nullable: true }),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),

    // Invoice Reference
    invoiceId: t.exposeString('invoiceId', { nullable: true }),
    invoiceNumber: t.exposeString('invoiceNumber', { nullable: true }),
    invoiceDate: t.expose('invoiceDate', { type: 'DateTime', nullable: true }),
    vendorId: t.exposeString('vendorId', { nullable: true }),

    // Variance from PDA
    pdaLineItemId: t.exposeString('pdaLineItemId', { nullable: true }),
    pdaAmount: t.exposeFloat('pdaAmount', { nullable: true }),
    variance: t.exposeFloat('variance', { nullable: true }),

    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),

    // Relations
    fda: t.relation('fda'),
    invoice: t.relation('invoice', { nullable: true }),
    vendor: t.relation('vendor', { nullable: true }),
  }),
});

// === 6. FDA Variance Analysis ===

builder.prismaObject('FdaVarianceAnalysis', {
  fields: (t) => ({
    id: t.exposeID('id'),
    fdaId: t.exposeString('fdaId'),
    category: t.exposeString('category'),
    pdaAmount: t.exposeFloat('pdaAmount'),
    fdaAmount: t.exposeFloat('fdaAmount'),
    variance: t.exposeFloat('variance'),
    variancePercent: t.exposeFloat('variancePercent'),
    reason: t.exposeString('reason', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),

    // Relations
    fda: t.relation('fda'),
  }),
});

// === 7. Service Request ===

builder.prismaObject('PortServiceRequest', {
  fields: (t) => ({
    id: t.exposeID('id'),
    appointmentId: t.exposeString('appointmentId'),
    serviceType: t.exposeString('serviceType'),
    description: t.exposeString('description'),
    requestedAt: t.expose('requestedAt', { type: 'DateTime' }),
    requiredBy: t.expose('requiredBy', { type: 'DateTime', nullable: true }),

    // Status
    status: t.exposeString('status'),

    // Selected Quote
    selectedQuoteId: t.exposeString('selectedQuoteId', { nullable: true }),

    // Completion
    completedAt: t.expose('completedAt', { type: 'DateTime', nullable: true }),
    actualCost: t.exposeFloat('actualCost', { nullable: true }),
    currency: t.exposeString('currency', { nullable: true }),
    rating: t.exposeInt('rating', { nullable: true }),
    review: t.exposeString('review', { nullable: true }),

    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),

    // Relations
    appointment: t.relation('appointment'),
    quotes: t.relation('quotes'),
  }),
});

// === 8. Vendor Quote ===

builder.prismaObject('PortVendorQuote', {
  fields: (t) => ({
    id: t.exposeID('id'),
    serviceRequestId: t.exposeString('serviceRequestId'),
    vendorId: t.exposeString('vendorId'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    validUntil: t.expose('validUntil', { type: 'DateTime' }),
    description: t.exposeString('description', { nullable: true }),
    terms: t.exposeString('terms', { nullable: true }),

    // Status
    status: t.exposeString('status'),
    respondedAt: t.expose('respondedAt', { type: 'DateTime' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),

    // Relations
    serviceRequest: t.relation('serviceRequest'),
    vendor: t.relation('vendor'),
  }),
});

// === 9. Port Service Master ===

builder.prismaObject('PortServiceMaster', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portCode: t.exposeString('portCode'),
    serviceType: t.exposeString('serviceType'),
    vendorId: t.exposeString('vendorId'),
    isActive: t.exposeBoolean('isActive'),
    priority: t.exposeInt('priority'),

    // Contact
    contactName: t.exposeString('contactName', { nullable: true }),
    contactEmail: t.exposeString('contactEmail', { nullable: true }),
    contactPhone: t.exposeString('contactPhone', { nullable: true }),

    // Pricing
    baseRate: t.exposeFloat('baseRate', { nullable: true }),
    currency: t.exposeString('currency', { nullable: true }),
    unit: t.exposeString('unit', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),

    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),

    // Relations
    vendor: t.relation('vendor'),
  }),
});

// ============================================================================
// QUERIES
// ============================================================================

builder.queryField('portAgentAppointments', (t) =>
  t.prismaField({
    type: ['PortAgentAppointment'],
    args: {
      portCode: t.arg.string(),
      vesselId: t.arg.string(),
      status: t.arg.string(),
      limit: t.arg.int({ defaultValue: 50 }),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      const where: Record<string, unknown> = {};
      if (args.portCode) where.portCode = args.portCode;
      if (args.vesselId) where.vesselId = args.vesselId;
      if (args.status) where.status = args.status;
      if (orgId) where.organizationId = orgId;

      return ctx.prisma.portAgentAppointment.findMany({
        ...query,
        where,
        orderBy: { eta: 'desc' },
        take: args.limit,
      });
    },
  }),
);

builder.queryField('proformaDisbursementAccounts', (t) =>
  t.prismaField({
    type: ['ProformaDisbursementAccount'],
    args: {
      appointmentId: t.arg.string(),
      portCode: t.arg.string(),
      status: t.arg.string(),
      limit: t.arg.int({ defaultValue: 50 }),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {};
      if (args.appointmentId) where.appointmentId = args.appointmentId;
      if (args.portCode) where.portCode = args.portCode;
      if (args.status) where.status = args.status;

      return ctx.prisma.proformaDisbursementAccount.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
        take: args.limit,
      });
    },
  }),
);

builder.queryField('finalDisbursementAccounts', (t) =>
  t.prismaField({
    type: ['FinalDisbursementAccount'],
    args: {
      appointmentId: t.arg.string(),
      status: t.arg.string(),
      limit: t.arg.int({ defaultValue: 50 }),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {};
      if (args.appointmentId) where.appointmentId = args.appointmentId;
      if (args.status) where.status = args.status;

      return ctx.prisma.finalDisbursementAccount.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
        take: args.limit,
      });
    },
  }),
);

builder.queryField('portServiceRequests', (t) =>
  t.prismaField({
    type: ['PortServiceRequest'],
    args: {
      appointmentId: t.arg.string({ required: true }),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = { appointmentId: args.appointmentId };
      if (args.status) where.status = args.status;

      return ctx.prisma.portServiceRequest.findMany({
        ...query,
        where,
        orderBy: { requestedAt: 'desc' },
      });
    },
  }),
);

// ============================================================================
// MUTATIONS
// ============================================================================

builder.mutationField('createPortAgentAppointment', (t) =>
  t.prismaField({
    type: 'PortAgentAppointment',
    args: {
      vesselId: t.arg.string({ required: true }),
      portCode: t.arg.string({ required: true }),
      eta: t.arg({ type: 'DateTime', required: true }),
      etb: t.arg({ type: 'DateTime' }),
      etd: t.arg({ type: 'DateTime' }),
      serviceType: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      if (!orgId) throw new Error('Unauthorized');

      return ctx.prisma.portAgentAppointment.create({
        ...query,
        data: {
          organizationId: orgId,
          vesselId: args.vesselId,
          portCode: args.portCode,
          eta: args.eta,
          etb: args.etb ?? undefined,
          etd: args.etd ?? undefined,
          serviceType: args.serviceType,
          status: 'nominated',
          nominatedBy: ctx.user?.id,
          nominatedAt: new Date(),
        },
      });
    },
  }),
);

builder.mutationField('updatePortAgentAppointmentStatus', (t) =>
  t.prismaField({
    type: 'PortAgentAppointment',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.portAgentAppointment.update({
        ...query,
        where: { id: args.id },
        data: { status: args.status },
      }),
  }),
);

// ============================================================================
// ADVANCED MUTATIONS (Service Layer Integration)
// ============================================================================

// Import services
import { getPDAGenerationService } from '../../services/pda-generation.service.js';
import { getFDAVarianceService } from '../../services/fda-variance.service.js';
import { getCurrencyService } from '../../services/currency.service.js';

const pdaService = getPDAGenerationService();
const fdaService = getFDAVarianceService();
const currencyService = getCurrencyService();

// PDA Generation Result Type
const PDAGenerationResult = builder.objectRef<{
  pdaId: string;
  reference: string;
  totalAmount: number;
  baseCurrency: string;
  totalAmountLocal?: number;
  localCurrency?: string;
  fxRate?: number;
  lineItems: number;
  generationTime: number;
  confidenceScore?: number;
}>('PDAGenerationResult');

PDAGenerationResult.implement({
  fields: (t) => ({
    pdaId: t.exposeString('pdaId'),
    reference: t.exposeString('reference'),
    totalAmount: t.exposeFloat('totalAmount'),
    baseCurrency: t.exposeString('baseCurrency'),
    totalAmountLocal: t.exposeFloat('totalAmountLocal', { nullable: true }),
    localCurrency: t.exposeString('localCurrency', { nullable: true }),
    fxRate: t.exposeFloat('fxRate', { nullable: true }),
    lineItems: t.exposeInt('lineItems'),
    generationTime: t.exposeInt('generationTime'),
    confidenceScore: t.exposeFloat('confidenceScore', { nullable: true }),
  }),
});

// FDA Variance Result Type
const FDAVarianceResult = builder.objectRef<{
  fdaId: string;
  reference: string;
  pdaTotal: number;
  fdaTotal: number;
  totalVariance: number;
  totalVariancePercent: number;
  autoApproved: boolean;
  recommendedAction: string;
}>('FDAVarianceResult');

FDAVarianceResult.implement({
  fields: (t) => ({
    fdaId: t.exposeString('fdaId'),
    reference: t.exposeString('reference'),
    pdaTotal: t.exposeFloat('pdaTotal'),
    fdaTotal: t.exposeFloat('fdaTotal'),
    totalVariance: t.exposeFloat('totalVariance'),
    totalVariancePercent: t.exposeFloat('totalVariancePercent'),
    autoApproved: t.exposeBoolean('autoApproved'),
    recommendedAction: t.exposeString('recommendedAction'),
  }),
});

// Currency Conversion Result Type
const CurrencyConversionResult = builder.objectRef<{
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  rate: number;
}>('CurrencyConversionResult');

CurrencyConversionResult.implement({
  fields: (t) => ({
    fromCurrency: t.exposeString('fromCurrency'),
    toCurrency: t.exposeString('toCurrency'),
    amount: t.exposeFloat('amount'),
    convertedAmount: t.exposeFloat('convertedAmount'),
    rate: t.exposeFloat('rate'),
  }),
});

// ============================================================================
// PDA GENERATION MUTATIONS
// ============================================================================

builder.mutationField('generatePDAFromAppointment', (t) =>
  t.field({
    type: PDAGenerationResult,
    args: {
      appointmentId: t.arg.string({ required: true }),
      baseCurrency: t.arg.string({ defaultValue: 'USD' }),
      targetCurrency: t.arg.string(),
    },
    resolve: async (_root, args, _ctx) => {
      return await pdaService.generatePDA({
        appointmentId: args.appointmentId,
        baseCurrency: args.baseCurrency,
        targetCurrency: args.targetCurrency ?? undefined,
      });
    },
  }),
);

builder.mutationField('updatePDAStatus', (t) =>
  t.prismaField({
    type: 'ProformaDisbursementAccount',
    args: {
      pdaId: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      approvedBy: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      await pdaService.updatePDAStatus(
        args.pdaId,
        args.status,
        args.approvedBy ?? undefined
      );

      return ctx.prisma.proformaDisbursementAccount.findUniqueOrThrow({
        ...query,
        where: { id: args.pdaId },
      });
    },
  }),
);

// ============================================================================
// FDA CREATION & VARIANCE MUTATIONS
// ============================================================================

// FDA Line Item Input Type
const FDALineItemInput = builder.inputType('FDALineItemInput', {
  fields: (t) => ({
    category: t.string({ required: true }),
    description: t.string({ required: true }),
    quantity: t.float(),
    unit: t.string(),
    unitPrice: t.float(),
    amount: t.float({ required: true }),
    currency: t.string({ defaultValue: 'USD' }),
    invoiceNumber: t.string(),
    invoiceDate: t.string(),
    vendorId: t.string(),
  }),
});

builder.mutationField('createFDAFromPDA', (t) =>
  t.field({
    type: FDAVarianceResult,
    args: {
      pdaId: t.arg.string({ required: true }),
      lineItems: t.arg({ type: [FDALineItemInput], required: true }),
      paymentMethod: t.arg.string(),
      paymentReference: t.arg.string(),
    },
    resolve: async (_root, args, _ctx) => {
      return await fdaService.createFDAFromPDA({
        pdaId: args.pdaId,
        lineItems: args.lineItems.map((item) => ({
          ...item,
          invoiceDate: item.invoiceDate ? new Date(item.invoiceDate) : undefined,
          vendorId: item.vendorId ?? undefined,
        })),
        paymentMethod: args.paymentMethod ?? undefined,
        paymentReference: args.paymentReference ?? undefined,
      });
    },
  }),
);

builder.mutationField('updateFDAStatus', (t) =>
  t.prismaField({
    type: 'FinalDisbursementAccount',
    args: {
      fdaId: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      paymentReference: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      await fdaService.updateFDAStatus(
        args.fdaId,
        args.status,
        args.paymentReference ?? undefined
      );

      return ctx.prisma.finalDisbursementAccount.findUniqueOrThrow({
        ...query,
        where: { id: args.fdaId },
      });
    },
  }),
);

// ============================================================================
// CURRENCY CONVERSION MUTATIONS
// ============================================================================

builder.mutationField('convertCurrency', (t) =>
  t.field({
    type: CurrencyConversionResult,
    args: {
      amount: t.arg.float({ required: true }),
      fromCurrency: t.arg.string({ required: true }),
      toCurrency: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, _ctx) => {
      const result = await currencyService.convert(
        args.amount,
        args.fromCurrency,
        args.toCurrency
      );

      return {
        fromCurrency: result.fromCurrency,
        toCurrency: result.toCurrency,
        amount: result.amount,
        convertedAmount: result.convertedAmount,
        rate: result.rate,
      };
    },
  }),
);

builder.queryField('exchangeRate', (t) =>
  t.field({
    type: 'Float',
    args: {
      from: t.arg.string({ required: true }),
      to: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, _ctx) => {
      return await currencyService.getExchangeRate(args.from, args.to);
    },
  }),
);

// ============================================================================
// SERVICE REQUEST MUTATIONS
// ============================================================================

builder.mutationField('requestService', (t) =>
  t.prismaField({
    type: 'PortServiceRequest',
    args: {
      appointmentId: t.arg.string({ required: true }),
      serviceType: t.arg.string({ required: true }),
      description: t.arg.string({ required: true }),
      requiredBy: t.arg({ type: 'DateTime' }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.portServiceRequest.create({
        ...query,
        data: {
          appointmentId: args.appointmentId,
          serviceType: args.serviceType,
          description: args.description,
          requestedAt: new Date(),
          requiredBy: args.requiredBy ?? undefined,
          status: 'pending',
        },
      });
    },
  }),
);

builder.mutationField('submitVendorQuote', (t) =>
  t.prismaField({
    type: 'PortVendorQuote',
    args: {
      serviceRequestId: t.arg.string({ required: true }),
      vendorId: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      currency: t.arg.string({ defaultValue: 'USD' }),
      validUntil: t.arg({ type: 'DateTime', required: true }),
      description: t.arg.string(),
      terms: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.portVendorQuote.create({
        ...query,
        data: {
          serviceRequestId: args.serviceRequestId,
          vendorId: args.vendorId,
          amount: args.amount,
          currency: args.currency,
          validUntil: args.validUntil,
          description: args.description ?? undefined,
          terms: args.terms ?? undefined,
          status: 'pending',
          respondedAt: new Date(),
        },
      });
    },
  }),
);

builder.mutationField('selectQuote', (t) =>
  t.prismaField({
    type: 'PortServiceRequest',
    args: {
      serviceRequestId: t.arg.string({ required: true }),
      quoteId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Update the selected quote status
      await ctx.prisma.portVendorQuote.update({
        where: { id: args.quoteId },
        data: { status: 'accepted' },
      });

      // Reject other quotes
      await ctx.prisma.portVendorQuote.updateMany({
        where: {
          serviceRequestId: args.serviceRequestId,
          id: { not: args.quoteId },
          status: 'pending',
        },
        data: { status: 'rejected' },
      });

      // Update service request
      return ctx.prisma.portServiceRequest.update({
        ...query,
        where: { id: args.serviceRequestId },
        data: {
          selectedQuoteId: args.quoteId,
          status: 'confirmed',
        },
      });
    },
  }),
);

builder.mutationField('completeService', (t) =>
  t.prismaField({
    type: 'PortServiceRequest',
    args: {
      serviceRequestId: t.arg.string({ required: true }),
      actualCost: t.arg.float({ required: true }),
      currency: t.arg.string({ defaultValue: 'USD' }),
      rating: t.arg.int(),
      review: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.portServiceRequest.update({
        ...query,
        where: { id: args.serviceRequestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          actualCost: args.actualCost,
          currency: args.currency,
          rating: args.rating ?? undefined,
          review: args.review ?? undefined,
        },
      });
    },
  }),
);

// ============================================================================
// EMAIL NOTIFICATION MUTATIONS
// ============================================================================

import { getEmailNotificationService } from '../../services/email-notification.service.js';
const emailService = getEmailNotificationService();

// Email Notification Result Type
const EmailNotificationResult = builder.objectRef<{
  success: boolean;
  message: string;
}>('EmailNotificationResult');

EmailNotificationResult.implement({
  fields: (t) => ({
    success: t.exposeBoolean('success'),
    message: t.exposeString('message'),
  }),
});

builder.mutationField('sendPDAApprovalEmail', (t) =>
  t.field({
    type: EmailNotificationResult,
    args: {
      pdaId: t.arg.string({ required: true }),
      ownerEmail: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      try {
        const pda = await ctx.prisma.proformaDisbursementAccount.findUnique({
          where: { id: args.pdaId },
          include: {
            lineItems: true,
            appointment: {
              include: {
                vessel: true,
              },
            },
          },
        });

        if (!pda) {
          return { success: false, message: 'PDA not found' };
        }

        await emailService.sendPDAApprovalEmail(
          {
            pdaReference: pda.reference,
            vesselName: pda.vesselName,
            portName: pda.portName,
            arrivalDate: pda.arrivalDate,
            totalAmount: pda.totalAmount,
            currency: pda.baseCurrency,
            lineItems: pda.lineItems.map((item) => ({
              category: item.category,
              description: item.description,
              amount: item.amount,
            })),
            approvalLink: `${process.env.APP_BASE_URL || 'http://localhost:5176'}/pda/${pda.id}/approve`,
            confidenceScore: pda.confidenceScore || undefined,
          },
          args.ownerEmail
        );

        // Update PDA status to sent
        await ctx.prisma.proformaDisbursementAccount.update({
          where: { id: args.pdaId },
          data: { status: 'sent', sentAt: new Date() },
        });

        return { success: true, message: `PDA approval email sent to ${args.ownerEmail}` };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  }),
);

builder.mutationField('sendFDAVarianceEmail', (t) =>
  t.field({
    type: EmailNotificationResult,
    args: {
      fdaId: t.arg.string({ required: true }),
      ownerEmail: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      try {
        const fda = await ctx.prisma.finalDisbursementAccount.findUnique({
          where: { id: args.fdaId },
          include: {
            lineItems: true,
            pda: {
              include: {
                lineItems: true,
                appointment: {
                  include: {
                    vessel: true,
                  },
                },
              },
            },
            variances: {
              where: {
                isSignificant: true,
              },
            },
          },
        });

        if (!fda) {
          return { success: false, message: 'FDA not found' };
        }

        await emailService.sendFDAVarianceEmail(
          {
            fdaReference: fda.reference,
            pdaReference: fda.pda.reference,
            vesselName: fda.pda.vesselName,
            portName: fda.pda.portName,
            pdaTotal: fda.pdaTotal,
            fdaTotal: fda.fdaTotal,
            totalVariance: fda.variance,
            totalVariancePercent: fda.variancePercent,
            autoApproved: fda.autoApproved,
            significantVariances: fda.variances.map((v) => ({
              category: v.category,
              pdaAmount: v.pdaAmount,
              fdaAmount: v.fdaAmount,
              varianceAmount: v.varianceAmount,
              variancePercent: v.variancePercent,
              reason: v.reason || 'Unknown',
            })),
            reviewLink: `${process.env.APP_BASE_URL || 'http://localhost:5176'}/fda/${fda.id}/review`,
          },
          args.ownerEmail
        );

        return { success: true, message: `FDA variance email sent to ${args.ownerEmail}` };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  }),
);

builder.mutationField('sendServiceQuotesEmail', (t) =>
  t.field({
    type: EmailNotificationResult,
    args: {
      serviceRequestId: t.arg.string({ required: true }),
      recipientEmail: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      try {
        const serviceRequest = await ctx.prisma.portServiceRequest.findUnique({
          where: { id: args.serviceRequestId },
          include: {
            quotes: {
              where: {
                status: 'pending',
              },
              include: {
                vendor: true,
              },
            },
            appointment: {
              include: {
                vessel: true,
              },
            },
          },
        });

        if (!serviceRequest) {
          return { success: false, message: 'Service request not found' };
        }

        if (serviceRequest.quotes.length === 0) {
          return { success: false, message: 'No quotes available for this service request' };
        }

        await emailService.sendServiceQuotesEmail(
          {
            serviceType: serviceRequest.serviceType,
            description: serviceRequest.description,
            vesselName: serviceRequest.appointment.vessel.name,
            portCode: serviceRequest.appointment.portCode,
            quotes: serviceRequest.quotes.map((q) => ({
              vendorName: q.vendor.name,
              amount: q.amount,
              currency: q.currency,
              validUntil: q.validUntil,
              description: q.description || '',
              terms: q.terms || '',
            })),
            reviewLink: `${process.env.APP_BASE_URL || 'http://localhost:5176'}/service-request/${serviceRequest.id}/quotes`,
          },
          args.recipientEmail
        );

        return { success: true, message: `Service quotes email sent to ${args.recipientEmail}` };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  }),
);
