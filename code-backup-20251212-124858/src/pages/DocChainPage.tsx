/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DOCCHAIN PAGE - Enhanced with All Document Categories
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 * 
 * Categories:
 * - Transport Documents (POD, LR, Gate Pass, E-Way Bill)
 * - Commercial Documents (Invoice, Quotation, Credit/Debit Notes)
 * - Compliance Documents (GST, Aadhaar, PAN, Licenses)
 * - Contracts & Legal (Contracts, Agreements, IP Disclosures)
 * - Vehicle Documents (RC, Insurance, Permits)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { DocChainWidget, DocType } from '@ankr/shell';

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

interface DocCategory {
  id: string;
  name: string;
  nameHi: string;
  icon: string;
  color: string;
  documents: DocConfig[];
}

interface DocConfig {
  type: DocType;
  title: string;
  titleHi: string;
  icon: string;
  requireSignature: boolean;
  signatureTier: 'none' | 'basic' | 'verified' | 'legal';
  enableAIExtraction: boolean;
}

const CATEGORIES: DocCategory[] = [
  {
    id: 'transport',
    name: 'Transport Documents',
    nameHi: 'परिवहन दस्तावेज़',
    icon: '🚛',
    color: 'from-blue-600 to-blue-800',
    documents: [
      { type: 'pod', title: 'Proof of Delivery', titleHi: 'डिलीवरी प्रूफ', icon: '📦', requireSignature: true, signatureTier: 'basic', enableAIExtraction: true },
      { type: 'lr', title: 'Lorry Receipt', titleHi: 'लॉरी रसीद', icon: '🚛', requireSignature: false, signatureTier: 'none', enableAIExtraction: true },
      { type: 'gate_pass', title: 'Gate Pass', titleHi: 'गेट पास', icon: '🚪', requireSignature: true, signatureTier: 'basic', enableAIExtraction: true },
      { type: 'eway_bill', title: 'E-Way Bill', titleHi: 'ई-वे बिल', icon: '📋', requireSignature: false, signatureTier: 'none', enableAIExtraction: true },
      { type: 'grn', title: 'Goods Receipt Note', titleHi: 'गुड्स रसीद', icon: '📥', requireSignature: true, signatureTier: 'basic', enableAIExtraction: true },
    ]
  },
  {
    id: 'commercial',
    name: 'Commercial Documents',
    nameHi: 'व्यावसायिक दस्तावेज़',
    icon: '💼',
    color: 'from-green-600 to-green-800',
    documents: [
      { type: 'invoice', title: 'Invoice', titleHi: 'इनवॉइस', icon: '🧾', requireSignature: true, signatureTier: 'verified', enableAIExtraction: true },
      { type: 'quotation', title: 'Quotation', titleHi: 'कोटेशन', icon: '💰', requireSignature: false, signatureTier: 'none', enableAIExtraction: true },
      { type: 'credit_note', title: 'Credit Note', titleHi: 'क्रेडिट नोट', icon: '➕', requireSignature: true, signatureTier: 'basic', enableAIExtraction: true },
      { type: 'debit_note', title: 'Debit Note', titleHi: 'डेबिट नोट', icon: '➖', requireSignature: true, signatureTier: 'basic', enableAIExtraction: true },
      { type: 'receipt', title: 'Receipt', titleHi: 'रसीद', icon: '🧾', requireSignature: false, signatureTier: 'none', enableAIExtraction: true },
    ]
  },
  {
    id: 'contracts',
    name: 'Contracts & Legal',
    nameHi: 'अनुबंध और कानूनी',
    icon: '📜',
    color: 'from-purple-600 to-purple-800',
    documents: [
      { type: 'contract', title: 'Contract', titleHi: 'अनुबंध', icon: '📜', requireSignature: true, signatureTier: 'legal', enableAIExtraction: true },
      { type: 'contract', title: 'IP Disclosure', titleHi: 'आईपी प्रकटीकरण', icon: '🔒', requireSignature: true, signatureTier: 'legal', enableAIExtraction: false },
      { type: 'contract', title: 'NDA Agreement', titleHi: 'एनडीए समझौता', icon: '🤝', requireSignature: true, signatureTier: 'legal', enableAIExtraction: true },
      { type: 'contract', title: 'Service Agreement', titleHi: 'सेवा समझौता', icon: '📝', requireSignature: true, signatureTier: 'legal', enableAIExtraction: true },
    ]
  },
  {
    id: 'compliance',
    name: 'Compliance & KYC',
    nameHi: 'अनुपालन और केवाईसी',
    icon: '✅',
    color: 'from-orange-600 to-orange-800',
    documents: [
      { type: 'gst_certificate', title: 'GST Certificate', titleHi: 'GST प्रमाणपत्र', icon: '📄', requireSignature: false, signatureTier: 'none', enableAIExtraction: true },
      { type: 'aadhaar', title: 'Aadhaar Card', titleHi: 'आधार कार्ड', icon: '🪪', requireSignature: false, signatureTier: 'none', enableAIExtraction: true },
      { type: 'pan', title: 'PAN Card', titleHi: 'पैन कार्ड', icon: '💳', requireSignature: false, signatureTier: 'none', enableAIExtraction: true },
      { type: 'driving_license', title: 'Driving License', titleHi: 'ड्राइविंग लाइसेंस', icon: '🚗', requireSignature: false, signatureTier: 'none', enableAIExtraction: true },
    ]
  },
  {
    id: 'vehicle',
    name: 'Vehicle Documents',
    nameHi: 'वाहन दस्तावेज़',
    icon: '🚗',
    color: 'from-red-600 to-red-800',
    documents: [
      { type: 'rc_book', title: 'RC Book', titleHi: 'आरसी बुक', icon: '📕', requireSignature: false, signatureTier: 'none', enableAIExtraction: true },
      { type: 'insurance', title: 'Insurance', titleHi: 'बीमा', icon: '🛡️', requireSignature: false, signatureTier: 'none', enableAIExtraction: true },
      { type: 'permit', title: 'Permit', titleHi: 'परमिट', icon: '📃', requireSignature: false, signatureTier: 'none', enableAIExtraction: true },
    ]
  },
  {
    id: 'international',
    name: 'International Trade',
    nameHi: 'अंतर्राष्ट्रीय व्यापार',
    icon: '🌍',
    color: 'from-teal-600 to-teal-800',
    documents: [
      { type: 'bill_of_lading', title: 'Bill of Lading', titleHi: 'बिल ऑफ लैडिंग', icon: '🚢', requireSignature: true, signatureTier: 'verified', enableAIExtraction: true },
      { type: 'airway_bill', title: 'Airway Bill', titleHi: 'एयरवे बिल', icon: '✈️', requireSignature: true, signatureTier: 'verified', enableAIExtraction: true },
      { type: 'packing_list', title: 'Packing List', titleHi: 'पैकिंग लिस्ट', icon: '📝', requireSignature: false, signatureTier: 'none', enableAIExtraction: true },
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DocChainPage() {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentAnchors, setRecentAnchors] = useState<Array<{
    type: string;
    txHash: string;
    timestamp: Date;
    blockNumber: number;
  }>>([]);

  const handleComplete = (result: any) => {
    console.log('Document verified:', result);
    if (result.blockchain?.txHash) {
      setRecentAnchors(prev => [{
        type: result.type,
        txHash: result.blockchain.txHash,
        timestamp: new Date(),
        blockNumber: result.blockchain.blockNumber
      }, ...prev.slice(0, 9)]);
    }
  };

  const filteredCategories = selectedCategory 
    ? CATEGORIES.filter(c => c.id === selectedCategory)
    : CATEGORIES;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-blue-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                ⛓️ DocChain
                <span className="text-sm font-normal bg-white/20 px-3 py-1 rounded-full">
                  Polygon Amoy
                </span>
              </h1>
              <p className="text-purple-200 mt-1">
                {language === 'en' 
                  ? 'Blockchain-verified document management'
                  : 'ब्लॉकचेन-सत्यापित दस्तावेज़ प्रबंधन'}
              </p>
            </div>
            
            {/* Language Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg transition ${
                  language === 'en' 
                    ? 'bg-white text-purple-700' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 rounded-lg transition ${
                  language === 'hi' 
                    ? 'bg-white text-purple-700' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg transition ${
                !selectedCategory
                  ? 'bg-white text-purple-700'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {language === 'en' ? 'All Categories' : 'सभी श्रेणियां'}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-white text-purple-700'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{language === 'en' ? cat.name : cat.nameHi}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Recent Anchors */}
        {recentAnchors.length > 0 && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              ✅ {language === 'en' ? 'Recently Anchored' : 'हाल ही में एंकर किए गए'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {recentAnchors.map((anchor, i) => (
                <a
                  key={i}
                  href={`https://amoy.polygonscan.com/tx/${anchor.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm bg-white dark:bg-gray-800 px-3 py-1 rounded-lg flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <span>⛓️</span>
                  <span className="font-mono">{anchor.txHash.slice(0, 10)}...</span>
                  <span className="text-gray-500">Block {anchor.blockNumber}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Document Categories */}
        {filteredCategories.map(category => (
          <div key={category.id} className="mb-8">
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 bg-gradient-to-r ${category.color} bg-clip-text text-transparent`}>
              <span className="text-2xl">{category.icon}</span>
              {language === 'en' ? category.name : category.nameHi}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {category.documents.map((doc, idx) => (
                <DocChainWidget
                  key={`${category.id}-${idx}`}
                  type={doc.type}
                  title={language === 'en' ? doc.title : doc.titleHi}
                  requireSignature={doc.requireSignature}
                  signatureTier={doc.signatureTier}
                  enableCamera={true}
                  enableUpload={true}
                  enableAIExtraction={doc.enableAIExtraction}
                  enableBlockchain={true}
                  language={language}
                  compact={true}
                  onComplete={handleComplete}
                  onError={(err) => console.error(`${doc.title} error:`, err)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Blockchain Info Footer */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            🔗 {language === 'en' ? 'Powered by Polygon Blockchain' : 'Polygon ब्लॉकचेन द्वारा संचालित'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {language === 'en' 
              ? 'All documents are hashed and anchored to Polygon Amoy testnet'
              : 'सभी दस्तावेज़ों को हैश किया जाता है और Polygon Amoy टेस्टनेट पर एंकर किया जाता है'}
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <a
              href="https://amoy.polygonscan.com/address/0xe6Ed66b84c31A356A911805fF747457770AB0781"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline flex items-center gap-1"
            >
              📋 View Contract
            </a>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">
              0xe6Ed66b84c31...0781
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
