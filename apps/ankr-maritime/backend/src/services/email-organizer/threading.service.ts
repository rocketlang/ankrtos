/**
 * Email Threading Service
 * Groups emails into conversations (Gmail-style threading)
 *
 * @package @ankr/email-organizer
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface EmailForThreading {
  id: string;
  messageId?: string | null;
  inReplyTo?: string | null;
  references?: string[];
  subject: string;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses?: string[];
  receivedAt?: Date | null;
  category?: string | null;
  urgency?: string | null;
  urgencyScore?: number | null;
  actionable?: string | null;
}

export class EmailThreadingService {
  /**
   * Find or create thread for an email
   */
  async findOrCreateThread(
    email: EmailForThreading,
    userId: string,
    organizationId: string
  ): Promise<string> {
    // Strategy 1: Match by In-Reply-To / References headers (RFC 5322)
    if (email.inReplyTo || email.references?.length) {
      const relatedMessageIds = [
        email.inReplyTo,
        ...(email.references || []),
      ].filter(Boolean) as string[];

      // TODO: Find existing email with matching messageId
      // const relatedEmail = await prisma.emailMessage.findFirst({
      //   where: { messageId: { in: relatedMessageIds } }
      // });
      // if (relatedEmail?.threadId) {
      //   await this.addEmailToThread(relatedEmail.threadId, email);
      //   return relatedEmail.threadId;
      // }
    }

    // Strategy 2: Match by normalized subject + participants
    const normalizedSubject = this.normalizeSubject(email.subject);
    const participants = this.getParticipants(email);

    const existingThread = await prisma.emailThread.findFirst({
      where: {
        userId,
        subject: normalizedSubject,
        // Match threads with overlapping participants
        participants: {
          hasSome: participants,
        },
        // Within 7 days (don't thread old conversations)
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (existingThread) {
      await this.addEmailToThread(existingThread.id, email);
      return existingThread.id;
    }

    // Strategy 3: Create new thread
    const thread = await prisma.emailThread.create({
      data: {
        userId,
        organizationId,
        subject: normalizedSubject,
        participants,
        messageCount: 1,
        unreadCount: 1,
        firstMessageId: email.id,
        latestMessageId: email.id,
        category: email.category,
        urgency: email.urgency,
        urgencyScore: email.urgencyScore,
        actionable: email.actionable,
        isStarred: false,
        isArchived: false,
        labels: [],
      },
    });

    return thread.id;
  }

  /**
   * Add email to existing thread
   */
  async addEmailToThread(threadId: string, email: EmailForThreading) {
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Thread not found');
    }

    // Update thread metadata
    const participants = Array.from(
      new Set([
        ...thread.participants,
        ...this.getParticipants(email),
      ])
    );

    await prisma.emailThread.update({
      where: { id: threadId },
      data: {
        messageCount: { increment: 1 },
        unreadCount: { increment: 1 },
        latestMessageId: email.id,
        participants,
        // Update classification from latest email
        category: email.category || thread.category,
        urgency: email.urgency || thread.urgency,
        urgencyScore: email.urgencyScore || thread.urgencyScore,
        actionable: email.actionable || thread.actionable,
        updatedAt: new Date(),
      },
    });

    // TODO: Update EmailMessage.threadId when we add the field
    // await prisma.emailMessage.update({
    //   where: { id: email.id },
    //   data: { threadId }
    // });
  }

  /**
   * Get thread with messages
   */
  async getThread(threadId: string, userId: string) {
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Thread not found');
    }
    if (thread.userId !== userId) {
      throw new Error('Not authorized to view this thread');
    }

    // TODO: Get messages when EmailMessage has threadId relation
    // const messages = await prisma.emailMessage.findMany({
    //   where: { threadId },
    //   orderBy: { receivedAt: 'asc' }
    // });

    return {
      thread,
      messages: [], // messages
    };
  }

  /**
   * Get threads for user
   */
  async getThreads(
    userId: string,
    options?: {
      category?: string;
      urgency?: string;
      isStarred?: boolean;
      isArchived?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: any = { userId };

    if (options?.category) where.category = options.category;
    if (options?.urgency) where.urgency = options.urgency;
    if (options?.isStarred !== undefined) where.isStarred = options.isStarred;
    if (options?.isArchived !== undefined) where.isArchived = options.isArchived;

    return await prisma.emailThread.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  /**
   * Mark thread as read/unread
   */
  async markThreadAsRead(threadId: string, userId: string, read: boolean = true) {
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Thread not found');
    }
    if (thread.userId !== userId) {
      throw new Error('Not authorized');
    }

    // Update thread
    await prisma.emailThread.update({
      where: { id: threadId },
      data: {
        unreadCount: read ? 0 : thread.messageCount,
      },
    });

    // TODO: Update all messages in thread
    // await prisma.emailMessage.updateMany({
    //   where: { threadId },
    //   data: { isRead: read }
    // });

    return { success: true };
  }

  /**
   * Star/unstar thread
   */
  async toggleThreadStar(threadId: string, userId: string, starred?: boolean) {
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Thread not found');
    }
    if (thread.userId !== userId) {
      throw new Error('Not authorized');
    }

    return await prisma.emailThread.update({
      where: { id: threadId },
      data: {
        isStarred: starred !== undefined ? starred : !thread.isStarred,
      },
    });
  }

  /**
   * Archive thread
   */
  async archiveThread(threadId: string, userId: string, archived: boolean = true) {
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Thread not found');
    }
    if (thread.userId !== userId) {
      throw new Error('Not authorized');
    }

    return await prisma.emailThread.update({
      where: { id: threadId },
      data: { isArchived: archived },
    });
  }

  /**
   * Add labels to thread
   */
  async addThreadLabels(threadId: string, userId: string, labels: string[]) {
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Thread not found');
    }
    if (thread.userId !== userId) {
      throw new Error('Not authorized');
    }

    const updatedLabels = Array.from(new Set([...thread.labels, ...labels]));

    return await prisma.emailThread.update({
      where: { id: threadId },
      data: { labels: updatedLabels },
    });
  }

  /**
   * Remove labels from thread
   */
  async removeThreadLabels(threadId: string, userId: string, labels: string[]) {
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Thread not found');
    }
    if (thread.userId !== userId) {
      throw new Error('Not authorized');
    }

    const updatedLabels = thread.labels.filter((label) => !labels.includes(label));

    return await prisma.emailThread.update({
      where: { id: threadId },
      data: { labels: updatedLabels },
    });
  }

  /**
   * Normalize email subject (strip Re:, Fwd:, etc.)
   */
  private normalizeSubject(subject: string): string {
    return subject
      .replace(/^(Re|Fwd|Fw|回复|转发):\s*/gi, '')
      .replace(/\[.*?\]/g, '')
      .trim()
      .toLowerCase();
  }

  /**
   * Get all participants from email
   */
  private getParticipants(email: EmailForThreading): string[] {
    return Array.from(
      new Set([
        email.fromAddress,
        ...email.toAddresses,
        ...(email.ccAddresses || []),
      ].map((addr) => addr.toLowerCase()))
    );
  }

  /**
   * Rebuild thread counters (maintenance task)
   */
  async rebuildThreadCounters(threadId: string) {
    // TODO: Implement when EmailMessage has threadId
    // const messageCount = await prisma.emailMessage.count({ where: { threadId } });
    // const unreadCount = await prisma.emailMessage.count({
    //   where: { threadId, isRead: false }
    // });

    // await prisma.emailThread.update({
    //   where: { id: threadId },
    //   data: { messageCount, unreadCount }
    // });

    return { success: true };
  }
}

export const emailThreadingService = new EmailThreadingService();
