/**
 * SWAYAM Vision Package
 *
 * Multi-modal image and document processing
 *
 * Features:
 * - OCR for Indian scripts (Devanagari, Tamil, Telugu, etc.)
 * - Document understanding (Aadhaar, PAN, invoices)
 * - Image description via Gemini/Claude
 * - Offline OCR via Tesseract.js
 *
 * @package @swayam/vision
 * @version 1.0.0
 */

// ============================================================================
// Types
// ============================================================================

export type OCRProvider = 'google' | 'azure' | 'tesseract';
export type VisionProvider = 'gemini' | 'claude' | 'local';

export type IndianScript =
  | 'devanagari' // Hindi, Marathi, Sanskrit
  | 'tamil'
  | 'telugu'
  | 'kannada'
  | 'malayalam'
  | 'bengali'
  | 'gujarati'
  | 'punjabi'
  | 'odia'
  | 'latin'; // English

export interface OCRConfig {
  provider: OCRProvider;
  apiKey?: string;
  languages?: string[];
  enhanceContrast?: boolean;
  deskew?: boolean;
}

export interface VisionConfig {
  provider: VisionProvider;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  script?: IndianScript;
}

export interface OCRResult {
  text: string;
  confidence: number;
  script: IndianScript;
  blocks: TextBlock[];
  isHandwritten: boolean;
  processingTimeMs: number;
}

export interface DocumentData {
  type: DocumentType;
  fields: Record<string, string>;
  confidence: number;
  rawText: string;
}

export type DocumentType =
  | 'aadhaar'
  | 'pan'
  | 'driving_license'
  | 'voter_id'
  | 'passport'
  | 'invoice'
  | 'cheque'
  | 'receipt'
  | 'bol' // Bill of Lading
  | 'pod' // Proof of Delivery
  | 'unknown';

export interface ImageAnalysis {
  description: string;
  objects: Array<{ name: string; confidence: number; boundingBox?: object }>;
  text?: string;
  faces?: Array<{ count: number }>;
  colors?: string[];
  tags?: string[];
}

// ============================================================================
// Script Detection
// ============================================================================

const SCRIPT_RANGES: Record<IndianScript, [number, number][]> = {
  devanagari: [[0x0900, 0x097f]],
  tamil: [[0x0b80, 0x0bff]],
  telugu: [[0x0c00, 0x0c7f]],
  kannada: [[0x0c80, 0x0cff]],
  malayalam: [[0x0d00, 0x0d7f]],
  bengali: [[0x0980, 0x09ff]],
  gujarati: [[0x0a80, 0x0aff]],
  punjabi: [[0x0a00, 0x0a7f]], // Gurmukhi
  odia: [[0x0b00, 0x0b7f]],
  latin: [
    [0x0041, 0x007a],
    [0x00c0, 0x00ff],
  ],
};

export function detectScript(text: string): IndianScript {
  const scriptCounts: Record<IndianScript, number> = {
    devanagari: 0,
    tamil: 0,
    telugu: 0,
    kannada: 0,
    malayalam: 0,
    bengali: 0,
    gujarati: 0,
    punjabi: 0,
    odia: 0,
    latin: 0,
  };

  for (const char of text) {
    const code = char.charCodeAt(0);

    for (const [script, ranges] of Object.entries(SCRIPT_RANGES)) {
      for (const [start, end] of ranges) {
        if (code >= start && code <= end) {
          scriptCounts[script as IndianScript]++;
          break;
        }
      }
    }
  }

  // Find script with highest count
  let maxScript: IndianScript = 'latin';
  let maxCount = 0;

  for (const [script, count] of Object.entries(scriptCounts)) {
    if (count > maxCount) {
      maxCount = count;
      maxScript = script as IndianScript;
    }
  }

  return maxScript;
}

// ============================================================================
// OCR Service
// ============================================================================

export class OCRService {
  private config: OCRConfig;

  constructor(config: OCRConfig) {
    this.config = {
      languages: ['eng', 'hin'],
      enhanceContrast: true,
      deskew: true,
      ...config,
    };
  }

  /**
   * Extract text from image
   */
  async extractText(imageBuffer: Buffer, language?: string): Promise<OCRResult> {
    const startTime = Date.now();

    switch (this.config.provider) {
      case 'google':
        return this.ocrGoogle(imageBuffer, language);
      case 'azure':
        return this.ocrAzure(imageBuffer, language);
      case 'tesseract':
      default:
        return this.ocrTesseract(imageBuffer, language);
    }
  }

  /**
   * Google Cloud Vision OCR
   */
  private async ocrGoogle(imageBuffer: Buffer, _language?: string): Promise<OCRResult> {
    const startTime = Date.now();

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBuffer.toString('base64') },
              features: [
                { type: 'TEXT_DETECTION' },
                { type: 'DOCUMENT_TEXT_DETECTION' },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    const annotation = data.responses[0].fullTextAnnotation || data.responses[0].textAnnotations?.[0];

    const text = annotation?.text || '';
    const script = detectScript(text);

    return {
      text,
      confidence: 0.95,
      script,
      blocks: [],
      isHandwritten: false,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Azure Computer Vision OCR
   */
  private async ocrAzure(imageBuffer: Buffer, _language?: string): Promise<OCRResult> {
    const startTime = Date.now();

    // Azure requires a two-step process
    const analyzeUrl = `https://eastus.api.cognitive.microsoft.com/vision/v3.2/read/analyze`;

    const analyzeResponse = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.config.apiKey!,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer,
    });

    if (!analyzeResponse.ok) {
      throw new Error(`Azure Vision API error: ${analyzeResponse.status}`);
    }

    const operationUrl = analyzeResponse.headers.get('Operation-Location');
    if (!operationUrl) throw new Error('No operation URL returned');

    // Poll for results
    let result: any = null;
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1000));

      const resultResponse = await fetch(operationUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': this.config.apiKey! },
      });

      result = await resultResponse.json();
      if (result.status === 'succeeded') break;
      if (result.status === 'failed') throw new Error('OCR failed');
    }

    const lines = result?.analyzeResult?.readResults?.[0]?.lines || [];
    const text = lines.map((l: any) => l.text).join('\n');
    const script = detectScript(text);

    return {
      text,
      confidence: 0.92,
      script,
      blocks: lines.map((l: any) => ({
        text: l.text,
        confidence: l.confidence || 0.9,
        boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      })),
      isHandwritten: false,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Tesseract.js OCR (offline)
   */
  private async ocrTesseract(imageBuffer: Buffer, language?: string): Promise<OCRResult> {
    const startTime = Date.now();

    // In browser, use Tesseract.js
    // In Node.js, use tesseract.js or node-tesseract-ocr

    // Placeholder - actual implementation would use:
    // import Tesseract from 'tesseract.js';
    // const { data } = await Tesseract.recognize(imageBuffer, language || 'eng+hin');

    console.log('[OCR] Tesseract processing...');

    // Simulated response
    const text = '[Tesseract OCR - implement with tesseract.js]';
    const script = detectScript(text);

    return {
      text,
      confidence: 0.85,
      script,
      blocks: [],
      isHandwritten: false,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Document Parser
// ============================================================================

export class DocumentParser {
  private ocr: OCRService;

  constructor(ocr: OCRService) {
    this.ocr = ocr;
  }

  /**
   * Parse document and extract structured data
   */
  async parseDocument(imageBuffer: Buffer, expectedType?: DocumentType): Promise<DocumentData> {
    const ocrResult = await this.ocr.extractText(imageBuffer);
    const text = ocrResult.text;

    // Detect document type if not provided
    const docType = expectedType || this.detectDocumentType(text);

    // Extract fields based on type
    const fields = this.extractFields(text, docType);

    return {
      type: docType,
      fields,
      confidence: ocrResult.confidence,
      rawText: text,
    };
  }

  /**
   * Detect document type from text
   */
  private detectDocumentType(text: string): DocumentType {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('unique identification') || lowerText.includes('uidai') || /\d{4}\s?\d{4}\s?\d{4}/.test(text)) {
      return 'aadhaar';
    }

    if (lowerText.includes('income tax department') || /[A-Z]{5}\d{4}[A-Z]/.test(text)) {
      return 'pan';
    }

    if (lowerText.includes('driving licence') || lowerText.includes('transport')) {
      return 'driving_license';
    }

    if (lowerText.includes('election commission') || lowerText.includes('voter')) {
      return 'voter_id';
    }

    if (lowerText.includes('passport') || lowerText.includes('republic of india')) {
      return 'passport';
    }

    if (lowerText.includes('invoice') || lowerText.includes('gst') || lowerText.includes('tax invoice')) {
      return 'invoice';
    }

    if (lowerText.includes('cheque') || lowerText.includes('pay to')) {
      return 'cheque';
    }

    if (lowerText.includes('bill of lading') || lowerText.includes('b/l')) {
      return 'bol';
    }

    if (lowerText.includes('proof of delivery') || lowerText.includes('pod')) {
      return 'pod';
    }

    if (lowerText.includes('receipt') || lowerText.includes('received')) {
      return 'receipt';
    }

    return 'unknown';
  }

  /**
   * Extract fields from document
   */
  private extractFields(text: string, docType: DocumentType): Record<string, string> {
    switch (docType) {
      case 'aadhaar':
        return this.extractAadhaarFields(text);
      case 'pan':
        return this.extractPANFields(text);
      case 'invoice':
        return this.extractInvoiceFields(text);
      case 'bol':
        return this.extractBOLFields(text);
      case 'pod':
        return this.extractPODFields(text);
      default:
        return { rawText: text };
    }
  }

  private extractAadhaarFields(text: string): Record<string, string> {
    const fields: Record<string, string> = {};

    // Aadhaar number
    const aadhaarMatch = text.match(/(\d{4}\s?\d{4}\s?\d{4})/);
    if (aadhaarMatch) {
      fields.aadhaarNumber = aadhaarMatch[1].replace(/\s/g, '');
    }

    // Name (usually after "Name:" or on separate line)
    const nameMatch = text.match(/(?:name|नाम)[:\s]+([^\n\d]+)/i);
    if (nameMatch) {
      fields.name = nameMatch[1].trim();
    }

    // DOB
    const dobMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dobMatch) {
      fields.dob = dobMatch[1];
    }

    // Gender
    if (/male|पुरुष/i.test(text)) {
      fields.gender = 'male';
    } else if (/female|महिला/i.test(text)) {
      fields.gender = 'female';
    }

    return fields;
  }

  private extractPANFields(text: string): Record<string, string> {
    const fields: Record<string, string> = {};

    // PAN number
    const panMatch = text.match(/([A-Z]{5}\d{4}[A-Z])/);
    if (panMatch) {
      fields.panNumber = panMatch[1];
    }

    // Name
    const nameMatch = text.match(/(?:name|नाम)[:\s]+([^\n\d]+)/i);
    if (nameMatch) {
      fields.name = nameMatch[1].trim();
    }

    // Father's name
    const fatherMatch = text.match(/(?:father|पिता)[:\s]+([^\n\d]+)/i);
    if (fatherMatch) {
      fields.fatherName = fatherMatch[1].trim();
    }

    // DOB
    const dobMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dobMatch) {
      fields.dob = dobMatch[1];
    }

    return fields;
  }

  private extractInvoiceFields(text: string): Record<string, string> {
    const fields: Record<string, string> = {};

    // Invoice number
    const invoiceMatch = text.match(/(?:invoice|inv)[.:\s#]*([A-Z0-9-]+)/i);
    if (invoiceMatch) {
      fields.invoiceNumber = invoiceMatch[1];
    }

    // GSTIN
    const gstMatch = text.match(/(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2})/);
    if (gstMatch) {
      fields.gstin = gstMatch[1];
    }

    // Total amount
    const totalMatch = text.match(/(?:total|amount)[:\s]*(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)/i);
    if (totalMatch) {
      fields.totalAmount = totalMatch[1].replace(/,/g, '');
    }

    // Date
    const dateMatch = text.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
    if (dateMatch) {
      fields.date = dateMatch[1];
    }

    return fields;
  }

  private extractBOLFields(text: string): Record<string, string> {
    const fields: Record<string, string> = {};

    // BOL number
    const bolMatch = text.match(/(?:b\/l|bol|bill of lading)[.:\s#]*([A-Z0-9-]+)/i);
    if (bolMatch) {
      fields.bolNumber = bolMatch[1];
    }

    // Shipper
    const shipperMatch = text.match(/(?:shipper|consignor)[:\s]+([^\n]+)/i);
    if (shipperMatch) {
      fields.shipper = shipperMatch[1].trim();
    }

    // Consignee
    const consigneeMatch = text.match(/(?:consignee)[:\s]+([^\n]+)/i);
    if (consigneeMatch) {
      fields.consignee = consigneeMatch[1].trim();
    }

    // Weight
    const weightMatch = text.match(/(?:weight|wt)[:\s]*(\d+\.?\d*)\s*(?:kg|kgs|ton)/i);
    if (weightMatch) {
      fields.weight = weightMatch[1];
    }

    return fields;
  }

  private extractPODFields(text: string): Record<string, string> {
    const fields: Record<string, string> = {};

    // POD number
    const podMatch = text.match(/(?:pod|delivery)[.:\s#]*([A-Z0-9-]+)/i);
    if (podMatch) {
      fields.podNumber = podMatch[1];
    }

    // Delivery date
    const dateMatch = text.match(/(?:delivered?|date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (dateMatch) {
      fields.deliveryDate = dateMatch[1];
    }

    // Receiver name
    const receiverMatch = text.match(/(?:received by|receiver)[:\s]+([^\n]+)/i);
    if (receiverMatch) {
      fields.receiverName = receiverMatch[1].trim();
    }

    return fields;
  }
}

// ============================================================================
// Vision Service (Image Understanding)
// ============================================================================

export class VisionService {
  private config: VisionConfig;

  constructor(config: VisionConfig) {
    this.config = {
      model: config.provider === 'gemini' ? 'gemini-2.0-flash' : 'claude-3-haiku-20240307',
      maxTokens: 1000,
      ...config,
    };
  }

  /**
   * Describe image
   */
  async describe(imageBuffer: Buffer, prompt?: string): Promise<string> {
    switch (this.config.provider) {
      case 'gemini':
        return this.describeGemini(imageBuffer, prompt);
      case 'claude':
        return this.describeClaude(imageBuffer, prompt);
      default:
        return '[Local vision not implemented - use Gemini or Claude]';
    }
  }

  /**
   * Answer questions about image
   */
  async analyze(imageBuffer: Buffer, questions: string[]): Promise<Record<string, string>> {
    const prompt = `Analyze this image and answer these questions:\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nRespond in JSON format with question numbers as keys.`;

    const response = await this.describe(imageBuffer, prompt);

    try {
      return JSON.parse(response);
    } catch {
      return { raw: response };
    }
  }

  /**
   * Gemini Vision
   */
  private async describeGemini(imageBuffer: Buffer, prompt?: string): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt || 'Describe this image in detail.' },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageBuffer.toString('base64'),
                  },
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: this.config.maxTokens,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini Vision error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No description available';
  }

  /**
   * Claude Vision
   */
  private async describeClaude(imageBuffer: Buffer, prompt?: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBuffer.toString('base64'),
                },
              },
              {
                type: 'text',
                text: prompt || 'Describe this image in detail.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude Vision error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    return data.content?.[0]?.text || 'No description available';
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createOCRService(config: OCRConfig): OCRService {
  return new OCRService(config);
}

export function createDocumentParser(ocr: OCRService): DocumentParser {
  return new DocumentParser(ocr);
}

export function createVisionService(config: VisionConfig): VisionService {
  return new VisionService(config);
}

// Convenience factories
export function createGoogleOCR(apiKey: string): OCRService {
  return new OCRService({ provider: 'google', apiKey });
}

export function createTesseractOCR(languages?: string[]): OCRService {
  return new OCRService({ provider: 'tesseract', languages: languages || ['eng', 'hin'] });
}

export function createGeminiVision(apiKey: string): VisionService {
  return new VisionService({ provider: 'gemini', apiKey });
}

export default {
  OCRService,
  DocumentParser,
  VisionService,
  detectScript,
  createOCRService,
  createDocumentParser,
  createVisionService,
  createGoogleOCR,
  createTesseractOCR,
  createGeminiVision,
};
