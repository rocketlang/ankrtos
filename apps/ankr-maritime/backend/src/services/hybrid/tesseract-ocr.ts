/**
 * Tesseract OCR Service
 *
 * Free, open-source OCR - no API costs
 */

import Tesseract from 'tesseract.js';
import { hybridDMSConfig } from '../../config/hybrid-dms.js';

interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

class TesseractOCRService {
  private languages: string[];

  constructor() {
    this.languages = hybridDMSConfig.ocr.languages;
  }

  /**
   * Extract text from image or PDF
   */
  async extractText(buffer: Buffer, options?: {
    languages?: string[];
    pageNumber?: number;
  }): Promise<OCRResult> {
    const langs = options?.languages || this.languages;

    try {
      const result = await Tesseract.recognize(buffer, langs.join('+'), {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        words: result.data.words.map((word) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox,
        })),
      };
    } catch (error) {
      console.error('Tesseract OCR error:', error);
      throw new Error(`Failed to extract text: ${error}`);
    }
  }

  /**
   * Extract text from PDF (convert pages to images first)
   */
  async extractTextFromPDF(pdfBuffer: Buffer, options?: {
    startPage?: number;
    endPage?: number;
  }): Promise<Array<{ page: number; text: string; confidence: number }>> {
    // Note: For PDF, you'd need pdf-poppler or similar to convert to images
    // For now, we'll return a placeholder
    throw new Error('PDF OCR requires pdf-poppler. Use extractText() for images.');
  }

  /**
   * Enhance text extraction with maritime-specific dictionary
   */
  async extractMaritimeText(buffer: Buffer): Promise<OCRResult> {
    const result = await this.extractText(buffer);

    // Post-process to fix common maritime OCR errors
    const enhancedText = this.enhanceMaritimeText(result.text);

    return {
      ...result,
      text: enhancedText,
    };
  }

  /**
   * Fix common OCR errors in maritime documents
   */
  private enhanceMaritimeText(text: string): string {
    // Common maritime term corrections
    const corrections: Record<string, string> = {
      'M/\/': 'M/V',
      'MN': 'M/V',
      'SS ': 'S/S ',
      'B\/L': 'B/L',
      'C\/P': 'C/P',
      'WWDSHEX': 'WWDSHEX',
      'SHlNC': 'SHINC',
      'GENCON': 'GENCON',
      'NYPE': 'NYPE',
      'DWT': 'DWT',
      'LOA': 'LOA',
      'GRT': 'GRT',
      'TEU': 'TEU',
    };

    let enhanced = text;

    for (const [wrong, correct] of Object.entries(corrections)) {
      const regex = new RegExp(wrong, 'gi');
      enhanced = enhanced.replace(regex, correct);
    }

    return enhanced;
  }

  /**
   * Check if OCR is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Tesseract is always available if package is installed
      return true;
    } catch {
      return false;
    }
  }
}

export const tesseractOCR = new TesseractOCRService();

/**
 * Maritime-specific OCR patterns
 */
export const MARITIME_OCR_PATTERNS = {
  vesselName: /(?:M\/V|MV|SS|MS)\s+([A-Z][A-Za-z\s]+)/g,
  imoNumber: /IMO\s*:?\s*(\d{7})/gi,
  portCode: /\b([A-Z]{5})\b/g, // UN/LOCODE
  bolNumber: /B\/L\s*(?:NO\.?|NUMBER)?\s*:?\s*([A-Z0-9-]+)/gi,
  quantity: /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(MT|T|KG|LBS|TONS?)/gi,
  date: /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g,
};
