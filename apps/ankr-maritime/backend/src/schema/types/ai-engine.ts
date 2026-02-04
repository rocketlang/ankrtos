// ai-engine.ts — AI Engine GraphQL Schema (Phase 8)
// Initial integration - covers all 8 AI services

import { builder } from '../builder.js';
import { GraphQLError } from 'graphql';

// Import AI services
import { emailClassifier, EmailCategory, UrgencyLevel, ActionableType } from '../../services/ai/email-classifier.js';
import { fixtureMatcher } from '../../services/ai/fixture-matcher.js';
import { pricePredictor } from '../../services/ai/price-predictor.js';
import { marketSentiment } from '../../services/ai/market-sentiment.js';
import { nlQueryEngine } from '../../services/ai/nl-query-engine.js';
import { documentParser } from '../../services/ai/document-parser.js';
import { aiDocumentClassifier } from '../../services/ai-document-classifier.js';
import { daIntelligenceService } from '../../services/da-ai-intelligence.js';

// ===== Enums =====

const EmailCategoryEnum = builder.enumType('EmailCategory', {
  values: Object.values(EmailCategory) as [string, ...string[]],
});

const UrgencyLevelEnum = builder.enumType('UrgencyLevel', {
  values: Object.values(UrgencyLevel) as [string, ...string[]],
});

const ActionableTypeEnum = builder.enumType('ActionableType', {
  values: Object.values(ActionableType) as [string, ...string[]],
});

// ===== Queries =====

builder.queryFields((t) => ({
  // Email Classification
  classifyEmail: t.field({
    type: 'JSON',
    args: {
      subject: t.arg.string({ required: true }),
      body: t.arg.string({ required: true }),
      sender: t.arg.string({ required: false }),
    },
    resolve: async (_, { subject, body, sender }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');

      try {
        const result = await emailClassifier.classifyEmail(
          subject,
          body,
          sender || '',
          ctx.user.organizationId
        );
        return result;
      } catch (error: any) {
        throw new GraphQLError(`Email classification failed: ${error.message}`);
      }
    },
  }),

  // Fixture Matching
  findMatchingVessels: t.field({
    type: 'JSON',
    args: {
      cargoType: t.arg.string({ required: true }),
      quantity: t.arg.float({ required: true }),
      loadPort: t.arg.string({ required: true }),
      dischargePort: t.arg.string({ required: true }),
      laycanFrom: t.arg.string({ required: true }),
      laycanTo: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');

      try {
        const matches = await fixtureMatcher.findMatches({
          ...args,
          organizationId: ctx.user.organizationId,
          laycanFrom: new Date(args.laycanFrom),
          laycanTo: new Date(args.laycanTo),
        } as any);
        return matches;
      } catch (error: any) {
        throw new GraphQLError(`Fixture matching failed: ${error.message}`);
      }
    },
  }),

  // AI Price Prediction
  predictPrice: t.field({
    type: 'JSON',
    args: {
      predictionType: t.arg.string({ required: true }), // freight_rate, bunker_price, vessel_value
      context: t.arg({ type: 'JSON', required: true }),
    },
    resolve: async (_, { predictionType, context }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');

      try {
        const prediction = await pricePredictor.predictRate({
          type: predictionType,
          ...(context as object),
          organizationId: ctx.user.organizationId,
        } as any);
        return prediction;
      } catch (error: any) {
        throw new GraphQLError(`Price prediction failed: ${error.message}`);
      }
    },
  }),

  // Market Sentiment Analysis
  getMarketSentiment: t.field({
    type: 'JSON',
    args: {
      sector: t.arg.string({ required: true }),
      timeRange: t.arg.string({ required: false }),
    },
    resolve: async (_, { sector, timeRange }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');

      try {
        const sentiment = await marketSentiment.analyzeMarketSentiment({
          cargoType: sector,
        }, timeRange || 'monthly');
        return sentiment;
      } catch (error: any) {
        throw new GraphQLError(`Sentiment analysis failed: ${error.message}`);
      }
    },
  }),

  // Natural Language Query
  queryWithNaturalLanguage: t.field({
    type: 'JSON',
    args: {
      query: t.arg.string({ required: true }),
    },
    resolve: async (_, { query }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');

      try {
        const result = await nlQueryEngine.processQuery(
          query,
          ctx.user.organizationId,
          ctx.user.id
        );
        return result;
      } catch (error: any) {
        throw new GraphQLError(`NL query failed: ${error.message}`);
      }
    },
  }),

  // Document Parsing
  parseDocument: t.field({
    type: 'JSON',
    args: {
      documentUrl: t.arg.string({ required: true }),
      documentType: t.arg.string({ required: false }),
    },
    resolve: async (_, { documentUrl, documentType }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');

      try {
        // Note: documentParser expects content string, not URL
        // In production, fetch document content from storage first
        const parsed = await documentParser.parseDocument(
          documentUrl, // Placeholder - should fetch actual content
          documentType || undefined,
          documentType ? 'application/pdf' : undefined
        );
        return parsed;
      } catch (error: any) {
        throw new GraphQLError(`Document parsing failed: ${error.message}`);
      }
    },
  }),

  // AI Document Classification
  classifyDocumentType: t.field({
    type: 'JSON',
    args: {
      documentId: t.arg.string({ required: true }),
    },
    resolve: async (_, { documentId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');

      try {
        // Get document from database
        const document = await ctx.prisma.document.findUnique({
          where: { id: documentId },
          select: { fileName: true },
        });

        if (!document) {
          throw new Error('Document not found');
        }

        const classification = await aiDocumentClassifier.classifyDocument(
          document.fileName,
          undefined, // extractedText - would need to fetch from storage
          undefined  // metadata
        );
        return classification;
      } catch (error: any) {
        throw new GraphQLError(`Document classification failed: ${error.message}`);
      }
    },
  }),

  // DA Desk AI Intelligence
  getDAIntelligence: t.field({
    type: 'JSON',
    args: {
      portCallId: t.arg.string({ required: true }),
    },
    resolve: async (_, { portCallId }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');

      try {
        // Find DA for this port call
        const portCall = await ctx.prisma.voyagePortCall.findUnique({
          where: { id: portCallId },
          select: { id: true },
        });

        if (!portCall) {
          throw new Error('Port call not found');
        }

        // Note: detectAnomalies expects daId - need to find or create DA first
        // For now, return placeholder
        return {
          anomalies: [],
          portCallId,
          note: 'DA intelligence requires DA creation workflow',
        };
      } catch (error: any) {
        throw new GraphQLError(`DA intelligence analysis failed: ${error.message}`);
      }
    },
  }),
}));

// ===== Mutations =====

builder.mutationFields((t) => ({
  // Save Email Classification
  saveEmailClassification: t.field({
    type: 'Boolean',
    args: {
      emailId: t.arg.string({ required: true }),
      classification: t.arg({ type: 'JSON', required: true }),
    },
    resolve: async (_, { emailId, classification }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');

      try {
        await emailClassifier.saveClassification(
          emailId,
          classification as any,
          ctx.user.organizationId
        );
        return true;
      } catch (error: any) {
        throw new GraphQLError(`Failed to save classification: ${error.message}`);
      }
    },
  }),

  // Batch Classify Emails
  classifyEmailBatch: t.field({
    type: 'JSON',
    args: {
      emailIds: t.arg.stringList({ required: true }),
    },
    resolve: async (_, { emailIds }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');

      try {
        // Fetch emails from database
        const emails = await ctx.prisma.emailMessage.findMany({
          where: { id: { in: emailIds as string[] } },
          select: { id: true, subject: true, bodyText: true, fromAddress: true },
        });

        const emailData = emails.map(e => ({
          id: e.id,
          subject: e.subject,
          body: e.bodyText || '',
          fromEmail: e.fromAddress,
        }));

        const results = await emailClassifier.classifyBatch(
          emailData,
          ctx.user.organizationId
        );

        // Convert Map to object for JSON return
        return Object.fromEntries(results);
      } catch (error: any) {
        throw new GraphQLError(`Batch classification failed: ${error.message}`);
      }
    },
  }),

  // Batch Predict Prices
  predictPriceBatch: t.field({
    type: 'JSON',
    args: {
      predictions: t.arg({ type: ['JSON'], required: true }),
    },
    resolve: async (_, { predictions }, ctx) => {
      if (!ctx.user) throw new GraphQLError('Not authenticated');

      try {
        const results = await pricePredictor.predictBatch(predictions as any);
        return results;
      } catch (error: any) {
        throw new GraphQLError(`Batch prediction failed: ${error.message}`);
      }
    },
  }),
}));
