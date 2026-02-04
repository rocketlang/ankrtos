/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANKR DOCUMENT PROCESSOR UI
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Photo → Data → Blockchain"
 *
 * Features:
 * - Camera capture / file upload
 * - OCR + LLM extraction
 * - Manual verification
 * - DocChain registration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, FileText, CheckCircle, XCircle, 
  Loader2, Edit, Download, Share2, Shield, QrCode 
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface DocumentType {
  id: string;
  name: string;
  nameHi: string;
  icon: string;
}

interface ExtractedDocument {
  id: string;
  type: string;
  originalFileName: string;
  rawText: string;
  confidence: number;
  structuredData: Record<string, any>;
  docChainHash?: string;
  docChainVerified: boolean;
  status: 'processing' | 'extracted' | 'verified' | 'rejected';
}

const DOCUMENT_TYPES: DocumentType[] = [
  { id: 'lr', name: 'Lorry Receipt', nameHi: 'लॉरी रसीद', icon: '📄' },
  { id: 'pod', name: 'Proof of Delivery', nameHi: 'डिलीवरी प्रमाण', icon: '✅' },
  { id: 'invoice', name: 'Invoice', nameHi: 'इनवॉइस', icon: '🧾' },
  { id: 'eway_bill', name: 'E-Way Bill', nameHi: 'ई-वे बिल', icon: '📋' },
  { id: 'rc', name: 'RC Book', nameHi: 'आरसी', icon: '🚛' },
  { id: 'license', name: 'License', nameHi: 'लाइसेंस', icon: '🪪' },
  { id: 'insurance', name: 'Insurance', nameHi: 'बीमा', icon: '🛡️' },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface Props {
  lang?: string;
  onDocumentProcessed?: (doc: ExtractedDocument) => void;
}

export default function DocumentProcessor({ lang = 'hi', onDocumentProcessed }: Props) {
  const [selectedType, setSelectedType] = useState<DocumentType>(DOCUMENT_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ExtractedDocument | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, any>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const processDocument = async () => {
    if (!file) return;

    setProcessing(true);
    setResult(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];

        const response = await fetch(`${API_BASE}/api/document/process-base64`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64,
            fileName: file.name,
            type: selectedType.id,
            userId: 'demo-user',
          }),
        });

        const data = await response.json();

        if (data.success) {
          setResult(data.document);
          setEditedData(data.document.structuredData);
          onDocumentProcessed?.(data.document);
        } else {
          alert('Processing failed: ' + data.error);
        }

        setProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Processing error:', error);
      setProcessing(false);
      alert('Failed to process document');
    }
  };

  const getFieldLabel = (key: string): string => {
    const labels: Record<string, string> = {
      lrNumber: lang === 'hi' ? 'एलआर नंबर' : 'LR Number',
      date: lang === 'hi' ? 'दिनांक' : 'Date',
      consignorName: lang === 'hi' ? 'भेजने वाला' : 'Consignor',
      consigneeName: lang === 'hi' ? 'प्राप्तकर्ता' : 'Consignee',
      origin: lang === 'hi' ? 'कहाँ से' : 'Origin',
      destination: lang === 'hi' ? 'कहाँ तक' : 'Destination',
      vehicleNumber: lang === 'hi' ? 'गाड़ी नंबर' : 'Vehicle No.',
      driverName: lang === 'hi' ? 'ड्राइवर' : 'Driver',
      weight: lang === 'hi' ? 'वजन' : 'Weight',
      freightAmount: lang === 'hi' ? 'भाड़ा' : 'Freight',
      invoiceNumber: lang === 'hi' ? 'इनवॉइस नंबर' : 'Invoice No.',
      totalAmount: lang === 'hi' ? 'कुल राशि' : 'Total Amount',
    };
    return labels[key] || key;
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {lang === 'hi' ? 'दस्तावेज़ प्रोसेसर' : 'Document Processor'}
        </h3>
        <p className="text-indigo-100 text-sm">
          {lang === 'hi' ? 'फोटो → डेटा → ब्लॉकचेन' : 'Photo → Data → Blockchain'}
        </p>
      </div>

      {/* Document Type Selector */}
      <div className="p-4 border-b border-gray-700">
        <label className="text-sm text-gray-400 block mb-2">
          {lang === 'hi' ? 'दस्तावेज़ का प्रकार' : 'Document Type'}
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {DOCUMENT_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap flex items-center gap-2 transition-all ${
                selectedType.id === type.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span>{type.icon}</span>
              <span>{lang === 'hi' ? type.nameHi : type.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      {!result && (
        <div className="p-4">
          {!preview ? (
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center">
              <div className="flex justify-center gap-4 mb-4">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-500"
                >
                  <Camera className="w-8 h-8" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-500"
                >
                  <Upload className="w-8 h-8" />
                </button>
              </div>
              <p className="text-gray-400">
                {lang === 'hi' ? 'फोटो खींचें या फाइल चुनें' : 'Take photo or select file'}
              </p>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-contain bg-gray-900 rounded-lg"
                />
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 p-2 bg-red-600 rounded-full text-white"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Process Button */}
              <button
                onClick={processDocument}
                disabled={processing}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {lang === 'hi' ? 'प्रोसेस हो रहा है...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    {lang === 'hi' ? 'दस्तावेज़ प्रोसेस करें' : 'Process Document'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="p-4 space-y-4">
          {/* Status Banner */}
          <div className={`p-3 rounded-lg flex items-center gap-3 ${
            result.docChainVerified ? 'bg-green-900/50' : 'bg-yellow-900/50'
          }`}>
            {result.docChainVerified ? (
              <Shield className="w-6 h-6 text-green-400" />
            ) : (
              <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
            )}
            <div>
              <p className={`font-medium ${result.docChainVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                {result.docChainVerified 
                  ? (lang === 'hi' ? '✅ ब्लॉकचेन पर वेरिफाइड' : '✅ Verified on Blockchain')
                  : (lang === 'hi' ? '⏳ वेरिफिकेशन पेंडिंग' : '⏳ Verification Pending')
                }
              </p>
              <p className="text-xs text-gray-400">
                {lang === 'hi' ? 'कॉन्फिडेंस' : 'Confidence'}: {result.confidence}%
              </p>
            </div>
          </div>

          {/* DocChain Hash */}
          {result.docChainHash && (
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">DocChain Hash</p>
              <p className="font-mono text-sm text-gray-300 break-all">
                {result.docChainHash.substring(0, 32)}...
              </p>
            </div>
          )}

          {/* Extracted Data */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-white">
                {lang === 'hi' ? 'निकाला गया डेटा' : 'Extracted Data'}
              </h4>
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-indigo-400 text-sm flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                {editMode ? (lang === 'hi' ? 'सेव करें' : 'Save') : (lang === 'hi' ? 'एडिट करें' : 'Edit')}
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(result.structuredData).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1">
                    {getFieldLabel(key)}
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedData[key] || ''}
                      onChange={e => setEditedData({ ...editedData, [key]: e.target.value })}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm"
                    />
                  ) : (
                    <p className="text-white">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button className="py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4" />
              {lang === 'hi' ? 'स्वीकार' : 'Approve'}
            </button>
            <button className="py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm">
              <Download className="w-4 h-4" />
              {lang === 'hi' ? 'डाउनलोड' : 'Download'}
            </button>
            <button className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm">
              <QrCode className="w-4 h-4" />
              QR
            </button>
          </div>

          {/* New Document */}
          <button
            onClick={() => {
              setFile(null);
              setPreview(null);
              setResult(null);
            }}
            className="w-full py-3 bg-gray-700 text-gray-300 rounded-lg"
          >
            {lang === 'hi' ? '+ नया दस्तावेज़' : '+ New Document'}
          </button>
        </div>
      )}
    </div>
  );
}
