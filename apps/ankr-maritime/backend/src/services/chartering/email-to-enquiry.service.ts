/**
 * Email-to-Enquiry Service
 * Automatically creates cargo enquiries from parsed emails
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface EmailEnquiryData {
  emailId: string;
  threadId: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
}

export interface ExtractedEnquiry {
  cargoType: string; // 'containers', 'bulk', 'breakbulk', 'liquid'
  commodity?: string; // 'coal', 'iron_ore', 'grain', 'crude_oil', etc.
  quantity?: number;
  quantityUnit?: string; // 'MT', 'TEU', 'CBM'
  loadPort?: string;
  dischargePort?: string;
  laycanStart?: Date;
  laycanEnd?: Date;
  vesselRequirements?: {
    minDwt?: number;
    maxDwt?: number;
    vesselType?: string;
    minAge?: number;
    maxAge?: number;
  };
  freightRate?: {
    amount?: number;
    currency?: string;
    unit?: string; // 'per_mt', 'lumpsum'
  };
  otherTerms?: string;
  confidence: number; // 0-1
}

export interface EnquiryCreationResult {
  success: boolean;
  enquiryId?: string;
  enquiry?: any;
  extracted: ExtractedEnquiry;
  isAutoCreated: boolean;
  needsReview: boolean;
  confidence: number;
  error?: string;
}

export class EmailToEnquiryService {
  private aiProxyEndpoint: string;

  constructor() {
    this.aiProxyEndpoint = process.env.AI_PROXY_ENDPOINT || 'http://localhost:8000/v1/chat/completions';
  }

  /**
   * Process email and create cargo enquiry if detected
   */
  async processEmail(emailData: EmailEnquiryData, userId: string, organizationId: string): Promise<EnquiryCreationResult> {
    try {
      // 1. Classify if this is a cargo enquiry
      const isEnquiry = await this.isCargoEnquiry(emailData);

      if (!isEnquiry) {
        return {
          success: false,
          extracted: { cargoType: 'unknown', confidence: 0 },
          isAutoCreated: false,
          needsReview: false,
          confidence: 0,
          error: 'Not a cargo enquiry email',
        };
      }

      // 2. Extract enquiry details using AI
      const extracted = await this.extractEnquiryDetails(emailData);

      // 3. Determine if auto-create or needs review
      const needsReview = extracted.confidence < 0.7 || !extracted.loadPort || !extracted.dischargePort;

      if (needsReview) {
        console.log(`⚠️ Enquiry needs review (confidence: ${extracted.confidence})`);
        // Still create enquiry but mark for review
      }

      // 4. Find or create contacts/companies from email
      const { contactId, companyId } = await this.findOrCreateContact(emailData.from, organizationId);

      // 5. Create cargo enquiry
      const enquiry = await prisma.cargoEnquiry.create({
        data: {
          // Basic info
          userId,
          organizationId,
          contactId,
          companyId,

          // Cargo details
          cargoType: extracted.cargoType,
          commodity: extracted.commodity,
          quantity: extracted.quantity,
          quantityUnit: extracted.quantityUnit,

          // Route
          loadPort: extracted.loadPort,
          dischargePort: extracted.dischargePort,

          // Laycan
          laycanStart: extracted.laycanStart,
          laycanEnd: extracted.laycanEnd,

          // Vessel requirements
          minDwt: extracted.vesselRequirements?.minDwt,
          maxDwt: extracted.vesselRequirements?.maxDwt,
          preferredVesselType: extracted.vesselRequirements?.vesselType,
          maxVesselAge: extracted.vesselRequirements?.maxAge,

          // Commercial
          freightRate: extracted.freightRate?.amount,
          freightCurrency: extracted.freightRate?.currency || 'USD',
          freightUnit: extracted.freightRate?.unit || 'per_mt',

          // Source tracking
          source: 'email',
          sourceEmailId: emailData.emailId,
          sourceThreadId: emailData.threadId,

          // Status
          status: needsReview ? 'pending_review' : 'active',
          priority: this.calculatePriority(extracted),

          // Metadata
          notes: extracted.otherTerms,
          aiConfidence: extracted.confidence,
          isAutoCreated: true,
          needsReview,

          // Dates
          receivedAt: emailData.receivedAt,
          enquiryDate: emailData.receivedAt,
        },
        include: {
          contact: true,
          company: true,
        },
      });

      console.log(`✅ Created enquiry ${enquiry.id} from email (confidence: ${extracted.confidence})`);

      return {
        success: true,
        enquiryId: enquiry.id,
        enquiry,
        extracted,
        isAutoCreated: true,
        needsReview,
        confidence: extracted.confidence,
      };
    } catch (error: any) {
      console.error('Failed to create enquiry from email:', error);
      return {
        success: false,
        extracted: { cargoType: 'unknown', confidence: 0 },
        isAutoCreated: false,
        needsReview: false,
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Classify if email is a cargo enquiry
   */
  private async isCargoEnquiry(emailData: EmailEnquiryData): Promise<boolean> {
    const text = `${emailData.subject}\n\n${emailData.body}`.toLowerCase();

    // Simple keyword detection first (fast path)
    const enquiryKeywords = [
      'cargo', 'shipment', 'enquiry', 'inquiry', 'requirement', 'looking for',
      'need vessel', 'tonnage', 'laycan', 'loading', 'discharging',
      'freight rate', 'charter', 'shipping'
    ];

    const hasKeyword = enquiryKeywords.some(keyword => text.includes(keyword));

    if (!hasKeyword) {
      return false;
    }

    // Use AI for confirmation (slow path, only if keywords matched)
    try {
      const response = await fetch(this.aiProxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in maritime shipping. Classify if an email is a cargo enquiry (request for vessel charter/freight).',
            },
            {
              role: 'user',
              content: `Is this a cargo enquiry?\n\nSubject: ${emailData.subject}\n\nBody: ${emailData.body.substring(0, 1000)}\n\nRespond with only: YES or NO`,
            },
          ],
          temperature: 0.1,
          max_tokens: 10,
        }),
      });

      const data = await response.json();
      const answer = data.choices[0].message.content.trim().toUpperCase();

      return answer === 'YES';
    } catch (error) {
      console.error('AI classification error:', error);
      // Fallback to keyword-based decision
      return hasKeyword;
    }
  }

  /**
   * Extract enquiry details using AI
   */
  private async extractEnquiryDetails(emailData: EmailEnquiryData): Promise<ExtractedEnquiry> {
    try {
      const prompt = `Extract cargo enquiry details from this email.

Subject: ${emailData.subject}

Body:
${emailData.body}

Extract the following information and respond in JSON format:
{
  "cargoType": "containers|bulk|breakbulk|liquid",
  "commodity": "specific commodity if mentioned (coal, grain, etc.)",
  "quantity": number or null,
  "quantityUnit": "MT|TEU|CBM" or null,
  "loadPort": "port name or code" or null,
  "dischargePort": "port name or code" or null,
  "laycanStart": "ISO date" or null,
  "laycanEnd": "ISO date" or null,
  "vesselRequirements": {
    "minDwt": number or null,
    "maxDwt": number or null,
    "vesselType": "bulk_carrier|tanker|container|general_cargo" or null,
    "maxAge": number (years) or null
  },
  "freightRate": {
    "amount": number or null,
    "currency": "USD|EUR" or null,
    "unit": "per_mt|lumpsum" or null
  },
  "otherTerms": "any other terms mentioned",
  "confidence": 0.0-1.0 (how confident you are in the extraction)
}`;

      const response = await fetch(this.aiProxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in maritime shipping. Extract structured data from cargo enquiry emails.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 800,
        }),
      });

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const extracted = JSON.parse(jsonMatch[0]);

      // Parse dates
      if (extracted.laycanStart) {
        extracted.laycanStart = new Date(extracted.laycanStart);
      }
      if (extracted.laycanEnd) {
        extracted.laycanEnd = new Date(extracted.laycanEnd);
      }

      return extracted;
    } catch (error: any) {
      console.error('Failed to extract enquiry details:', error);
      return {
        cargoType: 'unknown',
        confidence: 0,
      };
    }
  }

  /**
   * Find or create contact from email address
   */
  private async findOrCreateContact(
    email: string,
    organizationId: string
  ): Promise<{ contactId: string; companyId?: string }> {
    // Try to find existing contact
    let contact = await prisma.contact.findFirst({
      where: { email, organizationId },
    });

    if (!contact) {
      // Extract name from email (before @)
      const name = email.split('@')[0].replace(/[._-]/g, ' ');
      const domain = email.split('@')[1];

      // Try to find company by domain
      let company = await prisma.company.findFirst({
        where: { email: { endsWith: `@${domain}` }, organizationId },
      });

      if (!company) {
        // Create company from domain
        company = await prisma.company.create({
          data: {
            name: domain.split('.')[0].toUpperCase(),
            email: `info@${domain}`,
            organizationId,
            type: 'charterer', // Assume charterer for enquiries
          },
        });
      }

      // Create contact
      contact = await prisma.contact.create({
        data: {
          name,
          email,
          companyId: company.id,
          organizationId,
          role: 'Broker',
        },
      });
    }

    return {
      contactId: contact.id,
      companyId: contact.companyId || undefined,
    };
  }

  /**
   * Calculate enquiry priority based on extracted data
   */
  private calculatePriority(extracted: ExtractedEnquiry): string {
    // High priority if:
    // - Laycan is soon (within 14 days)
    // - Large quantity
    // - High confidence extraction

    if (extracted.laycanStart) {
      const daysUntilLaycan = Math.floor(
        (extracted.laycanStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilLaycan <= 7) return 'high';
      if (daysUntilLaycan <= 14) return 'medium';
    }

    if (extracted.quantity && extracted.quantity > 50000) {
      return 'high'; // Large cargo
    }

    if (extracted.confidence > 0.8) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Batch process multiple emails
   */
  async processBatch(
    emails: EmailEnquiryData[],
    userId: string,
    organizationId: string
  ): Promise<EnquiryCreationResult[]> {
    const results: EnquiryCreationResult[] = [];

    for (const email of emails) {
      const result = await this.processEmail(email, userId, organizationId);
      results.push(result);

      // Rate limiting: wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Review and confirm auto-created enquiry
   */
  async reviewEnquiry(enquiryId: string, confirmed: boolean, updates?: any): Promise<void> {
    if (confirmed) {
      await prisma.cargoEnquiry.update({
        where: { id: enquiryId },
        data: {
          status: 'active',
          needsReview: false,
          ...updates,
        },
      });
    } else {
      // Reject and archive
      await prisma.cargoEnquiry.update({
        where: { id: enquiryId },
        data: {
          status: 'rejected',
          needsReview: false,
        },
      });
    }
  }
}

export const emailToEnquiryService = new EmailToEnquiryService();
