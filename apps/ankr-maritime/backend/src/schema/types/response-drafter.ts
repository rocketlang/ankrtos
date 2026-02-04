/**
 * AI Response Drafter GraphQL API
 * Generate AI-powered email responses
 *
 * @package @ankr/email-organizer
 * @version 1.0.0
 */

import { builder } from '../builder.js';
import { Context } from '../context.js';
import { responseDrafterService, ResponseStyle } from '../../services/email-organizer/response-drafter.service.js';

// ============================================================================
// Enums
// ============================================================================

const ResponseStyleEnum = builder.enumType('ResponseStyle', {
  values: [
    'acknowledge',
    'query_reply',
    'formal',
    'concise',
    'friendly',
    'follow_up',
    'rejection_polite',
    'acceptance',
    'auto_reply',
  ] as const,
});

// ============================================================================
// Object Types
// ============================================================================

const ResponseDraftType = builder.objectRef<any>('ResponseDraft').implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    subject: t.exposeString('subject'),
    body: t.exposeString('body'),
    style: t.field({ type: ResponseStyleEnum, resolve: (parent) => parent.style }),
    confidence: t.exposeFloat('confidence'),
    contextUsed: t.field({
      type: 'JSON',
      resolve: (parent) => parent.contextUsed,
    }),
    suggestedEdits: t.stringList({
      nullable: true,
      resolve: (parent) => parent.suggestedEdits || null,
    }),
    generatedAt: t.expose('generatedAt', { type: 'DateTime' }),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const OriginalEmailInput = builder.inputType('OriginalEmailInput', {
  fields: (t) => ({
    subject: t.string({ required: true }),
    body: t.string({ required: true }),
    from: t.string({ required: true }),
    to: t.stringList({ required: true }),
    category: t.string(),
    urgency: t.string(),
    entities: t.field({ type: 'JSON' }),
  }),
});

const ThreadMessageInput = builder.inputType('ThreadMessageInput', {
  fields: (t) => ({
    subject: t.string({ required: true }),
    body: t.string({ required: true }),
    from: t.string({ required: true }),
    timestamp: t.string({ required: true }),
  }),
});

const RelevantDocumentInput = builder.inputType('RelevantDocumentInput', {
  fields: (t) => ({
    title: t.string({ required: true }),
    content: t.string({ required: true }),
    source: t.string({ required: true }),
  }),
});

const ResponseContextInput = builder.inputType('ResponseContextInput', {
  fields: (t) => ({
    originalEmail: t.field({ type: OriginalEmailInput, required: true }),
    threadHistory: t.field({ type: [ThreadMessageInput] }),
    relevantDocuments: t.field({ type: [RelevantDocumentInput] }),
    companyKnowledge: t.stringList(),
  }),
});

const UpdateDraftInput = builder.inputType('UpdateDraftInput', {
  fields: (t) => ({
    subject: t.string(),
    body: t.string(),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('responseDraft', (t) =>
  t.field({
    type: ResponseDraftType,
    nullable: true,
    description: 'Get a saved response draft',
    args: {
      draftId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');
      return await responseDrafterService.getDraft(args.draftId, ctx.userId);
    },
  })
);

builder.queryField('responseDraftsForEmail', (t) =>
  t.field({
    type: [ResponseDraftType],
    description: 'Get all drafts for an email',
    args: {
      emailId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');
      return await responseDrafterService.getDraftsForEmail(args.emailId, ctx.userId);
    },
  })
);

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField('generateEmailResponse', (t) =>
  t.field({
    type: ResponseDraftType,
    description: 'Generate AI-powered email response',
    args: {
      context: t.arg({ type: ResponseContextInput, required: true }),
      style: t.arg({ type: ResponseStyleEnum, required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId || !ctx.organizationId) {
        throw new Error('Not authenticated');
      }

      return await responseDrafterService.generateResponse(
        {
          originalEmail: args.context.originalEmail,
          threadHistory: args.context.threadHistory || undefined,
          relevantDocuments: args.context.relevantDocuments || undefined,
          companyKnowledge: args.context.companyKnowledge || undefined,
        },
        args.style as ResponseStyle,
        ctx.userId,
        ctx.organizationId
      );
    },
  })
);

builder.mutationField('updateResponseDraft', (t) =>
  t.boolean({
    description: 'Update a response draft (tracks edits for ML)',
    args: {
      draftId: t.arg.string({ required: true }),
      updates: t.arg({ type: UpdateDraftInput, required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      await responseDrafterService.updateDraft(args.draftId, ctx.userId, {
        subject: args.updates.subject || undefined,
        body: args.updates.body || undefined,
      });

      return true;
    },
  })
);

builder.mutationField('markDraftAsSent', (t) =>
  t.boolean({
    description: 'Mark a draft as sent',
    args: {
      draftId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      await responseDrafterService.markDraftAsSent(args.draftId, ctx.userId);
      return true;
    },
  })
);
