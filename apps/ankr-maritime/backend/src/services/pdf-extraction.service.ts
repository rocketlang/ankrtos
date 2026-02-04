/**
 * PDF Extraction Service - Extract text from port tariff PDFs
 * Week 2 - Days 1-2: PDF Extraction Engine
 *
 * Strategy:
 * 1. Try pdf-parse first (fast, text-based PDFs - 80%)
 * 2. Fall back to tesseract.js OCR (scanned PDFs - 15%)
 * 3. Escalate to @ankr/eon (complex/low confidence - 5%)
 *
 * Performance:
 * - Text-based PDFs: <5 seconds
 * - Scanned PDFs (OCR): <30 seconds
 * - Complex PDFs (LLM): <60 seconds
 */

import fs from 'fs';
import path from 'path';
// Temporarily disabled - ESM import issue with pdf-parse (CommonJS module)
// import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';

export interface PDFExtractionResult {
  text: string;
  method: 'pdf-parse' | 'tesseract-ocr' | 'ankr-ocr';
  confidence: number;
  pageCount: number;
  extractionTime: number; // milliseconds
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface TextQualityAssessment {
  readableCharacters: number;
  totalCharacters: number;
  readabilityScore: number; // 0-1
  hasStructure: boolean;
  hasTables: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export class PDFExtractionService {
  private readonly READABILITY_THRESHOLD = 0.7; // 70% readable characters
  private readonly GOOD_QUALITY_THRESHOLD = 0.85; // 85% readability
  private readonly EXCELLENT_QUALITY_THRESHOLD = 0.95; // 95% readability

  /**
   * Extract text from PDF with automatic fallback strategy
   */
  async extractText(pdfPath: string): Promise<PDFExtractionResult> {
    const startTime = Date.now();

    console.log(`📄 Extracting text from PDF: ${path.basename(pdfPath)}`);

    // Step 1: Try pdf-parse (fast text extraction)
    const pdfParseResult = await this.extractWithPdfParse(pdfPath);
    const quality = this.assessTextQuality(pdfParseResult.text);

    // If quality is good, return immediately
    if (quality.readabilityScore >= this.READABILITY_THRESHOLD) {
      const extractionTime = Date.now() - startTime;
      console.log(
        `✅ pdf-parse succeeded: ${quality.readabilityScore.toFixed(2)} quality, ${extractionTime}ms`
      );

      return {
        text: pdfParseResult.text,
        method: 'pdf-parse',
        confidence: quality.readabilityScore,
        pageCount: pdfParseResult.pageCount,
        extractionTime,
        quality: quality.quality,
      };
    }

    console.log(
      `⚠️ pdf-parse quality low (${quality.readabilityScore.toFixed(2)}), trying OCR...`
    );

    // Step 2: Try Tesseract OCR (for scanned PDFs)
    const ocrResult = await this.extractWithTesseract(pdfPath);
    const ocrQuality = this.assessTextQuality(ocrResult.text);

    // If OCR quality is better, use it
    if (ocrQuality.readabilityScore > quality.readabilityScore) {
      const extractionTime = Date.now() - startTime;
      console.log(
        `✅ Tesseract OCR succeeded: ${ocrQuality.readabilityScore.toFixed(2)} quality, ${extractionTime}ms`
      );

      return {
        text: ocrResult.text,
        method: 'tesseract-ocr',
        confidence: ocrQuality.readabilityScore * 0.9, // OCR is less reliable
        pageCount: pdfParseResult.pageCount,
        extractionTime,
        quality: ocrQuality.quality,
      };
    }

    // Step 3: If both methods failed, return best attempt
    const extractionTime = Date.now() - startTime;
    console.log(
      `⚠️ Low quality extraction: ${quality.readabilityScore.toFixed(2)}, consider manual review`
    );

    return {
      text: pdfParseResult.text,
      method: 'pdf-parse',
      confidence: quality.readabilityScore,
      pageCount: pdfParseResult.pageCount,
      extractionTime,
      quality: quality.quality,
    };
  }

  /**
   * Extract text using pdf-parse (fast, text-based PDFs)
   * TEMPORARILY DISABLED - ESM import issue with pdf-parse
   */
  private async extractWithPdfParse(
    pdfPath: string
  ): Promise<{ text: string; pageCount: number }> {
    console.warn('⚠️  pdf-parse temporarily disabled (ESM import issue)');
    return { text: '', pageCount: 0 };

    // TODO: Re-enable once pdf-parse ESM import is fixed
    // try {
    //   const dataBuffer = fs.readFileSync(pdfPath);
    //   const data = await pdfParse(dataBuffer);
    //
    //   return {
    //     text: data.text,
    //     pageCount: data.numpages,
    //   };
    // } catch (error: any) {
    //   console.error('pdf-parse error:', error.message);
    //   return { text: '', pageCount: 0 };
    // }
  }

  /**
   * Extract text using Tesseract OCR (for scanned PDFs)
   */
  private async extractWithTesseract(pdfPath: string): Promise<{ text: string }> {
    try {
      // Note: This requires converting PDF pages to images first
      // For now, return empty string - will implement full OCR pipeline later
      console.log('⚠️ Tesseract OCR not fully implemented, returning empty');
      return { text: '' };

      // Full implementation would:
      // 1. Convert PDF to images using pdf-poppler or similar
      // 2. Run Tesseract on each page
      // 3. Combine results
      /*
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      const { data: { text } } = await worker.recognize(imagePath);
      await worker.terminate();

      return { text };
      */
    } catch (error: any) {
      console.error('Tesseract error:', error.message);
      return { text: '' };
    }
  }

  /**
   * Assess the quality of extracted text
   */
  assessTextQuality(text: string): TextQualityAssessment {
    if (!text || text.length === 0) {
      return {
        readableCharacters: 0,
        totalCharacters: 0,
        readabilityScore: 0,
        hasStructure: false,
        hasTables: false,
        quality: 'poor',
      };
    }

    const totalCharacters = text.length;
    const readableCharacters = this.countReadableCharacters(text);
    const readabilityScore = readableCharacters / totalCharacters;

    // Check for structure indicators
    const hasStructure = this.hasStructuralElements(text);
    const hasTables = this.hasTableStructure(text);

    // Determine quality level
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (readabilityScore >= this.EXCELLENT_QUALITY_THRESHOLD) {
      quality = 'excellent';
    } else if (readabilityScore >= this.GOOD_QUALITY_THRESHOLD) {
      quality = 'good';
    } else if (readabilityScore >= this.READABILITY_THRESHOLD) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }

    return {
      readableCharacters,
      totalCharacters,
      readabilityScore,
      hasStructure,
      hasTables,
      quality,
    };
  }

  /**
   * Count readable characters (letters, numbers, common punctuation)
   */
  private countReadableCharacters(text: string): number {
    // Match alphanumeric, spaces, and common punctuation
    const readablePattern = /[a-zA-Z0-9\s.,;:!?()\-$€£¥%]/g;
    const matches = text.match(readablePattern);
    return matches ? matches.length : 0;
  }

  /**
   * Check if text has structural elements (headers, lists, sections)
   */
  private hasStructuralElements(text: string): boolean {
    // Look for common structural patterns
    const patterns = [
      /\n\d+\.\s/g, // Numbered lists (1. , 2. , etc.)
      /\n[A-Z][a-z]+:/g, // Headers with colons (Title:)
      /\n\s*-\s/g, // Bullet points
      /SECTION|CHAPTER|ARTICLE/i, // Section headers
    ];

    return patterns.some((pattern) => pattern.test(text));
  }

  /**
   * Check if text has table-like structure
   */
  private hasTableStructure(text: string): boolean {
    // Look for table indicators
    const lines = text.split('\n');

    // Count lines with multiple spaces/tabs (table columns)
    const tableLines = lines.filter((line) => {
      const spacedWords = line.split(/\s{2,}/).length;
      return spacedWords >= 3; // At least 3 columns
    });

    // If >10% of lines look like table rows, assume table structure
    return tableLines.length > lines.length * 0.1;
  }

  /**
   * Extract metadata from PDF
   * TEMPORARILY DISABLED - ESM import issue with pdf-parse
   */
  async extractMetadata(pdfPath: string): Promise<{
    title?: string;
    author?: string;
    creationDate?: Date;
    pages: number;
  }> {
    console.warn('⚠️  pdf-parse metadata extraction temporarily disabled (ESM import issue)');
    return { pages: 0 };

    // TODO: Re-enable once pdf-parse ESM import is fixed
    // try {
    //   const dataBuffer = fs.readFileSync(pdfPath);
    //   const data = await pdfParse(dataBuffer);
    //
    //   return {
    //     title: data.info?.Title,
    //     author: data.info?.Author,
    //     creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
    //     pages: data.numpages,
    //   };
    // } catch (error: any) {
    //   console.error('Metadata extraction error:', error.message);
    //   return { pages: 0 };
    // }
  }

  /**
   * Validate PDF file
   */
  validatePDF(pdfPath: string): { valid: boolean; error?: string } {
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      return { valid: false, error: 'File does not exist' };
    }

    // Check if file is readable
    try {
      fs.accessSync(pdfPath, fs.constants.R_OK);
    } catch {
      return { valid: false, error: 'File is not readable' };
    }

    // Check file extension
    if (!pdfPath.toLowerCase().endsWith('.pdf')) {
      return { valid: false, error: 'File is not a PDF' };
    }

    // Check file size (max 50MB)
    const stats = fs.statSync(pdfPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }

    return { valid: true };
  }
}

// Singleton instance
let pdfExtractionService: PDFExtractionService | null = null;

export function getPDFExtractionService(): PDFExtractionService {
  if (!pdfExtractionService) {
    pdfExtractionService = new PDFExtractionService();
  }
  return pdfExtractionService;
}
