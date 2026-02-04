/**
 * AI Document Classification GraphQL Schema
 * Phase 33: Task #69 - AI Document Classification & Tagging
 */

import { builder } from '../builder.js';
import { aiDocumentClassifier } from '../../services/ai-document-classifier.js';
import { prisma } from '../../lib/prisma.js';

// Object Types
const ExtractedEntities = builder.objectRef<{
  vessels: string[];
  ports: string[];
  companies: string[];
  dates: string[];
  amounts: string[];
}>('ExtractedEntities');

ExtractedEntities.implement({
  fields: (t) => ({
    vessels: t.exposeStringList('vessels'),
    ports: t.exposeStringList('ports'),
    companies: t.exposeStringList('companies'),
    dates: t.exposeStringList('dates'),
    amounts: t.exposeStringList('amounts'),
  }),
});

const ClassificationResult = builder.objectRef<{
  category: string;
  subcategory: string | null;
  confidence: number;
  suggestedTags: string[];
  suggestedFolderPath: string[];
  extractedEntities: {
    vessels: string[];
    ports: string[];
    companies: string[];
    dates: string[];
    amounts: string[];
  };
}>('ClassificationResult');

ClassificationResult.implement({
  fields: (t) => ({
    category: t.exposeString('category'),
    subcategory: t.exposeString('subcategory', { nullable: true }),
    confidence: t.exposeFloat('confidence'),
    suggestedTags: t.exposeStringList('suggestedTags'),
    suggestedFolderPath: t.exposeStringList('suggestedFolderPath'),
    extractedEntities: t.field({
      type: ExtractedEntities,
      resolve: (parent) => parent.extractedEntities,
    }),
  }),
});

const DuplicateDetectionResult = builder.objectRef<{
  isDuplicate: boolean;
  duplicateOf?: string;
  similarity?: number;
  reason: string;
}>('DuplicateDetectionResult');

DuplicateDetectionResult.implement({
  fields: (t) => ({
    isDuplicate: t.exposeBoolean('isDuplicate'),
    duplicateOf: t.exposeString('duplicateOf', { nullable: true }),
    similarity: t.exposeFloat('similarity', { nullable: true }),
    reason: t.exposeString('reason'),
  }),
});

const RelatedDocument = builder.objectRef<{
  documentId: string;
  title: string;
  similarity: number;
  reason: string;
}>('RelatedDocument');

RelatedDocument.implement({
  fields: (t) => ({
    documentId: t.exposeID('documentId'),
    title: t.exposeString('title'),
    similarity: t.exposeFloat('similarity'),
    reason: t.exposeString('reason'),
    // Resolve full document
    document: t.field({
      type: 'Document',
      nullable: true,
      resolve: async (parent, _args, ctx) => {
        return await ctx.prisma.document.findUnique({
          where: { id: parent.documentId },
        });
      },
    }),
  }),
});

const BatchClassificationResult = builder.objectRef<{
  processed: number;
  classified: number;
  errors: number;
}>('BatchClassificationResult');

BatchClassificationResult.implement({
  fields: (t) => ({
    processed: t.exposeInt('processed'),
    classified: t.exposeInt('classified'),
    errors: t.exposeInt('errors'),
  }),
});

// Input Types
const ClassifyDocumentInput = builder.inputType('ClassifyDocumentInput', {
  fields: (t) => ({
    fileName: t.string({ required: true }),
    extractedText: t.string(),
    metadata: t.field({ type: 'JSON' }),
  }),
});

// Queries
builder.queryFields((t) => ({
  /**
   * Classify a document (without creating it)
   */
  classifyDocument: t.field({
    type: ClassificationResult,
    args: {
      input: t.arg({ type: ClassifyDocumentInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const result = await aiDocumentClassifier.classifyDocument(
        input.fileName,
        input.extractedText,
        input.metadata as Record<string, any> | undefined
      );

      return result;
    },
  }),

  /**
   * Check if document is duplicate
   */
  checkDuplicateDocument: t.field({
    type: DuplicateDetectionResult,
    args: {
      fileHash: t.arg.string({ required: true }),
      fileName: t.arg.string({ required: true }),
    },
    resolve: async (_root, { fileHash, fileName }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const result = await aiDocumentClassifier.detectDuplicate(
        fileHash,
        fileName,
        ctx.user.organizationId
      );

      return result;
    },
  }),

  /**
   * Find related documents
   */
  findRelatedDocuments: t.field({
    type: [RelatedDocument],
    args: {
      documentId: t.arg.string({ required: true }),
      limit: t.arg.int({ defaultValue: 5 }),
    },
    resolve: async (_root, { documentId, limit }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      // Get document
      const document = await ctx.prisma.document.findUnique({
        where: {
          id: documentId,
          organizationId: ctx.user.organizationId,
        },
        select: {
          category: true,
          metadata: true,
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Extract entities from metadata
      const classification = (document.metadata as any)?.classification;
      const entities = classification?.extractedEntities || {
        vessels: [],
        ports: [],
        companies: [],
        dates: [],
        amounts: [],
      };

      const related = await aiDocumentClassifier.findRelatedDocuments(
        documentId,
        document.category,
        entities,
        ctx.user.organizationId,
        limit
      );

      return related;
    },
  }),

  /**
   * Get AI classification suggestions for existing document
   */
  getDocumentClassificationSuggestions: t.field({
    type: ClassificationResult,
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { documentId }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const document = await ctx.prisma.document.findUnique({
        where: {
          id: documentId,
          organizationId: ctx.user.organizationId,
        },
        select: {
          fileName: true,
          notes: true,
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // TODO: Extract text from document file (OCR, PDF parsing, etc.)
      const extractedText = document.notes || undefined;

      const result = await aiDocumentClassifier.classifyDocument(
        document.fileName,
        extractedText
      );

      return result;
    },
  }),
}));

// Mutations
builder.mutationFields((t) => ({
  /**
   * Apply AI classification to a document
   */
  applyAIClassification: t.field({
    type: 'Document',
    args: {
      documentId: t.arg.string({ required: true }),
      applyTags: t.arg.boolean({ defaultValue: true }),
      applyCategory: t.arg.boolean({ defaultValue: true }),
      applyFolder: t.arg.boolean({ defaultValue: false }),
    },
    resolve: async (_root, { documentId, applyTags, applyCategory, applyFolder }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const document = await ctx.prisma.document.findUnique({
        where: {
          id: documentId,
          organizationId: ctx.user.organizationId,
        },
        select: {
          fileName: true,
          notes: true,
          category: true,
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Classify
      const classification = await aiDocumentClassifier.classifyDocument(
        document.fileName,
        document.notes || undefined
      );

      // Only apply if confidence is high enough
      if (classification.confidence < 0.5) {
        throw new Error(
          `Classification confidence too low (${Math.round(classification.confidence * 100)}%). Minimum 50% required.`
        );
      }

      // Build update data
      const updateData: any = {
        metadata: {
          classification: {
            confidence: classification.confidence,
            extractedEntities: classification.extractedEntities,
            suggestedTags: classification.suggestedTags,
            suggestedFolderPath: classification.suggestedFolderPath,
            classifiedAt: new Date().toISOString(),
          },
        },
      };

      if (applyCategory) {
        updateData.category = classification.category;
        updateData.subcategory = classification.subcategory;
      }

      if (applyTags) {
        updateData.tags = { set: classification.suggestedTags };
      }

      if (applyFolder) {
        // TODO: Create or find folder based on suggestedFolderPath
        // For now, we'll skip this
      }

      // Update document
      const updatedDocument = await ctx.prisma.document.update({
        where: { id: documentId },
        data: updateData,
      });

      return updatedDocument;
    },
  }),

  /**
   * Batch classify documents
   */
  batchClassifyDocuments: t.field({
    type: BatchClassificationResult,
    args: {
      limit: t.arg.int({ defaultValue: 100 }),
    },
    resolve: async (_root, { limit }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');
      if (ctx.user.role !== 'admin') {
        throw new Error('Admin access required for batch operations');
      }

      const result = await aiDocumentClassifier.batchClassify(ctx.user.organizationId, limit);

      return result;
    },
  }),

  /**
   * Reclassify document (force re-classification)
   */
  reclassifyDocument: t.field({
    type: 'Document',
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, { documentId }, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');

      const document = await ctx.prisma.document.findUnique({
        where: {
          id: documentId,
          organizationId: ctx.user.organizationId,
        },
        select: {
          fileName: true,
          notes: true,
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Classify
      const classification = await aiDocumentClassifier.classifyDocument(
        document.fileName,
        document.notes || undefined
      );

      // Update document
      const updatedDocument = await ctx.prisma.document.update({
        where: { id: documentId },
        data: {
          category: classification.category,
          subcategory: classification.subcategory,
          tags: { set: classification.suggestedTags },
          metadata: {
            classification: {
              confidence: classification.confidence,
              extractedEntities: classification.extractedEntities,
              classifiedAt: new Date().toISOString(),
            },
          },
        },
      });

      return updatedDocument;
    },
  }),
}));
