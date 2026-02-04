/**
 * Port Documents GraphQL Schema
 * Document workflow for vessel-port agent coordination
 */

import { builder } from '../builder.js';
import { prisma } from '../context.js';
import { documentAutoFillService } from '../../services/document-autofill.service.js';

// ============================================================================
// ENUMS
// ============================================================================

const DocumentStatus = builder.enumType('DocumentStatus', {
  values: ['draft', 'review', 'submitted', 'approved', 'rejected'] as const,
});

const DocumentCategory = builder.enumType('DocumentCategory', {
  values: ['pre_arrival', 'arrival', 'departure'] as const,
});

const SubmissionStatus = builder.enumType('SubmissionStatus', {
  values: ['preparing', 'ready', 'submitted', 'accepted', 'rejected'] as const,
});

// ============================================================================
// OBJECT TYPES
// ============================================================================

builder.prismaObject('DocumentTemplate', {
  fields: (t) => ({
    id: t.exposeID('id'),
    code: t.exposeString('code'),
    name: t.exposeString('name'),
    category: t.exposeString('category'),
    imoForm: t.exposeBoolean('imoForm'),
    mandatory: t.exposeBoolean('mandatory'),
    description: t.exposeString('description', { nullable: true }),
    version: t.exposeString('version'),
    templateJson: t.expose('templateJson', { type: 'JSON' }),
    applicableCountries: t.expose('applicableCountries', {
      type: ['String'],
    }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('VesselDocument', {
  fields: (t) => ({
    id: t.exposeID('id'),
    documentNumber: t.exposeString('documentNumber'),
    templateId: t.exposeString('templateId'),
    template: t.relation('template'),

    vesselId: t.exposeString('vesselId'),
    vessel: t.relation('vessel'),

    voyageId: t.exposeString('voyageId', { nullable: true }),
    voyage: t.relation('voyage', { nullable: true }),

    documentData: t.expose('documentData', { type: 'JSON' }),
    status: t.exposeString('status'),
    fillProgress: t.exposeFloat('fillProgress'),

    submittedToAgent: t.exposeBoolean('submittedToAgent'),
    submittedToAgentAt: t.expose('submittedToAgentAt', {
      type: 'DateTime',
      nullable: true,
    }),
    agentResponse: t.exposeString('agentResponse', { nullable: true }),
    agentComments: t.exposeString('agentComments', { nullable: true }),

    submittedToAuthority: t.exposeBoolean('submittedToAuthority'),
    submittedToAuthorityAt: t.expose('submittedToAuthorityAt', {
      type: 'DateTime',
      nullable: true,
    }),
    authorityReference: t.exposeString('authorityReference', { nullable: true }),

    validationErrors: t.expose('validationErrors', {
      type: 'JSON',
      nullable: true,
    }),
    validationWarnings: t.expose('validationWarnings', {
      type: 'JSON',
      nullable: true,
    }),

    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('DocumentSubmission', {
  fields: (t) => ({
    id: t.exposeID('id'),

    vesselId: t.exposeString('vesselId'),
    vessel: t.relation('vessel'),

    voyageId: t.exposeString('voyageId'),
    voyage: t.relation('voyage'),

    documentIds: t.expose('documentIds', { type: ['String'] }),

    status: t.exposeString('status'),
    submittedAt: t.expose('submittedAt', { type: 'DateTime', nullable: true }),
    acknowledgedAt: t.expose('acknowledgedAt', {
      type: 'DateTime',
      nullable: true,
    }),

    agentName: t.exposeString('agentName', { nullable: true }),
    agentEmail: t.exposeString('agentEmail', { nullable: true }),
    authorityReference: t.exposeString('authorityReference', { nullable: true }),

    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ============================================================================
// INPUT TYPES
// ============================================================================

const CreateDocumentInput = builder.inputType('CreateDocumentInput', {
  fields: (t) => ({
    templateCode: t.string({ required: true }),
    vesselId: t.string({ required: true }),
    voyageId: t.string({ required: false }),
    autoFill: t.boolean({ required: false }),
  }),
});

const UpdateDocumentInput = builder.inputType('UpdateDocumentInput', {
  fields: (t) => ({
    documentId: t.string({ required: true }),
    documentData: t.field({ type: 'JSON', required: false }),
    status: t.string({ required: false }),
  }),
});

const SubmitToAgentInput = builder.inputType('SubmitToAgentInput', {
  fields: (t) => ({
    documentIds: t.stringList({ required: true }),
    vesselId: t.string({ required: true }),
    voyageId: t.string({ required: true }),
    agentName: t.string({ required: false }),
    agentEmail: t.string({ required: false }),
  }),
});

// ============================================================================
// QUERIES
// ============================================================================

builder.queryField('documentTemplates', (t) =>
  t.prismaField({
    type: ['DocumentTemplate'],
    args: {
      category: t.arg.string({ required: false }),
      imoForm: t.arg.boolean({ required: false }),
    },
    resolve: (query, _root, args) => {
      const where: any = {};
      if (args.category) where.category = args.category;
      if (args.imoForm !== undefined) where.imoForm = args.imoForm;

      return prisma.documentTemplate.findMany({
        ...query,
        where,
        orderBy: { code: 'asc' },
      });
    },
  })
);

builder.queryField('documentTemplate', (t) =>
  t.prismaField({
    type: 'DocumentTemplate',
    nullable: true,
    args: {
      code: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.documentTemplate.findUnique({
        ...query,
        where: { code: args.code },
      }),
  })
);

builder.queryField('vesselDocuments', (t) =>
  t.prismaField({
    type: ['VesselDocument'],
    args: {
      vesselId: t.arg.string({ required: false }),
      voyageId: t.arg.string({ required: false }),
      status: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) => {
      const where: any = { organizationId: ctx.user?.organizationId };

      if (args.vesselId) where.vesselId = args.vesselId;
      if (args.voyageId) where.voyageId = args.voyageId;
      if (args.status) where.status = args.status;
      where.deleted = false;

      return prisma.vesselDocument.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  })
);

builder.queryField('vesselDocument', (t) =>
  t.prismaField({
    type: 'VesselDocument',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.vesselDocument.findUnique({
        ...query,
        where: { id: args.id },
      }),
  })
);

builder.queryField('documentSubmissions', (t) =>
  t.prismaField({
    type: ['DocumentSubmission'],
    args: {
      vesselId: t.arg.string({ required: false }),
      voyageId: t.arg.string({ required: false }),
      status: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) => {
      const where: any = { organizationId: ctx.user?.organizationId };

      if (args.vesselId) where.vesselId = args.vesselId;
      if (args.voyageId) where.voyageId = args.voyageId;
      if (args.status) where.status = args.status;

      return prisma.documentSubmission.findMany({
        ...query,
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  })
);

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new vessel document (with optional auto-fill)
 */
builder.mutationField('createVesselDocument', (t) =>
  t.field({
    type: 'VesselDocument',
    args: {
      input: t.arg({ type: CreateDocumentInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { templateCode, vesselId, voyageId, autoFill = true } = args.input;

      // Get template
      const template = await prisma.documentTemplate.findUnique({
        where: { code: templateCode },
      });

      if (!template) {
        throw new Error(`Template ${templateCode} not found`);
      }

      // Auto-fill if requested
      let documentData = {};
      let fillProgress = 0;
      let autoFillSource = null;

      if (autoFill) {
        const result = await documentAutoFillService.autoFillDocument(
          templateCode,
          vesselId,
          voyageId
        );

        documentData = result.documentData;
        fillProgress = result.fillProgress;
        autoFillSource = result.dataSource;
      }

      // Generate document number
      const count = await prisma.vesselDocument.count();
      const documentNumber = `DOC-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

      // Create document
      const document = await prisma.vesselDocument.create({
        data: {
          documentNumber,
          templateId: template.id,
          vesselId,
          voyageId,
          documentData,
          status: 'draft',
          fillProgress,
          autoFillSource,
          createdBy: ctx.user?.id || 'system',
          organizationId: ctx.user?.organizationId || 'default',
        },
        include: {
          template: true,
          vessel: true,
          voyage: true,
        },
      });

      return document as any;
    },
  })
);

/**
 * Update vessel document data
 */
builder.mutationField('updateVesselDocument', (t) =>
  t.field({
    type: 'VesselDocument',
    args: {
      input: t.arg({ type: UpdateDocumentInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { documentId, documentData, status } = args.input;

      const updateData: any = {};
      if (documentData) updateData.documentData = documentData;
      if (status) updateData.status = status;
      updateData.updatedAt = new Date();

      const document = await prisma.vesselDocument.update({
        where: { id: documentId },
        data: updateData,
        include: {
          template: true,
          vessel: true,
          voyage: true,
        },
      });

      return document as any;
    },
  })
);

/**
 * Submit documents to port agent
 */
builder.mutationField('submitToAgent', (t) =>
  t.field({
    type: 'DocumentSubmission',
    args: {
      input: t.arg({ type: SubmitToAgentInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { documentIds, vesselId, voyageId, agentName, agentEmail } = args.input;

      // Mark documents as submitted
      await prisma.vesselDocument.updateMany({
        where: { id: { in: documentIds } },
        data: {
          submittedToAgent: true,
          submittedToAgentAt: new Date(),
          status: 'submitted',
        },
      });

      // Create submission record
      const submission = await prisma.documentSubmission.create({
        data: {
          vesselId,
          voyageId,
          documentIds,
          status: 'submitted',
          submittedAt: new Date(),
          agentName,
          agentEmail,
          createdBy: ctx.user?.id || 'system',
          organizationId: ctx.user?.organizationId || 'default',
        },
        include: {
          vessel: true,
          voyage: true,
        },
      });

      // TODO: Send email notification to agent

      return submission as any;
    },
  })
);

/**
 * Validate document completeness
 */
builder.queryField('validateDocument', (t) =>
  t.field({
    type: 'JSON',
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const document = await prisma.vesselDocument.findUnique({
        where: { id: args.documentId },
        include: { template: true },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Simple validation logic
      const errors: string[] = [];
      const warnings: string[] = [];

      const data = document.documentData as any;

      // Check required fields based on template
      if (document.template.imoForm) {
        if (!data.vesselName) errors.push('Vessel name is required');
        if (!data.imoNumber) errors.push('IMO number is required');
        if (!data.flag) errors.push('Flag is required');
      }

      // Check fill progress
      if (document.fillProgress < 0.8) {
        warnings.push(
          `Document is only ${(document.fillProgress * 100).toFixed(0)}% complete`
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        fillProgress: document.fillProgress,
        missingFields: errors.length,
      };
    },
  })
);
