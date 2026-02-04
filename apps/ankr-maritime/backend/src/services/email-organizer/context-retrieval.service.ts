/**
 * Context Retrieval Service
 * Fetches relevant context for AI response generation
 * Integrates with PageIndex RAG system
 *
 * @package @ankr/email-organizer
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RetrievedContext {
  relevantDocuments: Array<{
    title: string;
    content: string;
    source: string;
    score: number;
  }>;
  companyKnowledge: string[];
  threadHistory: Array<{
    subject: string;
    body: string;
    from: string;
    timestamp: string;
  }>;
  userPreferences?: {
    signature?: string;
    tone?: string;
    language?: string;
  };
}

export interface EmailContext {
  emailId?: string;
  threadId?: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  category?: string;
  urgency?: string;
  entities?: Record<string, any[]>;
}

export class ContextRetrievalService {
  private ragEndpoint: string;

  constructor() {
    this.ragEndpoint = process.env.RAG_ENDPOINT || 'http://localhost:8001/search';
  }

  /**
   * Retrieve comprehensive context for response generation
   */
  async retrieveContext(
    emailContext: EmailContext,
    userId: string,
    organizationId: string
  ): Promise<RetrievedContext> {
    const [documents, knowledge, history, preferences] = await Promise.all([
      this.retrieveRelevantDocuments(emailContext, organizationId),
      this.retrieveCompanyKnowledge(emailContext, organizationId),
      this.retrieveThreadHistory(emailContext),
      this.getUserPreferences(userId),
    ]);

    return {
      relevantDocuments: documents,
      companyKnowledge: knowledge,
      threadHistory: history,
      userPreferences: preferences,
    };
  }

  /**
   * Retrieve relevant documents using PageIndex RAG
   */
  private async retrieveRelevantDocuments(
    emailContext: EmailContext,
    organizationId: string
  ): Promise<Array<{ title: string; content: string; source: string; score: number }>> {
    try {
      // Build search query from email content
      const searchQuery = this.buildSearchQuery(emailContext);

      // Call PageIndex RAG endpoint
      const response = await fetch(this.ragEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          filters: {
            organizationId,
            documentTypes: ['policy', 'procedure', 'contract', 'template'],
          },
          limit: 5,
          minScore: 0.7,
        }),
      });

      if (!response.ok) {
        console.warn('RAG endpoint unavailable, using fallback');
        return await this.fallbackDocumentRetrieval(emailContext, organizationId);
      }

      const data = await response.json();

      return data.results.map((result: any) => ({
        title: result.title || result.metadata?.title || 'Document',
        content: result.content.slice(0, 1000), // Limit to 1000 chars
        source: result.source || result.metadata?.source || 'Knowledge Base',
        score: result.score || 0,
      }));
    } catch (error) {
      console.error('Failed to retrieve documents from RAG:', error);
      return await this.fallbackDocumentRetrieval(emailContext, organizationId);
    }
  }

  /**
   * Build search query from email context
   */
  private buildSearchQuery(emailContext: EmailContext): string {
    const parts: string[] = [];

    // Add category if present
    if (emailContext.category) {
      parts.push(emailContext.category);
    }

    // Add key entities
    if (emailContext.entities) {
      for (const [type, values] of Object.entries(emailContext.entities)) {
        if (values.length > 0) {
          parts.push(...values.map((v: any) => v.value));
        }
      }
    }

    // Add subject keywords (remove common words)
    const subjectKeywords = emailContext.subject
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .filter((word) => !['about', 'regarding', 'from', 'with'].includes(word))
      .slice(0, 5);
    parts.push(...subjectKeywords);

    // Add body keywords (first 100 words)
    const bodyKeywords = emailContext.body
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .slice(0, 10);
    parts.push(...bodyKeywords);

    return parts.slice(0, 20).join(' ');
  }

  /**
   * Fallback document retrieval using direct database query
   */
  private async fallbackDocumentRetrieval(
    emailContext: EmailContext,
    organizationId: string
  ): Promise<Array<{ title: string; content: string; source: string; score: number }>> {
    try {
      // Query DocumentChunk table (from Phase 3.2 RAG implementation)
      const chunks = await prisma.documentChunk.findMany({
        where: {
          organizationId,
          OR: [
            { content: { contains: emailContext.category || '', mode: 'insensitive' } },
            { title: { contains: emailContext.subject.split(' ')[0], mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return chunks.map((chunk) => ({
        title: chunk.title || 'Document',
        content: chunk.content.slice(0, 1000),
        source: chunk.source || 'Database',
        score: 0.8,
      }));
    } catch (error) {
      console.error('Fallback document retrieval failed:', error);
      return [];
    }
  }

  /**
   * Retrieve company knowledge snippets
   */
  private async retrieveCompanyKnowledge(
    emailContext: EmailContext,
    organizationId: string
  ): Promise<string[]> {
    try {
      const knowledge: string[] = [];

      // Get organization settings
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (org) {
        // Add company name
        knowledge.push(`Company: ${org.name}`);

        // Add industry if available
        if (org.industry) {
          knowledge.push(`Industry: ${org.industry}`);
        }
      }

      // Get category-specific knowledge
      if (emailContext.category) {
        const categoryKnowledge = await this.getCategoryKnowledge(
          emailContext.category,
          organizationId
        );
        knowledge.push(...categoryKnowledge);
      }

      return knowledge;
    } catch (error) {
      console.error('Failed to retrieve company knowledge:', error);
      return [];
    }
  }

  /**
   * Get category-specific knowledge snippets
   */
  private async getCategoryKnowledge(
    category: string,
    organizationId: string
  ): Promise<string[]> {
    const knowledgeMap: Record<string, string[]> = {
      vessel_inquiry: [
        'We provide vessel specifications and availability information',
        'Typical response time: within 4 hours',
        'Include vessel IMO, name, and required dates',
      ],
      port_inquiry: [
        'We handle port documentation and clearance',
        'Port agents available 24/7',
        'Include port name, ETA, and vessel details',
      ],
      freight_quote: [
        'Freight quotes valid for 7 days',
        'Rates subject to bunker adjustment',
        'Include cargo type, quantity, and route',
      ],
      charter_party: [
        'Standard charter party forms: NYPE, Baltime, Barecon',
        'Legal review required before signing',
        'Include laycan, hire rate, and delivery/redelivery ports',
      ],
      documentation: [
        'All documents require proper authentication',
        'Processing time: 24-48 hours',
        'Include vessel details and voyage information',
      ],
    };

    return knowledgeMap[category] || [];
  }

  /**
   * Retrieve thread history
   */
  private async retrieveThreadHistory(
    emailContext: EmailContext
  ): Promise<Array<{ subject: string; body: string; from: string; timestamp: string }>> {
    if (!emailContext.threadId) {
      return [];
    }

    try {
      const thread = await prisma.emailThread.findUnique({
        where: { id: emailContext.threadId },
        include: {
          messages: {
            orderBy: {
              receivedAt: 'desc',
            },
            take: 5,
          },
        },
      });

      if (!thread) {
        return [];
      }

      return thread.messages.map((msg) => ({
        subject: msg.subject,
        body: msg.body.slice(0, 500), // Limit to 500 chars
        from: msg.from,
        timestamp: msg.receivedAt.toISOString(),
      }));
    } catch (error) {
      console.error('Failed to retrieve thread history:', error);
      return [];
    }
  }

  /**
   * Get user preferences for response generation
   */
  private async getUserPreferences(userId: string): Promise<{
    signature?: string;
    tone?: string;
    language?: string;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {};
      }

      return {
        signature: user.emailSignature || undefined,
        tone: user.preferredTone || 'professional',
        language: user.language || 'en',
      };
    } catch (error) {
      console.error('Failed to retrieve user preferences:', error);
      return {};
    }
  }

  /**
   * Smart context selection based on email urgency
   */
  async retrieveSmartContext(
    emailContext: EmailContext,
    userId: string,
    organizationId: string
  ): Promise<RetrievedContext> {
    const baseContext = await this.retrieveContext(emailContext, userId, organizationId);

    // For critical/high urgency, prioritize recent thread history
    if (emailContext.urgency === 'critical' || emailContext.urgency === 'high') {
      baseContext.threadHistory = baseContext.threadHistory.slice(0, 3);
      baseContext.relevantDocuments = baseContext.relevantDocuments
        .filter((doc) => doc.score >= 0.8)
        .slice(0, 3);
    }

    // For low urgency, include more comprehensive context
    if (emailContext.urgency === 'low' || !emailContext.urgency) {
      baseContext.companyKnowledge = [
        ...baseContext.companyKnowledge,
        'Feel free to ask if you need any additional information',
        'We appreciate your patience',
      ];
    }

    return baseContext;
  }
}

export const contextRetrievalService = new ContextRetrievalService();
