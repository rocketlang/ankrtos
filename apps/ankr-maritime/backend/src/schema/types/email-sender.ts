/**
 * Email Sender GraphQL API
 * Send AI-generated responses via SMTP
 *
 * @package @ankr/email-assistant
 * @version 1.0.0
 */

import { builder } from '../builder.js';
import { Context } from '../context.js';
import { emailSenderService } from '../../services/email-organizer/email-sender.service.js';

// ============================================================================
// Object Types
// ============================================================================

const SendResultType = builder.objectRef<any>('SendResult').implement({
  fields: (t) => ({
    success: t.exposeBoolean('success'),
    messageId: t.exposeString('messageId', { nullable: true }),
    error: t.exposeString('error', { nullable: true }),
    sentAt: t.expose('sentAt', { type: 'DateTime' }),
  }),
});

const EmailSentLogType = builder.objectRef<any>('EmailSentLog').implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    to: t.stringList({ resolve: (parent) => parent.to }),
    subject: t.exposeString('subject'),
    success: t.exposeBoolean('success'),
    error: t.exposeString('error', { nullable: true }),
    sentAt: t.expose('sentAt', { type: 'DateTime' }),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const EmailAttachmentInput = builder.inputType('EmailAttachmentInput', {
  fields: (t) => ({
    filename: t.string({ required: true }),
    content: t.string({ required: true }), // Base64 encoded
    contentType: t.string(),
  }),
});

const SendEmailInput = builder.inputType('SendEmailInput', {
  fields: (t) => ({
    to: t.stringList({ required: true }),
    cc: t.stringList(),
    bcc: t.stringList(),
    subject: t.string({ required: true }),
    body: t.string({ required: true }),
    html: t.string(),
    attachments: t.field({ type: [EmailAttachmentInput] }),
    replyTo: t.string(),
    inReplyTo: t.string(),
    references: t.stringList(),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('emailSentLogs', (t) =>
  t.field({
    type: [EmailSentLogType],
    description: 'Get sent email logs for current user',
    args: {
      limit: t.arg.int({ defaultValue: 50 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      return await ctx.prisma.emailSentLog.findMany({
        where: { userId: ctx.userId },
        orderBy: { sentAt: 'desc' },
        take: args.limit,
        skip: args.offset,
      });
    },
  })
);

builder.queryField('testSMTPConnection', (t) =>
  t.field({
    type: 'Boolean',
    description: 'Test SMTP connection (admin only)',
    resolve: async (_root, _args, ctx: Context) => {
      if (!ctx.userId || ctx.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const result = await emailSenderService.testConnection();
      return result.success;
    },
  })
);

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField('sendEmail', (t) =>
  t.field({
    type: SendResultType,
    description: 'Send email via SMTP',
    args: {
      input: t.arg({ type: SendEmailInput, required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      // Decode base64 attachments if present
      const attachments = args.input.attachments?.map((att) => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.contentType,
      }));

      const result = await emailSenderService.sendEmail(
        {
          to: args.input.to,
          cc: args.input.cc || undefined,
          bcc: args.input.bcc || undefined,
          subject: args.input.subject,
          body: args.input.body,
          html: args.input.html || undefined,
          attachments,
          replyTo: args.input.replyTo || undefined,
          inReplyTo: args.input.inReplyTo || undefined,
          references: args.input.references || undefined,
        },
        ctx.userId
      );

      return result;
    },
  })
);

builder.mutationField('sendAIResponse', (t) =>
  t.field({
    type: SendResultType,
    description: 'Send AI-generated response via SMTP',
    args: {
      draftId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId || !ctx.organizationId) {
        throw new Error('Not authenticated');
      }

      const result = await emailSenderService.sendAIResponse(
        args.draftId,
        ctx.userId,
        ctx.organizationId
      );

      return result;
    },
  })
);

builder.mutationField('sendTestEmail', (t) =>
  t.field({
    type: SendResultType,
    description: 'Send test email to verify SMTP configuration',
    args: {
      to: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      const result = await emailSenderService.sendTestEmail(args.to, ctx.userId);

      return result;
    },
  })
);

builder.mutationField('sendNotification', (t) =>
  t.field({
    type: SendResultType,
    description: 'Send notification email',
    args: {
      to: t.arg.stringList({ required: true }),
      subject: t.arg.string({ required: true }),
      body: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      const result = await emailSenderService.sendNotification(
        args.to,
        args.subject,
        args.body,
        ctx.userId
      );

      return result;
    },
  })
);
