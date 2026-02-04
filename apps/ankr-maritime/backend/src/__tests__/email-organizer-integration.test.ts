/**
 * Email Organizer Integration Tests
 * End-to-end testing for Phase 4 & 5
 *
 * @package @ankr/email-organizer
 * @version 1.0.0
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { folderService } from '../services/email-organizer/folder.service';
import { threadingService } from '../services/email-organizer/threading.service';
import { emailSummaryService } from '../services/email-organizer/summary.service';
import { responseDrafterService } from '../services/email-organizer/response-drafter.service';
import { contextRetrievalService } from '../services/email-organizer/context-retrieval.service';

const prisma = new PrismaClient();

// Test data
const TEST_USER_ID = 'test-user-123';
const TEST_ORG_ID = 'test-org-123';
const TEST_EMAIL_ID = 'test-email-123';

describe('Email Organizer Integration Tests', () => {
  beforeAll(async () => {
    // Create test organization
    await prisma.organization.upsert({
      where: { id: TEST_ORG_ID },
      update: {},
      create: {
        id: TEST_ORG_ID,
        name: 'Test Maritime Corp',
        industry: 'maritime',
      },
    });

    // Create test user
    await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: {},
      create: {
        id: TEST_USER_ID,
        email: 'test@mari8x.com',
        name: 'Test Agent',
        organizationId: TEST_ORG_ID,
        role: 'port_agent',
        emailSignature: '\n\nBest regards,\nTest Agent\nMari8X Port Agency',
        preferredTone: 'professional',
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.responseDraft.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.responseEdit.deleteMany({});
    await prisma.emailThread.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.emailFolder.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.user.delete({ where: { id: TEST_USER_ID } }).catch(() => {});
    await prisma.organization.delete({ where: { id: TEST_ORG_ID } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('Phase 4: Email Organizer', () => {
    describe('Folder Management', () => {
      it('should initialize system folders on first use', async () => {
        const folders = await folderService.initializeSystemFolders(TEST_USER_ID, TEST_ORG_ID);

        expect(folders).toHaveLength(6);
        expect(folders.map((f) => f.name)).toEqual([
          'Inbox',
          'Sent',
          'Drafts',
          'Archive',
          'Spam',
          'Trash',
        ]);

        // Verify all folders have correct type
        folders.forEach((folder) => {
          expect(folder.type).toBe('system');
          expect(folder.userId).toBe(TEST_USER_ID);
          expect(folder.organizationId).toBe(TEST_ORG_ID);
        });
      });

      it('should create custom folder', async () => {
        const folder = await folderService.createFolder(
          TEST_USER_ID,
          TEST_ORG_ID,
          'Important Clients',
          'custom',
          undefined,
          'Star',
          '#FFD700'
        );

        expect(folder.name).toBe('Important Clients');
        expect(folder.type).toBe('custom');
        expect(folder.icon).toBe('Star');
        expect(folder.color).toBe('#FFD700');
      });

      it('should create nested folder hierarchy', async () => {
        const parent = await folderService.createFolder(
          TEST_USER_ID,
          TEST_ORG_ID,
          'Projects',
          'custom'
        );

        const child = await folderService.createFolder(
          TEST_USER_ID,
          TEST_ORG_ID,
          'Project Alpha',
          'custom',
          parent.id
        );

        expect(child.parentId).toBe(parent.id);

        // Get folder tree
        const tree = await folderService.getFolderTree(TEST_USER_ID, TEST_ORG_ID);
        const projectsFolder = tree.find((f) => f.name === 'Projects');

        expect(projectsFolder).toBeDefined();
        expect(projectsFolder?.children).toHaveLength(1);
        expect(projectsFolder?.children[0].name).toBe('Project Alpha');
      });

      it('should prevent circular references in folder hierarchy', async () => {
        const folder1 = await folderService.createFolder(
          TEST_USER_ID,
          TEST_ORG_ID,
          'Folder 1',
          'custom'
        );

        const folder2 = await folderService.createFolder(
          TEST_USER_ID,
          TEST_ORG_ID,
          'Folder 2',
          'custom',
          folder1.id
        );

        // Try to make folder1 a child of folder2 (circular)
        await expect(
          folderService.updateFolder(TEST_USER_ID, folder1.id, {
            parentId: folder2.id,
          })
        ).rejects.toThrow('Circular reference');
      });
    });

    describe('Smart Email Threading', () => {
      it('should create new thread for first email', async () => {
        const threadId = await threadingService.findOrCreateThread(
          {
            messageId: '<msg1@example.com>',
            subject: 'Vessel Inquiry - MV OCEAN SPIRIT',
            from: 'customer@example.com',
            to: ['agent@mari8x.com'],
            inReplyTo: null,
            references: null,
            receivedAt: new Date(),
            body: 'Test email body',
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        expect(threadId).toBeDefined();

        const thread = await prisma.emailThread.findUnique({
          where: { id: threadId },
        });

        expect(thread?.subject).toBe('Vessel Inquiry - MV OCEAN SPIRIT');
        expect(thread?.normalizedSubject).toBe('vessel inquiry mv ocean spirit');
        expect(thread?.messageCount).toBe(1);
      });

      it('should group emails by In-Reply-To header', async () => {
        const threadId1 = await threadingService.findOrCreateThread(
          {
            messageId: '<original@example.com>',
            subject: 'Port Documentation',
            from: 'customer@example.com',
            to: ['agent@mari8x.com'],
            inReplyTo: null,
            references: null,
            receivedAt: new Date(),
            body: 'Original message',
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        const threadId2 = await threadingService.findOrCreateThread(
          {
            messageId: '<reply@example.com>',
            subject: 'Re: Port Documentation',
            from: 'agent@mari8x.com',
            to: ['customer@example.com'],
            inReplyTo: '<original@example.com>',
            references: '<original@example.com>',
            receivedAt: new Date(),
            body: 'Reply message',
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        expect(threadId1).toBe(threadId2);

        const thread = await prisma.emailThread.findUnique({
          where: { id: threadId1 },
        });

        expect(thread?.messageCount).toBe(2);
      });

      it('should group emails by subject + participants', async () => {
        const threadId1 = await threadingService.findOrCreateThread(
          {
            messageId: '<msg-a@example.com>',
            subject: 'Freight Quote Request',
            from: 'broker@example.com',
            to: ['agent@mari8x.com'],
            inReplyTo: null,
            references: null,
            receivedAt: new Date(),
            body: 'Quote request',
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        const threadId2 = await threadingService.findOrCreateThread(
          {
            messageId: '<msg-b@example.com>',
            subject: 'Re: Freight Quote Request',
            from: 'agent@mari8x.com',
            to: ['broker@example.com'],
            inReplyTo: null, // No In-Reply-To header
            references: null,
            receivedAt: new Date(Date.now() + 3600000), // 1 hour later
            body: 'Quote response',
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        expect(threadId1).toBe(threadId2);
      });

      it('should normalize subject for threading', async () => {
        const subjects = [
          'Important Meeting',
          'Re: Important Meeting',
          'RE: Important Meeting',
          'Fwd: Important Meeting',
          'FW: Re: Important Meeting',
        ];

        const threadIds = await Promise.all(
          subjects.map((subject, i) =>
            threadingService.findOrCreateThread(
              {
                messageId: `<test-${i}@example.com>`,
                subject,
                from: 'user@example.com',
                to: ['agent@mari8x.com'],
                inReplyTo: null,
                references: null,
                receivedAt: new Date(Date.now() + i * 1000),
                body: 'Test',
              },
              TEST_USER_ID,
              TEST_ORG_ID
            )
          )
        );

        // All should be in the same thread
        const uniqueThreadIds = new Set(threadIds);
        expect(uniqueThreadIds.size).toBe(1);
      });

      it('should mark thread as read/unread', async () => {
        const threadId = await threadingService.findOrCreateThread(
          {
            messageId: '<read-test@example.com>',
            subject: 'Read Test',
            from: 'sender@example.com',
            to: ['agent@mari8x.com'],
            inReplyTo: null,
            references: null,
            receivedAt: new Date(),
            body: 'Test',
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        await threadingService.markThreadAsRead(threadId, TEST_USER_ID, true);
        let thread = await prisma.emailThread.findUnique({ where: { id: threadId } });
        expect(thread?.isRead).toBe(true);

        await threadingService.markThreadAsRead(threadId, TEST_USER_ID, false);
        thread = await prisma.emailThread.findUnique({ where: { id: threadId } });
        expect(thread?.isRead).toBe(false);
      });

      it('should toggle star on thread', async () => {
        const threadId = await threadingService.findOrCreateThread(
          {
            messageId: '<star-test@example.com>',
            subject: 'Star Test',
            from: 'sender@example.com',
            to: ['agent@mari8x.com'],
            inReplyTo: null,
            references: null,
            receivedAt: new Date(),
            body: 'Test',
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        await threadingService.toggleThreadStar(threadId, TEST_USER_ID, true);
        let thread = await prisma.emailThread.findUnique({ where: { id: threadId } });
        expect(thread?.isStarred).toBe(true);

        await threadingService.toggleThreadStar(threadId, TEST_USER_ID, false);
        thread = await prisma.emailThread.findUnique({ where: { id: threadId } });
        expect(thread?.isStarred).toBe(false);
      });
    });

    describe('AI Email Summaries', () => {
      it('should generate email summary with key points', async () => {
        const summary = await emailSummaryService.generateSummary({
          emailId: TEST_EMAIL_ID,
          subject: 'Urgent: Vessel ETA Update',
          body: `Dear Port Agent,

We need to update you on MV PACIFIC STAR's arrival. The vessel will arrive
at Singapore port on May 15, 2026 at 14:00 hours instead of the originally
scheduled time of 10:00 hours due to weather conditions.

Please prepare the following documents:
- Port clearance certificate
- Cargo manifest
- Crew list

The cargo consists of 45,000 MT of bulk grain valued at $2.5 million.

Urgent response required.

Best regards,
Captain Smith`,
          category: 'vessel_operations',
          urgency: 'critical',
        });

        expect(summary.summary).toBeDefined();
        expect(summary.summary.length).toBeGreaterThan(10);
        expect(summary.summary.length).toBeLessThan(200);

        expect(summary.keyPoints).toBeInstanceOf(Array);
        expect(summary.keyPoints.length).toBeGreaterThan(0);

        expect(summary.action).toBeDefined();
        expect(summary.action).toContain('response');

        expect(summary.confidence).toBeGreaterThan(0.5);
        expect(summary.confidence).toBeLessThanOrEqual(1);
      });

      it('should extract entities from email content', async () => {
        const summary = await emailSummaryService.generateSummary({
          emailId: TEST_EMAIL_ID,
          subject: 'Charter Party for MV ATLANTIC',
          body: `Charter party details:
- Vessel: MV ATLANTIC (IMO 9876543)
- Load Port: Rotterdam
- Discharge Port: New York
- Laycan: June 10-15, 2026
- Freight: $850,000
- Cargo: 55,000 MT steel coils`,
          category: 'charter_party',
          urgency: 'medium',
        });

        // Check if key information is in key points
        const allPoints = summary.keyPoints.join(' ');
        expect(allPoints.toLowerCase()).toContain('atlantic');
        expect(allPoints.toLowerCase()).toMatch(/rotterdam|new york/);
      });
    });
  });

  describe('Phase 5: AI Response Drafter', () => {
    describe('Response Generation', () => {
      it('should generate query_reply style response', async () => {
        const response = await responseDrafterService.generateResponse(
          {
            originalEmail: {
              subject: 'Vessel Availability Inquiry',
              body: 'Do you have any vessels available for Singapore to Dubai route in May 2026?',
              from: 'customer@shipping.com',
              to: ['agent@mari8x.com'],
              category: 'vessel_inquiry',
              urgency: 'medium',
            },
          },
          'query_reply',
          TEST_USER_ID,
          TEST_ORG_ID
        );

        expect(response.subject).toContain('Re:');
        expect(response.body).toBeDefined();
        expect(response.body.length).toBeGreaterThan(50);
        expect(response.style).toBe('query_reply');
        expect(response.confidence).toBeGreaterThan(0);
        expect(response.contextUsed).toBeDefined();
        expect(response.generatedAt).toBeInstanceOf(Date);
      });

      it('should generate acknowledge style response (brief)', async () => {
        const response = await responseDrafterService.generateResponse(
          {
            originalEmail: {
              subject: 'Document Submission',
              body: 'Please find attached port clearance documents.',
              from: 'master@vessel.com',
              to: ['agent@mari8x.com'],
              category: 'documentation',
              urgency: 'low',
            },
          },
          'acknowledge',
          TEST_USER_ID,
          TEST_ORG_ID
        );

        expect(response.body.split('\n').length).toBeLessThan(10); // Brief response
        expect(response.style).toBe('acknowledge');
      });

      it('should generate formal style response', async () => {
        const response = await responseDrafterService.generateResponse(
          {
            originalEmail: {
              subject: 'Charter Party Agreement',
              body: 'Requesting charter party terms for 6-month period.',
              from: 'legal@company.com',
              to: ['agent@mari8x.com'],
              category: 'charter_party',
              urgency: 'medium',
            },
          },
          'formal',
          TEST_USER_ID,
          TEST_ORG_ID
        );

        expect(response.body).toMatch(/Dear|Yours sincerely|Best regards/i);
        expect(response.style).toBe('formal');
      });

      it('should include user signature in response', async () => {
        const response = await responseDrafterService.generateResponse(
          {
            originalEmail: {
              subject: 'Test Email',
              body: 'Test content',
              from: 'test@example.com',
              to: ['agent@mari8x.com'],
            },
          },
          'concise',
          TEST_USER_ID,
          TEST_ORG_ID
        );

        expect(response.body).toContain('Test Agent');
        expect(response.body).toContain('Mari8X Port Agency');
      });
    });

    describe('Context Retrieval Integration', () => {
      beforeEach(async () => {
        // Create test documents in DocumentChunk table
        await prisma.documentChunk.create({
          data: {
            id: 'doc-1',
            documentId: 'test-doc-1',
            organizationId: TEST_ORG_ID,
            title: 'Vessel Availability Policy',
            content:
              'Our standard response time for vessel inquiries is 4 hours. Quotes are valid for 7 days.',
            source: 'company_policy',
            chunkIndex: 0,
          },
        });

        await prisma.documentChunk.create({
          data: {
            id: 'doc-2',
            documentId: 'test-doc-2',
            organizationId: TEST_ORG_ID,
            title: 'Port Documentation Requirements',
            content:
              'Required documents: Port clearance, cargo manifest, crew list, health certificate.',
            source: 'procedure',
            chunkIndex: 0,
          },
        });
      });

      afterEach(async () => {
        await prisma.documentChunk.deleteMany({
          where: { organizationId: TEST_ORG_ID },
        });
      });

      it('should retrieve relevant documents from database fallback', async () => {
        const context = await contextRetrievalService.retrieveContext(
          {
            subject: 'Vessel Inquiry',
            body: 'Need vessel availability information',
            from: 'customer@example.com',
            to: ['agent@mari8x.com'],
            category: 'vessel_inquiry',
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        expect(context.relevantDocuments).toBeDefined();
        expect(context.companyKnowledge).toBeInstanceOf(Array);
        expect(context.threadHistory).toBeInstanceOf(Array);
        expect(context.userPreferences).toBeDefined();
        expect(context.userPreferences?.signature).toContain('Test Agent');
      });

      it('should retrieve category-specific knowledge', async () => {
        const context = await contextRetrievalService.retrieveContext(
          {
            subject: 'Port Documentation',
            body: 'Need documentation checklist',
            from: 'customer@example.com',
            to: ['agent@mari8x.com'],
            category: 'documentation',
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        expect(context.companyKnowledge.some((k) => k.includes('documents'))).toBe(true);
      });

      it('should adjust context based on urgency', async () => {
        const criticalContext = await contextRetrievalService.retrieveSmartContext(
          {
            subject: 'URGENT',
            body: 'Critical issue',
            from: 'customer@example.com',
            to: ['agent@mari8x.com'],
            urgency: 'critical',
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        const lowContext = await contextRetrievalService.retrieveSmartContext(
          {
            subject: 'General inquiry',
            body: 'Non-urgent question',
            from: 'customer@example.com',
            to: ['agent@mari8x.com'],
            urgency: 'low',
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        // Critical should have focused context
        expect(criticalContext.threadHistory.length).toBeLessThanOrEqual(3);
        expect(criticalContext.relevantDocuments.length).toBeLessThanOrEqual(3);

        // Low urgency should have more comprehensive knowledge
        expect(lowContext.companyKnowledge.length).toBeGreaterThanOrEqual(
          criticalContext.companyKnowledge.length
        );
      });

      it('should retrieve thread history when threadId provided', async () => {
        // Create a thread with multiple messages
        const threadId = await threadingService.findOrCreateThread(
          {
            messageId: '<msg1@example.com>',
            subject: 'Ongoing Discussion',
            from: 'customer@example.com',
            to: ['agent@mari8x.com'],
            inReplyTo: null,
            references: null,
            receivedAt: new Date(Date.now() - 86400000), // 1 day ago
            body: 'First message',
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        await threadingService.findOrCreateThread(
          {
            messageId: '<msg2@example.com>',
            subject: 'Re: Ongoing Discussion',
            from: 'agent@mari8x.com',
            to: ['customer@example.com'],
            inReplyTo: '<msg1@example.com>',
            references: '<msg1@example.com>',
            receivedAt: new Date(Date.now() - 43200000), // 12 hours ago
            body: 'Reply message',
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        const context = await contextRetrievalService.retrieveContext(
          {
            threadId,
            subject: 'Re: Re: Ongoing Discussion',
            body: 'Latest message',
            from: 'customer@example.com',
            to: ['agent@mari8x.com'],
          },
          TEST_USER_ID,
          TEST_ORG_ID
        );

        expect(context.threadHistory.length).toBeGreaterThan(0);
      });
    });

    describe('Draft Management', () => {
      it('should save and retrieve draft', async () => {
        const draft = await responseDrafterService.generateResponse(
          {
            originalEmail: {
              subject: 'Test',
              body: 'Test',
              from: 'test@example.com',
              to: ['agent@mari8x.com'],
            },
          },
          'concise',
          TEST_USER_ID,
          TEST_ORG_ID
        );

        const retrieved = await responseDrafterService.getDraft(draft.id!, TEST_USER_ID);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(draft.id);
        expect(retrieved?.subject).toBe(draft.subject);
        expect(retrieved?.body).toBe(draft.body);
      });

      it('should track user edits for ML feedback', async () => {
        const draft = await responseDrafterService.generateResponse(
          {
            originalEmail: {
              subject: 'Test',
              body: 'Test',
              from: 'test@example.com',
              to: ['agent@mari8x.com'],
            },
          },
          'friendly',
          TEST_USER_ID,
          TEST_ORG_ID
        );

        const originalSubject = draft.subject;
        const editedSubject = 'Modified Subject';

        await responseDrafterService.updateDraft(draft.id!, TEST_USER_ID, {
          subject: editedSubject,
        });

        // Check edit was tracked
        const edit = await prisma.responseEdit.findFirst({
          where: {
            draftId: draft.id!,
            field: 'subject',
          },
        });

        expect(edit).toBeDefined();
        expect(edit?.originalValue).toBe(originalSubject);
        expect(edit?.editedValue).toBe(editedSubject);
      });

      it('should mark draft as sent', async () => {
        const draft = await responseDrafterService.generateResponse(
          {
            originalEmail: {
              subject: 'Test',
              body: 'Test',
              from: 'test@example.com',
              to: ['agent@mari8x.com'],
            },
          },
          'acknowledge',
          TEST_USER_ID,
          TEST_ORG_ID
        );

        await responseDrafterService.markDraftAsSent(draft.id!, TEST_USER_ID);

        const updated = await prisma.responseDraft.findUnique({
          where: { id: draft.id! },
        });

        expect(updated?.status).toBe('sent');
        expect(updated?.sentAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('End-to-End User Workflows', () => {
    it('should complete full email organization workflow', async () => {
      // 1. Initialize folders
      await folderService.initializeSystemFolders(TEST_USER_ID, TEST_ORG_ID);

      // 2. Receive emails and create threads
      const threadId1 = await threadingService.findOrCreateThread(
        {
          messageId: '<e2e-1@example.com>',
          subject: 'Important Client Inquiry',
          from: 'vip@client.com',
          to: ['agent@mari8x.com'],
          inReplyTo: null,
          references: null,
          receivedAt: new Date(),
          body: 'Need urgent assistance',
        },
        TEST_USER_ID,
        TEST_ORG_ID
      );

      // 3. Generate summary
      const summary = await emailSummaryService.generateSummary({
        emailId: threadId1,
        subject: 'Important Client Inquiry',
        body: 'Need urgent assistance',
        category: 'general',
        urgency: 'high',
      });

      expect(summary).toBeDefined();

      // 4. Generate response
      const response = await responseDrafterService.generateResponse(
        {
          originalEmail: {
            threadId: threadId1,
            subject: 'Important Client Inquiry',
            body: 'Need urgent assistance',
            from: 'vip@client.com',
            to: ['agent@mari8x.com'],
            urgency: 'high',
          },
        },
        'query_reply',
        TEST_USER_ID,
        TEST_ORG_ID
      );

      expect(response).toBeDefined();

      // 5. Mark as read
      await threadingService.markThreadAsRead(threadId1, TEST_USER_ID, true);

      // 6. Archive thread
      const inboxFolder = await prisma.emailFolder.findFirst({
        where: {
          userId: TEST_USER_ID,
          name: 'Inbox',
        },
      });

      const archiveFolder = await prisma.emailFolder.findFirst({
        where: {
          userId: TEST_USER_ID,
          name: 'Archive',
        },
      });

      await folderService.moveEmailToFolder(
        TEST_USER_ID,
        threadId1,
        inboxFolder!.id,
        archiveFolder!.id
      );

      const thread = await prisma.emailThread.findUnique({
        where: { id: threadId1 },
      });

      expect(thread?.folderId).toBe(archiveFolder!.id);
    });

    it('should handle conversation thread with multiple responses', async () => {
      // Customer sends initial inquiry
      const threadId = await threadingService.findOrCreateThread(
        {
          messageId: '<conv-1@example.com>',
          subject: 'Charter Party Negotiation',
          from: 'broker@maritime.com',
          to: ['agent@mari8x.com'],
          inReplyTo: null,
          references: null,
          receivedAt: new Date(Date.now() - 7200000), // 2 hours ago
          body: 'Interested in charter party for MV STAR',
        },
        TEST_USER_ID,
        TEST_ORG_ID
      );

      // Agent generates first response
      const response1 = await responseDrafterService.generateResponse(
        {
          originalEmail: {
            threadId,
            subject: 'Charter Party Negotiation',
            body: 'Interested in charter party for MV STAR',
            from: 'broker@maritime.com',
            to: ['agent@mari8x.com'],
          },
        },
        'formal',
        TEST_USER_ID,
        TEST_ORG_ID
      );

      await responseDrafterService.markDraftAsSent(response1.id!, TEST_USER_ID);

      // Customer replies
      await threadingService.findOrCreateThread(
        {
          messageId: '<conv-2@example.com>',
          subject: 'Re: Charter Party Negotiation',
          from: 'broker@maritime.com',
          to: ['agent@mari8x.com'],
          inReplyTo: '<conv-1@example.com>',
          references: '<conv-1@example.com>',
          receivedAt: new Date(Date.now() - 3600000), // 1 hour ago
          body: 'Can you provide rate details?',
        },
        TEST_USER_ID,
        TEST_ORG_ID
      );

      // Agent generates second response with thread context
      const response2 = await responseDrafterService.generateResponse(
        {
          originalEmail: {
            threadId,
            subject: 'Re: Charter Party Negotiation',
            body: 'Can you provide rate details?',
            from: 'broker@maritime.com',
            to: ['agent@mari8x.com'],
          },
        },
        'query_reply',
        TEST_USER_ID,
        TEST_ORG_ID
      );

      // Thread history should be included in context
      expect(response2.contextUsed.threadMessagesCount).toBeGreaterThan(0);

      const thread = await prisma.emailThread.findUnique({
        where: { id: threadId },
      });

      expect(thread?.messageCount).toBeGreaterThanOrEqual(2);
    });
  });
});
