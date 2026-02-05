/**
 * Photo Classification Service
 * Classifies images using OpenAI Vision API (vessel, damage, documents, etc.)
 *
 * @package @ankr/universal-ai-assistant
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type PhotoCategory =
  | 'vessel' // Ship/vessel photo
  | 'damage' // Damage inspection photo
  | 'document' // Document/paperwork photo (B/L, invoice, etc.)
  | 'port' // Port/terminal photo
  | 'cargo' // Cargo photo
  | 'crew' // Crew/personnel photo
  | 'equipment' // Equipment/machinery photo
  | 'other'; // Unclassified

export interface ClassificationResult {
  success: boolean;
  category?: PhotoCategory;
  confidence?: number; // 0-1
  description?: string; // AI-generated description
  entities?: {
    vesselName?: string;
    vesselType?: string;
    damageType?: string;
    documentType?: string;
    portName?: string;
    cargoType?: string;
  };
  tags?: string[];
  error?: string;
}

export interface ClassificationOptions {
  detectText?: boolean; // Extract text from image (OCR)
  detectEntities?: boolean; // Extract maritime entities
  detailedDescription?: boolean; // Generate detailed description
}

export class PhotoClassificationService {
  private aiProxyEndpoint: string;

  constructor() {
    this.aiProxyEndpoint = process.env.AI_PROXY_ENDPOINT || 'http://localhost:8000/v1/chat/completions';

    console.log(`📸 Photo Classification Service initialized (AI Proxy: ${this.aiProxyEndpoint})`);
  }

  /**
   * Classify photo from URL
   */
  async classifyFromUrl(
    imageUrl: string,
    options?: ClassificationOptions
  ): Promise<ClassificationResult> {
    try {

      // Build prompt based on options
      let prompt = `Analyze this image and classify it into one of these categories:
- vessel: Photo of a ship or vessel
- damage: Damage inspection photo
- document: Document/paperwork photo (Bill of Lading, Invoice, Certificate, etc.)
- port: Port or terminal photo
- cargo: Cargo photo (containers, bulk cargo, etc.)
- crew: Crew or personnel photo
- equipment: Equipment or machinery photo
- other: Unclassified

Respond in JSON format:
{
  "category": "vessel|damage|document|port|cargo|crew|equipment|other",
  "confidence": 0.0-1.0,
  "description": "Brief description of what you see",
  "entities": {
    "vesselName": "if visible",
    "vesselType": "container ship, tanker, bulk carrier, etc.",
    "damageType": "if damage photo",
    "documentType": "if document photo",
    "portName": "if identifiable",
    "cargoType": "if cargo photo"
  },
  "tags": ["keyword1", "keyword2", ...]
}`;

      if (options?.detectText) {
        prompt += '\n\nAlso extract any visible text (OCR).';
      }

      if (options?.detectEntities) {
        prompt += '\n\nIdentify specific maritime entities (vessel names, IMO numbers, port names, etc.).';
      }

      if (options?.detailedDescription) {
        prompt += '\n\nProvide a detailed description suitable for maritime documentation.';
      }

      // Call AI Proxy Vision endpoint
      const response = await fetch(this.aiProxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o', // GPT-4o supports vision
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
              ],
            },
          ],
          max_tokens: 1000,
          temperature: 0.3, // Lower temperature for more deterministic classification
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Vision API error:', error);
        return {
          success: false,
          error: `Classification failed: ${response.statusText}`,
        };
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        return {
          success: false,
          error: 'No response from Vision API',
        };
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false,
          error: 'Failed to parse classification result',
        };
      }

      const classification = JSON.parse(jsonMatch[0]);

      console.log(
        `📸 Photo classified: ${classification.category} (${Math.round(classification.confidence * 100)}%)`
      );

      return {
        success: true,
        category: classification.category,
        confidence: classification.confidence,
        description: classification.description,
        entities: classification.entities,
        tags: classification.tags,
      };
    } catch (error: any) {
      console.error('Photo classification error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Classify WhatsApp image
   */
  async classifyWhatsAppImage(
    mediaId: string,
    accessToken: string,
    options?: ClassificationOptions
  ): Promise<ClassificationResult> {
    try {
      // Get media URL from WhatsApp
      const mediaInfoResponse = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!mediaInfoResponse.ok) {
        return {
          success: false,
          error: 'Failed to get WhatsApp media info',
        };
      }

      const mediaInfo = await mediaInfoResponse.json();

      if (!mediaInfo.url) {
        return {
          success: false,
          error: 'No media URL returned from WhatsApp',
        };
      }

      // Classify using the media URL
      return await this.classifyFromUrl(mediaInfo.url, options);
    } catch (error: any) {
      console.error('WhatsApp image classification error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Save classification to database
   */
  async saveClassification(
    messageId: string,
    classification: ClassificationResult
  ): Promise<void> {
    try {
      if (!classification.success) return;

      // Update message with classification data
      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: `[${classification.category}] ${classification.description}`,
          metadata: {
            classification: {
              category: classification.category,
              confidence: classification.confidence,
              description: classification.description,
              entities: classification.entities,
              tags: classification.tags,
              classifiedAt: new Date().toISOString(),
            },
          },
        },
      });

      // If vessel photo, try to link to vessel record
      if (classification.category === 'vessel' && classification.entities?.vesselName) {
        await this.linkToVessel(messageId, classification.entities.vesselName);
      }

      // If damage photo, create damage inspection record
      if (classification.category === 'damage') {
        await this.createDamageRecord(messageId, classification);
      }

      // If document photo, classify document type and create record
      if (classification.category === 'document' && classification.entities?.documentType) {
        await this.createDocumentRecord(messageId, classification);
      }
    } catch (error) {
      console.error('Failed to save classification:', error);
    }
  }

  /**
   * Link photo to vessel record
   */
  private async linkToVessel(messageId: string, vesselName: string): Promise<void> {
    try {
      // Search for vessel by name
      const vessel = await prisma.vessel.findFirst({
        where: {
          name: {
            contains: vesselName,
            mode: 'insensitive',
          },
        },
      });

      if (vessel) {
        console.log(`🔗 Linked photo to vessel: ${vessel.name}`);
        // Could create a VesselPhoto record here
      }
    } catch (error) {
      console.error('Failed to link to vessel:', error);
    }
  }

  /**
   * Create damage inspection record
   */
  private async createDamageRecord(
    messageId: string,
    classification: ClassificationResult
  ): Promise<void> {
    try {
      console.log(`📋 Damage inspection detected: ${classification.entities?.damageType}`);
      // Could create a DamageInspection record here
      // This would integrate with claims management system
    } catch (error) {
      console.error('Failed to create damage record:', error);
    }
  }

  /**
   * Create document record
   */
  private async createDocumentRecord(
    messageId: string,
    classification: ClassificationResult
  ): Promise<void> {
    try {
      console.log(`📄 Document detected: ${classification.entities?.documentType}`);
      // Could create a Document record here and trigger OCR extraction
      // This would integrate with DMS
    } catch (error) {
      console.error('Failed to create document record:', error);
    }
  }

  /**
   * Extract text from image (OCR)
   */
  async extractText(imageUrl: string): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      const response = await fetch(this.aiProxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all visible text from this image. Return only the extracted text, preserving formatting.',
                },
                { type: 'image_url', image_url: { url: imageUrl } },
              ],
            },
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `OCR failed: ${response.statusText}`,
        };
      }

      const result = await response.json();
      const text = result.choices?.[0]?.message?.content;

      return {
        success: true,
        text: text || '',
      };
    } catch (error: any) {
      console.error('Text extraction error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Batch classify multiple photos
   */
  async batchClassify(
    imageUrls: string[],
    options?: ClassificationOptions
  ): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = [];

    for (const url of imageUrls) {
      const result = await this.classifyFromUrl(url, options);
      results.push(result);

      // Rate limiting: wait 500ms between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Test classification service
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test AI Proxy connection with a simple chat request
      const response = await fetch(this.aiProxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: 'AI Proxy not available',
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `AI Proxy connection failed: ${error.message}`,
      };
    }
  }
}

export const photoClassificationService = new PhotoClassificationService();
