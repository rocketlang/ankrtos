/**
 * S&P Subject Resolution Service
 * Phase 4: Ship Broking & S&P
 *
 * Features:
 * - Subject (condition precedent) tracking
 * - Auto-resolution based on events
 * - Deadline countdown
 * - Evidence collection
 * - Subject release workflow
 */

import { prisma } from '../lib/prisma.js';

export interface Subject {
  id: string;
  transactionId: string;
  type: 'inspection' | 'board_approval' | 'finance' | 'flag_approval' | 'class_approval' | 'drydock' | 'custom';
  description: string;
  party: 'buyer' | 'seller' | 'both';
  deadline: Date;
  status: 'pending' | 'satisfied' | 'waived' | 'failed' | 'expired';
  evidence?: string;
  releasedBy?: string;
  releasedAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface SubjectResolutionEvent {
  id: string;
  subjectId: string;
  eventType: 'evidence_uploaded' | 'deadline_extended' | 'waived' | 'satisfied' | 'failed';
  triggeredBy: string;
  evidence?: string;
  notes?: string;
  timestamp: Date;
}

class SNPSubjectResolutionService {
  /**
   * Create subject
   */
  async createSubject(
    transactionId: string,
    type: string,
    description: string,
    party: string,
    deadlineHours: number,
    userId: string
  ): Promise<Subject> {
    const deadline = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);

    const subject: Subject = {
      id: `subj-${Date.now()}`,
      transactionId,
      type: type as any,
      description,
      party: party as any,
      deadline,
      status: 'pending',
      createdAt: new Date(),
    };

    // In production: Store in database
    // await prisma.snpSubject.create({ data: subject });

    return subject;
  }

  /**
   * Get all subjects for transaction
   */
  async getSubjects(transactionId: string): Promise<Subject[]> {
    // In production: Fetch from database
    // return await prisma.snpSubject.findMany({
    //   where: { transactionId },
    //   orderBy: { deadline: 'asc' },
    // });

    // Simulated subjects
    return [
      {
        id: 'subj-1',
        transactionId,
        type: 'inspection',
        description: 'Subject to satisfactory survey by class-approved surveyor',
        party: 'buyer',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'subj-2',
        transactionId,
        type: 'finance',
        description: 'Subject to buyers arranging finance',
        party: 'buyer',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'subj-3',
        transactionId,
        type: 'board_approval',
        description: 'Subject to sellers board approval',
        party: 'seller',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'satisfied',
        releasedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        releasedBy: 'user-123',
        evidence: 'Board resolution dated 2026-01-30',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  /**
   * Release subject (mark as satisfied)
   */
  async releaseSubject(
    subjectId: string,
    evidence: string,
    userId: string
  ): Promise<Subject> {
    // Update subject status
    const subject: Subject = {
      id: subjectId,
      transactionId: 'txn-123',
      type: 'inspection',
      description: 'Subject description',
      party: 'buyer',
      deadline: new Date(),
      status: 'satisfied',
      releasedBy: userId,
      releasedAt: new Date(),
      evidence,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    };

    // Create resolution event
    await this.createResolutionEvent(
      subjectId,
      'satisfied',
      userId,
      evidence,
      'Subject satisfied with provided evidence'
    );

    // In production: Update in database
    // await prisma.snpSubject.update({
    //   where: { id: subjectId },
    //   data: {
    //     status: 'satisfied',
    //     releasedBy: userId,
    //     releasedAt: new Date(),
    //     evidence,
    //   },
    // });

    // Check if all subjects satisfied → move transaction to unconditional
    await this.checkAllSubjectsSatisfied(subject.transactionId);

    return subject;
  }

  /**
   * Waive subject
   */
  async waiveSubject(
    subjectId: string,
    reason: string,
    userId: string
  ): Promise<Subject> {
    const subject: Subject = {
      id: subjectId,
      transactionId: 'txn-123',
      type: 'inspection',
      description: 'Subject description',
      party: 'buyer',
      deadline: new Date(),
      status: 'waived',
      releasedBy: userId,
      releasedAt: new Date(),
      notes: reason,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    };

    // Create resolution event
    await this.createResolutionEvent(
      subjectId,
      'waived',
      userId,
      undefined,
      reason
    );

    // In production: Update in database
    // await prisma.snpSubject.update({
    //   where: { id: subjectId },
    //   data: { status: 'waived', releasedBy: userId, releasedAt: new Date(), notes: reason },
    // });

    await this.checkAllSubjectsSatisfied(subject.transactionId);

    return subject;
  }

  /**
   * Fail subject (buyer/seller not satisfied)
   */
  async failSubject(
    subjectId: string,
    reason: string,
    userId: string
  ): Promise<Subject> {
    const subject: Subject = {
      id: subjectId,
      transactionId: 'txn-123',
      type: 'inspection',
      description: 'Subject description',
      party: 'buyer',
      deadline: new Date(),
      status: 'failed',
      releasedBy: userId,
      releasedAt: new Date(),
      notes: reason,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    };

    // Create resolution event
    await this.createResolutionEvent(
      subjectId,
      'failed',
      userId,
      undefined,
      reason
    );

    // In production: Update in database and transaction
    // await prisma.snpSubject.update({
    //   where: { id: subjectId },
    //   data: { status: 'failed', releasedBy: userId, releasedAt: new Date(), notes: reason },
    // });

    // Mark transaction as cancelled
    // await prisma.snpTransaction.update({
    //   where: { id: subject.transactionId },
    //   data: { status: 'cancelled', cancellationReason: `Subject failed: ${reason}` },
    // });

    return subject;
  }

  /**
   * Extend subject deadline
   */
  async extendDeadline(
    subjectId: string,
    newDeadline: Date,
    reason: string,
    userId: string
  ): Promise<Subject> {
    // In production: Update deadline
    // await prisma.snpSubject.update({
    //   where: { id: subjectId },
    //   data: { deadline: newDeadline },
    // });

    await this.createResolutionEvent(
      subjectId,
      'deadline_extended',
      userId,
      undefined,
      `Deadline extended to ${newDeadline.toDateString()}. Reason: ${reason}`
    );

    return {
      id: subjectId,
      transactionId: 'txn-123',
      type: 'inspection',
      description: 'Subject description',
      party: 'buyer',
      deadline: newDeadline,
      status: 'pending',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Check if all subjects satisfied → mark transaction unconditional
   */
  private async checkAllSubjectsSatisfied(transactionId: string): Promise<void> {
    // In production: Query all subjects
    // const subjects = await prisma.snpSubject.findMany({
    //   where: { transactionId },
    // });

    // const allSatisfied = subjects.every(s => s.status === 'satisfied' || s.status === 'waived');

    // if (allSatisfied) {
    //   await prisma.snpTransaction.update({
    //     where: { id: transactionId },
    //     data: { status: 'unconditional', unconditionalDate: new Date() },
    //   });
    // }

    console.log(`Checking if all subjects satisfied for transaction ${transactionId}`);
  }

  /**
   * Auto-expire subjects past deadline
   */
  async expireOverdueSubjects(): Promise<Subject[]> {
    const now = new Date();

    // In production: Find and update overdue subjects
    // const overdueSubjects = await prisma.snpSubject.findMany({
    //   where: {
    //     status: 'pending',
    //     deadline: { lt: now },
    //   },
    // });

    // for (const subject of overdueSubjects) {
    //   await prisma.snpSubject.update({
    //     where: { id: subject.id },
    //     data: { status: 'expired' },
    //   });

    //   await this.createResolutionEvent(
    //     subject.id,
    //     'failed',
    //     'system',
    //     undefined,
    //     'Subject expired - deadline passed'
    //   );

    //   // Mark transaction as cancelled if critical subject expired
    //   await prisma.snpTransaction.update({
    //     where: { id: subject.transactionId },
    //     data: { status: 'cancelled', cancellationReason: 'Subject expired' },
    //   });
    // }

    return [];
  }

  /**
   * Create resolution event
   */
  private async createResolutionEvent(
    subjectId: string,
    eventType: string,
    triggeredBy: string,
    evidence?: string,
    notes?: string
  ): Promise<SubjectResolutionEvent> {
    const event: SubjectResolutionEvent = {
      id: `evt-${Date.now()}`,
      subjectId,
      eventType: eventType as any,
      triggeredBy,
      evidence,
      notes,
      timestamp: new Date(),
    };

    // In production: Store in database
    // await prisma.snpSubjectEvent.create({ data: event });

    return event;
  }

  /**
   * Get resolution history for subject
   */
  async getResolutionHistory(subjectId: string): Promise<SubjectResolutionEvent[]> {
    // In production: Fetch from database
    // return await prisma.snpSubjectEvent.findMany({
    //   where: { subjectId },
    //   orderBy: { timestamp: 'asc' },
    // });

    return [
      {
        id: 'evt-1',
        subjectId,
        eventType: 'evidence_uploaded',
        triggeredBy: 'user-123',
        evidence: 'Survey report dated 2026-01-28',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'evt-2',
        subjectId,
        eventType: 'satisfied',
        triggeredBy: 'user-456',
        notes: 'Survey findings acceptable',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  /**
   * Get subjects summary for transaction
   */
  async getSubjectsSummary(transactionId: string): Promise<{
    total: number;
    pending: number;
    satisfied: number;
    waived: number;
    failed: number;
    expired: number;
    nextDeadline?: Date;
    criticalSubjects: Subject[];
  }> {
    const subjects = await this.getSubjects(transactionId);

    const summary = {
      total: subjects.length,
      pending: subjects.filter((s) => s.status === 'pending').length,
      satisfied: subjects.filter((s) => s.status === 'satisfied').length,
      waived: subjects.filter((s) => s.status === 'waived').length,
      failed: subjects.filter((s) => s.status === 'failed').length,
      expired: subjects.filter((s) => s.status === 'expired').length,
      nextDeadline: undefined as Date | undefined,
      criticalSubjects: [] as Subject[],
    };

    // Find next deadline
    const pendingSubjects = subjects.filter((s) => s.status === 'pending');
    if (pendingSubjects.length > 0) {
      summary.nextDeadline = pendingSubjects.sort((a, b) => a.deadline.getTime() - b.deadline.getTime())[0].deadline;
    }

    // Find critical subjects (deadline within 48 hours)
    const critical48h = Date.now() + 48 * 60 * 60 * 1000;
    summary.criticalSubjects = pendingSubjects.filter(
      (s) => s.deadline.getTime() <= critical48h
    );

    return summary;
  }
}

export const snpSubjectResolutionService = new SNPSubjectResolutionService();
