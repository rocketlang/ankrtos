/**
 * Document Management GraphQL Schema
 *
 * Provides GraphQL types, queries, and mutations for:
 * - eBL Blockchain
 * - Digital Signatures
 * - Document Workflows
 * - Document Versioning
 * - Document Templates
 */

import { builder } from '../builder';
import { GraphQLError } from 'graphql';
import {
  eblBlockchain as eblBlockchainService,
  digitalSignature as digitalSignatureService,
  documentWorkflowService,
  documentVersioningService,
  documentTemplatesService,
  EBLStatus,
  SignatureStatus,
  SignatureType,
  WorkflowStatus,
  WorkflowStepType,
  VersionStatus,
  ChangeType,
  TemplateCategory,
  TemplateFormat,
  TemplateStatus,
  VariableType,
} from '../../services/document-management';
import accessControlService, {
  PermissionLevel,
  AccessType,
} from '../../services/document-management/access-control';

// ============================================================================
// Enums
// ============================================================================

const EBLStatusEnum = builder.enumType('EBLStatus', {
  values: ['DRAFT', 'ISSUED', 'ENDORSED', 'SURRENDERED', 'ACCOMPLISHED', 'CANCELLED'] as const,
});

const SignatureStatusEnum = builder.enumType('SignatureStatus', {
  values: ['PENDING', 'SIGNED', 'REJECTED', 'EXPIRED', 'CANCELLED'] as const,
});

const SignatureTypeEnum = builder.enumType('SignatureType', {
  values: ['SIMPLE', 'ADVANCED', 'QUALIFIED'] as const,
});

const WorkflowStatusEnum = builder.enumType('WorkflowStatus', {
  values: ['DRAFT', 'PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'ARCHIVED', 'CANCELLED'] as const,
});

const WorkflowStepTypeEnum = builder.enumType('WorkflowStepType', {
  values: ['REVIEW', 'APPROVE', 'SIGN', 'VERIFY', 'ACKNOWLEDGE', 'CONDITIONAL'] as const,
});

const VersionStatusEnum = builder.enumType('VersionStatus', {
  values: ['DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED', 'DELETED'] as const,
});

const ChangeTypeEnum = builder.enumType('ChangeType', {
  values: ['CREATED', 'MODIFIED', 'MINOR_EDIT', 'MAJOR_REVISION', 'MERGED', 'ROLLED_BACK'] as const,
});

const TemplateCategoryEnum = builder.enumType('TemplateCategory', {
  values: [
    'CHARTER_PARTY',
    'BILL_OF_LADING',
    'INVOICE',
    'STATEMENT_OF_FACTS',
    'VOYAGE_INSTRUCTIONS',
    'LETTER_OF_PROTEST',
    'NOTICE_OF_READINESS',
    'TIME_SHEET',
    'CORRESPONDENCE',
    'CUSTOM',
  ] as const,
});

const TemplateFormatEnum = builder.enumType('TemplateFormat', {
  values: ['MARKDOWN', 'HTML', 'DOCX', 'PDF', 'PLAIN_TEXT'] as const,
});

const TemplateStatusEnum = builder.enumType('TemplateStatus', {
  values: ['DRAFT', 'ACTIVE', 'ARCHIVED', 'DEPRECATED'] as const,
});

const VariableTypeEnum = builder.enumType('VariableType', {
  values: [
    'TEXT',
    'NUMBER',
    'DATE',
    'CURRENCY',
    'BOOLEAN',
    'SELECT',
    'MULTI_SELECT',
    'VESSEL',
    'PORT',
    'COMPANY',
    'USER',
  ] as const,
});

const PermissionLevelEnum = builder.enumType('PermissionLevel', {
  values: ['NONE', 'VIEW', 'COMMENT', 'EDIT', 'FULL_CONTROL'] as const,
});

const AccessTypeEnum = builder.enumType('AccessType', {
  values: ['USER', 'ROLE', 'TEAM', 'PUBLIC', 'EXTERNAL'] as const,
});

// ============================================================================
// Object Types
// ============================================================================

// eBL Types
const BlockchainRecord = builder.objectType('BlockchainRecord', {
  fields: (t) => ({
    blockHash: t.exposeString('blockHash'),
    previousHash: t.exposeString('previousHash'),
    timestamp: t.field({ type: 'DateTime', resolve: (parent) => parent.timestamp }),
    action: t.exposeString('action'),
    actor: t.exposeString('actor'),
    data: t.field({ type: 'JSON', resolve: (parent) => parent.data }),
  }),
});

const EBL = builder.objectType('EBL', {
  fields: (t) => ({
    id: t.exposeID('id'),
    blNumber: t.exposeString('blNumber'),
    status: t.field({ type: EBLStatusEnum, resolve: (parent) => parent.status }),
    shipper: t.exposeString('shipper'),
    consignee: t.exposeString('consignee'),
    notifyParty: t.exposeString('notifyParty'),
    vesselName: t.exposeString('vesselName'),
    voyageNumber: t.exposeString('voyageNumber'),
    portOfLoading: t.exposeString('portOfLoading'),
    portOfDischarge: t.exposeString('portOfDischarge'),
    cargoDescription: t.exposeString('cargoDescription'),
    currentHolder: t.exposeString('currentHolder'),
    blockchainRecords: t.field({
      type: [BlockchainRecord],
      resolve: (parent) => parent.blockchainRecords,
    }),
    latestBlockHash: t.exposeString('latestBlockHash'),
    issuedAt: t.field({ type: 'DateTime', resolve: (parent) => parent.issuedAt }),
    organizationId: t.exposeString('organizationId'),
  }),
});

// Digital Signature Types
const Signatory = builder.objectType('Signatory', {
  fields: (t) => ({
    name: t.exposeString('name'),
    email: t.exposeString('email'),
    role: t.exposeString('role'),
  }),
});

const Signature = builder.objectType('Signature', {
  fields: (t) => ({
    id: t.exposeID('id'),
    signatory: t.field({ type: Signatory, resolve: (parent) => parent.signatory }),
    signedAt: t.field({ type: 'DateTime', resolve: (parent) => parent.signedAt }),
    signatureData: t.exposeString('signatureData'),
    ipAddress: t.string({ resolve: (parent) => parent.ipAddress || '' }),
    userAgent: t.string({ resolve: (parent) => parent.userAgent || '' }),
  }),
});

const SignatureSession = builder.objectType('SignatureSession', {
  fields: (t) => ({
    sessionId: t.exposeID('sessionId'),
    documentId: t.exposeString('documentId'),
    documentType: t.exposeString('documentType'),
    signatureType: t.field({ type: SignatureTypeEnum, resolve: (parent) => parent.signatureType }),
    status: t.field({ type: SignatureStatusEnum, resolve: (parent) => parent.status }),
    currentSignatory: t.string({ resolve: (parent) => parent.currentSignatory || '' }),
    signatures: t.field({ type: [Signature], resolve: (parent) => parent.signatures }),
    createdAt: t.field({ type: 'DateTime', resolve: (parent) => parent.createdAt }),
    expiresAt: t.field({ type: 'DateTime', resolve: (parent) => parent.expiresAt }),
  }),
});

// Workflow Types
const WorkflowStep = builder.objectType('WorkflowStep', {
  fields: (t) => ({
    stepId: t.exposeID('stepId'),
    stepNumber: t.exposeInt('stepNumber'),
    stepType: t.field({ type: WorkflowStepTypeEnum, resolve: (parent) => parent.stepType }),
    stepName: t.exposeString('stepName'),
    assignedTo: t.exposeString('assignedTo'),
    status: t.exposeString('status'),
    dueDate: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.dueDate || null,
    }),
    completedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.completedAt || null,
    }),
    completedBy: t.string({ nullable: true, resolve: (parent) => parent.completedBy || null }),
    comments: t.string({ nullable: true, resolve: (parent) => parent.comments || null }),
  }),
});

const DocumentWorkflow = builder.objectType('DocumentWorkflow', {
  fields: (t) => ({
    workflowId: t.exposeID('workflowId'),
    documentId: t.exposeString('documentId'),
    documentType: t.exposeString('documentType'),
    status: t.field({ type: WorkflowStatusEnum, resolve: (parent) => parent.status }),
    currentStep: t.exposeInt('currentStep'),
    steps: t.field({ type: [WorkflowStep], resolve: (parent) => parent.steps }),
    initiatedBy: t.exposeString('initiatedBy'),
    initiatedAt: t.field({ type: 'DateTime', resolve: (parent) => parent.initiatedAt }),
    completedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.completedAt || null,
    }),
  }),
});

const WorkflowTemplate = builder.objectType('WorkflowTemplate', {
  fields: (t) => ({
    templateId: t.exposeID('templateId'),
    templateName: t.exposeString('templateName'),
    description: t.exposeString('description'),
    documentType: t.exposeString('documentType'),
    isActive: t.exposeBoolean('isActive'),
    usageCount: t.exposeInt('usageCount'),
  }),
});

// Versioning Types
const DocumentVersion = builder.objectType('DocumentVersion', {
  fields: (t) => ({
    versionId: t.exposeID('versionId'),
    documentId: t.exposeString('documentId'),
    versionNumber: t.exposeString('versionNumber'),
    majorVersion: t.exposeInt('majorVersion'),
    minorVersion: t.exposeInt('minorVersion'),
    patchVersion: t.exposeInt('patchVersion'),
    status: t.field({ type: VersionStatusEnum, resolve: (parent) => parent.status }),
    changeType: t.field({ type: ChangeTypeEnum, resolve: (parent) => parent.changeType }),
    contentHash: t.exposeString('contentHash'),
    fileSize: t.exposeInt('fileSize'),
    title: t.exposeString('title'),
    description: t.string({ nullable: true, resolve: (parent) => parent.description || null }),
    branchName: t.string({ nullable: true, resolve: (parent) => parent.branchName || null }),
    createdBy: t.exposeString('createdBy'),
    createdAt: t.field({ type: 'DateTime', resolve: (parent) => parent.createdAt }),
  }),
});

const VersionDifference = builder.objectType('VersionDifference', {
  fields: (t) => ({
    field: t.exposeString('field'),
    changeType: t.exposeString('changeType'),
    oldValue: t.field({ type: 'JSON', nullable: true, resolve: (parent) => parent.oldValue || null }),
    newValue: t.field({ type: 'JSON', nullable: true, resolve: (parent) => parent.newValue || null }),
  }),
});

const VersionComparison = builder.objectType('VersionComparison', {
  fields: (t) => ({
    documentId: t.exposeString('documentId'),
    sourceVersion: t.exposeString('sourceVersion'),
    targetVersion: t.exposeString('targetVersion'),
    differences: t.field({ type: [VersionDifference], resolve: (parent) => parent.differences }),
    similarity: t.exposeFloat('similarity'),
    comparedAt: t.field({ type: 'DateTime', resolve: (parent) => parent.comparedAt }),
  }),
});

// Template Types
const TemplateVariable = builder.objectType('TemplateVariable', {
  fields: (t) => ({
    name: t.exposeString('name'),
    label: t.exposeString('label'),
    type: t.field({ type: VariableTypeEnum, resolve: (parent) => parent.type }),
    required: t.exposeBoolean('required'),
    defaultValue: t.field({ type: 'JSON', nullable: true, resolve: (parent) => parent.defaultValue || null }),
    description: t.string({ nullable: true, resolve: (parent) => parent.description || null }),
    placeholder: t.string({ nullable: true, resolve: (parent) => parent.placeholder || null }),
  }),
});

const DMSDocumentTemplate = builder.objectType('DMSDocumentTemplate', {
  fields: (t) => ({
    templateId: t.exposeID('templateId'),
    templateName: t.exposeString('templateName'),
    description: t.exposeString('description'),
    category: t.field({ type: TemplateCategoryEnum, resolve: (parent) => parent.category }),
    format: t.field({ type: TemplateFormatEnum, resolve: (parent) => parent.format }),
    status: t.field({ type: TemplateStatusEnum, resolve: (parent) => parent.status }),
    content: t.exposeString('content'),
    variables: t.field({ type: [TemplateVariable], resolve: (parent) => parent.variables }),
    tags: t.stringList({ resolve: (parent) => parent.tags }),
    version: t.exposeString('version'),
    isPublic: t.exposeBoolean('isPublic'),
    usageCount: t.exposeInt('usageCount'),
    createdAt: t.field({ type: 'DateTime', resolve: (parent) => parent.createdAt }),
  }),
});

const GeneratedDocument = builder.objectType('GeneratedDocument', {
  fields: (t) => ({
    documentId: t.exposeID('documentId'),
    templateId: t.exposeString('templateId'),
    content: t.exposeString('content'),
    format: t.field({ type: TemplateFormatEnum, resolve: (parent) => parent.format }),
    generatedAt: t.field({ type: 'DateTime', resolve: (parent) => parent.generatedAt }),
  }),
});

// Access Control Types
const AccessControlEntry = builder.objectType('AccessControlEntry', {
  fields: (t) => ({
    id: t.exposeID('id'),
    documentId: t.exposeString('documentId'),
    accessType: t.field({ type: AccessTypeEnum, resolve: (parent) => parent.accessType }),
    entityId: t.exposeString('entityId'),
    permissionLevel: t.field({ type: PermissionLevelEnum, resolve: (parent) => parent.permissionLevel }),
    expiresAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.expiresAt || null,
    }),
    grantedBy: t.exposeString('grantedBy'),
    grantedAt: t.field({ type: 'DateTime', resolve: (parent) => parent.grantedAt }),
  }),
});

const ShareLink = builder.objectType('ShareLink', {
  fields: (t) => ({
    id: t.exposeID('id'),
    documentId: t.exposeString('documentId'),
    token: t.exposeString('token'),
    permissionLevel: t.field({ type: PermissionLevelEnum, resolve: (parent) => parent.permissionLevel }),
    expiresAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.expiresAt || null,
    }),
    maxDownloads: t.int({ nullable: true, resolve: (parent) => parent.maxDownloads || null }),
    downloadCount: t.exposeInt('downloadCount'),
    hasPassword: t.boolean({ resolve: (parent) => !!parent.password }),
    createdBy: t.exposeString('createdBy'),
    createdAt: t.field({ type: 'DateTime', resolve: (parent) => parent.createdAt }),
    lastAccessedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (parent) => parent.lastAccessedAt || null,
    }),
  }),
});

const AccessAuditLog = builder.objectType('AccessAuditLog', {
  fields: (t) => ({
    id: t.exposeID('id'),
    documentId: t.exposeString('documentId'),
    userId: t.string({ nullable: true, resolve: (parent) => parent.userId || null }),
    action: t.exposeString('action'),
    ipAddress: t.string({ nullable: true, resolve: (parent) => parent.ipAddress || null }),
    userAgent: t.string({ nullable: true, resolve: (parent) => parent.userAgent || null }),
    timestamp: t.field({ type: 'DateTime', resolve: (parent) => parent.timestamp }),
    details: t.field({ type: 'JSON', nullable: true, resolve: (parent) => parent.details || null }),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const EBLDataInput = builder.inputType('EBLDataInput', {
  fields: (t) => ({
    blNumber: t.string({ required: true }),
    shipper: t.string({ required: true }),
    consignee: t.string({ required: true }),
    notifyParty: t.string({ required: true }),
    vesselName: t.string({ required: true }),
    voyageNumber: t.string({ required: true }),
    portOfLoading: t.string({ required: true }),
    portOfDischarge: t.string({ required: true }),
    cargoDescription: t.string({ required: true }),
  }),
});

const EndorsementInput = builder.inputType('EndorsementInput', {
  fields: (t) => ({
    fromParty: t.string({ required: true }),
    toParty: t.string({ required: true }),
    signature: t.string({ required: true }),
  }),
});

const SignatoryInput = builder.inputType('SignatoryInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    email: t.string({ required: true }),
    role: t.string({ required: true }),
  }),
});

const SignatureRequestInput = builder.inputType('SignatureRequestInput', {
  fields: (t) => ({
    documentId: t.string({ required: true }),
    documentType: t.string({ required: true }),
    signatureType: t.field({ type: SignatureTypeEnum, required: true }),
    signatories: t.field({ type: [SignatoryInput], required: true }),
  }),
});

const WorkflowStepInput = builder.inputType('WorkflowStepInput', {
  fields: (t) => ({
    stepType: t.field({ type: WorkflowStepTypeEnum, required: true }),
    stepName: t.string({ required: true }),
    assignedTo: t.string({ required: true }),
    assignmentType: t.string({ required: true }),
    dueDate: t.field({ type: 'DateTime', required: false }),
  }),
});

const TemplateVariableInput = builder.inputType('TemplateVariableInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    label: t.string({ required: true }),
    type: t.field({ type: VariableTypeEnum, required: true }),
    required: t.boolean({ required: true }),
    defaultValue: t.field({ type: 'JSON', required: false }),
    description: t.string({ required: false }),
  }),
});

const CreateTemplateInput = builder.inputType('CreateTemplateInput', {
  fields: (t) => ({
    templateName: t.string({ required: true }),
    description: t.string({ required: true }),
    category: t.field({ type: TemplateCategoryEnum, required: true }),
    format: t.field({ type: TemplateFormatEnum, required: true }),
    content: t.string({ required: true }),
    variables: t.field({ type: [TemplateVariableInput], required: true }),
    tags: t.stringList({ required: false }),
    isPublic: t.boolean({ required: false }),
  }),
});

const GrantAccessInput = builder.inputType('GrantAccessInput', {
  fields: (t) => ({
    documentId: t.string({ required: true }),
    accessType: t.field({ type: AccessTypeEnum, required: true }),
    entityId: t.string({ required: true }),
    permissionLevel: t.field({ type: PermissionLevelEnum, required: true }),
    expiresAt: t.field({ type: 'DateTime', required: false }),
    notify: t.boolean({ required: false }),
  }),
});

const CreateShareLinkInput = builder.inputType('CreateShareLinkInput', {
  fields: (t) => ({
    documentId: t.string({ required: true }),
    permissionLevel: t.field({ type: PermissionLevelEnum, required: false }),
    expiresAt: t.field({ type: 'DateTime', required: false }),
    maxDownloads: t.int({ required: false }),
    password: t.string({ required: false }),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryFields((t) => ({
  // eBL Queries
  getEBL: t.field({
    type: EBL,
    nullable: true,
    args: {
      eblId: t.arg.string({ required: true }),
    },
    resolve: async (_, { eblId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return eblBlockchainService.getEBL(eblId, ctx.user.organizationId);
    },
  }),

  verifyEBLChain: t.boolean({
    args: {
      eblId: t.arg.string({ required: true }),
    },
    resolve: async (_, { eblId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return eblBlockchainService.verifyChain(eblId, ctx.user.organizationId);
    },
  }),

  // Digital Signature Queries
  getSignatureSession: t.field({
    type: SignatureSession,
    nullable: true,
    args: {
      sessionId: t.arg.string({ required: true }),
    },
    resolve: async (_, { sessionId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return digitalSignatureService.getSession(sessionId, ctx.user.organizationId);
    },
  }),

  // Workflow Queries
  getWorkflow: t.field({
    type: DocumentWorkflow,
    nullable: true,
    args: {
      workflowId: t.arg.string({ required: true }),
    },
    resolve: async (_, { workflowId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentWorkflowService.getWorkflow(workflowId, ctx.user.organizationId);
    },
  }),

  getPendingWorkflows: t.field({
    type: [DocumentWorkflow],
    resolve: async (_, __, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentWorkflowService.getPendingWorkflows(ctx.user.id, ctx.user.organizationId);
    },
  }),

  getWorkflowTemplates: t.field({
    type: [WorkflowTemplate],
    resolve: async (_, __, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentWorkflowService.getWorkflowTemplates(ctx.user.organizationId);
    },
  }),

  // Versioning Queries
  getDocumentVersions: t.field({
    type: [DocumentVersion],
    args: {
      documentId: t.arg.string({ required: true }),
      branchName: t.arg.string({ required: false }),
    },
    resolve: async (_, { documentId, branchName }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentVersioningService.getVersionHistory(
        documentId,
        ctx.user.organizationId,
        branchName || undefined
      );
    },
  }),

  compareVersions: t.field({
    type: VersionComparison,
    args: {
      versionId1: t.arg.string({ required: true }),
      versionId2: t.arg.string({ required: true }),
    },
    resolve: async (_, { versionId1, versionId2 }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentVersioningService.compareVersions(
        versionId1,
        versionId2,
        ctx.user.id,
        ctx.user.organizationId
      );
    },
  }),

  // Template Queries
  getDocumentTemplate: t.field({
    type: DocumentTemplate,
    nullable: true,
    args: {
      templateId: t.arg.string({ required: true }),
    },
    resolve: async (_, { templateId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentTemplatesService.getTemplate(templateId, ctx.user.organizationId);
    },
  }),

  getDocumentTemplates: t.field({
    type: [DocumentTemplate],
    args: {
      category: t.arg({ type: TemplateCategoryEnum, required: false }),
    },
    resolve: async (_, { category }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentTemplatesService.getTemplates(ctx.user.organizationId, {
        category: category || undefined,
      });
    },
  }),

  // Access Control Queries
  getDocumentAccess: t.field({
    type: [AccessControlEntry],
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return accessControlService.getDocumentAccess(documentId, ctx.user.organizationId);
    },
  }),

  getDocumentShareLinks: t.field({
    type: [ShareLink],
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return accessControlService.getDocumentShareLinks(documentId, ctx.user.organizationId);
    },
  }),

  getDocumentPermissionLevel: t.field({
    type: PermissionLevelEnum,
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return accessControlService.getPermissionLevel(
        documentId,
        ctx.user.id,
        ctx.user.organizationId
      );
    },
  }),

  getAccessAudit: t.field({
    type: [AccessAuditLog],
    args: {
      documentId: t.arg.string({ required: true }),
      userId: t.arg.string({ required: false }),
      action: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (_, { documentId, userId, action, limit }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return accessControlService.getAccessAudit(documentId, ctx.user.organizationId, {
        userId: userId || undefined,
        action: action || undefined,
        limit: limit || undefined,
      });
    },
  }),
}));

// ============================================================================
// Mutations
// ============================================================================

builder.mutationFields((t) => ({
  // eBL Mutations
  issueEBL: t.field({
    type: 'String',
    args: {
      data: t.arg({ type: EBLDataInput, required: true }),
      issuerPrivateKey: t.arg.string({ required: true }),
    },
    resolve: async (_, { data, issuerPrivateKey }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const result = await eblBlockchainService.issueEBL(
        data as any,
        ctx.user.id,
        issuerPrivateKey
      );
      return result.eblId;
    },
  }),

  endorseEBL: t.field({
    type: 'String',
    args: {
      eblId: t.arg.string({ required: true }),
      endorsement: t.arg({ type: EndorsementInput, required: true }),
      endorsedByUserId: t.arg.string({ required: true }),
    },
    resolve: async (_, { eblId, endorsement, endorsedByUserId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const result = await eblBlockchainService.endorseEBL(eblId, endorsement as any, endorsedByUserId);
      return result.blockHash;
    },
  }),

  // Digital Signature Mutations
  createSignatureRequest: t.field({
    type: SignatureSession,
    args: {
      request: t.arg({ type: SignatureRequestInput, required: true }),
    },
    resolve: async (_, { request }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const result = await digitalSignatureService.createSignatureRequest(
        request as any,
        ctx.user.id,
        ctx.user.organizationId
      );
      return digitalSignatureService.getSession(result.sessionId, ctx.user.organizationId) as any;
    },
  }),

  signDocument: t.boolean({
    args: {
      sessionId: t.arg.string({ required: true }),
      signatory: t.arg({ type: SignatoryInput, required: true }),
    },
    resolve: async (_, { sessionId, signatory }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const result = await digitalSignatureService.signDocument(sessionId, signatory as any);
      return result.success;
    },
  }),

  // Workflow Mutations
  createWorkflowFromTemplate: t.field({
    type: DocumentWorkflow,
    args: {
      documentId: t.arg.string({ required: true }),
      templateId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId, templateId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentWorkflowService.createWorkflowFromTemplate(
        documentId,
        templateId,
        ctx.user.id,
        ctx.user.organizationId
      );
    },
  }),

  completeWorkflowStep: t.field({
    type: DocumentWorkflow,
    args: {
      workflowId: t.arg.string({ required: true }),
      stepId: t.arg.string({ required: true }),
      comments: t.arg.string({ required: false }),
    },
    resolve: async (_, { workflowId, stepId, comments }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentWorkflowService.completeWorkflowStep(
        workflowId,
        stepId,
        ctx.user.id,
        ctx.user.organizationId,
        comments || undefined
      );
    },
  }),

  // Versioning Mutations
  createDocumentVersion: t.field({
    type: DocumentVersion,
    args: {
      documentId: t.arg.string({ required: true }),
      changeType: t.arg({ type: ChangeTypeEnum, required: true }),
      content: t.arg.string({ required: true }),
      changeLog: t.arg.string({ required: false }),
    },
    resolve: async (_, { documentId, changeType, content, changeLog }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentVersioningService.createVersion(
        documentId,
        changeType as any,
        content,
        ctx.user.id,
        ctx.user.organizationId,
        { changeLog: changeLog || undefined }
      );
    },
  }),

  rollbackToVersion: t.field({
    type: DocumentVersion,
    args: {
      documentId: t.arg.string({ required: true }),
      versionId: t.arg.string({ required: true }),
      reason: t.arg.string({ required: false }),
    },
    resolve: async (_, { documentId, versionId, reason }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentVersioningService.rollbackToVersion(
        documentId,
        versionId,
        ctx.user.id,
        ctx.user.organizationId,
        reason || undefined
      );
    },
  }),

  // Template Mutations
  createDocumentTemplate: t.field({
    type: DocumentTemplate,
    args: {
      input: t.arg({ type: CreateTemplateInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentTemplatesService.createTemplate(
        input as any,
        ctx.user.id,
        ctx.user.organizationId
      );
    },
  }),

  generateDocumentFromTemplate: t.field({
    type: GeneratedDocument,
    args: {
      templateId: t.arg.string({ required: true }),
      variableValues: t.arg({ type: 'JSON', required: true }),
      saveToVault: t.arg.boolean({ required: false }),
    },
    resolve: async (_, { templateId, variableValues, saveToVault }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentTemplatesService.generateDocument(
        templateId,
        variableValues as any,
        ctx.user.id,
        ctx.user.organizationId,
        { saveToVault: saveToVault || false }
      );
    },
  }),

  // Access Control Mutations
  grantDocumentAccess: t.field({
    type: AccessControlEntry,
    args: {
      input: t.arg({ type: GrantAccessInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return accessControlService.grantAccess(
        (input as any).documentId,
        (input as any).accessType,
        (input as any).entityId,
        (input as any).permissionLevel,
        ctx.user.id,
        ctx.user.organizationId,
        {
          expiresAt: (input as any).expiresAt,
          notify: (input as any).notify,
        }
      );
    },
  }),

  revokeDocumentAccess: t.boolean({
    args: {
      documentId: t.arg.string({ required: true }),
      accessType: t.arg({ type: AccessTypeEnum, required: true }),
      entityId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId, accessType, entityId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      await accessControlService.revokeAccess(
        documentId,
        accessType as any,
        entityId,
        ctx.user.id,
        ctx.user.organizationId
      );
      return true;
    },
  }),

  createShareLink: t.field({
    type: ShareLink,
    args: {
      input: t.arg({ type: CreateShareLinkInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return accessControlService.createShareLink(
        (input as any).documentId,
        ctx.user.id,
        ctx.user.organizationId,
        {
          permissionLevel: (input as any).permissionLevel,
          expiresAt: (input as any).expiresAt,
          maxDownloads: (input as any).maxDownloads,
          password: (input as any).password,
        }
      );
    },
  }),

  revokeShareLink: t.boolean({
    args: {
      linkId: t.arg.string({ required: true }),
    },
    resolve: async (_, { linkId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      await accessControlService.revokeShareLink(linkId, ctx.user.id, ctx.user.organizationId);
      return true;
    },
  }),

  cleanupExpiredAccess: t.field({
    type: 'JSON',
    resolve: async (_, __, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      if (ctx.user.role !== 'admin') throw new GraphQLError('Admin access required');
      return accessControlService.cleanupExpired(ctx.user.organizationId);
    },
  }),
}));

// ============================================================================
// Phase 33: Advanced DMS Types (Folders, Locks, Blockchain, Expiry, Audit)
// ============================================================================

import { createMaritimeDMS } from '../../services/maritime-dms';
import { documentStorage } from '../../services/document-storage';
import { bulkDocumentOps } from '../../services/bulk-document-operations';
import { advancedDocProcessing } from '../../services/advanced-document-processing';

// Document Folder
const DocumentFolder = builder.objectType('DocumentFolder', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    parentId: t.string({ nullable: true, resolve: (f) => f.parentId }),
    folderPath: t.exposeString('folderPath'),
    folderType: t.exposeString('folderType'),
    entityId: t.string({ nullable: true, resolve: (f) => f.entityId }),
    description: t.string({ nullable: true, resolve: (f) => f.description }),
    permissions: t.stringList({ resolve: (f) => f.permissions || [] }),
    documentCount: t.int({ resolve: () => 0 }), // TODO: Add folderId to Document model
    createdAt: t.field({ type: 'DateTime', resolve: (f) => f.createdAt }),
    updatedAt: t.field({ type: 'DateTime', resolve: (f) => f.updatedAt }),
  }),
});

// Document Lock
const DocumentLock = builder.objectType('DocumentLock', {
  fields: (t) => ({
    id: t.exposeID('id'),
    documentId: t.exposeString('documentId'),
    lockedBy: t.exposeString('lockedBy'),
    lockedByName: t.string({ nullable: true, resolve: (l) => l.lockedByName }),
    lockReason: t.string({ nullable: true, resolve: (l) => l.lockReason }),
    expectedRelease: t.field({ type: 'DateTime', nullable: true, resolve: (l) => l.expectedRelease }),
    lockedAt: t.field({ type: 'DateTime', resolve: (l) => l.lockedAt }),
  }),
});

// Lock Status
const LockStatus = builder.objectType('LockStatus', {
  fields: (t) => ({
    isLocked: t.exposeBoolean('isLocked'),
    lock: t.field({ type: DocumentLock, nullable: true, resolve: (s) => s.lock }),
  }),
});

// Blockchain Proof
const BlockchainProof = builder.objectType('BlockchainProof', {
  fields: (t) => ({
    id: t.exposeID('id'),
    documentId: t.exposeString('documentId'),
    documentHash: t.exposeString('documentHash'),
    blockchainTxId: t.exposeString('blockchainTxId'),
    blockchainNetwork: t.exposeString('blockchainNetwork'),
    verificationUrl: t.string({ nullable: true, resolve: (p) => p.verificationUrl }),
    proofType: t.exposeString('proofType'),
    metadata: t.field({ type: 'JSON', nullable: true, resolve: (p) => p.metadata }),
    eblNumber: t.string({ nullable: true, resolve: (p) => p.eblNumber }),
    eblStandard: t.string({ nullable: true, resolve: (p) => p.eblStandard }),
    createdAt: t.field({ type: 'DateTime', resolve: (p) => p.createdAt }),
  }),
});

// Blockchain Verification
const BlockchainVerification = builder.objectType('BlockchainVerification', {
  fields: (t) => ({
    verified: t.exposeBoolean('verified'),
    proof: t.field({ type: BlockchainProof, nullable: true, resolve: (v) => v.proof }),
    timestamp: t.field({ type: 'DateTime', nullable: true, resolve: (v) => v.timestamp }),
    blockchainTxId: t.string({ nullable: true, resolve: (v) => v.blockchainTxId }),
    verificationUrl: t.string({ nullable: true, resolve: (v) => v.verificationUrl }),
    error: t.string({ nullable: true, resolve: (v) => v.error }),
  }),
});

// Certificate Expiry
const CertificateExpiry = builder.objectType('CertificateExpiry', {
  fields: (t) => ({
    id: t.exposeID('id'),
    documentId: t.exposeString('documentId'),
    certificateType: t.exposeString('certificateType'),
    issuedBy: t.string({ nullable: true, resolve: (c) => c.issuedBy }),
    issueDate: t.field({ type: 'DateTime', nullable: true, resolve: (c) => c.issueDate }),
    expiryDate: t.field({ type: 'DateTime', resolve: (c) => c.expiryDate }),
    renewalDue: t.field({ type: 'DateTime', nullable: true, resolve: (c) => c.renewalDue }),
    vesselId: t.string({ nullable: true, resolve: (c) => c.vesselId }),
    entityType: t.string({ nullable: true, resolve: (c) => c.entityType }),
    entityId: t.string({ nullable: true, resolve: (c) => c.entityId }),
    alertSent30: t.exposeBoolean('alertSent30'),
    alertSent60: t.exposeBoolean('alertSent60'),
    alertSent90: t.exposeBoolean('alertSent90'),
    renewalStatus: t.exposeString('renewalStatus'),
    daysUntilExpiry: t.int({
      resolve: (c: any) => {
        return Math.floor((c.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      },
    }),
    createdAt: t.field({ type: 'DateTime', resolve: (c) => c.createdAt }),
    updatedAt: t.field({ type: 'DateTime', resolve: (c) => c.updatedAt }),
  }),
});

// Document Audit Log
const DocumentAuditLog = builder.objectType('DocumentAuditLog', {
  fields: (t) => ({
    id: t.exposeID('id'),
    documentId: t.exposeString('documentId'),
    action: t.exposeString('action'),
    performedBy: t.exposeString('performedBy'),
    performedByName: t.string({ nullable: true, resolve: (a) => a.performedByName }),
    ipAddress: t.string({ nullable: true, resolve: (a) => a.ipAddress }),
    userAgent: t.string({ nullable: true, resolve: (a) => a.userAgent }),
    changes: t.field({ type: 'JSON', nullable: true, resolve: (a) => a.changes }),
    metadata: t.field({ type: 'JSON', nullable: true, resolve: (a) => a.metadata }),
    createdAt: t.field({ type: 'DateTime', resolve: (a) => a.createdAt }),
  }),
});

// Document With Details
const DocumentWithDetails = builder.objectType('DocumentWithDetails', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    category: t.exposeString('category'),
    subcategory: t.string({ nullable: true, resolve: (d) => d.subcategory }),
    fileName: t.exposeString('fileName'),
    fileSize: t.exposeInt('fileSize'),
    mimeType: t.exposeString('mimeType'),
    entityType: t.string({ nullable: true, resolve: (d) => d.entityType }),
    entityId: t.string({ nullable: true, resolve: (d) => d.entityId }),
    voyageId: t.string({ nullable: true, resolve: (d) => d.voyageId }),
    vesselId: t.string({ nullable: true, resolve: (d) => d.vesselId }),
    tags: t.stringList({ resolve: (d) => d.tags || [] }),
    notes: t.string({ nullable: true, resolve: (d) => d.notes }),
    status: t.exposeString('status'),
    uploadedBy: t.string({ nullable: true, resolve: (d) => d.uploadedBy }),
    createdAt: t.field({ type: 'DateTime', resolve: (d) => d.createdAt }),
    updatedAt: t.field({ type: 'DateTime', resolve: (d) => d.updatedAt }),
    versions: t.field({ type: [DocumentVersion], resolve: (d: any) => d.versions || [] }),
    auditLog: t.field({ type: [DocumentAuditLog], resolve: (d: any) => d.auditLog || [] }),
    lockStatus: t.field({ type: LockStatus, nullable: true, resolve: (d: any) => d.lockStatus }),
    blockchainProof: t.field({ type: BlockchainProof, nullable: true, resolve: (d: any) => d.blockchainProof }),
    certificateExpiry: t.field({ type: CertificateExpiry, nullable: true, resolve: (d: any) => d.certificateExpiry }),
  }),
});

// Input Types
const DocumentUploadInput = builder.inputType('DocumentUploadInput', {
  fields: (t) => ({
    title: t.string({ required: true }),
    category: t.string({ required: true }),
    subcategory: t.string(),
    fileName: t.string({ required: true }),
    fileSize: t.int({ required: true }),
    mimeType: t.string({ required: true }),
    entityType: t.string(),
    entityId: t.string(),
    voyageId: t.string(),
    vesselId: t.string(),
    tags: t.stringList(),
    notes: t.string(),
    folderId: t.string(),
    requireBlockchainProof: t.boolean(),
  }),
});

const DocumentVersionInput = builder.inputType('DocumentVersionInput', {
  fields: (t) => ({
    documentId: t.string({ required: true }),
    fileHash: t.string({ required: true }),
    fileSize: t.int({ required: true }),
    mimeType: t.string({ required: true }),
    storagePath: t.string(),
    changelog: t.string(),
    uploadedBy: t.string({ required: true }),
    uploadedByName: t.string(),
  }),
});

const FolderInput = builder.inputType('FolderInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    parentId: t.string(),
    folderType: t.string({ required: true }),
    entityId: t.string(),
    description: t.string(),
    permissions: t.stringList(),
  }),
});

const CheckOutInput = builder.inputType('CheckOutInput', {
  fields: (t) => ({
    documentId: t.string({ required: true }),
    lockReason: t.string(),
    expectedRelease: t.field({ type: 'DateTime' }),
  }),
});

const BlockchainProofInput = builder.inputType('BlockchainProofInput', {
  fields: (t) => ({
    documentId: t.string({ required: true }),
    documentHash: t.string({ required: true }),
    proofType: t.string(),
    eblNumber: t.string(),
    eblStandard: t.string(),
    metadata: t.field({ type: 'JSON' }),
  }),
});

const CertificateExpiryInput = builder.inputType('CertificateExpiryInput', {
  fields: (t) => ({
    documentId: t.string({ required: true }),
    certificateType: t.string({ required: true }),
    issuedBy: t.string(),
    issueDate: t.field({ type: 'DateTime' }),
    expiryDate: t.field({ type: 'DateTime', required: true }),
    renewalDue: t.field({ type: 'DateTime' }),
    vesselId: t.string(),
    entityType: t.string(),
    entityId: t.string(),
  }),
});

// Queries
builder.queryFields((t) => ({
  getDocumentDetails: t.field({
    type: DocumentWithDetails,
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      const doc = await dms.getDocument(documentId);
      const lockStatus = await dms.getLockStatus(documentId);

      let blockchainProof = null;
      try {
        const verification = await dms.verifyDocument(documentId);
        blockchainProof = verification.proof || null;
      } catch (e) {
        // No proof exists
      }

      let certificateExpiry = null;
      try {
        certificateExpiry = await ctx.prisma.certificateExpiry.findUnique({
          where: { documentId },
        });
      } catch (e) {
        // No certificate tracking
      }

      return {
        ...doc,
        lockStatus,
        blockchainProof,
        certificateExpiry,
      };
    },
  }),

  getFolderTree: t.field({
    type: [DocumentFolder],
    args: {
      parentId: t.arg.string(),
    },
    resolve: async (_, { parentId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      return dms.getFolderTree(parentId);
    },
  }),

  getDocumentLockStatus: t.field({
    type: LockStatus,
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      return dms.getLockStatus(documentId);
    },
  }),

  verifyBlockchainProof: t.field({
    type: BlockchainVerification,
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      return dms.verifyDocument(documentId);
    },
  }),

  getExpiringCertificates: t.field({
    type: [CertificateExpiry],
    args: {
      daysAhead: t.arg.int({ defaultValue: 90 }),
    },
    resolve: async (_, { daysAhead }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      return dms.getExpiringCertificates(daysAhead!);
    },
  }),

  getDocumentAuditTrail: t.field({
    type: [DocumentAuditLog],
    args: {
      documentId: t.arg.string({ required: true }),
      limit: t.arg.int({ defaultValue: 100 }),
    },
    resolve: async (_, { documentId, limit }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      return dms.getAuditTrail(documentId, limit!);
    },
  }),

  getDocumentVersions: t.field({
    type: [DocumentVersion],
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return ctx.prisma.documentVersion.findMany({
        where: {
          documentId,
          organizationId: ctx.user.organizationId,
        },
        orderBy: { versionNumber: 'desc' },
      });
    },
  }),

  // MinIO Integration Queries
  getStorageStats: t.field({
    type: 'JSON',
    resolve: async (_, __, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentStorage.getStorageStats(ctx.user.organizationId);
    },
  }),

  checkMinIOHealth: t.boolean({
    resolve: async () => {
      return documentStorage.healthCheck();
    },
  }),

  // Advanced Document Processing Queries
  getDocumentAnalytics: t.field({
    type: 'JSON',
    args: {
      documentId: t.arg.string({ required: true }),
      days: t.arg.int(),
    },
    resolve: async (_, { documentId, days }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return advancedDocProcessing.getAnalytics(documentId, days || 30);
    },
  }),
}));

// Mutations
builder.mutationFields((t) => ({
  uploadDocumentWithDMS: t.field({
    type: 'JSON',
    args: {
      input: t.arg({ type: DocumentUploadInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      return dms.uploadDocument(input as any, ctx.user.id);
    },
  }),

  createDocumentVersion: t.field({
    type: DocumentVersion,
    args: {
      input: t.arg({ type: DocumentVersionInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      return dms.createVersion(input as any);
    },
  }),

  createDocumentFolder: t.field({
    type: DocumentFolder,
    args: {
      input: t.arg({ type: FolderInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      return dms.createFolder({
        ...(input as any),
        organizationId: ctx.user.organizationId,
      });
    },
  }),

  checkOutDocument: t.field({
    type: DocumentLock,
    args: {
      input: t.arg({ type: CheckOutInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      return dms.checkOutDocument({
        ...(input as any),
        userId: ctx.user.id,
        userName: ctx.user.name,
      });
    },
  }),

  checkInDocument: t.boolean({
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      await dms.checkInDocument(documentId, ctx.user.id);
      return true;
    },
  }),

  createBlockchainProof: t.field({
    type: BlockchainProof,
    args: {
      input: t.arg({ type: BlockchainProofInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      return dms.createBlockchainProof(input as any);
    },
  }),

  trackCertificateExpiry: t.field({
    type: CertificateExpiry,
    args: {
      input: t.arg({ type: CertificateExpiryInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      return dms.trackCertificateExpiry(input as any);
    },
  }),

  updateCertificateStatus: t.field({
    type: CertificateExpiry,
    args: {
      certificateId: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
    },
    resolve: async (_, { certificateId, status }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return ctx.prisma.certificateExpiry.update({
        where: { id: certificateId },
        data: { renewalStatus: status },
      });
    },
  }),

  sendExpiryAlerts: t.field({
    type: 'JSON',
    resolve: async (_, __, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      if (ctx.user.role !== 'admin') throw new GraphQLError('Admin access required');
      const dms = createMaritimeDMS(ctx.user.organizationId);
      return dms.sendExpiryAlerts();
    },
  }),

  // MinIO Integration Mutations
  getDocumentDownloadUrl: t.string({
    args: {
      documentId: t.arg.string({ required: true }),
      versionNumber: t.arg.int(),
      expirySeconds: t.arg.int(),
    },
    resolve: async (_, { documentId, versionNumber, expirySeconds }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return documentStorage.getDownloadUrl(
        documentId,
        versionNumber || undefined,
        expirySeconds || 3600
      );
    },
  }),

  deleteDocumentFromStorage: t.boolean({
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      await documentStorage.deleteDocument(documentId, ctx.user.id);
      return true;
    },
  }),

  deleteDocumentVersion: t.boolean({
    args: {
      documentId: t.arg.string({ required: true }),
      versionNumber: t.arg.int({ required: true }),
    },
    resolve: async (_, { documentId, versionNumber }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      await documentStorage.deleteVersion(documentId, versionNumber, ctx.user.id);
      return true;
    },
  }),

  // Bulk Operations Mutations
  bulkDeleteDocuments: t.field({
    type: 'JSON',
    args: {
      documentIds: t.arg.stringList({ required: true }),
    },
    resolve: async (_, { documentIds }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return bulkDocumentOps.bulkDelete({
        documentIds,
        organizationId: ctx.user.organizationId,
        userId: ctx.user.id,
      });
    },
  }),

  bulkDownloadDocuments: t.field({
    type: 'JSON',
    args: {
      documentIds: t.arg.stringList({ required: true }),
      zipFileName: t.arg.string(),
    },
    resolve: async (_, { documentIds, zipFileName }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return bulkDocumentOps.bulkDownload({
        documentIds,
        organizationId: ctx.user.organizationId,
        zipFileName: zipFileName || undefined,
        userId: ctx.user.id,
      });
    },
  }),

  getBulkJobProgress: t.field({
    type: 'JSON',
    args: {
      jobId: t.arg.string({ required: true }),
      queueName: t.arg.string({ required: true }),
    },
    resolve: async (_, { jobId, queueName }) => {
      return bulkDocumentOps.getJobProgress(jobId, queueName);
    },
  }),

  cancelBulkJob: t.boolean({
    args: {
      jobId: t.arg.string({ required: true }),
      queueName: t.arg.string({ required: true }),
    },
    resolve: async (_, { jobId, queueName }) => {
      await bulkDocumentOps.cancelJob(jobId, queueName);
      return true;
    },
  }),

  // Advanced Document Processing Mutations
  generateThumbnail: t.string({
    args: {
      documentId: t.arg.string({ required: true }),
      width: t.arg.int(),
      height: t.arg.int(),
    },
    resolve: async (_, { documentId, width, height }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return advancedDocProcessing.generateThumbnail({
        documentId,
        width: width || undefined,
        height: height || undefined,
      });
    },
  }),

  generatePreview: t.string({
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return advancedDocProcessing.generatePreview(documentId);
    },
  }),

  addWatermark: t.string({
    args: {
      documentId: t.arg.string({ required: true }),
      watermarkText: t.arg.string({ required: true }),
      opacity: t.arg.float(),
    },
    resolve: async (_, { documentId, watermarkText, opacity }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return advancedDocProcessing.addWatermark({
        documentId,
        watermarkText,
        opacity: opacity || undefined,
        userId: ctx.user.id,
      });
    },
  }),

  extractTextOCR: t.string({
    args: {
      documentId: t.arg.string({ required: true }),
      languages: t.arg.stringList(),
    },
    resolve: async (_, { documentId, languages }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return advancedDocProcessing.extractTextOCR({
        documentId,
        languages: languages || undefined,
      });
    },
  }),

  trackDocumentView: t.boolean({
    args: {
      documentId: t.arg.string({ required: true }),
      metadata: t.arg({ type: 'JSON' }),
    },
    resolve: async (_, { documentId, metadata }, ctx) => {
      await advancedDocProcessing.trackAnalytics({
        documentId,
        eventType: 'view',
        userId: ctx.user?.id,
        metadata: metadata || undefined,
      });
      return true;
    },
  }),

  trackDocumentDownload: t.boolean({
    args: {
      documentId: t.arg.string({ required: true }),
      metadata: t.arg({ type: 'JSON' }),
    },
    resolve: async (_, { documentId, metadata }, ctx) => {
      await advancedDocProcessing.trackAnalytics({
        documentId,
        eventType: 'download',
        userId: ctx.user?.id,
        metadata: metadata || undefined,
      });
      return true;
    },
  }),

  batchGenerateThumbnails: t.field({
    type: 'JSON',
    args: {
      documentIds: t.arg.stringList({ required: true }),
    },
    resolve: async (_, { documentIds }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');
      return advancedDocProcessing.batchGenerateThumbnails(documentIds);
    },
  }),
}));
