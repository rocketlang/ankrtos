/**
 * AI Response Drafter Service
 * Generates context-aware email responses in multiple styles
 *
 * @package @ankr/email-organizer
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { contextRetrievalService } from './context-retrieval.service.js';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export type ResponseStyle =
  | 'acknowledge'
  | 'query_reply'
  | 'formal'
  | 'concise'
  | 'friendly'
  | 'follow_up'
  | 'rejection_polite'
  | 'acceptance'
  | 'auto_reply';

export interface ResponseContext {
  originalEmail: {
    emailId?: string;
    threadId?: string;
    subject: string;
    body: string;
    from: string;
    to: string[];
    category?: string;
    urgency?: string;
    entities?: Record<string, any[]>;
  };
  threadHistory?: Array<{
    subject: string;
    body: string;
    from: string;
    timestamp: string;
  }>;
  relevantDocuments?: Array<{
    title: string;
    content: string;
    source: string;
  }>;
  companyKnowledge?: string[];
  userPreferences?: {
    signature?: string;
    tone?: string;
    language?: string;
  };
}

export interface ResponseDraft {
  id?: string;
  subject: string;
  body: string;
  style: ResponseStyle;
  confidence: number;
  contextUsed: {
    documentsCount: number;
    knowledgeCount: number;
    threadMessagesCount: number;
  };
  suggestedEdits?: string[];
  generatedAt: Date;
}

export class ResponseDrafterService {
  private aiProxyEndpoint: string;

  constructor() {
    this.aiProxyEndpoint = process.env.AI_PROXY_ENDPOINT || 'http://localhost:8000/v1/chat/completions';
  }

  /**
   * Generate AI-powered email response
   */
  async generateResponse(
    context: ResponseContext,
    style: ResponseStyle,
    userId: string,
    organizationId: string
  ): Promise<ResponseDraft> {
    const startTime = Date.now();

    try {
      // Retrieve comprehensive context if not provided
      if (!context.relevantDocuments && !context.companyKnowledge) {
        const retrievedContext = await contextRetrievalService.retrieveSmartContext(
          {
            emailId: context.originalEmail.emailId,
            threadId: context.originalEmail.threadId,
            subject: context.originalEmail.subject,
            body: context.originalEmail.body,
            from: context.originalEmail.from,
            to: context.originalEmail.to,
            category: context.originalEmail.category,
            urgency: context.originalEmail.urgency,
            entities: context.originalEmail.entities,
          },
          userId,
          organizationId
        );

        // Merge retrieved context with provided context
        context = {
          ...context,
          relevantDocuments: retrievedContext.relevantDocuments,
          companyKnowledge: retrievedContext.companyKnowledge,
          threadHistory: retrievedContext.threadHistory,
          userPreferences: retrievedContext.userPreferences,
        };
      }

      // Build comprehensive prompt
      const prompt = this.buildPrompt(context, style);

      // Call AI proxy
      const aiResponse = await this.callAIProxy(prompt, style);

      // Parse response
      const parsed = this.parseAIResponse(aiResponse);

      // Save draft to database
      const draft = await prisma.responseDraft.create({
        data: {
          emailId: 'temp', // Will be updated when linked to actual email
          userId,
          organizationId,
          style,
          subject: parsed.subject,
          body: parsed.body,
          contextDocs: context.relevantDocuments || null,
          contextKnowledge: context.companyKnowledge || null,
          threadHistory: context.threadHistory || null,
          status: 'draft',
          confidence: parsed.confidence,
        },
      });

      const processingTime = Date.now() - startTime;
      console.log(`Response generated in ${processingTime}ms`);

      return {
        id: draft.id,
        subject: parsed.subject,
        body: parsed.body,
        style,
        confidence: parsed.confidence,
        contextUsed: {
          documentsCount: context.relevantDocuments?.length || 0,
          knowledgeCount: context.companyKnowledge?.length || 0,
          threadMessagesCount: context.threadHistory?.length || 0,
        },
        suggestedEdits: parsed.suggestedEdits,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to generate response:', error);
      throw new Error('Response generation failed');
    }
  }

  /**
   * Build AI prompt based on style and context
   */
  private buildPrompt(context: ResponseContext, style: ResponseStyle): string {
    const styleInstructions = this.getStyleInstructions(style);

    let prompt = `You are an expert email assistant. Generate a professional email response.\n\n`;

    // Original email
    prompt += `ORIGINAL EMAIL:\n`;
    prompt += `From: ${context.originalEmail.from}\n`;
    prompt += `Subject: ${context.originalEmail.subject}\n`;
    prompt += `Body:\n${context.originalEmail.body.slice(0, 2000)}\n\n`;

    // Extracted entities
    if (context.originalEmail.entities) {
      prompt += `EXTRACTED INFORMATION:\n`;
      for (const [type, values] of Object.entries(context.originalEmail.entities)) {
        if (values.length > 0) {
          prompt += `- ${type}: ${values.map((v: any) => v.value).join(', ')}\n`;
        }
      }
      prompt += `\n`;
    }

    // Thread history
    if (context.threadHistory && context.threadHistory.length > 0) {
      prompt += `CONVERSATION HISTORY (most recent first):\n`;
      for (const msg of context.threadHistory.slice(0, 3)) {
        prompt += `From: ${msg.from}\n`;
        prompt += `${msg.body.slice(0, 500)}...\n\n`;
      }
    }

    // Relevant documents
    if (context.relevantDocuments && context.relevantDocuments.length > 0) {
      prompt += `RELEVANT COMPANY INFORMATION:\n`;
      for (const doc of context.relevantDocuments.slice(0, 3)) {
        prompt += `- ${doc.title}: ${doc.content.slice(0, 300)}...\n`;
      }
      prompt += `\n`;
    }

    // Company knowledge
    if (context.companyKnowledge && context.companyKnowledge.length > 0) {
      prompt += `COMPANY KNOWLEDGE:\n`;
      for (const knowledge of context.companyKnowledge.slice(0, 5)) {
        prompt += `- ${knowledge}\n`;
      }
      prompt += `\n`;
    }

    // Style instructions
    prompt += `RESPONSE STYLE: ${style}\n`;
    prompt += styleInstructions;
    prompt += `\n\n`;

    // User preferences
    if (context.userPreferences) {
      prompt += `USER PREFERENCES:\n`;
      if (context.userPreferences.tone) {
        prompt += `- Preferred tone: ${context.userPreferences.tone}\n`;
      }
      if (context.userPreferences.language) {
        prompt += `- Language: ${context.userPreferences.language}\n`;
      }
      if (context.userPreferences.signature) {
        prompt += `- Signature to include:\n${context.userPreferences.signature}\n`;
      }
      prompt += `\n`;
    }

    // Output format
    prompt += `Generate a response in JSON format:\n`;
    prompt += `{\n`;
    prompt += `  "subject": "Re: ${context.originalEmail.subject}",\n`;
    prompt += `  "body": "Email body here with proper formatting${
      context.userPreferences?.signature ? '\\n\\n' + context.userPreferences.signature : ''
    }",\n`;
    prompt += `  "confidence": 0.9,\n`;
    prompt += `  "suggestedEdits": ["Optional edit suggestions"]\n`;
    prompt += `}\n`;

    return prompt;
  }

  /**
   * Get style-specific instructions
   */
  private getStyleInstructions(style: ResponseStyle): string {
    const instructions: Record<ResponseStyle, string> = {
      acknowledge: `Write a brief acknowledgment email (2-3 sentences).
- Thank them for reaching out
- Confirm receipt of their request
- Provide a timeline for response if applicable
- Keep it warm but professional`,

      query_reply: `Write a detailed response answering their question.
- Address each point they raised
- Provide specific information and data
- Use bullet points for clarity
- Include relevant context from company knowledge
- Offer to provide more details if needed`,

      formal: `Write a formal, professional business email.
- Use formal salutation and closing
- Structure with clear paragraphs
- Use professional tone throughout
- Include all relevant details
- Sign off appropriately`,

      concise: `Write a short, direct response (3-5 sentences maximum).
- Get straight to the point
- Answer the core question
- Skip pleasantries unless essential
- Clear call to action if needed`,

      friendly: `Write a warm, conversational response.
- Use friendly but professional tone
- Personalize with their name
- Show empathy and understanding
- Keep it approachable
- End with an open invitation for follow-up`,

      follow_up: `Write a polite follow-up email.
- Reference previous communication
- Gently remind of pending action
- Offer assistance
- Provide clear next steps
- Set a soft deadline`,

      rejection_polite: `Write a polite rejection or decline.
- Express appreciation for the opportunity
- Clearly but kindly state the decline
- Provide brief reasoning if appropriate
- Leave door open for future opportunities
- Maintain positive relationship`,

      acceptance: `Write an enthusiastic acceptance email.
- Express excitement and gratitude
- Confirm key details
- Outline next steps
- Show commitment
- Professional but warm tone`,

      auto_reply: `Write an auto-reply/out-of-office message.
- State unavailability clearly
- Provide return date
- Offer alternative contact if urgent
- Keep it brief and professional
- Set expectations`,
    };

    return instructions[style];
  }

  /**
   * Call AI Proxy
   */
  private async callAIProxy(prompt: string, style: ResponseStyle): Promise<string> {
    const temperature = style === 'formal' ? 0.3 : style === 'friendly' ? 0.7 : 0.5;

    const response = await fetch(this.aiProxyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use GPT-4 for better response quality
        messages: [
          {
            role: 'system',
            content: 'You are an expert email assistant. Generate professional, context-aware email responses.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Proxy error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(response: string): {
    subject: string;
    body: string;
    confidence: number;
    suggestedEdits?: string[];
  } {
    try {
      // Try to parse as JSON
      const json = JSON.parse(response);

      return {
        subject: json.subject || 'Re: Your Email',
        body: json.body || '',
        confidence: json.confidence || 0.8,
        suggestedEdits: json.suggestedEdits || [],
      };
    } catch (error) {
      // If not JSON, treat as plain text body
      const lines = response.split('\n');
      const subject = lines[0]?.startsWith('Subject:') ? lines[0].replace('Subject:', '').trim() : 'Re: Your Email';
      const body = lines.slice(1).join('\n').trim();

      return {
        subject,
        body,
        confidence: 0.7,
      };
    }
  }

  /**
   * Get saved draft
   */
  async getDraft(draftId: string, userId: string): Promise<ResponseDraft | null> {
    const draft = await prisma.responseDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft || draft.userId !== userId) {
      return null;
    }

    return {
      id: draft.id,
      subject: draft.subject,
      body: draft.body,
      style: draft.style as ResponseStyle,
      confidence: draft.confidence || 0,
      contextUsed: {
        documentsCount: Array.isArray(draft.contextDocs) ? draft.contextDocs.length : 0,
        knowledgeCount: Array.isArray(draft.contextKnowledge) ? draft.contextKnowledge.length : 0,
        threadMessagesCount: Array.isArray(draft.threadHistory) ? draft.threadHistory.length : 0,
      },
      generatedAt: draft.createdAt,
    };
  }

  /**
   * Update draft (user edited)
   */
  async updateDraft(
    draftId: string,
    userId: string,
    updates: { subject?: string; body?: string }
  ): Promise<void> {
    const draft = await prisma.responseDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft || draft.userId !== userId) {
      throw new Error('Draft not found or unauthorized');
    }

    // Track edits for ML feedback
    if (updates.subject && updates.subject !== draft.subject) {
      await prisma.responseEdit.create({
        data: {
          draftId,
          field: 'subject',
          originalValue: draft.subject,
          editedValue: updates.subject,
        },
      });
    }

    if (updates.body && updates.body !== draft.body) {
      await prisma.responseEdit.create({
        data: {
          draftId,
          field: 'body',
          originalValue: draft.body,
          editedValue: updates.body,
        },
      });
    }

    // Update draft
    await prisma.responseDraft.update({
      where: { id: draftId },
      data: {
        subject: updates.subject || draft.subject,
        body: updates.body || draft.body,
        status: 'edited',
      },
    });
  }

  /**
   * Mark draft as sent
   */
  async markDraftAsSent(draftId: string, userId: string): Promise<void> {
    const draft = await prisma.responseDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft || draft.userId !== userId) {
      throw new Error('Draft not found or unauthorized');
    }

    await prisma.responseDraft.update({
      where: { id: draftId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });
  }

  /**
   * Get all drafts for an email
   */
  async getDraftsForEmail(emailId: string, userId: string): Promise<ResponseDraft[]> {
    const drafts = await prisma.responseDraft.findMany({
      where: {
        emailId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return drafts.map((draft) => ({
      id: draft.id,
      subject: draft.subject,
      body: draft.body,
      style: draft.style as ResponseStyle,
      confidence: draft.confidence || 0,
      contextUsed: {
        documentsCount: 0,
        knowledgeCount: 0,
        threadMessagesCount: 0,
      },
      generatedAt: draft.createdAt,
    }));
  }
}

export const responseDrafterService = new ResponseDrafterService();
