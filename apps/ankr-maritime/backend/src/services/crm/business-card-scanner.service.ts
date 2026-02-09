/**
 * Business Card Scanner Service
 * OCR-powered contact creation from business cards
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface BusinessCardData {
  // Personal info
  name?: string;
  role?: string;
  company?: string;

  // Contact details
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;

  // Address
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;

  // Social
  linkedIn?: string;
  twitter?: string;

  // Raw OCR text
  rawText: string;
  confidence: number; // 0-1
}

export interface ScanResult {
  cardData: BusinessCardData;
  suggestedCompany?: {
    id: string;
    name: string;
    matchScore: number;
  };
  suggestedContact?: {
    id: string;
    name: string;
    matchScore: number;
  };
  autoCreated: boolean;
  contactId?: string;
}

export class BusinessCardScannerService {
  /**
   * Scan business card image and extract data
   */
  async scanBusinessCard(
    imageBuffer: Buffer,
    organizationId: string,
    autoCreate: boolean = false
  ): Promise<ScanResult> {
    // Step 1: Perform OCR
    const ocrText = await this.performOCR(imageBuffer);

    // Step 2: Extract structured data
    const cardData = this.extractCardData(ocrText);

    // Step 3: Find or suggest matching company
    const suggestedCompany = cardData.company
      ? await this.findMatchingCompany(cardData.company, organizationId)
      : undefined;

    // Step 4: Find or suggest matching contact
    const suggestedContact = cardData.email
      ? await this.findMatchingContact(cardData.email, organizationId)
      : undefined;

    // Step 5: Auto-create if requested and no existing match
    let autoCreated = false;
    let contactId: string | undefined;

    if (autoCreate && !suggestedContact && cardData.name && cardData.email) {
      contactId = await this.createContact(cardData, suggestedCompany?.id, organizationId);
      autoCreated = true;
    }

    return {
      cardData,
      suggestedCompany,
      suggestedContact,
      autoCreated,
      contactId,
    };
  }

  /**
   * Batch scan multiple business cards
   */
  async batchScanCards(
    images: Buffer[],
    organizationId: string,
    autoCreate: boolean = false
  ): Promise<ScanResult[]> {
    const results: ScanResult[] = [];

    for (const image of images) {
      try {
        const result = await this.scanBusinessCard(image, organizationId, autoCreate);
        results.push(result);
      } catch (error) {
        console.error('Failed to scan card:', error);
        results.push({
          cardData: {
            rawText: '',
            confidence: 0,
          },
          autoCreated: false,
        });
      }
    }

    return results;
  }

  /**
   * Create contact from business card data
   */
  async createContact(
    cardData: BusinessCardData,
    companyId: string | undefined,
    organizationId: string
  ): Promise<string> {
    // Create or find company first
    let finalCompanyId = companyId;

    if (!finalCompanyId && cardData.company) {
      const company = await prisma.company.create({
        data: {
          name: cardData.company,
          type: 'BROKER', // Default, can be updated later
          organizationId,
          website: cardData.website,
          address: this.formatAddress(cardData),
        },
      });
      finalCompanyId = company.id;
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        name: cardData.name!,
        email: cardData.email,
        phone: cardData.phone || cardData.mobile,
        role: cardData.role,
        companyId: finalCompanyId,
        organizationId,
        linkedIn: cardData.linkedIn,
        source: 'BUSINESS_CARD_SCAN',
      },
    });

    return contact.id;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async performOCR(imageBuffer: Buffer): Promise<string> {
    // In production, use @ankr/ocr or Tesseract.js or Google Vision API
    // For now, return mock OCR result

    // Simulate OCR delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock OCR output
    return `
John Smith
Senior Chartering Manager
Pacific Shipping Lines

Email: john.smith@pacificshipping.com
Phone: +65 6123 4567
Mobile: +65 9876 5432

1 Maritime Square
#10-01 HarbourFront Centre
Singapore 099253

www.pacificshipping.com
LinkedIn: linkedin.com/in/johnsmith
    `.trim();
  }

  private extractCardData(ocrText: string): BusinessCardData {
    const lines = ocrText.split('\n').map((l) => l.trim()).filter((l) => l);

    const cardData: BusinessCardData = {
      rawText: ocrText,
      confidence: 0.85, // Mock confidence
    };

    // Extract name (usually first line)
    if (lines.length > 0) {
      cardData.name = this.cleanName(lines[0]);
    }

    // Extract role (usually second line)
    if (lines.length > 1 && this.looksLikeRole(lines[1])) {
      cardData.role = lines[1];
    }

    // Extract company (usually third line or after role)
    if (lines.length > 2) {
      const companyLine = lines.find((l, i) => i > 0 && i < 4 && !this.isContactInfo(l));
      if (companyLine) {
        cardData.company = companyLine;
      }
    }

    // Extract email
    const emailMatch = ocrText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      cardData.email = emailMatch[0].toLowerCase();
    }

    // Extract phone numbers
    const phoneMatches = ocrText.match(/(\+?\d{1,3}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/g);
    if (phoneMatches && phoneMatches.length > 0) {
      cardData.phone = this.cleanPhone(phoneMatches[0]);
      if (phoneMatches.length > 1) {
        cardData.mobile = this.cleanPhone(phoneMatches[1]);
      }
    }

    // Extract website
    const websiteMatch = ocrText.match(/(www\.|https?:\/\/)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (websiteMatch) {
      cardData.website = websiteMatch[0].replace('www.', 'https://www.');
    }

    // Extract LinkedIn
    const linkedInMatch = ocrText.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/);
    if (linkedInMatch) {
      cardData.linkedIn = `https://${linkedInMatch[0]}`;
    }

    // Extract address (lines containing numbers, street, building names)
    const addressLines = lines.filter((l) => this.looksLikeAddress(l));
    if (addressLines.length > 0) {
      cardData.address = addressLines.join(', ');
    }

    // Extract country (common patterns)
    const countryMatch = ocrText.match(/(Singapore|USA|UK|China|Japan|India|Greece|Norway)/i);
    if (countryMatch) {
      cardData.country = countryMatch[0];
    }

    return cardData;
  }

  private async findMatchingCompany(
    companyName: string,
    organizationId: string
  ): Promise<{ id: string; name: string; matchScore: number } | undefined> {
    // Fuzzy search for company
    const companies = await prisma.company.findMany({
      where: {
        organizationId,
        name: {
          contains: companyName.split(' ')[0], // Search by first word
          mode: 'insensitive',
        },
      },
      take: 1,
    });

    if (companies.length > 0) {
      const company = companies[0];
      const matchScore = this.calculateSimilarity(companyName, company.name);

      if (matchScore > 0.7) {
        return {
          id: company.id,
          name: company.name,
          matchScore,
        };
      }
    }

    return undefined;
  }

  private async findMatchingContact(
    email: string,
    organizationId: string
  ): Promise<{ id: string; name: string; matchScore: number } | undefined> {
    const contact = await prisma.contact.findFirst({
      where: {
        organizationId,
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });

    if (contact) {
      return {
        id: contact.id,
        name: contact.name,
        matchScore: 1.0, // Exact email match
      };
    }

    return undefined;
  }

  private cleanName(name: string): string {
    // Remove common titles
    return name
      .replace(/^(Mr\.?|Ms\.?|Mrs\.?|Dr\.?|Prof\.?)\s+/i, '')
      .replace(/\s+(Jr\.?|Sr\.?|II|III)$/i, '')
      .trim();
  }

  private looksLikeRole(text: string): boolean {
    const rolekeywords = [
      'manager',
      'director',
      'ceo',
      'cfo',
      'president',
      'vp',
      'vice president',
      'head',
      'senior',
      'chief',
      'owner',
      'chartering',
      'operations',
      'commercial',
    ];
    return roleKeywords.some((kw) => text.toLowerCase().includes(kw));
  }

  private isContactInfo(text: string): boolean {
    // Check if line contains contact info patterns
    return (
      text.includes('@') ||
      text.includes('www.') ||
      text.includes('http') ||
      /\d{3,}/.test(text) // Contains 3+ digits (phone/fax)
    );
  }

  private looksLikeAddress(text: string): boolean {
    const addressKeywords = [
      'street',
      'road',
      'avenue',
      'square',
      'building',
      'floor',
      'suite',
      '#',
      'blvd',
      'drive',
    ];
    return (
      addressKeywords.some((kw) => text.toLowerCase().includes(kw)) ||
      /\d+/.test(text) // Contains numbers
    );
  }

  private cleanPhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '').trim();
  }

  private formatAddress(cardData: BusinessCardData): string | undefined {
    const parts = [cardData.address, cardData.city, cardData.country, cardData.postalCode]
      .filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Levenshtein distance-based similarity
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[s2.length][s1.length];
    const maxLen = Math.max(s1.length, s2.length);
    return 1 - distance / maxLen;
  }
}

export const businessCardScannerService = new BusinessCardScannerService();
