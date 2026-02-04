/**
 * PDF Extraction Service
 *
 * Unified PDF text extraction with multi-strategy fallback:
 * 1. pdf-parse (fast, text-based PDFs - 80%)
 * 2. tesseract.js OCR (scanned PDFs - 15%)
 * 3. @ankr/ocr escalation (complex/low-confidence - 5%)
 */

import * as pdfParse from 'pdf-parse';
import { tesseractOCR } from './hybrid/tesseract-ocr.js';
import { convertPdfToImages } from './pdf-to-image.js';

export interface ExtractionResult {
  text: string;
  confidence: number;
  method: 'pdf-parse' | 'tesseract' | 'ankr-ocr';
  pageCount: number;
  metadata?: {
    author?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export interface ExtractionOptions {
  preferOcr?: boolean;
  minConfidence?: number;
  maxPages?: number;
}

class PDFExtractionService {
  private readonly MIN_TEXT_QUALITY = 0.7;
  private readonly MIN_WORDS_PER_PAGE = 10;

  /**
   * Extract text from PDF using best available method
   */
  async extractText(
    pdfBuffer: Buffer,
    options: ExtractionOptions = {}
  ): Promise<ExtractionResult> {
    const { preferOcr = false, minConfidence = 0.8, maxPages = 100 } = options;

    try {
      // Strategy 1: Try pdf-parse first (unless OCR is preferred)
      if (!preferOcr) {
        const parseResult = await this.extractWithPdfParse(pdfBuffer);

        // Assess quality of extracted text
        const quality = this.assessTextQuality(parseResult.text, parseResult.pageCount);

        if (quality.isGood && quality.confidence >= minConfidence) {
          return {
            text: parseResult.text,
            confidence: quality.confidence,
            method: 'pdf-parse',
            pageCount: parseResult.pageCount,
            metadata: parseResult.metadata,
          };
        }

        console.log(`pdf-parse quality low (${quality.confidence.toFixed(2)}), trying OCR...`);
      }

      // Strategy 2: Tesseract OCR fallback
      const ocrResult = await this.extractWithTesseract(pdfBuffer, { maxPages });

      if (ocrResult.confidence >= minConfidence) {
        return ocrResult;
      }

      console.log(`Tesseract confidence low (${ocrResult.confidence.toFixed(2)}), escalating...`);

      // Strategy 3: @ankr/ocr escalation (not implemented yet, return tesseract result)
      // TODO: Implement @ankr/ocr integration when available
      return ocrResult;

    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw new Error(`Failed to extract text from PDF: ${error}`);
    }
  }

  /**
   * Extract text using pdf-parse (fast, text-based PDFs)
   */
  async extractWithPdfParse(pdfBuffer: Buffer): Promise<{
    text: string;
    pageCount: number;
    metadata: ExtractionResult['metadata'];
  }> {
    try {
      const data = await pdfParse(pdfBuffer);

      return {
        text: data.text,
        pageCount: data.numpages,
        metadata: {
          author: data.info?.Author,
          creator: data.info?.Creator,
          producer: data.info?.Producer,
          creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
          modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined,
        },
      };
    } catch (error) {
      console.error('pdf-parse extraction error:', error);
      throw new Error(`pdf-parse failed: ${error}`);
    }
  }

  /**
   * Extract text using Tesseract OCR (scanned PDFs)
   */
  async extractWithTesseract(
    pdfBuffer: Buffer,
    options: { maxPages?: number } = {}
  ): Promise<ExtractionResult> {
    try {
      const { maxPages = 100 } = options;

      // Convert PDF pages to images
      const images = await convertPdfToImages(pdfBuffer, { maxPages });

      if (images.length === 0) {
        throw new Error('No images extracted from PDF');
      }

      // OCR each page
      const pageResults = await Promise.all(
        images.map(async (imageBuffer, index) => {
          const result = await tesseractOCR.extractText(imageBuffer);
          return {
            page: index + 1,
            text: result.text,
            confidence: result.confidence,
          };
        })
      );

      // Combine results
      const combinedText = pageResults.map(r => r.text).join('\n\n');
      const avgConfidence = pageResults.reduce((sum, r) => sum + r.confidence, 0) / pageResults.length;

      return {
        text: combinedText,
        confidence: avgConfidence / 100, // Tesseract returns 0-100, normalize to 0-1
        method: 'tesseract',
        pageCount: pageResults.length,
      };
    } catch (error) {
      console.error('Tesseract extraction error:', error);
      throw new Error(`Tesseract OCR failed: ${error}`);
    }
  }

  /**
   * Extract text using @ankr/ocr (escalation for complex PDFs)
   * TODO: Implement when @ankr/ocr is available
   */
  async extractWithAnkrOCR(pdfBuffer: Buffer): Promise<ExtractionResult> {
    // Placeholder for @ankr/ocr integration
    throw new Error('@ankr/ocr integration not yet implemented');
  }

  /**
   * Assess quality of extracted text
   */
  assessTextQuality(text: string, pageCount: number): {
    isGood: boolean;
    confidence: number;
    metrics: {
      wordCount: number;
      wordsPerPage: number;
      hasNumbers: boolean;
      hasLetters: boolean;
      encodingIssues: number;
    };
  } {
    // Count words
    const words = text.trim().split(/\s+/);
    const wordCount = words.length;
    const wordsPerPage = pageCount > 0 ? wordCount / pageCount : 0;

    // Check for content
    const hasNumbers = /\d/.test(text);
    const hasLetters = /[a-zA-Z]/.test(text);

    // Check for encoding issues (mojibake)
    const encodingIssues = (text.match(/�|[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
    const encodingIssueRatio = encodingIssues / Math.max(text.length, 1);

    // Calculate confidence score
    let confidence = 1.0;

    // Penalize low word count
    if (wordsPerPage < this.MIN_WORDS_PER_PAGE) {
      confidence *= 0.5;
    }

    // Penalize missing content types
    if (!hasNumbers || !hasLetters) {
      confidence *= 0.7;
    }

    // Penalize encoding issues
    if (encodingIssueRatio > 0.01) {
      confidence *= 0.6;
    }

    // Penalize gibberish (too many single-character "words")
    const singleCharWords = words.filter(w => w.length === 1).length;
    const singleCharRatio = singleCharWords / Math.max(wordCount, 1);
    if (singleCharRatio > 0.3) {
      confidence *= 0.5;
    }

    const isGood = confidence >= this.MIN_TEXT_QUALITY;

    return {
      isGood,
      confidence,
      metrics: {
        wordCount,
        wordsPerPage,
        hasNumbers,
        hasLetters,
        encodingIssues,
      },
    };
  }

  /**
   * Extract text from specific pages
   */
  async extractPages(
    pdfBuffer: Buffer,
    pageNumbers: number[],
    options: ExtractionOptions = {}
  ): Promise<Map<number, ExtractionResult>> {
    // For now, extract entire PDF and return requested pages
    // TODO: Optimize to extract only specific pages
    const fullResult = await this.extractText(pdfBuffer, options);
    const pages = fullResult.text.split(/\n{3,}/); // Assume page breaks are 3+ newlines

    const results = new Map<number, ExtractionResult>();

    for (const pageNum of pageNumbers) {
      const pageIndex = pageNum - 1;
      if (pageIndex >= 0 && pageIndex < pages.length) {
        results.set(pageNum, {
          ...fullResult,
          text: pages[pageIndex],
          pageCount: 1,
        });
      }
    }

    return results;
  }

  /**
   * Check if a PDF is likely scanned (image-based)
   */
  async isScannedPDF(pdfBuffer: Buffer): Promise<boolean> {
    try {
      const parseResult = await this.extractWithPdfParse(pdfBuffer);
      const quality = this.assessTextQuality(parseResult.text, parseResult.pageCount);

      // If very few words per page, likely scanned
      return quality.metrics.wordsPerPage < this.MIN_WORDS_PER_PAGE;
    } catch {
      // If pdf-parse fails, assume it's scanned
      return true;
    }
  }
}

export const pdfExtractionService = new PDFExtractionService();
