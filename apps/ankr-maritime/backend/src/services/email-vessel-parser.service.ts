/**
 * Email Vessel Parser Service
 *
 * Extracts vessel information from emails:
 * - IMO numbers (7-digit format)
 * - Vessel names (with validation against known vessels)
 * - MMSI numbers (9-digit format)
 *
 * Triggers automatic enrichment for mentioned vessels
 */

import { prisma } from '../lib/prisma.js';
import { autoEnrichmentService } from './auto-enrichment.service.js';
import { logger } from '../utils/logger.js';

export interface ParsedVesselMention {
  imoNumber?: string;
  mmsi?: string;
  vesselName?: string;
  context: string; // Surrounding text
  confidence: 'high' | 'medium' | 'low';
}

export interface EmailParseResult {
  vessels: ParsedVesselMention[];
  enrichmentTriggered: number;
}

class EmailVesselParserService {
  // IMO pattern: 7-digit number, often prefixed with "IMO"
  private imoPattern = /\b(?:IMO\s*)?(\d{7})\b/gi;

  // MMSI pattern: 9-digit number
  private mmsiPattern = /\b(?:MMSI\s*)?(\d{9})\b/gi;

  // Vessel name patterns (all caps, 3-50 chars, common prefixes)
  private vesselNamePatterns = [
    /\b(M\/[VT]\s+[A-Z\s]{3,50})\b/g, // M/V VESSEL NAME, M/T TANKER NAME
    /\b(MV\s+[A-Z\s]{3,50})\b/g, // MV VESSEL NAME
    /\b(MT\s+[A-Z\s]{3,50})\b/g, // MT TANKER NAME
  ];

  /**
   * Parse email content and extract vessel mentions
   */
  async parseEmail(emailContent: string, emailSubject?: string): Promise<EmailParseResult> {
    const fullText = `${emailSubject || ''}\n\n${emailContent}`;
    const vessels: ParsedVesselMention[] = [];

    // Extract IMO numbers
    const imoMatches = [...fullText.matchAll(this.imoPattern)];
    for (const match of imoMatches) {
      const imoNumber = match[1];
      const context = this.extractContext(fullText, match.index!);

      vessels.push({
        imoNumber,
        context,
        confidence: 'high', // IMO is definitive
      });
    }

    // Extract MMSI numbers
    const mmsiMatches = [...fullText.matchAll(this.mmsiPattern)];
    for (const match of mmsiMatches) {
      const mmsi = match[1];
      const context = this.extractContext(fullText, match.index!);

      // Try to resolve MMSI to vessel
      const vessel = await prisma.vessel.findFirst({
        where: { mmsi },
        select: { imoNumber: true, name: true },
      });

      if (vessel?.imoNumber) {
        vessels.push({
          imoNumber: vessel.imoNumber,
          mmsi,
          vesselName: vessel.name || undefined,
          context,
          confidence: 'high',
        });
      } else {
        vessels.push({
          mmsi,
          context,
          confidence: 'medium', // MMSI but no vessel match
        });
      }
    }

    // Extract vessel names
    for (const pattern of this.vesselNamePatterns) {
      const nameMatches = [...fullText.matchAll(pattern)];
      for (const match of nameMatches) {
        const vesselName = match[1].trim();
        const context = this.extractContext(fullText, match.index!);

        // Try to find vessel in database
        const vessel = await prisma.vessel.findFirst({
          where: {
            name: {
              contains: vesselName.replace(/^(M\/[VT]|MV|MT)\s+/, ''), // Strip prefix
              mode: 'insensitive',
            },
          },
          select: { imoNumber: true, name: true },
        });

        if (vessel?.imoNumber) {
          vessels.push({
            imoNumber: vessel.imoNumber,
            vesselName: vessel.name || vesselName,
            context,
            confidence: 'high',
          });
        } else {
          vessels.push({
            vesselName,
            context,
            confidence: 'low', // Name mentioned but not in DB
          });
        }
      }
    }

    // Deduplicate by IMO
    const uniqueVessels = this.deduplicateVessels(vessels);

    // Trigger enrichment for high-confidence vessels with IMO
    let enrichmentTriggered = 0;
    const vesselsToEnrich = uniqueVessels.filter(
      v => v.imoNumber && (v.confidence === 'high' || v.confidence === 'medium')
    );

    await autoEnrichmentService.enrichFromEmail(vesselsToEnrich);
    enrichmentTriggered = vesselsToEnrich.length;

    logger.info(`Parsed email: Found ${uniqueVessels.length} vessels, triggered ${enrichmentTriggered} enrichments`);

    return {
      vessels: uniqueVessels,
      enrichmentTriggered,
    };
  }

  /**
   * Extract context around a match (50 chars before/after)
   */
  private extractContext(text: string, index: number): string {
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + 50);
    return text.substring(start, end).replace(/\s+/g, ' ').trim();
  }

  /**
   * Deduplicate vessels by IMO number
   */
  private deduplicateVessels(vessels: ParsedVesselMention[]): ParsedVesselMention[] {
    const seen = new Set<string>();
    const unique: ParsedVesselMention[] = [];

    for (const vessel of vessels) {
      const key = vessel.imoNumber || vessel.vesselName || vessel.mmsi || '';
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(vessel);
      }
    }

    return unique;
  }

  /**
   * Batch parse multiple emails
   */
  async parseEmails(emails: Array<{ subject?: string; body: string }>): Promise<EmailParseResult> {
    const allVessels: ParsedVesselMention[] = [];
    let totalEnrichmentTriggered = 0;

    for (const email of emails) {
      const result = await this.parseEmail(email.body, email.subject);
      allVessels.push(...result.vessels);
      totalEnrichmentTriggered += result.enrichmentTriggered;
    }

    return {
      vessels: this.deduplicateVessels(allVessels),
      enrichmentTriggered: totalEnrichmentTriggered,
    };
  }
}

export const emailVesselParserService = new EmailVesselParserService();
