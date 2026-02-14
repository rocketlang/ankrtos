/**
 * ANKR Package Catalog
 * Knowledge base of @ankr/* packages for product scaffolding
 */

export interface PackageInfo {
  name: string;
  description: string;
  category: string;
  keywords: string[];
  useCases: string[];
  dependencies?: string[];
  example?: string;
}

export const PACKAGE_CATALOG: Record<string, PackageInfo> = {
  // ═══════════════════════════════════════════════════════════════
  // AI & INTELLIGENCE
  // ═══════════════════════════════════════════════════════════════
  '@ankr/ai-router': {
    name: '@ankr/ai-router',
    description: 'Multi-provider LLM router with failover (Groq, Gemini, Claude, GPT)',
    category: 'ai',
    keywords: ['ai', 'llm', 'chat', 'openai', 'claude', 'groq', 'gemini'],
    useCases: ['AI chatbot', 'Text generation', 'AI assistant', 'Code generation'],
    example: `import { AIRouter } from '@ankr/ai-router';
const ai = new AIRouter();
const response = await ai.chat('Hello!');`
  },
  '@ankr/intelligence': {
    name: '@ankr/intelligence',
    description: 'Conversational AI with intent classification, entity extraction, todo planning',
    category: 'ai',
    keywords: ['conversation', 'intent', 'entity', 'planning', 'nlu'],
    useCases: ['Smart assistant', 'Task planning', 'Conversational UI'],
    dependencies: ['@ankr/ai-router']
  },
  '@ankr/eon': {
    name: '@ankr/eon',
    description: 'Memory & knowledge graph system (episodic, semantic, procedural)',
    category: 'ai',
    keywords: ['memory', 'knowledge', 'graph', 'context', 'learning'],
    useCases: ['AI memory', 'Context persistence', 'User preferences', 'Learning system']
  },
  '@ankr/embeddings': {
    name: '@ankr/embeddings',
    description: 'Vector embeddings service with pgvector',
    category: 'ai',
    keywords: ['embeddings', 'vectors', 'similarity', 'search', 'rag'],
    useCases: ['Semantic search', 'RAG', 'Document similarity']
  },
  '@ankr/rag': {
    name: '@ankr/rag',
    description: 'Retrieval Augmented Generation with document chunking',
    category: 'ai',
    keywords: ['rag', 'retrieval', 'documents', 'context'],
    useCases: ['Document Q&A', 'Knowledge base', 'Contextual AI'],
    dependencies: ['@ankr/embeddings', '@ankr/ai-router']
  },

  // ═══════════════════════════════════════════════════════════════
  // AUTH & SECURITY
  // ═══════════════════════════════════════════════════════════════
  '@ankr/oauth': {
    name: '@ankr/oauth',
    description: 'OAuth 2.0 with 9 providers (Google, GitHub, etc.)',
    category: 'auth',
    keywords: ['oauth', 'auth', 'login', 'google', 'github', 'social'],
    useCases: ['Social login', 'User authentication', 'SSO'],
    example: `import { OAuthProvider } from '@ankr/oauth';
const auth = new OAuthProvider('google');
const url = auth.getAuthUrl();`
  },
  '@ankr/iam': {
    name: '@ankr/iam',
    description: 'Identity & Access Management (RBAC, MFA, permissions)',
    category: 'auth',
    keywords: ['rbac', 'permissions', 'roles', 'mfa', 'access'],
    useCases: ['Role-based access', 'Admin panels', 'Multi-tenant apps']
  },
  '@ankr/otp-auth': {
    name: '@ankr/otp-auth',
    description: 'OTP authentication (MSG91, Twilio)',
    category: 'auth',
    keywords: ['otp', 'sms', 'verification', 'phone'],
    useCases: ['Phone verification', 'Two-factor auth', 'Indian users']
  },
  '@ankr/security': {
    name: '@ankr/security',
    description: 'WAF, encryption, rate limiting, security middleware',
    category: 'security',
    keywords: ['security', 'waf', 'encryption', 'rate-limit'],
    useCases: ['API security', 'Data encryption', 'DDoS protection']
  },

  // ═══════════════════════════════════════════════════════════════
  // COMPLIANCE & TAX (INDIA)
  // ═══════════════════════════════════════════════════════════════
  '@ankr/compliance-gst': {
    name: '@ankr/compliance-gst',
    description: 'GST compliance - GSTIN validation, e-Invoice, GSTR filing',
    category: 'compliance',
    keywords: ['gst', 'gstin', 'einvoice', 'gstr', 'tax'],
    useCases: ['GST billing', 'E-invoicing', 'Tax compliance'],
    example: `import { validateGSTIN } from '@ankr/compliance-gst';
const isValid = validateGSTIN('29ABCDE1234F1Z5');`
  },
  '@ankr/compliance-tds': {
    name: '@ankr/compliance-tds',
    description: 'TDS compliance - deduction, calculation, Form 26Q',
    category: 'compliance',
    keywords: ['tds', 'tax', 'deduction', '26q'],
    useCases: ['Salary TDS', 'Vendor payments', 'TDS filing']
  },
  '@ankr/compliance-itr': {
    name: '@ankr/compliance-itr',
    description: 'Income Tax Return filing and validation',
    category: 'compliance',
    keywords: ['itr', 'income-tax', 'filing', 'pan'],
    useCases: ['ITR preparation', 'Tax calculation']
  },
  '@ankr/einvoice': {
    name: '@ankr/einvoice',
    description: 'E-Invoice generation with IRP integration',
    category: 'compliance',
    keywords: ['einvoice', 'irp', 'irn', 'qr'],
    useCases: ['B2B invoicing', 'E-way bills', 'GST invoices'],
    dependencies: ['@ankr/compliance-gst']
  },

  // ═══════════════════════════════════════════════════════════════
  // BANKING & PAYMENTS
  // ═══════════════════════════════════════════════════════════════
  '@ankr/banking-upi': {
    name: '@ankr/banking-upi',
    description: 'UPI payments integration',
    category: 'banking',
    keywords: ['upi', 'payment', 'gpay', 'phonepe'],
    useCases: ['UPI payments', 'Payment links', 'QR payments']
  },
  '@ankr/banking-bbps': {
    name: '@ankr/banking-bbps',
    description: 'BBPS bill payments (electricity, water, etc.)',
    category: 'banking',
    keywords: ['bbps', 'bills', 'electricity', 'recharge'],
    useCases: ['Utility bills', 'Recharges', 'Bill payments']
  },
  '@ankr/banking-calculators': {
    name: '@ankr/banking-calculators',
    description: 'EMI, loan, interest calculators',
    category: 'banking',
    keywords: ['emi', 'loan', 'interest', 'calculator'],
    useCases: ['Loan calculators', 'EMI tools', 'Financial planning']
  },

  // ═══════════════════════════════════════════════════════════════
  // CRM
  // ═══════════════════════════════════════════════════════════════
  '@ankr/crm-core': {
    name: '@ankr/crm-core',
    description: 'CRM core - leads, contacts, deals, activities',
    category: 'crm',
    keywords: ['crm', 'leads', 'contacts', 'deals', 'sales'],
    useCases: ['Sales CRM', 'Lead management', 'Customer tracking'],
    dependencies: ['@ankr/crm-prisma']
  },
  '@ankr/crm-ui': {
    name: '@ankr/crm-ui',
    description: 'CRM UI components (DataTable, Pipeline, ActivityFeed)',
    category: 'crm',
    keywords: ['crm', 'ui', 'table', 'pipeline', 'dashboard'],
    useCases: ['CRM dashboard', 'Lead views', 'Deal pipelines']
  },

  // ═══════════════════════════════════════════════════════════════
  // ERP
  // ═══════════════════════════════════════════════════════════════
  '@ankr/erp': {
    name: '@ankr/erp',
    description: 'Complete ERP system - inventory, sales, purchases',
    category: 'erp',
    keywords: ['erp', 'inventory', 'sales', 'purchases', 'accounting'],
    useCases: ['Business management', 'Inventory control', 'Order management'],
    dependencies: ['@ankr/erp-prisma', '@ankr/erp-ui']
  },
  '@ankr/erp-inventory': {
    name: '@ankr/erp-inventory',
    description: 'Inventory management with stock tracking',
    category: 'erp',
    keywords: ['inventory', 'stock', 'warehouse', 'sku'],
    useCases: ['Stock management', 'Warehouse tracking']
  },
  '@ankr/erp-gst': {
    name: '@ankr/erp-gst',
    description: 'GST integration for ERP',
    category: 'erp',
    keywords: ['erp', 'gst', 'tax', 'hsn'],
    useCases: ['GST-compliant invoicing', 'Tax reporting'],
    dependencies: ['@ankr/compliance-gst']
  },

  // ═══════════════════════════════════════════════════════════════
  // TMS / LOGISTICS
  // ═══════════════════════════════════════════════════════════════
  '@ankr/tms': {
    name: '@ankr/tms',
    description: 'Transport Management System core',
    category: 'logistics',
    keywords: ['tms', 'transport', 'fleet', 'logistics', 'trucking'],
    useCases: ['Fleet management', 'Trip planning', 'Driver management']
  },
  '@ankr/wowtruck-gps': {
    name: '@ankr/wowtruck-gps',
    description: 'GPS tracking for vehicles',
    category: 'logistics',
    keywords: ['gps', 'tracking', 'vehicle', 'location'],
    useCases: ['Vehicle tracking', 'Live location', 'Route history']
  },
  '@ankr/ocean-tracker': {
    name: '@ankr/ocean-tracker',
    description: 'Ocean freight tracking (containers, vessels)',
    category: 'logistics',
    keywords: ['ocean', 'shipping', 'container', 'freight'],
    useCases: ['Container tracking', 'Shipping status', 'NVOCC']
  },

  // ═══════════════════════════════════════════════════════════════
  // VOICE & MESSAGING
  // ═══════════════════════════════════════════════════════════════
  '@ankr/voice-ai': {
    name: '@ankr/voice-ai',
    description: 'Voice AI with 11 Indian languages',
    category: 'voice',
    keywords: ['voice', 'speech', 'hindi', 'multilingual', 'stt', 'tts'],
    useCases: ['Voice assistant', 'Speech recognition', 'Voice commands']
  },
  '@ankr/bani': {
    name: '@ankr/bani',
    description: 'Speech services (STT, TTS, Translation) via Sarvam',
    category: 'voice',
    keywords: ['speech', 'stt', 'tts', 'translation', 'sarvam'],
    useCases: ['Voice apps', 'Multilingual audio', 'Transcription']
  },
  '@ankr/chat-widget': {
    name: '@ankr/chat-widget',
    description: 'Embeddable chat widget for websites',
    category: 'messaging',
    keywords: ['chat', 'widget', 'support', 'embed'],
    useCases: ['Customer support', 'Live chat', 'Website integration']
  },
  '@ankr/messaging': {
    name: '@ankr/messaging',
    description: 'Multi-channel messaging (WhatsApp, SMS, Telegram)',
    category: 'messaging',
    keywords: ['whatsapp', 'sms', 'telegram', 'notifications'],
    useCases: ['WhatsApp business', 'SMS alerts', 'Notifications']
  },

  // ═══════════════════════════════════════════════════════════════
  // LOCALIZATION & i18n
  // ═══════════════════════════════════════════════════════════════
  '@ankr/ai-translator': {
    name: '@ankr/ai-translator',
    description: 'AI-powered website translation for 10+ Indian languages',
    category: 'i18n',
    keywords: ['translate', 'i18n', 'localization', 'hindi', 'bengali', 'tamil', 'telugu', 'multilingual'],
    useCases: ['Website translation', 'Multilingual apps', 'Indian language support'],
    example: `// Drop-in browser script
<script src="https://ankrlabs.org/cdn/ai-translator/browser.js"></script>

// Or use as module
import { AITranslatorCore } from '@ankr/ai-translator';
const translator = new AITranslatorCore();
const hindi = await translator.translate('Hello', 'hi');`
  },
  '@ankr/i18n': {
    name: '@ankr/i18n',
    description: 'Static internationalization with message catalogs',
    category: 'i18n',
    keywords: ['i18n', 'locale', 'messages', 'static-translation'],
    useCases: ['Static translations', 'Message catalogs', 'Multi-locale apps']
  },

  // ═══════════════════════════════════════════════════════════════
  // GOVERNMENT APIs
  // ═══════════════════════════════════════════════════════════════
  '@ankr/gov-aadhaar': {
    name: '@ankr/gov-aadhaar',
    description: 'Aadhaar verification and e-KYC',
    category: 'gov',
    keywords: ['aadhaar', 'kyc', 'ekyc', 'verification'],
    useCases: ['KYC verification', 'Identity check', 'Onboarding']
  },
  '@ankr/gov-digilocker': {
    name: '@ankr/gov-digilocker',
    description: 'DigiLocker document fetch',
    category: 'gov',
    keywords: ['digilocker', 'documents', 'pan', 'driving-license'],
    useCases: ['Document verification', 'Digital documents']
  },
  '@ankr/gov-ulip': {
    name: '@ankr/gov-ulip',
    description: 'ULIP - Unified Logistics Interface Platform',
    category: 'gov',
    keywords: ['ulip', 'logistics', 'vahan', 'sarathi'],
    useCases: ['Vehicle verification', 'License check', 'Logistics compliance']
  },

  // ═══════════════════════════════════════════════════════════════
  // UI & COMPONENTS
  // ═══════════════════════════════════════════════════════════════
  '@ankr/widgets': {
    name: '@ankr/widgets',
    description: 'UI widget library (Cards, Charts, Forms)',
    category: 'ui',
    keywords: ['ui', 'widgets', 'components', 'react'],
    useCases: ['Dashboard building', 'UI components', 'Data visualization']
  },
  '@ankr/widget-factory': {
    name: '@ankr/widget-factory',
    description: 'Dynamic widget creation and rendering',
    category: 'ui',
    keywords: ['widgets', 'dynamic', 'factory', 'builder'],
    useCases: ['Customizable dashboards', 'Widget builder']
  },

  // ═══════════════════════════════════════════════════════════════
  // DEVELOPMENT TOOLS
  // ═══════════════════════════════════════════════════════════════
  '@ankr/vibecoding-tools': {
    name: '@ankr/vibecoding-tools',
    description: 'Code generation with vibe styles',
    category: 'dev',
    keywords: ['codegen', 'vibe', 'scaffold', 'generator'],
    useCases: ['Code generation', 'Project scaffolding']
  },
  '@ankr/create-ankr': {
    name: '@ankr/create-ankr',
    description: 'CLI to create ANKR projects',
    category: 'dev',
    keywords: ['cli', 'create', 'scaffold', 'template'],
    useCases: ['Project creation', 'Boilerplate setup']
  },
  '@ankr/mcp-tools': {
    name: '@ankr/mcp-tools',
    description: '260+ MCP tools for AI agents',
    category: 'dev',
    keywords: ['mcp', 'tools', 'agents', 'automation'],
    useCases: ['AI agents', 'Automation', 'Tool orchestration']
  }
};

// Category descriptions
export const CATEGORIES = {
  ai: { name: 'AI & Intelligence', icon: '🧠', color: '#8b5cf6' },
  auth: { name: 'Auth & Security', icon: '🔐', color: '#ef4444' },
  compliance: { name: 'Compliance & Tax', icon: '📋', color: '#f97316' },
  banking: { name: 'Banking & Payments', icon: '💳', color: '#10b981' },
  crm: { name: 'CRM', icon: '👥', color: '#3b82f6' },
  erp: { name: 'ERP', icon: '🏭', color: '#6366f1' },
  logistics: { name: 'TMS & Logistics', icon: '🚛', color: '#14b8a6' },
  voice: { name: 'Voice & Messaging', icon: '🎙️', color: '#ec4899' },
  i18n: { name: 'Localization & i18n', icon: '🌐', color: '#a855f7' },
  gov: { name: 'Government APIs', icon: '🏛️', color: '#78716c' },
  ui: { name: 'UI & Components', icon: '🎨', color: '#a78bfa' },
  dev: { name: 'Development Tools', icon: '🛠️', color: '#71717a' }
};

/**
 * Find relevant packages for a user request
 */
export function findRelevantPackages(request: string): PackageInfo[] {
  const lower = request.toLowerCase();
  const matches: { pkg: PackageInfo; score: number }[] = [];

  for (const pkg of Object.values(PACKAGE_CATALOG)) {
    let score = 0;

    // Check keywords
    for (const keyword of pkg.keywords) {
      if (lower.includes(keyword)) score += 10;
    }

    // Check use cases
    for (const useCase of pkg.useCases) {
      if (lower.includes(useCase.toLowerCase())) score += 5;
    }

    // Check description
    const descWords = pkg.description.toLowerCase().split(' ');
    for (const word of descWords) {
      if (word.length > 3 && lower.includes(word)) score += 2;
    }

    if (score > 0) {
      matches.push({ pkg, score });
    }
  }

  // Sort by score and return top matches
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(m => m.pkg);
}

/**
 * Generate product scaffold using packages
 */
export function generateProductScaffold(packages: PackageInfo[]): string {
  const imports = packages.map(p => `import { /* ... */ } from '${p.name}';`).join('\n');
  const deps = packages.map(p => `"${p.name}": "latest"`).join(',\n    ');

  return `// 🚀 ANKR Product Scaffold
// Generated with ${packages.length} @ankr packages

// Package imports
${imports}

// package.json dependencies:
// {
//   "dependencies": {
//     ${deps}
//   }
// }

// Your product code here...
`;
}
