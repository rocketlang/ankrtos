import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Maritime-specific namespaces
export const namespaces = [
  'common',           // Common UI elements
  'maritime',         // Maritime terminology (vessel types, port operations, etc.)
  'chartering',       // Chartering desk terms
  'voyage',           // Voyage operations
  'laytime',          // Laytime & demurrage
  'compliance',       // Compliance & sanctions
  'finance',          // Trade finance, invoicing
  'claims',           // Claims management
  'analytics',        // Reports & analytics
  'crew',             // Crew & HRMS
  'bunker',           // Bunker management
  'snp',              // Ship sale & purchase
  'ffa',              // Freight derivatives
  'errors',           // Error messages
  'validation',       // Form validation
] as const;

export type Namespace = typeof namespaces[number];

// Supported languages
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', rtl: false },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
] as const;

export const defaultLanguage = 'en';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: defaultLanguage,
    supportedLngs: languages.map(l => l.code),
    ns: namespaces,
    defaultNS: 'common',

    // Language detection
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'mari8x-language',
    },

    // Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // React configuration
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },

    interpolation: {
      escapeValue: false, // React already escapes
      format: (value, format, lng) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'capitalize') return value.charAt(0).toUpperCase() + value.slice(1);

        // Date formatting
        if (value instanceof Date) {
          if (format === 'short') return new Intl.DateTimeFormat(lng, { dateStyle: 'short' }).format(value);
          if (format === 'medium') return new Intl.DateTimeFormat(lng, { dateStyle: 'medium' }).format(value);
          if (format === 'long') return new Intl.DateTimeFormat(lng, { dateStyle: 'long' }).format(value);
          if (format === 'datetime') return new Intl.DateTimeFormat(lng, { dateStyle: 'short', timeStyle: 'short' }).format(value);
        }

        // Number formatting
        if (typeof value === 'number') {
          if (format === 'currency') return new Intl.NumberFormat(lng, { style: 'currency', currency: 'USD' }).format(value);
          if (format === 'decimal') return new Intl.NumberFormat(lng, { style: 'decimal' }).format(value);
          if (format === 'percent') return new Intl.NumberFormat(lng, { style: 'percent' }).format(value);
        }

        return value;
      },
    },

    debug: process.env.NODE_ENV === 'development',
  });

export default i18n;
