/**
 * SWAYAM Intent Classifier
 * Classifies user intent from natural language (Hindi + English)
 */

import type { Intent, IntentDomain, Message } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// INTENT PATTERNS - Comprehensive patterns for all domains
// ═══════════════════════════════════════════════════════════════════════════════

interface IntentPattern {
  intent: string;
  domain: IntentDomain;
  patterns: RegExp[];
  keywords: string[];
  keywordsHi: string[];
  priority: number;
  requiredEntities?: string[];
  tools?: string[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLIANCE INTENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'gst_setup',
    domain: 'compliance',
    patterns: [
      /gst\s*(registration|setup|apply|शुरू|रजिस्ट्रेशन)/i,
      /(register|apply)\s*(for)?\s*gst/i,
      /जीएसटी\s*(के लिए|का)\s*(रजिस्टर|आवेदन|सेटअप)/i
    ],
    keywords: ['gst', 'registration', 'setup', 'apply', 'new gstin'],
    keywordsHi: ['जीएसटी', 'रजिस्ट्रेशन', 'सेटअप', 'आवेदन', 'नया'],
    priority: 1,
    tools: ['gst_verify', 'mca_company_search', 'pan_verify']
  },
  {
    intent: 'gst_verify',
    domain: 'compliance',
    patterns: [
      /verify\s*(gstin|gst)/i,
      /(gstin|gst)\s*(verify|check|validate)/i,
      /जीएसटी\s*(वेरीफाई|चेक|जांच)/i
    ],
    keywords: ['verify', 'check', 'validate', 'gstin'],
    keywordsHi: ['वेरीफाई', 'चेक', 'जांच', 'जीएसटीएन'],
    priority: 2,
    requiredEntities: ['gstin'],
    tools: ['gst_verify']
  },
  {
    intent: 'gst_calculate',
    domain: 'compliance',
    patterns: [
      /calculate\s*gst/i,
      /gst\s*(calculate|calc|kitna|कितना)/i,
      /जीएसटी\s*(कैलकुलेट|कितना|निकालो)/i,
      /(\d+)\s*(पर|पे|on)\s*gst/i
    ],
    keywords: ['calculate', 'gst', 'tax', 'amount'],
    keywordsHi: ['कैलकुलेट', 'जीएसटी', 'टैक्स', 'कितना'],
    priority: 2,
    requiredEntities: ['amount'],
    tools: ['gst_calc']
  },
  {
    intent: 'gst_return_file',
    domain: 'compliance',
    patterns: [
      /(file|submit)\s*(gstr|gst\s*return)/i,
      /gstr[123b9]\s*(file|submit|भरो)/i,
      /जीएसटी\s*रिटर्न\s*(फाइल|भरो|जमा)/i
    ],
    keywords: ['file', 'return', 'gstr1', 'gstr3b', 'submit'],
    keywordsHi: ['फाइल', 'रिटर्न', 'भरो', 'जमा'],
    priority: 1,
    tools: ['gstr1_prepare', 'gstr3b_prepare', 'gstr1_file', 'gstr3b_file']
  },
  {
    intent: 'eway_generate',
    domain: 'compliance',
    patterns: [
      /(generate|create|make)\s*e-?way/i,
      /e-?way\s*(bill|बिल)\s*(बनाओ|generate)/i,
      /ई-?वे\s*बिल\s*(बनाओ|जनरेट)/i
    ],
    keywords: ['eway', 'e-way', 'bill', 'generate', 'transport'],
    keywordsHi: ['ई-वे', 'बिल', 'बनाओ', 'जनरेट'],
    priority: 2,
    tools: ['eway_generate']
  },
  {
    intent: 'einvoice_generate',
    domain: 'compliance',
    patterns: [
      /(generate|create)\s*e-?invoice/i,
      /e-?invoice\s*(बनाओ|generate)/i,
      /ई-?इनवॉइस\s*(बनाओ|जनरेट)/i
    ],
    keywords: ['einvoice', 'e-invoice', 'irn', 'generate'],
    keywordsHi: ['ई-इनवॉइस', 'बनाओ', 'जनरेट'],
    priority: 2,
    tools: ['einvoice_generate']
  },
  {
    intent: 'tds_calculate',
    domain: 'compliance',
    patterns: [
      /(calculate|kitna)\s*tds/i,
      /tds\s*(calculate|कितना|निकालो)/i,
      /टीडीएस\s*(कैलकुलेट|कितना)/i
    ],
    keywords: ['tds', 'calculate', 'deduction'],
    keywordsHi: ['टीडीएस', 'कैलकुलेट', 'कितना'],
    priority: 2,
    requiredEntities: ['amount'],
    tools: ['tds_calc']
  },
  {
    intent: 'income_tax_calculate',
    domain: 'compliance',
    patterns: [
      /(calculate|kitna)\s*(income\s*tax|itr)/i,
      /(income\s*tax|itr)\s*(calculate|कितना)/i,
      /(आयकर|इनकम\s*टैक्स)\s*(कैलकुलेट|कितना)/i
    ],
    keywords: ['income', 'tax', 'itr', 'calculate'],
    keywordsHi: ['आयकर', 'इनकम', 'टैक्स', 'कैलकुलेट'],
    priority: 2,
    requiredEntities: ['amount'],
    tools: ['income_tax_calc']
  },
  {
    intent: 'hsn_lookup',
    domain: 'compliance',
    patterns: [
      /(hsn|sac)\s*(code|lookup|find|खोजो)/i,
      /(find|search|खोजो)\s*(hsn|sac)/i,
      /एचएसएन\s*(कोड|खोजो)/i
    ],
    keywords: ['hsn', 'sac', 'code', 'lookup'],
    keywordsHi: ['एचएसएन', 'कोड', 'खोजो'],
    priority: 3,
    tools: ['hsn_lookup', 'sac_lookup']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ERP INTENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'invoice_create',
    domain: 'erp',
    patterns: [
      /(create|make|generate)\s*invoice/i,
      /invoice\s*(बनाओ|create)/i,
      /इनवॉइस\s*(बनाओ|जनरेट)/i,
      /बिल\s*बनाओ/i
    ],
    keywords: ['invoice', 'create', 'bill', 'generate'],
    keywordsHi: ['इनवॉइस', 'बनाओ', 'बिल', 'जनरेट'],
    priority: 1,
    tools: ['invoice_create']
  },
  {
    intent: 'stock_check',
    domain: 'erp',
    patterns: [
      /(check|show)\s*stock/i,
      /stock\s*(check|kitna|कितना)/i,
      /स्टॉक\s*(चेक|कितना|दिखाओ)/i,
      /inventory\s*(check|status)/i
    ],
    keywords: ['stock', 'inventory', 'check', 'available'],
    keywordsHi: ['स्टॉक', 'इन्वेंटरी', 'चेक', 'कितना'],
    priority: 2,
    tools: ['stock_check']
  },
  {
    intent: 'purchase_order_create',
    domain: 'erp',
    patterns: [
      /(create|make)\s*(po|purchase\s*order)/i,
      /(po|purchase\s*order)\s*बनाओ/i,
      /पीओ\s*बनाओ/i,
      /खरीद\s*ऑर्डर/i
    ],
    keywords: ['po', 'purchase', 'order', 'create'],
    keywordsHi: ['पीओ', 'खरीद', 'ऑर्डर', 'बनाओ'],
    priority: 2,
    tools: ['po_create']
  },
  {
    intent: 'sales_order_create',
    domain: 'erp',
    patterns: [
      /(create|make)\s*(so|sales\s*order)/i,
      /(so|sales\s*order)\s*बनाओ/i,
      /सेल्स\s*ऑर्डर/i,
      /बिक्री\s*ऑर्डर/i
    ],
    keywords: ['so', 'sales', 'order', 'create'],
    keywordsHi: ['एसओ', 'सेल्स', 'बिक्री', 'ऑर्डर'],
    priority: 2,
    tools: ['so_create']
  },
  {
    intent: 'accounting_report',
    domain: 'erp',
    patterns: [
      /(balance\s*sheet|trial\s*balance|p&?l|profit\s*loss)/i,
      /(show|generate)\s*(balance|trial|pnl)/i,
      /बैलेंस\s*शीट/i,
      /लाभ\s*हानि/i
    ],
    keywords: ['balance', 'sheet', 'trial', 'pnl', 'profit', 'loss'],
    keywordsHi: ['बैलेंस', 'शीट', 'लाभ', 'हानि'],
    priority: 2,
    tools: ['balance_sheet', 'trial_balance', 'profit_loss']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRM INTENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'lead_create',
    domain: 'crm',
    patterns: [
      /(create|add|make)\s+(a\s+)?(new\s+)?lead/i,
      /new\s+lead\s+(for|named)/i,
      /lead\s*(बनाओ|add|create)/i,
      /लीड\s*(बनाओ|जोड़ो|क्रिएट)/i,
      /नया\s*(लीड|ग्राहक|customer|lead)/i,
      /(register|add)\s+(new\s+)?(customer|client|prospect)/i,
      /prospect\s+(for|named)/i
    ],
    keywords: ['lead', 'create', 'add', 'new', 'customer', 'prospect', 'client', 'contact'],
    keywordsHi: ['लीड', 'बनाओ', 'जोड़ो', 'नया', 'ग्राहक', 'कस्टमर'],
    priority: 1,  // Higher priority than accounting_report
    tools: ['lead_create']
  },
  {
    intent: 'lead_followup',
    domain: 'crm',
    patterns: [
      /(followup|follow-up|follow\s*up)\s*(due|pending)/i,
      /(pending|due)\s*(followup|leads)/i,
      /फॉलोअप\s*(पेंडिंग|बाकी)/i
    ],
    keywords: ['followup', 'follow-up', 'pending', 'due'],
    keywordsHi: ['फॉलोअप', 'पेंडिंग', 'बाकी'],
    priority: 2,
    tools: ['lead_followup']
  },
  {
    intent: 'opportunity_pipeline',
    domain: 'crm',
    patterns: [
      /(show|view)\s*(pipeline|opportunities)/i,
      /pipeline\s*(दिखाओ|show)/i,
      /पाइपलाइन/i,
      /sales\s*funnel/i
    ],
    keywords: ['pipeline', 'opportunities', 'funnel', 'deals'],
    keywordsHi: ['पाइपलाइन', 'डील्स', 'अवसर'],
    priority: 2,
    tools: ['opportunity_pipeline', 'opportunity_list']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BANKING INTENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'upi_send',
    domain: 'banking',
    patterns: [
      /(send|transfer)\s*(money|payment|पैसे)/i,
      /upi\s*(send|transfer|भेजो)/i,
      /पैसे\s*(भेजो|ट्रांसफर)/i
    ],
    keywords: ['upi', 'send', 'transfer', 'money', 'payment'],
    keywordsHi: ['यूपीआई', 'भेजो', 'ट्रांसफर', 'पैसे'],
    priority: 2,
    requiredEntities: ['amount'],
    tools: ['upi_send']
  },
  {
    intent: 'bill_pay',
    domain: 'banking',
    patterns: [
      /(pay|भरो)\s*(electricity|bijli|water|pani|gas|mobile|dth)/i,
      /(बिजली|पानी|गैस|मोबाइल)\s*(बिल|bill)\s*(भरो|pay)/i,
      /recharge\s*(mobile|dth)/i
    ],
    keywords: ['bill', 'pay', 'electricity', 'water', 'gas', 'recharge'],
    keywordsHi: ['बिल', 'भरो', 'बिजली', 'पानी', 'गैस', 'रिचार्ज'],
    priority: 2,
    tools: ['bbps_electricity', 'bbps_water', 'bbps_gas', 'bbps_mobile']
  },
  {
    intent: 'emi_calculate',
    domain: 'banking',
    patterns: [
      /(calculate|kitna)\s*emi/i,
      /emi\s*(calculate|कितना|निकालो)/i,
      /ईएमआई\s*(कैलकुलेट|कितना)/i,
      /loan\s*emi/i
    ],
    keywords: ['emi', 'calculate', 'loan', 'monthly'],
    keywordsHi: ['ईएमआई', 'कैलकुलेट', 'लोन', 'कितना'],
    priority: 2,
    requiredEntities: ['amount'],
    tools: ['emi_calc']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BFC FINANCIAL INTENTS (ankrBFC Integration)
  // Captures financial intentions for behavioral intelligence
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'credit_eligibility_check',
    domain: 'banking',
    patterns: [
      /(loan|credit)\s*(eligible|eligibility|mil\s*sakta|मिल\s*सकता)/i,
      /मुझे\s*(लोन|क्रेडिट)\s*(मिल\s*सकता|मिलेगा)/i,
      /क्या\s*मैं\s*(eligible|पात्र|योग्य)\s*हूं/i,
      /(am\s*i|can\s*i)\s*(eligible|qualify)\s*(for)?\s*(loan|credit)/i,
      /लोन\s*के\s*लिए\s*(पात्र|योग्य)/i,
      /(check|जांचो)\s*(my)?\s*(loan|credit)\s*(eligibility|पात्रता)/i
    ],
    keywords: ['loan', 'credit', 'eligible', 'eligibility', 'qualify', 'check'],
    keywordsHi: ['लोन', 'क्रेडिट', 'पात्र', 'योग्य', 'मिल सकता', 'एलिजिबल'],
    priority: 1,
    tools: ['bfc_credit_check', 'bfc_eligibility_calc']
  },
  {
    intent: 'loan_apply',
    domain: 'banking',
    patterns: [
      /(apply|आवेदन)\s*(for)?\s*(loan|लोन)/i,
      /लोन\s*(के\s*लिए)?\s*(आवेदन|अप्लाई)/i,
      /(home|car|personal|education|होम|कार|पर्सनल)\s*loan/i,
      /मुझे\s*(home|car|personal|होम|कार|पर्सनल)?\s*लोन\s*चाहिए/i,
      /(get|लेना|लूं)\s*(a)?\s*loan/i
    ],
    keywords: ['apply', 'loan', 'home', 'car', 'personal', 'education', 'get'],
    keywordsHi: ['आवेदन', 'लोन', 'होम', 'कार', 'पर्सनल', 'चाहिए', 'लेना'],
    priority: 1,
    requiredEntities: ['loan_type', 'amount'],
    tools: ['bfc_loan_apply', 'bfc_document_upload']
  },
  {
    intent: 'loan_status_check',
    domain: 'banking',
    patterns: [
      /(loan|लोन)\s*(status|स्टेटस|कहां\s*तक)/i,
      /(my|मेरा)\s*loan\s*(application)?\s*(status)?/i,
      /लोन\s*का\s*(क्या\s*हुआ|स्टेटस)/i,
      /(check|track)\s*(my)?\s*loan\s*(application)?/i,
      /मेरा\s*आवेदन\s*कहां\s*तक\s*पहुंचा/i
    ],
    keywords: ['loan', 'status', 'check', 'track', 'application', 'progress'],
    keywordsHi: ['लोन', 'स्टेटस', 'आवेदन', 'कहां तक', 'प्रगति'],
    priority: 2,
    tools: ['bfc_loan_status']
  },
  {
    intent: 'credit_score_check',
    domain: 'banking',
    patterns: [
      /(credit|cibil)\s*(score|स्कोर)/i,
      /(my|मेरा)\s*(credit|cibil|क्रेडिट|सिबिल)\s*(score|स्कोर)/i,
      /सिबिल\s*(स्कोर|चेक)/i,
      /(check|show|दिखाओ)\s*(my)?\s*(credit|cibil)/i,
      /मेरा\s*क्रेडिट\s*स्कोर\s*(कितना|क्या)/i
    ],
    keywords: ['credit', 'cibil', 'score', 'check', 'rating'],
    keywordsHi: ['क्रेडिट', 'सिबिल', 'स्कोर', 'चेक', 'रेटिंग'],
    priority: 2,
    tools: ['bfc_credit_score']
  },
  {
    intent: 'insurance_quote_request',
    domain: 'banking',
    patterns: [
      /(insurance|बीमा)\s*(quote|कोटेशन|कितना)/i,
      /(health|life|car|bike|term)\s*insurance\s*(quote|price|premium)?/i,
      /(हेल्थ|लाइफ|कार|बाइक|टर्म)\s*(इंश्योरेंस|बीमा)/i,
      /बीमा\s*(का\s*)?कोटेशन\s*चाहिए/i,
      /(get|want)\s*(a)?\s*(health|life|car)?\s*insurance\s*(quote)?/i,
      /मुझे\s*बीमा\s*(करवाना|लेना)\s*है/i
    ],
    keywords: ['insurance', 'quote', 'health', 'life', 'car', 'premium', 'policy'],
    keywordsHi: ['इंश्योरेंस', 'बीमा', 'कोटेशन', 'हेल्थ', 'लाइफ', 'प्रीमियम'],
    priority: 1,
    requiredEntities: ['insurance_type'],
    tools: ['bfc_insurance_quote', 'bfc_premium_calc']
  },
  {
    intent: 'insurance_claim',
    domain: 'banking',
    patterns: [
      /(insurance|बीमा)\s*(claim|क्लेम|दावा)/i,
      /(file|submit|दर्ज)\s*(insurance)?\s*(claim|क्लेम)/i,
      /क्लेम\s*(करना|दर्ज\s*करना|फाइल)/i,
      /बीमा\s*का\s*दावा/i,
      /(how\s*to)?\s*claim\s*(insurance)?/i
    ],
    keywords: ['insurance', 'claim', 'file', 'submit', 'policy'],
    keywordsHi: ['इंश्योरेंस', 'क्लेम', 'दावा', 'दर्ज', 'फाइल'],
    priority: 1,
    tools: ['bfc_insurance_claim', 'bfc_claim_status']
  },
  {
    intent: 'investment_portfolio_view',
    domain: 'banking',
    patterns: [
      /(my|मेरा)\s*(investment|निवेश)\s*(portfolio|पोर्टफोलियो)?/i,
      /(show|दिखाओ)\s*(my)?\s*(investments|निवेश)/i,
      /मेरा\s*निवेश\s*(पोर्टफोलियो|दिखाओ)/i,
      /(portfolio|पोर्टफोलियो)\s*(status|performance|प्रदर्शन)/i,
      /कितना\s*निवेश\s*किया/i
    ],
    keywords: ['investment', 'portfolio', 'show', 'performance', 'returns'],
    keywordsHi: ['निवेश', 'पोर्टफोलियो', 'दिखाओ', 'प्रदर्शन', 'रिटर्न'],
    priority: 2,
    tools: ['bfc_portfolio_view']
  },
  {
    intent: 'investment_recommend',
    domain: 'banking',
    patterns: [
      /(where|कहां)\s*(should\s*i|मुझे)?\s*(invest|निवेश)/i,
      /(best|अच्छा)\s*(investment|निवेश)\s*(option|विकल्प)?/i,
      /निवेश\s*(कहां|कैसे)\s*करूं/i,
      /(mutual\s*fund|fd|sip|म्यूचुअल\s*फंड)\s*(suggest|recommend)/i,
      /पैसा\s*कहां\s*लगाऊं/i,
      /(suggest|recommend)\s*(me)?\s*(investments|funds)/i
    ],
    keywords: ['invest', 'investment', 'recommend', 'suggest', 'mutual fund', 'fd', 'sip'],
    keywordsHi: ['निवेश', 'कहां', 'सुझाव', 'म्यूचुअल फंड', 'एफडी', 'एसआईपी'],
    priority: 1,
    tools: ['bfc_investment_recommend', 'bfc_risk_profile']
  },
  {
    intent: 'financial_goal_set',
    domain: 'banking',
    patterns: [
      /(set|create|बनाओ)\s*(a)?\s*(financial)?\s*(goal|लक्ष्य)/i,
      /(save|बचत)\s*(for|के\s*लिए)\s*(house|car|education|wedding|retirement)/i,
      /(घर|कार|शादी|रिटायरमेंट)\s*के\s*लिए\s*(बचत|सेव)/i,
      /मुझे\s*(\d+)\s*(lakh|लाख|crore|करोड़)\s*(बचाने|जोड़ने)\s*हैं/i,
      /(financial|वित्तीय)\s*(goal|planning|लक्ष्य|प्लानिंग)/i
    ],
    keywords: ['goal', 'save', 'saving', 'target', 'financial', 'planning'],
    keywordsHi: ['लक्ष्य', 'बचत', 'सेव', 'टारगेट', 'वित्तीय', 'प्लानिंग'],
    priority: 1,
    requiredEntities: ['goal_type', 'amount'],
    tools: ['bfc_goal_create', 'bfc_goal_track']
  },
  {
    intent: 'financial_goal_progress',
    domain: 'banking',
    patterns: [
      /(my|मेरे)\s*(financial)?\s*(goal|goals|लक्ष्य)\s*(progress|status)?/i,
      /(show|दिखाओ)\s*(my)?\s*goals/i,
      /लक्ष्य\s*(कहां\s*तक|प्रगति|स्टेटस)/i,
      /कितना\s*(बचा|जमा)\s*हुआ/i,
      /(goal|saving)\s*(tracker|tracking)/i
    ],
    keywords: ['goal', 'progress', 'status', 'tracker', 'savings'],
    keywordsHi: ['लक्ष्य', 'प्रगति', 'स्टेटस', 'ट्रैकर', 'बचत'],
    priority: 2,
    tools: ['bfc_goal_progress']
  },
  {
    intent: 'offers_view',
    domain: 'banking',
    patterns: [
      /(my|मेरे)\s*(offers|ऑफर्स)/i,
      /(show|दिखाओ)\s*(me)?\s*(offers|ऑफर)/i,
      /क्या\s*ऑफर\s*(हैं|मिल\s*सकते)/i,
      /(available|उपलब्ध)\s*(offers|deals|ऑफर)/i,
      /मेरे\s*लिए\s*क्या\s*(ऑफर|डील)/i,
      /(special|exclusive)\s*(offer|deal)/i
    ],
    keywords: ['offers', 'deals', 'available', 'special', 'exclusive', 'show'],
    keywordsHi: ['ऑफर', 'डील', 'उपलब्ध', 'स्पेशल', 'दिखाओ'],
    priority: 2,
    tools: ['bfc_offers_list', 'bfc_offer_details']
  },
  {
    intent: 'offer_apply',
    domain: 'banking',
    patterns: [
      /(apply|avail|use)\s*(this)?\s*(offer|ऑफर)/i,
      /ऑफर\s*(लेना|अप्लाई|इस्तेमाल)/i,
      /(redeem|claim)\s*(the)?\s*(offer|reward)/i,
      /यह\s*ऑफर\s*(चाहिए|लूंगा)/i,
      /(interested\s*in|want)\s*(this)?\s*offer/i
    ],
    keywords: ['apply', 'avail', 'use', 'redeem', 'claim', 'offer'],
    keywordsHi: ['अप्लाई', 'लेना', 'इस्तेमाल', 'रिडीम', 'ऑफर'],
    priority: 1,
    requiredEntities: ['offer_id'],
    tools: ['bfc_offer_apply']
  },
  {
    intent: 'rewards_check',
    domain: 'banking',
    patterns: [
      /(my|मेरे)\s*(rewards|points|रिवॉर्ड्स|पॉइंट्स)/i,
      /(show|check|दिखाओ)\s*(my)?\s*(rewards|points)/i,
      /कितने\s*(पॉइंट्स|रिवॉर्ड्स)\s*(हैं|मिले)/i,
      /(reward|loyalty)\s*(points|balance)/i,
      /मेरे\s*रिवॉर्ड\s*पॉइंट्स/i
    ],
    keywords: ['rewards', 'points', 'loyalty', 'balance', 'check'],
    keywordsHi: ['रिवॉर्ड्स', 'पॉइंट्स', 'लॉयल्टी', 'बैलेंस', 'चेक'],
    priority: 2,
    tools: ['bfc_rewards_balance', 'bfc_rewards_history']
  },
  {
    intent: 'rewards_redeem',
    domain: 'banking',
    patterns: [
      /(redeem|use|इस्तेमाल)\s*(my)?\s*(rewards|points)/i,
      /पॉइंट्स\s*(रिडीम|इस्तेमाल|खर्च)/i,
      /(convert|exchange)\s*points/i,
      /रिवॉर्ड्स\s*(का\s*इस्तेमाल|खर्च)/i,
      /(claim|get)\s*(rewards|cashback)/i
    ],
    keywords: ['redeem', 'use', 'convert', 'exchange', 'claim', 'cashback'],
    keywordsHi: ['रिडीम', 'इस्तेमाल', 'खर्च', 'क्लेम', 'कैशबैक'],
    priority: 1,
    tools: ['bfc_rewards_redeem']
  },
  {
    intent: 'spending_analysis',
    domain: 'banking',
    patterns: [
      /(my|मेरा)\s*(spending|खर्च)\s*(analysis|pattern|विश्लेषण)?/i,
      /(where|कहां)\s*(am\s*i|मैं)\s*spending/i,
      /खर्च\s*(कहां|कितना)\s*(हो\s*रहा|किया)/i,
      /(expense|खर्चे)\s*(report|breakdown|रिपोर्ट)/i,
      /पैसा\s*कहां\s*जा\s*रहा/i
    ],
    keywords: ['spending', 'expense', 'analysis', 'pattern', 'where', 'breakdown'],
    keywordsHi: ['खर्च', 'खर्चे', 'विश्लेषण', 'कहां', 'रिपोर्ट'],
    priority: 2,
    tools: ['bfc_spending_analysis', 'bfc_expense_report']
  },
  {
    intent: 'budget_set',
    domain: 'banking',
    patterns: [
      /(set|create|बनाओ)\s*(a)?\s*(budget|बजट)/i,
      /(monthly|महीने\s*का)\s*(budget|बजट)/i,
      /बजट\s*(सेट|बनाओ|तय)/i,
      /(limit|control)\s*(my)?\s*(spending|expenses)/i,
      /खर्चे\s*(कम|कंट्रोल)\s*करने/i
    ],
    keywords: ['budget', 'set', 'monthly', 'limit', 'control', 'spending'],
    keywordsHi: ['बजट', 'सेट', 'महीने', 'लिमिट', 'कंट्रोल', 'खर्च'],
    priority: 2,
    tools: ['bfc_budget_create', 'bfc_budget_track']
  },
  {
    intent: 'financial_advice',
    domain: 'banking',
    patterns: [
      /(financial|वित्तीय)\s*(advice|सलाह)/i,
      /(need|चाहिए)\s*(financial)?\s*(help|advice|मदद|सलाह)/i,
      /(money|पैसे)\s*(management|प्रबंधन)\s*(tips|सुझाव)?/i,
      /पैसों\s*की\s*(सलाह|टिप्स)/i,
      /(improve|सुधारो)\s*(my)?\s*(finances|वित्त)/i,
      /आर्थिक\s*(सलाह|मदद)/i
    ],
    keywords: ['financial', 'advice', 'help', 'tips', 'money', 'management'],
    keywordsHi: ['वित्तीय', 'सलाह', 'मदद', 'टिप्स', 'पैसे', 'प्रबंधन'],
    priority: 2,
    tools: ['bfc_financial_advice', 'bfc_tips']
  },
  {
    intent: 'account_link',
    domain: 'banking',
    patterns: [
      /(link|connect|जोड़ो)\s*(my)?\s*(bank)?\s*(account|अकाउंट)/i,
      /(add|जोड़ो)\s*(another|new)?\s*(bank|बैंक)/i,
      /बैंक\s*अकाउंट\s*(जोड़ो|लिंक)/i,
      /(setu|aa|account\s*aggregator)\s*(link|connect)/i,
      /खाता\s*जोड़ना\s*है/i
    ],
    keywords: ['link', 'connect', 'add', 'bank', 'account', 'setu', 'aa'],
    keywordsHi: ['लिंक', 'जोड़ो', 'बैंक', 'अकाउंट', 'खाता'],
    priority: 1,
    tools: ['bfc_account_link', 'setu_aa_consent']
  },
  {
    intent: 'account_summary',
    domain: 'banking',
    patterns: [
      /(my|मेरा)\s*(account|accounts|खाता|खाते)\s*(summary|सारांश)?/i,
      /(show|दिखाओ)\s*(all)?\s*(my)?\s*(accounts|balances)/i,
      /सभी\s*खातों\s*का\s*(बैलेंस|सारांश)/i,
      /(total|कुल)\s*(balance|बैलेंस)/i,
      /कितना\s*पैसा\s*है/i
    ],
    keywords: ['account', 'summary', 'balance', 'total', 'all'],
    keywordsHi: ['खाता', 'सारांश', 'बैलेंस', 'कुल', 'सभी'],
    priority: 2,
    tools: ['bfc_account_summary', 'bfc_balance_view']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GOVERNMENT INTENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'aadhaar_verify',
    domain: 'government',
    patterns: [
      /(verify|check)\s*aadhaar/i,
      /aadhaar\s*(verify|check|वेरीफाई)/i,
      /आधार\s*(वेरीफाई|चेक)/i
    ],
    keywords: ['aadhaar', 'verify', 'check', 'ekyc'],
    keywordsHi: ['आधार', 'वेरीफाई', 'चेक'],
    priority: 2,
    requiredEntities: ['aadhaar'],
    tools: ['aadhaar_verify']
  },
  {
    intent: 'pan_verify',
    domain: 'government',
    patterns: [
      /(verify|check)\s*pan/i,
      /pan\s*(verify|check|वेरीफाई)/i,
      /पैन\s*(वेरीफाई|चेक)/i
    ],
    keywords: ['pan', 'verify', 'check'],
    keywordsHi: ['पैन', 'वेरीफाई', 'चेक'],
    priority: 2,
    requiredEntities: ['pan'],
    tools: ['pan_verify']
  },
  {
    intent: 'epf_balance',
    domain: 'government',
    patterns: [
      /(check|show)\s*(pf|epf|provident\s*fund)\s*balance/i,
      /(pf|epf)\s*balance\s*(check|दिखाओ)/i,
      /पीएफ\s*बैलेंस/i
    ],
    keywords: ['pf', 'epf', 'balance', 'provident'],
    keywordsHi: ['पीएफ', 'ईपीएफ', 'बैलेंस'],
    priority: 2,
    tools: ['epf_balance']
  },
  {
    intent: 'pm_scheme_check',
    domain: 'government',
    patterns: [
      /(pm|pradhan\s*mantri)\s*(kisan|awas|ujjwala)/i,
      /पीएम\s*(किसान|आवास|उज्ज्वला)/i,
      /scheme\s*(status|check)/i
    ],
    keywords: ['pm', 'kisan', 'awas', 'ujjwala', 'scheme'],
    keywordsHi: ['पीएम', 'किसान', 'आवास', 'उज्ज्वला', 'योजना'],
    priority: 2,
    tools: ['pm_kisan', 'pm_awas', 'ujjwala']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGISTICS INTENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'vehicle_track',
    domain: 'logistics',
    patterns: [
      /(track|locate|find)\s*(vehicle|truck|गाड़ी)/i,
      /(vehicle|truck|गाड़ी)\s*(kahan|कहां|where)/i,
      /गाड़ी\s*(ट्रैक|कहां)/i
    ],
    keywords: ['track', 'vehicle', 'truck', 'location', 'gps'],
    keywordsHi: ['ट्रैक', 'गाड़ी', 'ट्रक', 'कहां'],
    priority: 2,
    requiredEntities: ['vehicle'],
    tools: ['vehicle_position', 'live_positions']
  },
  {
    intent: 'container_track',
    domain: 'logistics',
    patterns: [
      /(track|locate)\s*container/i,
      /container\s*(track|status|ट्रैक)/i,
      /कंटेनर\s*(ट्रैक|स्टेटस)/i
    ],
    keywords: ['container', 'track', 'shipping', 'status'],
    keywordsHi: ['कंटेनर', 'ट्रैक', 'शिपिंग'],
    priority: 2,
    requiredEntities: ['container'],
    tools: ['container_track']
  },
  {
    intent: 'toll_estimate',
    domain: 'logistics',
    patterns: [
      /(estimate|calculate)\s*toll/i,
      /toll\s*(kitna|कितना|estimate)/i,
      /टोल\s*(कितना|estimate)/i
    ],
    keywords: ['toll', 'estimate', 'highway', 'charges'],
    keywordsHi: ['टोल', 'कितना', 'हाईवे'],
    priority: 2,
    tools: ['toll_estimate']
  },
  {
    intent: 'distance_calculate',
    domain: 'logistics',
    patterns: [
      /(distance|दूरी)\s*(between|calculate|कितनी)/i,
      /(kitni|कितनी)\s*(door|दूर)/i,
      /route\s*(distance|plan)/i
    ],
    keywords: ['distance', 'route', 'between', 'calculate'],
    keywordsHi: ['दूरी', 'रूट', 'कितनी', 'दूर'],
    priority: 2,
    tools: ['distance_calc']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERAL INTENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'weather_check',
    domain: 'general',
    patterns: [
      /(weather|mausam|मौसम)\s*(in|ka|का)?/i,
      /(check|show)\s*weather/i,
      /आज\s*का\s*मौसम/i
    ],
    keywords: ['weather', 'temperature', 'forecast'],
    keywordsHi: ['मौसम', 'तापमान', 'बारिश'],
    priority: 3,
    tools: ['weather']
  },
  {
    intent: 'web_search',
    domain: 'general',
    patterns: [
      /(search|find|खोजो)\s*(for|about)?/i,
      /google\s*/i,
      /इंटरनेट\s*पर\s*खोजो/i
    ],
    keywords: ['search', 'find', 'google', 'internet'],
    keywordsHi: ['खोजो', 'ढूंढो', 'इंटरनेट'],
    priority: 4,
    tools: ['web_search']
  },
  {
    intent: 'calculate',
    domain: 'general',
    patterns: [
      /(\d+)\s*[\+\-\*\/]\s*(\d+)/,
      /(calculate|kitna|कितना)\s*(\d+)/i,
      /(\d+)\s*(plus|minus|into|divided)/i
    ],
    keywords: ['calculate', 'plus', 'minus', 'multiply', 'divide'],
    keywordsHi: ['कैलकुलेट', 'जोड़', 'घटा', 'गुणा', 'भाग'],
    priority: 4,
    tools: ['calculator']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // META INTENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'help',
    domain: 'meta',
    patterns: [
      /(help|मदद|सहायता)/i,
      /(what\s*can\s*you|क्या\s*कर\s*सकते)/i,
      /features|capabilities/i
    ],
    keywords: ['help', 'features', 'capabilities', 'how'],
    keywordsHi: ['मदद', 'सहायता', 'कैसे', 'क्या'],
    priority: 5,
    tools: []
  },
  {
    intent: 'greeting',
    domain: 'meta',
    patterns: [
      /^(hi|hello|hey|namaste|नमस्ते|हाय|हेलो)$/i,
      /good\s*(morning|afternoon|evening)/i,
      /शुभ\s*(प्रभात|संध्या)/i
    ],
    keywords: ['hi', 'hello', 'hey', 'namaste'],
    keywordsHi: ['नमस्ते', 'हाय', 'हेलो'],
    priority: 5,
    tools: []
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// INTENT CLASSIFIER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class IntentClassifier {
  private patterns: IntentPattern[] = INTENT_PATTERNS;
  private aiProxyUrl: string;

  constructor(config?: { aiProxyUrl?: string }) {
    this.aiProxyUrl = config?.aiProxyUrl || process.env.AI_PROXY_URL || 'http://localhost:4444';
  }

  /**
   * Classify intent from text using pattern matching + AI fallback
   */
  async classify(text: string, context?: Message[]): Promise<Intent> {
    // 1. Try pattern matching first (fast)
    const patternMatch = this.matchPatterns(text);
    if (patternMatch && patternMatch.confidence > 0.7) {
      return patternMatch;
    }

    // 2. Try keyword matching
    const keywordMatch = this.matchKeywords(text);
    if (keywordMatch && keywordMatch.confidence > 0.6) {
      return keywordMatch;
    }

    // 3. Fall back to AI classification
    const aiMatch = await this.classifyWithAI(text, context);

    // 4. Combine results
    return this.combineResults(patternMatch, keywordMatch, aiMatch);
  }

  /**
   * Pattern-based matching (regex)
   */
  private matchPatterns(text: string): Intent | null {
    const normalizedText = text.toLowerCase().trim();
    let bestMatch: { pattern: IntentPattern; score: number } | null = null;

    for (const pattern of this.patterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(normalizedText)) {
          const score = 0.9 - (pattern.priority * 0.05); // Higher priority = higher score
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { pattern, score };
          }
        }
      }
    }

    if (bestMatch) {
      return {
        primary: bestMatch.pattern.intent,
        domain: bestMatch.pattern.domain,
        confidence: bestMatch.score,
        voiceTriggers: bestMatch.pattern.keywords.concat(bestMatch.pattern.keywordsHi)
      };
    }

    return null;
  }

  /**
   * Keyword-based matching
   */
  private matchKeywords(text: string): Intent | null {
    const normalizedText = text.toLowerCase().trim();
    const words = normalizedText.split(/\s+/);
    let bestMatch: { pattern: IntentPattern; score: number } | null = null;

    for (const pattern of this.patterns) {
      const allKeywords = [...pattern.keywords, ...pattern.keywordsHi];
      let matchCount = 0;

      for (const word of words) {
        if (allKeywords.some(kw => word.includes(kw.toLowerCase()) || kw.toLowerCase().includes(word))) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const score = (matchCount / allKeywords.length) * (1 - pattern.priority * 0.1);
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { pattern, score };
        }
      }
    }

    if (bestMatch && bestMatch.score > 0.2) {
      return {
        primary: bestMatch.pattern.intent,
        domain: bestMatch.pattern.domain,
        confidence: Math.min(bestMatch.score + 0.3, 0.8),
        voiceTriggers: bestMatch.pattern.keywords
      };
    }

    return null;
  }

  /**
   * AI-based classification using AI Proxy
   */
  private async classifyWithAI(text: string, context?: Message[]): Promise<Intent> {
    try {
      const systemPrompt = `You are an intent classifier for SWAYAM, an Indian voice AI assistant.
Classify the user's intent into one of these categories:
- compliance: GST, TDS, ITR, MCA, tax-related
- erp: Invoicing, accounting, inventory, purchase, sales
- crm: Leads, contacts, opportunities, sales activities
- banking: UPI, bill payments, loans, calculators, credit eligibility, insurance quotes, investment advice, financial goals, offers/rewards, spending analysis, account linking
- government: Aadhaar, PAN, DigiLocker, government schemes
- logistics: Vehicle tracking, shipping, toll, distance
- general: Weather, search, calculator
- meta: Help, greetings, settings

For banking financial intents, use these specific intent names:
- credit_eligibility_check: Checking loan eligibility
- loan_apply: Applying for loans (home, car, personal, education)
- loan_status_check: Tracking loan application status
- credit_score_check: Checking CIBIL/credit score
- insurance_quote_request: Getting insurance quotes
- insurance_claim: Filing insurance claims
- investment_portfolio_view: Viewing investments
- investment_recommend: Getting investment recommendations
- financial_goal_set: Setting savings goals
- financial_goal_progress: Checking goal progress
- offers_view: Viewing available offers
- offer_apply: Applying for offers
- rewards_check: Checking reward points
- rewards_redeem: Redeeming rewards
- spending_analysis: Analyzing spending patterns
- budget_set: Setting budgets
- financial_advice: Getting financial advice
- account_link: Linking bank accounts (Setu AA)
- account_summary: Viewing account summary

Return JSON: { "intent": "specific_intent_name", "domain": "category", "confidence": 0.0-1.0 }`;

      const response = await fetch(`${this.aiProxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'auto',
          messages: [
            { role: 'system', content: systemPrompt },
            ...(context || []).slice(-3),
            { role: 'user', content: text }
          ],
          temperature: 0.1
        })
      });

      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content || '{}';

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          primary: parsed.intent || 'unknown',
          domain: parsed.domain || 'general',
          confidence: parsed.confidence || 0.5
        };
      }
    } catch (error) {
      console.error('AI classification error:', error);
    }

    return {
      primary: 'unknown',
      domain: 'general',
      confidence: 0.3
    };
  }

  /**
   * Combine multiple classification results
   */
  private combineResults(
    patternMatch: Intent | null,
    keywordMatch: Intent | null,
    aiMatch: Intent
  ): Intent {
    // If pattern match is confident, use it
    if (patternMatch && patternMatch.confidence > 0.8) {
      return patternMatch;
    }

    // If all agree, boost confidence
    if (patternMatch && keywordMatch && aiMatch &&
        patternMatch.primary === keywordMatch.primary &&
        patternMatch.primary === aiMatch.primary) {
      return {
        ...patternMatch,
        confidence: Math.min(patternMatch.confidence + 0.1, 1.0)
      };
    }

    // Otherwise, pick best
    const candidates = [patternMatch, keywordMatch, aiMatch].filter(Boolean) as Intent[];
    return candidates.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );
  }

  /**
   * Get tools required for an intent
   */
  getToolsForIntent(intentName: string): string[] {
    const pattern = this.patterns.find(p => p.intent === intentName);
    return pattern?.tools || [];
  }

  /**
   * Get required entities for an intent
   */
  getRequiredEntities(intentName: string): string[] {
    const pattern = this.patterns.find(p => p.intent === intentName);
    return pattern?.requiredEntities || [];
  }
}

// Export singleton instance
export const intentClassifier = new IntentClassifier();
