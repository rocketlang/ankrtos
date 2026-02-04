/**
 * ANKR SMART i18n - LLM-Powered Translation
 * Updated: Dec 9, 2025 - Added dashboard labels
 */

import { ANKR_LANGUAGES, LanguageConfig } from './languages';

// Critical UI labels that need translation
export const CRITICAL_LABELS: Record<string, Record<string, string>> = {
  // Auth
  login: { en: 'Login', hi: 'लॉगिन' },
  logout: { en: 'Logout', hi: 'लॉगआउट' },

  // Navigation
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
  freight: { en: 'Freight', hi: 'माल ढुलाई' },
  fleet: { en: 'Fleet', hi: 'फ्लीट' },
  trips: { en: 'Trips', hi: 'यात्राएं' },
  drivers: { en: 'Drivers', hi: 'ड्राइवर' },
  invoices: { en: 'Invoices', hi: 'चालान' },
  orders: { en: 'Orders', hi: 'ऑर्डर' },
  vehicles: { en: 'Vehicles', hi: 'वाहन' },
  customers: { en: 'Customers', hi: 'ग्राहक' },

  // Dashboard specific
  'dashboard.title': { en: 'WowTruck Dashboard', hi: 'वाउट्रक डैशबोर्ड' },
  'dashboard.subtitle': { en: 'Transport Management System', hi: 'परिवहन प्रबंधन प्रणाली' },
  'dashboard.totalFleet': { en: 'Total Fleet', hi: 'कुल वाहन' },
  'dashboard.active': { en: 'Active', hi: 'सक्रिय' },
  'dashboard.pendingOrders': { en: 'Pending Orders', hi: 'लंबित ऑर्डर' },
  'dashboard.totalOrders': { en: 'Total Orders', hi: 'कुल ऑर्डर' },
  'dashboard.drivers': { en: 'Drivers', hi: 'ड्राइवर' },
  'dashboard.customers': { en: 'Customers', hi: 'ग्राहक' },
  'dashboard.liveTracking': { en: 'Live Tracking', hi: 'लाइव ट्रैकिंग' },
  'dashboard.viewAll': { en: 'View All', hi: 'सभी देखें' },
  'dashboard.manageOrders': { en: 'Manage Orders', hi: 'ऑर्डर प्रबंधित करें' },
  'dashboard.monitor': { en: 'System Monitor', hi: 'सिस्टम मॉनिटर' },
  'dashboard.fleetUtilization': { en: 'Fleet Utilization', hi: 'फ्लीट उपयोग' },
  'dashboard.ordersToday': { en: 'Orders Today', hi: 'आज के ऑर्डर' },
  'dashboard.pendingActions': { en: 'Pending Actions', hi: 'लंबित कार्य' },
  'dashboard.systemStatus': { en: 'System Status', hi: 'सिस्टम स्थिति' },

  // Actions
  submit: { en: 'Submit', hi: 'जमा करें' },
  cancel: { en: 'Cancel', hi: 'रद्द करें' },
  save: { en: 'Save', hi: 'सहेजें' },
  search: { en: 'Search', hi: 'खोजें' },
  add: { en: 'Add', hi: 'जोड़ें' },
  edit: { en: 'Edit', hi: 'संपादित करें' },
  delete: { en: 'Delete', hi: 'हटाएं' },
  view: { en: 'View', hi: 'देखें' },

  // Status
  loading: { en: 'Loading...', hi: 'लोड हो रहा है...' },
  success: { en: 'Success!', hi: 'सफल!' },
  error: { en: 'Error', hi: 'त्रुटि' },
  pending: { en: 'Pending', hi: 'लंबित' },
  completed: { en: 'Completed', hi: 'पूर्ण' },
  active: { en: 'Active', hi: 'सक्रिय' },
  inactive: { en: 'Inactive', hi: 'निष्क्रिय' },

  // Chat/AI
  typeMessage: { en: 'Type a message...', hi: 'संदेश टाइप करें...' },
  send: { en: 'Send', hi: 'भेजें' },
  listening: { en: 'Listening...', hi: 'सुन रहा हूं...' },

  // Greetings
  hello: { en: 'Hello!', hi: 'नमस्ते!' },
  welcome: { en: 'Welcome', hi: 'स्वागत है' },
};

export type LabelKey = string;
export type LanguageCode = string;

/**
 * Get translated label - returns key if not found
 */
export function t(key: string, lang: LanguageCode = 'en'): string {
  const label = CRITICAL_LABELS[key];
  if (!label) return key;
  return label[lang] || label.en || key;
}

export function getAvailableLanguages(): LanguageConfig[] {
  return ANKR_LANGUAGES;
}

export function getPrimaryLanguages(): LanguageConfig[] {
  return ANKR_LANGUAGES.filter(l => l.tier === 1);
}

export function getIndianLanguages(): LanguageConfig[] {
  return ANKR_LANGUAGES.filter(l => l.region === 'India');
}

export function getSpeechCode(langCode: string): string {
  const lang = ANKR_LANGUAGES.find(l => l.code === langCode);
  return lang?.bcp47 || 'en-US';
}

export function isRTL(langCode: string): boolean {
  const lang = ANKR_LANGUAGES.find(l => l.code === langCode);
  return lang?.rtl || false;
}

console.log('🌍 ANKR i18n loaded:', Object.keys(CRITICAL_LABELS).length, 'labels');
