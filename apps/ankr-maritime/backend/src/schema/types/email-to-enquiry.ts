/**
 * Email-to-Enquiry GraphQL Schema
 * Auto-create cargo enquiries from emails
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { builder } from '../builder.js';
import { Context } from '../context.js';
import { emailToEnquiryService } from '../../services/chartering/email-to-enquiry.service.js';

// ============================================================================
// Object Types
// ============================================================================

const ExtractedEnquiryType = builder.objectRef<any>('ExtractedEnquiry').implement({
  fields: (t) => ({
    cargoType: t.exposeString('cargoType'),
    commodity: t.exposeString('commodity', { nullable: true }),
    quantity: t.exposeFloat('quantity', { nullable: true }),
    quantityUnit: t.exposeString('quantityUnit', { nullable: true }),
    loadPort: t.exposeString('loadPort', { nullable: true }),
    dischargePort: t.exposeString('dischargePort', { nullable: true }),
    laycanStart: t.expose('laycanStart', { type: 'DateTime', nullable: true }),
    laycanEnd: t.expose('laycanEnd', { type: 'DateTime', nullable: true }),
    confidence: t.exposeFloat('confidence'),
  }),
});

const EnquiryCreationResultType = builder.objectRef<any>('EnquiryCreationResult').implement({
  fields: (t) => ({
    success: t.exposeBoolean('success'),
    enquiryId: t.exposeString('enquiryId', { nullable: true }),
    extracted: t.field({ type: ExtractedEnquiryType, resolve: (parent) => parent.extracted }),
    isAutoCreated: t.exposeBoolean('isAutoCreated'),
    needsReview: t.exposeBoolean('needsReview'),
    confidence: t.exposeFloat('confidence'),
    error: t.exposeString('error', { nullable: true }),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const ProcessEmailToEnquiryInput = builder.inputType('ProcessEmailToEnquiryInput', {
  fields: (t) => ({
    emailId: t.string({ required: true }),
    threadId: t.string({ required: true }),
    from: t.string({ required: true }),
    subject: t.string({ required: true }),
    body: t.string({ required: true }),
    receivedAt: t.field({ type: 'DateTime', required: true }),
  }),
});

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField('processEmailToEnquiry', (t) =>
  t.field({
    type: EnquiryCreationResultType,
    description: 'Process email and auto-create cargo enquiry if detected',
    args: {
      input: t.arg({ type: ProcessEmailToEnquiryInput, required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId || !ctx.organizationId) {
        throw new Error('Authentication required');
      }

      return await emailToEnquiryService.processEmail(
        {
          emailId: args.input.emailId,
          threadId: args.input.threadId,
          from: args.input.from,
          subject: args.input.subject,
          body: args.input.body,
          receivedAt: args.input.receivedAt,
        },
        ctx.userId,
        ctx.organizationId
      );
    },
  })
);

builder.mutationField('reviewAutoEnquiry', (t) =>
  t.boolean({
    description: 'Review and confirm/reject auto-created enquiry',
    args: {
      enquiryId: t.arg.string({ required: true }),
      confirmed: t.arg.boolean({ required: true }),
      updates: t.arg({ type: 'JSON', required: false }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) {
        throw new Error('Authentication required');
      }

      await emailToEnquiryService.reviewEnquiry(
        args.enquiryId,
        args.confirmed,
        args.updates || undefined
      );

      return true;
    },
  })
);

// ============================================================================
// Queries
// ============================================================================

builder.queryField('pendingEnquiryReviews', (t) =>
  t.field({
    type: ['CargoEnquiry'],
    description: 'Get cargo enquiries that need review',
    resolve: async (_root, _args, ctx: Context) => {
      if (!ctx.userId || !ctx.organizationId) {
        throw new Error('Authentication required');
      }

      return await ctx.prisma.cargoEnquiry.findMany({
        where: {
          organizationId: ctx.organizationId,
          needsReview: true,
          status: 'pending_review',
        },
        orderBy: { receivedAt: 'desc' },
        take: 50,
      });
    },
  })
);
