/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OCR DEMO - Canvas Preprocessing + Google Vision Fallback
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 * 
 * FLOW:
 * 1. Canvas preprocessing (sharpen, contrast, scale)
 * 2. Tesseract.js (FREE)
 * 3. If confidence < 50% → Google Vision API (PAID fallback)
 * 
 * GOOGLE VISION PRICING:
 * - First 1,000/month: FREE
 * - 1,001-5M: $1.50 per 1,000
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useCallback } from 'react';
import { createWorker, Worker } from 'tesseract.js';
import { 
  Camera, Upload, FileText, Loader2, CheckCircle, AlertCircle,
  Truck, FileCheck, Receipt, Scale, ClipboardList, Languages,
  Copy, RotateCcw, Zap, Eye, Info, Hash, Calendar, Phone,
  Mail, IndianRupee, MapPin, CreditCard, User, Building, FileType,
  Settings, Sliders, Cloud, Cpu
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type DocumentType = 'pod' | 'lr' | 'invoice' | 'eway' | 'weighment' | 'challan' | 'general';
type SupportedLanguage = 'eng' | 'hin' | 'tam' | 'tel' | 'mar' | 'guj' | 'ben' | 'kan' | 'mal' | 'pan' | 'ori';
type OCREngine = 'tesseract' | 'google-vision' | 'auto';

interface ExtractedField {
  label: string;
  value: string;
  type: string;
  icon: React.ElementType;
  confidence?: 'high' | 'medium' | 'low';
}

interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  engine: string;
  processingTime: number;
  documentType: DocumentType;
  extractedFields: ExtractedField[];
  lines: string[];
  wordCount: number;
  preprocessed?: boolean;
  fallbackUsed?: boolean;
}

interface PreprocessingOptions {
  scale: number;
  contrast: number;
  brightness: number;
  sharpen: boolean;
  grayscale: boolean;
  denoise: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const LANGUAGES: { code: SupportedLanguage; name: string; native: string }[] = [
  { code: 'eng', name: 'English', native: 'English' },
  { code: 'hin', name: 'Hindi', native: 'हिंदी' },
  { code: 'tam', name: 'Tamil', native: 'தமிழ்' },
  { code: 'tel', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mar', name: 'Marathi', native: 'मराठी' },
  { code: 'guj', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ben', name: 'Bengali', native: 'বাংলা' },
  { code: 'kan', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'mal', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pan', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ori', name: 'Odia', native: 'ଓଡ଼ିଆ' },
];

const DOC_TYPES: { type: DocumentType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'general', label: 'General', icon: FileType, color: 'bg-gray-500' },
  { type: 'lr', label: 'Lorry Receipt', icon: Truck, color: 'bg-blue-500' },
  { type: 'pod', label: 'POD', icon: FileCheck, color: 'bg-green-500' },
  { type: 'invoice', label: 'Invoice', icon: Receipt, color: 'bg-purple-500' },
  { type: 'eway', label: 'E-Way Bill', icon: ClipboardList, color: 'bg-orange-500' },
  { type: 'weighment', label: 'Weighment', icon: Scale, color: 'bg-cyan-500' },
  { type: 'challan', label: 'Challan', icon: FileText, color: 'bg-pink-500' },
];

const DEFAULT_PREPROCESSING: PreprocessingOptions = {
  scale: 2,        // 2x upscale for better OCR
  contrast: 1.4,   // Increase contrast
  brightness: 1.1, // Slight brightness boost
  sharpen: true,   // Apply sharpening
  grayscale: true, // Convert to grayscale
  denoise: true,   // Apply noise reduction
};

// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS IMAGE PREPROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

async function preprocessImage(
  imageData: string, 
  options: PreprocessingOptions = DEFAULT_PREPROCESSING
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Create canvas with scaled dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Scale up for better OCR
      const newWidth = img.width * options.scale;
      const newHeight = img.height * options.scale;
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw scaled image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Get image data for pixel manipulation
      let imageDataObj = ctx.getImageData(0, 0, newWidth, newHeight);
      let data = imageDataObj.data;

      // Convert to grayscale (improves OCR significantly)
      if (options.grayscale) {
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray;     // R
          data[i + 1] = gray; // G
          data[i + 2] = gray; // B
        }
      }

      // Apply contrast and brightness
      const contrast = options.contrast;
      const brightness = options.brightness;
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
      
      for (let i = 0; i < data.length; i += 4) {
        // Contrast
        data[i] = factor * (data[i] - 128) + 128;
        data[i + 1] = factor * (data[i + 1] - 128) + 128;
        data[i + 2] = factor * (data[i + 2] - 128) + 128;
        
        // Brightness
        data[i] = data[i] * brightness;
        data[i + 1] = data[i + 1] * brightness;
        data[i + 2] = data[i + 2] * brightness;
        
        // Clamp values
        data[i] = Math.min(255, Math.max(0, data[i]));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1]));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2]));
      }

      // Simple denoise (3x3 median-like filter)
      if (options.denoise) {
        const width = newWidth;
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < newHeight - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            
            // Average of neighbors for each channel
            for (let c = 0; c < 3; c++) {
              let sum = 0;
              let count = 0;
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  const nidx = ((y + dy) * width + (x + dx)) * 4 + c;
                  sum += tempData[nidx];
                  count++;
                }
              }
              data[idx + c] = sum / count;
            }
          }
        }
      }

      // Apply sharpening (unsharp mask approximation)
      if (options.sharpen) {
        const width = newWidth;
        const tempData = new Uint8ClampedArray(data);
        const sharpenAmount = 0.5;
        
        for (let y = 1; y < newHeight - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            
            for (let c = 0; c < 3; c++) {
              // Simple edge enhancement
              const center = tempData[idx + c];
              const neighbors = (
                tempData[((y - 1) * width + x) * 4 + c] +
                tempData[((y + 1) * width + x) * 4 + c] +
                tempData[(y * width + x - 1) * 4 + c] +
                tempData[(y * width + x + 1) * 4 + c]
              ) / 4;
              
              const sharpened = center + (center - neighbors) * sharpenAmount;
              data[idx + c] = Math.min(255, Math.max(0, sharpened));
            }
          }
        }
      }

      // Binarization (threshold) for very poor images
      // Commented out - can be too aggressive
      // const threshold = 128;
      // for (let i = 0; i < data.length; i += 4) {
      //   const v = data[i] > threshold ? 255 : 0;
      //   data[i] = data[i + 1] = data[i + 2] = v;
      // }

      ctx.putImageData(imageDataObj, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageData;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE VISION API (Fallback)
// ═══════════════════════════════════════════════════════════════════════════════

async function callGoogleVision(imageData: string, apiKey: string): Promise<{ text: string; confidence: number }> {
  // Remove data URL prefix to get base64
  const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');
  
  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: base64 },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
        imageContext: {
          languageHints: ['en', 'hi'] // English + Hindi
        }
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Google Vision API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.responses?.[0]?.error) {
    throw new Error(data.responses[0].error.message);
  }

  const fullTextAnnotation = data.responses?.[0]?.fullTextAnnotation;
  if (!fullTextAnnotation) {
    return { text: '', confidence: 0 };
  }

  // Calculate average confidence from pages
  let totalConfidence = 0;
  let blockCount = 0;
  fullTextAnnotation.pages?.forEach((page: any) => {
    page.blocks?.forEach((block: any) => {
      if (block.confidence) {
        totalConfidence += block.confidence;
        blockCount++;
      }
    });
  });

  return {
    text: fullTextAnnotation.text || '',
    confidence: blockCount > 0 ? (totalConfidence / blockCount) * 100 : 85 // Default 85% if no confidence data
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL EXTRACTION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

const UNIVERSAL_PATTERNS = {
  dateIndian: /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\b/g,
  phoneIndian: /(?:\+91[\s\-]?)?[6-9]\d{9}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  url: /https?:\/\/[^\s]+/g,
  amountRupee: /(?:Rs\.?|₹|INR)\s*([0-9,]+(?:\.\d{1,2})?)/gi,
  gstin: /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1})\b/g,
  pan: /\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/g,
  vehicleNumber: /\b([A-Z]{2}[\s\-]?\d{1,2}[\s\-]?[A-Z]{1,3}[\s\-]?\d{4})\b/gi,
  invoiceNo: /(?:Invoice|Inv|Bill)[\s\.:№#]*(?:No\.?)?[\s\.:]*([A-Z0-9\-\/]+)/gi,
  lrNumber: /(?:LR|L\.R\.|GC|GR|CN|Consignment)[\s\.:№#]*(?:No\.?)?[\s\.:]*([A-Z0-9\-\/]+)/gi,
  ewayBill: /(?:E-?Way|EWB)[\s\.:]*(?:Bill)?[\s\.:]*(?:No\.?)?[\s\.:]*(\d{12,15})/gi,
  weight: /(\d+(?:[.,]\d+)?)\s*(?:kg|KG|Kg|MT|ton|quintal)/gi,
  quantity: /(\d+)\s*(?:pcs?|pieces?|units?|nos?|boxes?|bags?|cartons?)/gi,
  ifsc: /\b([A-Z]{4}0[A-Z0-9]{6})\b/g,
};

function extractUniversalFields(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const seen = new Set<string>();
  
  const addField = (label: string, value: string, type: string, icon: React.ElementType, confidence: 'high' | 'medium' | 'low' = 'high') => {
    const key = `${type}:${value}`;
    if (!seen.has(key) && value.trim()) {
      seen.add(key);
      fields.push({ label, value: value.trim(), type, icon, confidence });
    }
  };

  // GSTIN
  const gstinMatches = text.match(UNIVERSAL_PATTERNS.gstin);
  gstinMatches?.forEach(m => addField('GSTIN', m, 'gstin', Building, 'high'));

  // PAN
  const panMatches = text.match(UNIVERSAL_PATTERNS.pan);
  panMatches?.forEach(m => {
    if (!gstinMatches?.some(g => g.includes(m))) {
      addField('PAN', m, 'pan', CreditCard, 'high');
    }
  });

  // Vehicle Numbers
  const vehicleMatches = text.match(UNIVERSAL_PATTERNS.vehicleNumber);
  vehicleMatches?.forEach(m => addField('Vehicle No', m.toUpperCase().replace(/\s+/g, '-'), 'vehicle', Truck, 'high'));

  // E-Way Bill
  let ewayMatch;
  while ((ewayMatch = UNIVERSAL_PATTERNS.ewayBill.exec(text)) !== null) {
    addField('E-Way Bill', ewayMatch[1], 'eway', ClipboardList, 'high');
    break;
  }
  UNIVERSAL_PATTERNS.ewayBill.lastIndex = 0;

  // Emails
  const emailMatches = text.match(UNIVERSAL_PATTERNS.email);
  emailMatches?.forEach(m => addField('Email', m.toLowerCase(), 'email', Mail, 'high'));

  // Phone Numbers
  const phoneMatches = text.match(UNIVERSAL_PATTERNS.phoneIndian);
  phoneMatches?.slice(0, 3).forEach((m, i) => addField(i === 0 ? 'Phone' : `Phone ${i + 1}`, m.replace(/\s+/g, ''), 'phone', Phone, 'high'));

  // Dates
  const dateMatches = text.match(UNIVERSAL_PATTERNS.dateIndian);
  dateMatches?.slice(0, 3).forEach((m, i) => addField(i === 0 ? 'Date' : `Date ${i + 1}`, m, 'date', Calendar, 'medium'));

  // Amounts
  const amountMatches = text.match(UNIVERSAL_PATTERNS.amountRupee);
  amountMatches?.slice(0, 3).forEach((m, i) => {
    const value = m.replace(/[Rs\.₹INR\s]/gi, '').trim();
    if (value && parseInt(value.replace(/,/g, '')) > 0) {
      addField(i === 0 ? 'Amount' : `Amount ${i + 1}`, '₹' + value, 'amount', IndianRupee, 'medium');
    }
  });

  // Invoice Numbers
  let invMatch;
  while ((invMatch = UNIVERSAL_PATTERNS.invoiceNo.exec(text)) !== null) {
    addField('Invoice No', invMatch[1], 'invoice', Receipt, 'medium');
    break;
  }
  UNIVERSAL_PATTERNS.invoiceNo.lastIndex = 0;

  // LR Numbers
  let lrMatch;
  while ((lrMatch = UNIVERSAL_PATTERNS.lrNumber.exec(text)) !== null) {
    addField('LR No', lrMatch[1], 'lr', FileText, 'medium');
    break;
  }
  UNIVERSAL_PATTERNS.lrNumber.lastIndex = 0;

  // Weights
  const weightMatches = text.match(UNIVERSAL_PATTERNS.weight);
  weightMatches?.slice(0, 2).forEach((m, i) => addField(i === 0 ? 'Weight' : `Weight ${i + 1}`, m, 'weight', Scale, 'medium'));

  // Quantities
  const qtyMatches = text.match(UNIVERSAL_PATTERNS.quantity);
  qtyMatches?.slice(0, 2).forEach((m, i) => addField(i === 0 ? 'Quantity' : `Qty ${i + 1}`, m, 'quantity', Hash, 'medium'));

  // URLs
  const urlMatches = text.match(UNIVERSAL_PATTERNS.url);
  urlMatches?.slice(0, 2).forEach(m => addField('URL', m, 'url', MapPin, 'high'));

  // IFSC
  const ifscMatches = text.match(UNIVERSAL_PATTERNS.ifsc);
  ifscMatches?.forEach(m => addField('IFSC', m, 'ifsc', Building, 'high'));

  return fields;
}

function detectDocumentType(text: string): DocumentType {
  const lower = text.toLowerCase();
  if (/lorry\s*receipt|l\.?r\.?\s*no|consignment\s*note|gc\s*no|gr\s*no|bilty/i.test(lower)) return 'lr';
  if (/proof\s*of\s*delivery|pod|delivered|delivery\s*receipt/i.test(lower)) return 'pod';
  if (/tax\s*invoice|invoice|bill\s*of\s*supply/i.test(lower)) return 'invoice';
  if (/e-?way\s*bill|ewb/i.test(lower)) return 'eway';
  if (/weigh.*slip|weighbridge|gross.*tare.*net/i.test(lower)) return 'weighment';
  if (/challan|delivery\s*challan|dc\s*no/i.test(lower)) return 'challan';
  return 'general';
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function OCRDemo() {
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<SupportedLanguage[]>(['eng']);
  const [activeTab, setActiveTab] = useState<'text' | 'fields' | 'lines'>('text');
  const [showSettings, setShowSettings] = useState(false);
  const [preprocessing, setPreprocessing] = useState<PreprocessingOptions>(DEFAULT_PREPROCESSING);
  const [googleApiKey, setGoogleApiKey] = useState<string>(localStorage.getItem('google_vision_key') || '');
  const [autoFallback, setAutoFallback] = useState(true);
  const [fallbackThreshold, setFallbackThreshold] = useState(50);
  const workerRef = useRef<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setProcessedImage(null);
      setResult(null);
      setError(null);
      setProgress(0);
    };
    reader.readAsDataURL(file);
  }, []);

  const processOCR = useCallback(async () => {
    if (!image) return;

    setProcessing(true);
    setError(null);
    setProgress(0);
    
    const startTime = Date.now();
    let finalText = '';
    let finalConfidence = 0;
    let engineUsed = 'tesseract';
    let fallbackUsed = false;

    try {
      // Step 1: Preprocess image
      setProgressStatus('Preprocessing image...');
      setProgress(10);
      
      let preprocessedImage: string;
      try {
        preprocessedImage = await preprocessImage(image, preprocessing);
        setProcessedImage(preprocessedImage);
      } catch (e) {
        console.warn('Preprocessing failed, using original:', e);
        preprocessedImage = image;
      }
      
      setProgress(20);

      // Step 2: Tesseract OCR
      setProgressStatus('Running Tesseract OCR...');
      const langString = selectedLanguages.join('+');
      
      const worker = await createWorker(langString, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(20 + Math.round(m.progress * 40));
          } else if (m.status === 'loading language traineddata') {
            setProgressStatus('Loading language data...');
          }
        },
      });

      workerRef.current = worker;
      const { data } = await worker.recognize(preprocessedImage);
      await worker.terminate();
      workerRef.current = null;

      finalText = data.text.trim();
      finalConfidence = data.confidence;
      setProgress(65);

      // Step 3: Check if fallback needed
      if (autoFallback && googleApiKey && finalConfidence < fallbackThreshold) {
        setProgressStatus(`Low confidence (${finalConfidence.toFixed(0)}%), trying Google Vision...`);
        setProgress(70);
        
        try {
          const visionResult = await callGoogleVision(image, googleApiKey);
          if (visionResult.text && visionResult.confidence > finalConfidence) {
            finalText = visionResult.text;
            finalConfidence = visionResult.confidence;
            engineUsed = 'google-vision';
            fallbackUsed = true;
          }
        } catch (e: any) {
          console.warn('Google Vision fallback failed:', e.message);
          // Continue with Tesseract result
        }
      }

      setProgress(90);
      setProgressStatus('Extracting fields...');

      // Process results
      const cleanText = finalText;
      const lines = cleanText.split('\n').filter(line => line.trim());
      const wordCount = cleanText.split(/\s+/).filter(w => w.length > 0).length;
      const extractedFields = extractUniversalFields(cleanText);
      const documentType = detectDocumentType(cleanText);

      setResult({
        success: true,
        text: cleanText,
        confidence: finalConfidence,
        engine: engineUsed,
        processingTime: Date.now() - startTime,
        documentType,
        extractedFields,
        lines,
        wordCount,
        preprocessed: true,
        fallbackUsed,
      });

      setProgress(100);
      setProgressStatus('Complete!');

    } catch (err: any) {
      console.error('OCR Error:', err);
      setError(err.message || 'OCR processing failed');
      if (workerRef.current) {
        await workerRef.current.terminate();
        workerRef.current = null;
      }
    } finally {
      setProcessing(false);
    }
  }, [image, selectedLanguages, preprocessing, googleApiKey, autoFallback, fallbackThreshold]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const reset = useCallback(async () => {
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }
    setImage(null);
    setProcessedImage(null);
    setResult(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, []);

  const toggleLanguage = useCallback((lang: SupportedLanguage) => {
    setSelectedLanguages(prev => {
      if (prev.includes(lang)) {
        if (prev.length === 1) return prev;
        return prev.filter(l => l !== lang);
      }
      return [...prev, lang];
    });
  }, []);

  const saveGoogleKey = useCallback((key: string) => {
    setGoogleApiKey(key);
    if (key) {
      localStorage.setItem('google_vision_key', key);
    } else {
      localStorage.removeItem('google_vision_key');
    }
  }, []);

  const getDocTypeInfo = (type: DocumentType) => DOC_TYPES.find(d => d.type === type) || DOC_TYPES[0];
  
  const getConfidenceColor = (conf?: 'high' | 'medium' | 'low') => {
    if (conf === 'high') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (conf === 'medium') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">@ankr/ocr</h1>
              <p className="text-sm text-gray-500">Universal OCR • Canvas Preprocessing • Google Vision Fallback</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <Cpu className="w-3 h-3" /> Tesseract (FREE)
          </span>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
            <Sliders className="w-3 h-3" /> Canvas Preprocessing
          </span>
          {googleApiKey && (
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
              <Cloud className="w-3 h-3" /> Google Vision Fallback
            </span>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="max-w-6xl mx-auto mb-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" /> OCR Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preprocessing */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image Preprocessing</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={preprocessing.grayscale} onChange={e => setPreprocessing(p => ({ ...p, grayscale: e.target.checked }))} className="rounded" />
                  <span className="text-gray-600 dark:text-gray-400">Grayscale</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={preprocessing.sharpen} onChange={e => setPreprocessing(p => ({ ...p, sharpen: e.target.checked }))} className="rounded" />
                  <span className="text-gray-600 dark:text-gray-400">Sharpen</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={preprocessing.denoise} onChange={e => setPreprocessing(p => ({ ...p, denoise: e.target.checked }))} className="rounded" />
                  <span className="text-gray-600 dark:text-gray-400">Denoise</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Scale:</span>
                  <input type="range" min="1" max="3" step="0.5" value={preprocessing.scale} onChange={e => setPreprocessing(p => ({ ...p, scale: parseFloat(e.target.value) }))} className="flex-1" />
                  <span className="text-sm text-gray-500 w-8">{preprocessing.scale}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Contrast:</span>
                  <input type="range" min="1" max="2" step="0.1" value={preprocessing.contrast} onChange={e => setPreprocessing(p => ({ ...p, contrast: parseFloat(e.target.value) }))} className="flex-1" />
                  <span className="text-sm text-gray-500 w-8">{preprocessing.contrast}</span>
                </div>
              </div>
            </div>

            {/* Google Vision */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Google Vision Fallback</h4>
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="Google Vision API Key"
                  value={googleApiKey}
                  onChange={e => saveGoogleKey(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={autoFallback} onChange={e => setAutoFallback(e.target.checked)} className="rounded" disabled={!googleApiKey} />
                  <span className={`${googleApiKey ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400'}`}>Auto-fallback if confidence below:</span>
                </label>
                <div className="flex items-center gap-2">
                  <input type="range" min="30" max="70" value={fallbackThreshold} onChange={e => setFallbackThreshold(parseInt(e.target.value))} className="flex-1" disabled={!googleApiKey || !autoFallback} />
                  <span className="text-sm text-gray-500 w-10">{fallbackThreshold}%</span>
                </div>
                <p className="text-xs text-gray-500">First 1,000/month FREE, then $1.50/1,000</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel */}
        <div className="space-y-4">
          {/* Languages */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Languages className="w-5 h-5 text-orange-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Languages</h2>
              <span className="text-xs text-gray-500 ml-auto">{selectedLanguages.length} selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  disabled={processing}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedLanguages.includes(lang.code)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  } ${processing ? 'opacity-50' : ''}`}
                >
                  {lang.native}
                </button>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Upload Image</h2>
            
            {!image ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8">
                <div className="flex flex-col items-center gap-4">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <p className="text-gray-500 text-center text-sm">Documents, Screenshots, Photos - anything with text</p>
                  <div className="flex gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                      <Upload className="w-4 h-4" /> Choose File
                    </button>
                    <button onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300">
                      <Camera className="w-4 h-4" /> Camera
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img src={processedImage || image} alt="Uploaded" className="w-full h-auto max-h-72 object-contain" />
                  {processedImage && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">Preprocessed</span>
                  )}
                  {!processing && (
                    <button onClick={reset} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {processing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{progressStatus}</span>
                      <span className="text-orange-500 font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <button
                  onClick={processOCR}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 disabled:opacity-50"
                >
                  {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Zap className="w-5 h-5" /> Extract Text</>}
                </button>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {result && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm text-center">
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className={`text-lg font-bold ${result.confidence >= 70 ? 'text-green-600' : result.confidence >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {result.confidence.toFixed(0)}%
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm text-center">
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="text-lg font-bold text-blue-600">{(result.processingTime / 1000).toFixed(1)}s</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm text-center">
                  <p className="text-xs text-gray-500">Words</p>
                  <p className="text-lg font-bold text-purple-600">{result.wordCount}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm text-center">
                  <p className="text-xs text-gray-500">Engine</p>
                  <p className={`text-sm font-bold ${result.engine === 'google-vision' ? 'text-purple-600' : 'text-cyan-600'}`}>
                    {result.engine === 'google-vision' ? 'GVision' : 'Tesseract'}
                  </p>
                </div>
              </div>

              {/* Engine + Doc Type */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm flex flex-wrap items-center gap-3">
                {result.fallbackUsed && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-xs flex items-center gap-1">
                    <Cloud className="w-3 h-3" /> Fallback Used
                  </span>
                )}
                {result.documentType !== 'general' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Detected:</span>
                    <span className={`px-2 py-1 ${getDocTypeInfo(result.documentType).color} text-white rounded-full text-xs`}>
                      {getDocTypeInfo(result.documentType).label}
                    </span>
                  </>
                )}
              </div>

              {/* Tabs */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  {[
                    { key: 'text', label: 'Raw Text', count: result.text.length },
                    { key: 'fields', label: 'Fields', count: result.extractedFields.length },
                    { key: 'lines', label: 'Lines', count: result.lines.length },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab.key
                          ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                <div className="p-4 max-h-80 overflow-auto">
                  {activeTab === 'text' && (
                    <div className="relative">
                      <pre className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                        {result.text || '(No text detected)'}
                      </pre>
                      <button onClick={() => copyToClipboard(result.text)} className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-600 rounded-lg shadow hover:bg-gray-100" title="Copy">
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                  )}

                  {activeTab === 'fields' && (
                    <div className="space-y-2">
                      {result.extractedFields.length > 0 ? (
                        result.extractedFields.map((field, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-2">
                              <field.icon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">{field.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-gray-900 dark:text-white">{field.value}</span>
                              <button onClick={() => copyToClipboard(field.value)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                                <Copy className="w-3 h-3 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4 text-sm">No structured fields detected</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'lines' && (
                    <div className="space-y-1">
                      {result.lines.map((line, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded group">
                          <span className="text-xs text-gray-400 w-5 text-right">{idx + 1}</span>
                          <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 font-mono">{line}</span>
                          <button onClick={() => copyToClipboard(line)} className="p-1 opacity-0 group-hover:opacity-100 rounded">
                            <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(result.text)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 text-sm">
                  <Copy className="w-4 h-4" /> Copy Text
                </button>
                <button onClick={() => copyToClipboard(JSON.stringify({ text: result.text, fields: result.extractedFields, lines: result.lines }, null, 2))} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 text-sm">
                  <FileText className="w-4 h-4" /> JSON
                </button>
                <button onClick={reset} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-200 text-sm">
                  <RotateCcw className="w-4 h-4" /> New
                </button>
              </div>
            </>
          )}

          {!result && !error && !processing && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready to Extract</h3>
              <p className="text-gray-500 text-sm">Upload any image with text</p>
            </div>
          )}

          {processing && !result && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Processing</h3>
              <p className="text-gray-500 text-sm">{progressStatus}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-6 text-center text-xs text-gray-500">
        🙏 Jai Guru Ji | @ankr/ocr v1.1.0 | Canvas Preprocessing + Google Vision Fallback
      </div>
    </div>
  );
}
