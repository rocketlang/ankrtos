/**
 * SWAYAM Entity Extractor
 * Extracts structured entities from natural language (Hindi + English)
 */

import type { Entity, EntityType, ExtractedEntities, Message } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITY PATTERNS - Indian-specific patterns
// ═══════════════════════════════════════════════════════════════════════════════

interface EntityPattern {
  type: EntityType;
  patterns: RegExp[];
  validator?: (value: string) => boolean;
  normalizer?: (value: string) => string;
  examples: string[];
}

const ENTITY_PATTERNS: EntityPattern[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // INDIAN IDENTITY NUMBERS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: 'gstin',
    patterns: [
      /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/gi,
      /gstin[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])/gi,
      /जीएसटीआईएन[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])/gi
    ],
    validator: (value) => {
      // GSTIN format: 2 digits (state) + 10 char PAN + 1 digit + Z + 1 checksum
      const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      return pattern.test(value.toUpperCase());
    },
    normalizer: (value) => value.toUpperCase().replace(/\s/g, ''),
    examples: ['27AABCU9603R1ZM', '29AABCU9603R1ZN']
  },
  {
    type: 'pan',
    patterns: [
      /\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/gi,
      /pan[:\s]*([A-Z]{5}[0-9]{4}[A-Z])/gi,
      /पैन[:\s]*([A-Z]{5}[0-9]{4}[A-Z])/gi
    ],
    validator: (value) => {
      // PAN format: 5 letters + 4 digits + 1 letter
      // 4th char indicates holder type: C=Company, P=Person, etc.
      const pattern = /^[A-Z]{3}[ABCFGHLJPTK][A-Z][0-9]{4}[A-Z]$/;
      return pattern.test(value.toUpperCase());
    },
    normalizer: (value) => value.toUpperCase().replace(/\s/g, ''),
    examples: ['ABCDE1234F', 'AABCU9603R']
  },
  {
    type: 'aadhaar',
    patterns: [
      /\b([2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4})\b/g,
      /aadhaar[:\s]*([2-9][0-9]{3}\s?[0-9]{4}\s?[0-9]{4})/gi,
      /आधार[:\s]*([2-9][0-9]{3}\s?[0-9]{4}\s?[0-9]{4})/gi
    ],
    validator: (value) => {
      // Aadhaar: 12 digits, doesn't start with 0 or 1
      const cleaned = value.replace(/\s/g, '');
      return /^[2-9][0-9]{11}$/.test(cleaned);
    },
    normalizer: (value) => value.replace(/\s/g, ''),
    examples: ['2345 6789 0123', '234567890123']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VEHICLE & TRANSPORT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: 'vehicle',
    patterns: [
      /\b([A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4})\b/gi,
      /vehicle[:\s]*([A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4})/gi,
      /गाड़ी[:\s]*([A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4})/gi,
      /ट्रक[:\s]*([A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4})/gi
    ],
    validator: (value) => {
      // Indian vehicle: 2 letters (state) + 2 digits (district) + 0-3 letters + 4 digits
      const pattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
      return pattern.test(value.toUpperCase().replace(/\s/g, ''));
    },
    normalizer: (value) => value.toUpperCase().replace(/\s/g, ''),
    examples: ['MH12AB1234', 'DL1CAB1234', 'KA01MF5678']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTACT INFORMATION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: 'phone',
    patterns: [
      /\b(\+91[\s-]?)?([6-9][0-9]{9})\b/g,
      /phone[:\s]*(\+?91[\s-]?)?([6-9][0-9]{9})/gi,
      /mobile[:\s]*(\+?91[\s-]?)?([6-9][0-9]{9})/gi,
      /फोन[:\s]*(\+?91[\s-]?)?([6-9][0-9]{9})/gi
    ],
    validator: (value) => {
      const cleaned = value.replace(/[\s\-\+]/g, '').replace(/^91/, '');
      return /^[6-9][0-9]{9}$/.test(cleaned);
    },
    normalizer: (value) => {
      const cleaned = value.replace(/[\s\-\+]/g, '').replace(/^91/, '');
      return '+91' + cleaned;
    },
    examples: ['+91 98765 43210', '9876543210']
  },
  {
    type: 'email',
    patterns: [
      /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi,
      /email[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      /ईमेल[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    ],
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    normalizer: (value) => value.toLowerCase().trim(),
    examples: ['user@example.com', 'test.user@domain.co.in']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AMOUNTS & NUMBERS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: 'amount',
    patterns: [
      /(?:rs\.?|₹|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
      /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rupees?|रुपये?|rs)/gi,
      /([0-9]+(?:\.[0-9]{1,2})?)\s*(?:lakh|lac|लाख)/gi,
      /([0-9]+(?:\.[0-9]{1,2})?)\s*(?:crore|cr|करोड़)/gi,
      /([0-9]+(?:\.[0-9]{1,2})?)\s*(?:thousand|हज़ार|k)\b/gi
    ],
    validator: (value) => !isNaN(parseFloat(value.replace(/,/g, ''))),
    normalizer: (value) => {
      let num = parseFloat(value.replace(/,/g, ''));
      const lower = value.toLowerCase();
      if (lower.includes('lakh') || lower.includes('lac') || lower.includes('लाख')) {
        num *= 100000;
      } else if (lower.includes('crore') || lower.includes('cr') || lower.includes('करोड़')) {
        num *= 10000000;
      } else if (lower.includes('thousand') || lower.includes('हज़ार') || lower.includes('k')) {
        num *= 1000;
      }
      return num.toString();
    },
    examples: ['₹10,000', 'Rs. 5 lakh', '2 crore', '50k']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DATES & TIME
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: 'date',
    patterns: [
      /\b([0-9]{1,2})[\/\-]([0-9]{1,2})[\/\-]([0-9]{2,4})\b/g,
      /\b([0-9]{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*([0-9]{2,4})?\b/gi,
      /(आज|कल|परसों|अगले\s*(?:हफ्ते|महीने))/gi,
      /(today|tomorrow|next\s*(?:week|month))/gi
    ],
    normalizer: (value) => {
      const lower = value.toLowerCase();
      const today = new Date();

      if (lower === 'आज' || lower === 'today') {
        return today.toISOString().split('T')[0];
      }
      if (lower === 'कल' || lower === 'tomorrow') {
        today.setDate(today.getDate() + 1);
        return today.toISOString().split('T')[0];
      }
      if (lower === 'परसों') {
        today.setDate(today.getDate() + 2);
        return today.toISOString().split('T')[0];
      }

      // Try to parse date
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }

      return value;
    },
    examples: ['25/12/2024', '25 Dec 2024', 'आज', 'tomorrow']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: 'location',
    patterns: [
      /\b([0-9]{6})\b/g, // Pincode
      /pincode[:\s]*([0-9]{6})/gi,
      /पिनकोड[:\s]*([0-9]{6})/gi
    ],
    validator: (value) => /^[1-9][0-9]{5}$/.test(value),
    normalizer: (value) => value.trim(),
    examples: ['400001', '110001', '560001']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPANY IDENTIFIERS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: 'company',
    patterns: [
      // CIN (Corporate Identification Number)
      /\b([UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6})\b/gi,
      /cin[:\s]*([UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6})/gi,
      // LLPIN (LLP Identification Number)
      /\b([A-Z]{3}-[0-9]{4})\b/gi,
      /llpin[:\s]*([A-Z]{3}-[0-9]{4})/gi,
      // TAN (Tax Deduction Account Number)
      /\b([A-Z]{4}[0-9]{5}[A-Z]{1})\b/gi,
      /tan[:\s]*([A-Z]{4}[0-9]{5}[A-Z])/gi
    ],
    normalizer: (value) => value.toUpperCase().replace(/\s/g, ''),
    examples: ['U12345MH2024PTC123456', 'AAA-1234', 'DELH12345A']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SHIPPING & LOGISTICS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: 'document',
    patterns: [
      // Container number (ISO 6346)
      /\b([A-Z]{4}[0-9]{7})\b/gi,
      /container[:\s]*([A-Z]{4}[0-9]{7})/gi,
      /कंटेनर[:\s]*([A-Z]{4}[0-9]{7})/gi,
      // E-Way Bill number
      /\b([0-9]{12})\b/g,
      /eway[:\s]*([0-9]{12})/gi,
      /ई-वे[:\s]*([0-9]{12})/gi
    ],
    examples: ['ABCD1234567', '123456789012']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BFC FINANCIAL ENTITIES (ankrBFC Integration)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: 'loan_type',
    patterns: [
      /(home|housing|होम|हाउसिंग|घर)\s*(loan|लोन)?/gi,
      /(car|vehicle|auto|कार|गाड़ी|वाहन)\s*(loan|लोन)?/gi,
      /(personal|पर्सनल|व्यक्तिगत)\s*(loan|लोन)?/gi,
      /(education|student|शिक्षा|एजुकेशन|पढ़ाई)\s*(loan|लोन)?/gi,
      /(business|व्यापार|बिज़नेस)\s*(loan|लोन)?/gi,
      /(gold|सोना|गोल्ड)\s*(loan|लोन)?/gi,
      /(two\s*wheeler|bike|बाइक)\s*(loan|लोन)?/gi
    ],
    normalizer: (value) => {
      const lower = value.toLowerCase();
      if (/home|housing|होम|हाउसिंग|घर/.test(lower)) return 'HOME_LOAN';
      if (/car|vehicle|auto|कार|गाड़ी|वाहन/.test(lower)) return 'CAR_LOAN';
      if (/personal|पर्सनल|व्यक्तिगत/.test(lower)) return 'PERSONAL_LOAN';
      if (/education|student|शिक्षा|एजुकेशन|पढ़ाई/.test(lower)) return 'EDUCATION_LOAN';
      if (/business|व्यापार|बिज़नेस/.test(lower)) return 'BUSINESS_LOAN';
      if (/gold|सोना|गोल्ड/.test(lower)) return 'GOLD_LOAN';
      if (/two\s*wheeler|bike|बाइक/.test(lower)) return 'TWO_WHEELER_LOAN';
      return 'PERSONAL_LOAN';
    },
    examples: ['home loan', 'होम लोन', 'car loan', 'पर्सनल लोन', 'education loan']
  },
  {
    type: 'insurance_type',
    patterns: [
      /(health|medical|स्वास्थ्य|हेल्थ|मेडिकल)\s*(insurance|बीमा)?/gi,
      /(life|term|जीवन|लाइफ|टर्म)\s*(insurance|बीमा)?/gi,
      /(car|motor|vehicle|कार|मोटर|वाहन)\s*(insurance|बीमा)?/gi,
      /(bike|two\s*wheeler|बाइक)\s*(insurance|बीमा)?/gi,
      /(travel|यात्रा|ट्रैवल)\s*(insurance|बीमा)?/gi,
      /(home|property|घर|होम|प्रॉपर्टी)\s*(insurance|बीमा)?/gi
    ],
    normalizer: (value) => {
      const lower = value.toLowerCase();
      if (/health|medical|स्वास्थ्य|हेल्थ|मेडिकल/.test(lower)) return 'HEALTH_INSURANCE';
      if (/life|term|जीवन|लाइफ|टर्म/.test(lower)) return 'LIFE_INSURANCE';
      if (/car|motor|vehicle|कार|मोटर|वाहन/.test(lower)) return 'CAR_INSURANCE';
      if (/bike|two\s*wheeler|बाइक/.test(lower)) return 'BIKE_INSURANCE';
      if (/travel|यात्रा|ट्रैवल/.test(lower)) return 'TRAVEL_INSURANCE';
      if (/home|property|घर|होम|प्रॉपर्टी/.test(lower)) return 'HOME_INSURANCE';
      return 'HEALTH_INSURANCE';
    },
    examples: ['health insurance', 'हेल्थ बीमा', 'life insurance', 'car insurance']
  },
  {
    type: 'employment_type',
    patterns: [
      /(salaried|salary|नौकरी|सैलरी|वेतनभोगी)/gi,
      /(self\s*employed|self-employed|स्वरोज़गार|खुद\s*का\s*काम)/gi,
      /(business|businessman|व्यापारी|बिज़नेस)/gi,
      /(professional|प्रोफेशनल|पेशेवर)/gi,
      /(freelancer|फ्रीलांसर)/gi,
      /(retired|रिटायर्ड|सेवानिवृत्त)/gi,
      /(student|विद्यार्थी|स्टूडेंट)/gi
    ],
    normalizer: (value) => {
      const lower = value.toLowerCase();
      if (/salaried|salary|नौकरी|सैलरी|वेतनभोगी/.test(lower)) return 'SALARIED';
      if (/self\s*employed|self-employed|स्वरोज़गार|खुद\s*का\s*काम/.test(lower)) return 'SELF_EMPLOYED';
      if (/business|businessman|व्यापारी|बिज़नेस/.test(lower)) return 'BUSINESS';
      if (/professional|प्रोफेशनल|पेशेवर/.test(lower)) return 'PROFESSIONAL';
      if (/freelancer|फ्रीलांसर/.test(lower)) return 'FREELANCER';
      if (/retired|रिटायर्ड|सेवानिवृत्त/.test(lower)) return 'RETIRED';
      if (/student|विद्यार्थी|स्टूडेंट/.test(lower)) return 'STUDENT';
      return 'SALARIED';
    },
    examples: ['salaried', 'self employed', 'business', 'व्यापारी']
  },
  {
    type: 'goal_type',
    patterns: [
      /(house|home|घर|होम)\s*(purchase|buy|खरीदना)?/gi,
      /(car|vehicle|कार|गाड़ी)\s*(purchase|buy|खरीदना)?/gi,
      /(wedding|marriage|शादी|विवाह)/gi,
      /(education|child\s*education|बच्चों\s*की\s*पढ़ाई|शिक्षा)/gi,
      /(retirement|रिटायरमेंट|सेवानिवृत्ति)/gi,
      /(vacation|travel|trip|छुट्टी|यात्रा)/gi,
      /(emergency\s*fund|आपातकालीन\s*फंड)/gi
    ],
    normalizer: (value) => {
      const lower = value.toLowerCase();
      if (/house|home|घर|होम/.test(lower)) return 'HOME_PURCHASE';
      if (/car|vehicle|कार|गाड़ी/.test(lower)) return 'CAR_PURCHASE';
      if (/wedding|marriage|शादी|विवाह/.test(lower)) return 'WEDDING';
      if (/education|बच्चों\s*की\s*पढ़ाई|शिक्षा/.test(lower)) return 'EDUCATION';
      if (/retirement|रिटायरमेंट|सेवानिवृत्ति/.test(lower)) return 'RETIREMENT';
      if (/vacation|travel|trip|छुट्टी|यात्रा/.test(lower)) return 'VACATION';
      if (/emergency/.test(lower)) return 'EMERGENCY_FUND';
      return 'GENERAL_SAVINGS';
    },
    examples: ['घर खरीदना', 'शादी', 'retirement', 'बच्चों की पढ़ाई']
  },
  {
    type: 'tenure',
    patterns: [
      /(\d+)\s*(year|years|साल|वर्ष|yr|yrs)/gi,
      /(\d+)\s*(month|months|महीने|महीना|mo|mos)/gi
    ],
    normalizer: (value) => {
      const num = parseInt(value.match(/\d+/)?.[0] || '0');
      const lower = value.toLowerCase();
      if (/month|महीने|महीना|mo/.test(lower)) {
        return `${num}_MONTHS`;
      }
      return `${num}_YEARS`;
    },
    validator: (value) => {
      const num = parseInt(value.match(/\d+/)?.[0] || '0');
      return num > 0 && num <= 30;
    },
    examples: ['5 years', '10 साल', '36 months', '24 महीने']
  },
  {
    type: 'age',
    patterns: [
      /(\d{1,2})\s*(year|years|साल|वर्ष)\s*(old|का|की|के)?/gi,
      /age[:\s]*(\d{1,2})/gi,
      /उम्र[:\s]*(\d{1,2})/gi,
      /आयु[:\s]*(\d{1,2})/gi
    ],
    normalizer: (value) => {
      const num = value.match(/\d+/)?.[0] || '0';
      return num;
    },
    validator: (value) => {
      const num = parseInt(value.match(/\d+/)?.[0] || '0');
      return num >= 18 && num <= 100;
    },
    examples: ['25 years old', '35 साल का', 'age 40', 'उम्र 30']
  },
  {
    type: 'annual_income',
    patterns: [
      /(?:annual|yearly|सालाना)\s*(?:income|salary|आय|वेतन)[:\s]*(?:rs\.?|₹|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
      /(?:annual|yearly|सालाना)\s*(?:income|salary|आय|वेतन)[:\s]*([0-9]+(?:\.[0-9]{1,2})?)\s*(?:lakh|lac|लाख)/gi,
      /(?:annual|yearly|सालाना)\s*(?:income|salary|आय|वेतन)[:\s]*([0-9]+(?:\.[0-9]{1,2})?)\s*(?:crore|cr|करोड़)/gi,
      /([0-9]+(?:\.[0-9]{1,2})?)\s*(?:lpa|lakh\s*per\s*annum|लाख\s*प्रति\s*वर्ष)/gi,
      /(?:income|salary|कमाई|आय)[:\s]*(?:rs\.?|₹)?\s*([0-9,]+)\s*(?:per\s*month|monthly|महीना)/gi
    ],
    normalizer: (value) => {
      let num = parseFloat(value.replace(/,/g, '').match(/[0-9.]+/)?.[0] || '0');
      const lower = value.toLowerCase();
      if (lower.includes('lakh') || lower.includes('lac') || lower.includes('लाख') || lower.includes('lpa')) {
        num *= 100000;
      } else if (lower.includes('crore') || lower.includes('cr') || lower.includes('करोड़')) {
        num *= 10000000;
      } else if (lower.includes('month') || lower.includes('monthly') || lower.includes('महीना')) {
        num *= 12; // Convert monthly to annual
      }
      return num.toString();
    },
    examples: ['5 LPA', 'सालाना आय 8 लाख', 'annual income 10 lakh', '50000 per month']
  },
  {
    type: 'credit_score',
    patterns: [
      /(?:cibil|credit)\s*(?:score)?[:\s]*(\d{3})/gi,
      /(?:सिबिल|क्रेडिट)\s*(?:स्कोर)?[:\s]*(\d{3})/gi,
      /score[:\s]*(\d{3})/gi
    ],
    validator: (value) => {
      const num = parseInt(value.match(/\d{3}/)?.[0] || '0');
      return num >= 300 && num <= 900;
    },
    normalizer: (value) => {
      return value.match(/\d{3}/)?.[0] || '0';
    },
    examples: ['CIBIL 750', 'credit score 680', 'सिबिल स्कोर 720']
  },
  {
    type: 'investment_type',
    patterns: [
      /(mutual\s*fund|mf|म्यूचुअल\s*फंड)/gi,
      /(fixed\s*deposit|fd|एफडी|फिक्स्ड\s*डिपॉजिट)/gi,
      /(recurring\s*deposit|rd|आरडी)/gi,
      /(sip|एसआईपी|systematic\s*investment)/gi,
      /(ppf|पीपीएफ|public\s*provident)/gi,
      /(nps|एनपीएस|national\s*pension)/gi,
      /(elss|ईएलएसएस|tax\s*saving\s*fund)/gi,
      /(stock|shares|equity|शेयर|इक्विटी)/gi,
      /(gold|सोना|गोल्ड)/gi,
      /(real\s*estate|property|प्रॉपर्टी)/gi
    ],
    normalizer: (value) => {
      const lower = value.toLowerCase();
      if (/mutual\s*fund|mf|म्यूचुअल\s*फंड/.test(lower)) return 'MUTUAL_FUND';
      if (/fixed\s*deposit|fd|एफडी|फिक्स्ड\s*डिपॉजिट/.test(lower)) return 'FD';
      if (/recurring\s*deposit|rd|आरडी/.test(lower)) return 'RD';
      if (/sip|एसआईपी|systematic/.test(lower)) return 'SIP';
      if (/ppf|पीपीएफ|public\s*provident/.test(lower)) return 'PPF';
      if (/nps|एनपीएस|national\s*pension/.test(lower)) return 'NPS';
      if (/elss|ईएलएसएस|tax\s*saving/.test(lower)) return 'ELSS';
      if (/stock|shares|equity|शेयर|इक्विटी/.test(lower)) return 'EQUITY';
      if (/gold|सोना|गोल्ड/.test(lower)) return 'GOLD';
      if (/real\s*estate|property|प्रॉपर्टी/.test(lower)) return 'REAL_ESTATE';
      return 'MUTUAL_FUND';
    },
    examples: ['SIP', 'mutual fund', 'एफडी', 'PPF', 'शेयर']
  },
  {
    type: 'bank_name',
    patterns: [
      /(sbi|state\s*bank|स्टेट\s*बैंक)/gi,
      /(hdfc|एचडीएफसी)/gi,
      /(icici|आईसीआईसीआई)/gi,
      /(axis|एक्सिस)/gi,
      /(kotak|कोटक)/gi,
      /(pnb|punjab\s*national|पंजाब\s*नेशनल)/gi,
      /(bob|bank\s*of\s*baroda|बैंक\s*ऑफ\s*बड़ौदा)/gi,
      /(canara|केनरा)/gi,
      /(union\s*bank|यूनियन\s*बैंक)/gi,
      /(idbi|आईडीबीआई)/gi,
      /(yes\s*bank|यस\s*बैंक)/gi,
      /(indusind|इंडसइंड)/gi
    ],
    normalizer: (value) => {
      const lower = value.toLowerCase();
      if (/sbi|state\s*bank|स्टेट\s*बैंक/.test(lower)) return 'SBI';
      if (/hdfc|एचडीएफसी/.test(lower)) return 'HDFC';
      if (/icici|आईसीआईसीआई/.test(lower)) return 'ICICI';
      if (/axis|एक्सिस/.test(lower)) return 'AXIS';
      if (/kotak|कोटक/.test(lower)) return 'KOTAK';
      if (/pnb|punjab\s*national|पंजाब\s*नेशनल/.test(lower)) return 'PNB';
      if (/bob|bank\s*of\s*baroda|बैंक\s*ऑफ\s*बड़ौदा/.test(lower)) return 'BOB';
      if (/canara|केनरा/.test(lower)) return 'CANARA';
      if (/union\s*bank|यूनियन\s*बैंक/.test(lower)) return 'UNION_BANK';
      if (/idbi|आईडीबीआई/.test(lower)) return 'IDBI';
      if (/yes\s*bank|यस\s*बैंक/.test(lower)) return 'YES_BANK';
      if (/indusind|इंडसइंड/.test(lower)) return 'INDUSIND';
      return value.toUpperCase();
    },
    examples: ['SBI', 'HDFC bank', 'आईसीआईसीआई', 'Kotak']
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// INDIAN STATES & CITIES (for location extraction)
// ═══════════════════════════════════════════════════════════════════════════════

const INDIAN_STATES: Record<string, string[]> = {
  'maharashtra': ['mumbai', 'pune', 'nagpur', 'nashik', 'aurangabad', 'मुंबई', 'पुणे'],
  'delhi': ['delhi', 'new delhi', 'दिल्ली', 'नई दिल्ली'],
  'karnataka': ['bangalore', 'bengaluru', 'mysore', 'बेंगलुरु', 'मैसूर'],
  'tamil_nadu': ['chennai', 'coimbatore', 'madurai', 'चेन्नई'],
  'telangana': ['hyderabad', 'हैदराबाद', 'secunderabad'],
  'gujarat': ['ahmedabad', 'surat', 'vadodara', 'अहमदाबाद', 'सूरत'],
  'west_bengal': ['kolkata', 'कोलकाता', 'howrah'],
  'rajasthan': ['jaipur', 'jodhpur', 'udaipur', 'जयपुर'],
  'uttar_pradesh': ['lucknow', 'noida', 'ghaziabad', 'लखनऊ', 'नोएडा'],
  'madhya_pradesh': ['bhopal', 'indore', 'भोपाल', 'इंदौर'],
  'kerala': ['kochi', 'thiruvananthapuram', 'कोच्चि'],
  'punjab': ['chandigarh', 'ludhiana', 'amritsar', 'चंडीगढ़', 'लुधियाना']
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITY EXTRACTOR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class EntityExtractor {
  private patterns: EntityPattern[] = ENTITY_PATTERNS;
  private aiProxyUrl: string;

  constructor(config?: { aiProxyUrl?: string }) {
    this.aiProxyUrl = config?.aiProxyUrl || process.env.AI_PROXY_URL || 'http://localhost:4444';
  }

  /**
   * Extract all entities from text
   */
  async extract(text: string, context?: Message[]): Promise<ExtractedEntities> {
    const entities: ExtractedEntities = {};

    // 1. Pattern-based extraction
    for (const pattern of this.patterns) {
      const extracted = this.extractByPattern(text, pattern);
      if (extracted.length > 0) {
        if (extracted.length === 1) {
          entities[pattern.type] = extracted[0];
        } else {
          entities[pattern.type] = extracted;
        }
      }
    }

    // 2. Location extraction (cities/states)
    const locations = this.extractLocations(text);
    if (locations.length > 0) {
      if (entities.location) {
        const existing = Array.isArray(entities.location) ? entities.location : [entities.location];
        entities.location = [...existing, ...locations];
      } else {
        entities.location = locations.length === 1 ? locations[0] : locations;
      }
    }

    // 3. AI-based extraction for complex entities
    if (Object.keys(entities).length === 0 || this.needsAIExtraction(text)) {
      const aiEntities = await this.extractWithAI(text, context);
      Object.assign(entities, aiEntities);
    }

    return entities;
  }

  /**
   * Extract entities using regex pattern
   */
  private extractByPattern(text: string, pattern: EntityPattern): Entity[] {
    const entities: Entity[] = [];
    const seen = new Set<string>();

    for (const regex of pattern.patterns) {
      const matches = text.matchAll(new RegExp(regex.source, regex.flags));

      for (const match of matches) {
        // Get the captured group (last non-undefined group)
        let value = match[1] || match[0];
        for (let i = match.length - 1; i >= 1; i--) {
          if (match[i]) {
            value = match[i];
            break;
          }
        }

        // Normalize
        const normalizedValue = pattern.normalizer ? pattern.normalizer(value) : value;

        // Skip duplicates
        if (seen.has(normalizedValue)) continue;

        // Validate
        if (pattern.validator && !pattern.validator(normalizedValue)) continue;

        seen.add(normalizedValue);

        entities.push({
          type: pattern.type,
          value,
          normalizedValue,
          confidence: 0.9,
          position: {
            start: match.index || 0,
            end: (match.index || 0) + match[0].length
          }
        });
      }
    }

    return entities;
  }

  /**
   * Extract location entities (cities, states)
   */
  private extractLocations(text: string): Entity[] {
    const entities: Entity[] = [];
    const lower = text.toLowerCase();

    for (const [state, cities] of Object.entries(INDIAN_STATES)) {
      for (const city of cities) {
        if (lower.includes(city.toLowerCase())) {
          entities.push({
            type: 'location',
            value: city,
            normalizedValue: city.charAt(0).toUpperCase() + city.slice(1),
            confidence: 0.85,
            metadata: { state, type: 'city' }
          });
        }
      }

      // Check state name
      const stateName = state.replace(/_/g, ' ');
      if (lower.includes(stateName)) {
        entities.push({
          type: 'location',
          value: stateName,
          normalizedValue: stateName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          confidence: 0.85,
          metadata: { type: 'state' }
        });
      }
    }

    return entities;
  }

  /**
   * Check if AI extraction is needed
   */
  private needsAIExtraction(text: string): boolean {
    // AI extraction for complex cases
    const complexPatterns = [
      /company\s*(?:name|called|named)/i,
      /कंपनी\s*(?:का\s*नाम|नाम)/i,
      /person\s*(?:name|called)/i,
      /product\s*(?:name|called)/i,
      /item\s*(?:name|called)/i
    ];

    return complexPatterns.some(p => p.test(text));
  }

  /**
   * AI-based entity extraction
   */
  private async extractWithAI(text: string, context?: Message[]): Promise<ExtractedEntities> {
    try {
      const systemPrompt = `You are an entity extractor for SWAYAM, an Indian business AI.
Extract named entities from the text. Focus on:
- Company names
- Person names
- Product/Item names
- Custom business terms

Return JSON object with entity types as keys and extracted values.
Example: { "company": { "value": "ABC Pvt Ltd", "confidence": 0.9 }, "person": { "value": "Rahul Sharma", "confidence": 0.85 } }`;

      const response = await fetch(`${this.aiProxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'auto',
          messages: [
            { role: 'system', content: systemPrompt },
            ...(context || []).slice(-2),
            { role: 'user', content: `Extract entities from: "${text}"` }
          ],
          temperature: 0.1
        })
      });

      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content || '{}';

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const entities: ExtractedEntities = {};

        for (const [type, value] of Object.entries(parsed)) {
          if (typeof value === 'object' && value !== null) {
            entities[type as EntityType] = value as Entity;
          } else if (typeof value === 'string') {
            entities[type as EntityType] = {
              type: type as EntityType,
              value,
              confidence: 0.7
            };
          }
        }

        return entities;
      }
    } catch (error) {
      console.error('AI entity extraction error:', error);
    }

    return {};
  }

  /**
   * Validate a specific entity
   */
  validate(type: EntityType, value: string): boolean {
    const pattern = this.patterns.find(p => p.type === type);
    if (pattern?.validator) {
      return pattern.validator(value);
    }
    return true;
  }

  /**
   * Normalize a specific entity
   */
  normalize(type: EntityType, value: string): string {
    const pattern = this.patterns.find(p => p.type === type);
    if (pattern?.normalizer) {
      return pattern.normalizer(value);
    }
    return value;
  }
}

// Export singleton instance
export const entityExtractor = new EntityExtractor();
