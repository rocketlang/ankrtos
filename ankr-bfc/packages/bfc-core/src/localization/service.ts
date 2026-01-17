/**
 * BFC Localization Service
 * Combines static i18n with AI-powered translation
 *
 * Uses:
 * - @ankr/i18n for base translations
 * - @ankr/ai-translator for dynamic content
 */

import type {
  SupportedLanguage,
  LanguageInfo,
  TranslationParams,
  LocalizationService,
} from './types.js';
import { translations } from './translations.js';

// Language metadata
const LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', script: 'Latin' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', script: 'Devanagari' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr', script: 'Tamil' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr', script: 'Telugu' },
  kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', direction: 'ltr', script: 'Kannada' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr', script: 'Devanagari' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr', script: 'Bengali' },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr', script: 'Gujarati' },
  ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', direction: 'ltr', script: 'Malayalam' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', direction: 'ltr', script: 'Gurmukhi' },
  or: { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', direction: 'ltr', script: 'Odia' },
};

// AI Proxy config for dynamic translation
interface AITranslatorConfig {
  apiUrl: string;
  fallbackUrl?: string;
  model: string;
  fallbackModel?: string;
  cacheKey?: string;
}

const DEFAULT_AI_CONFIG: AITranslatorConfig = {
  apiUrl: 'http://localhost:4444/v1/chat/completions',
  fallbackUrl: 'https://ankr.in/api/ai/chat/completions',
  model: 'gpt-4o-mini',
  fallbackModel: 'gemini-2.0-flash',
  cacheKey: 'bfc_translations',
};

/**
 * BFC Localization Service
 */
export class BFCLocalizationService implements LocalizationService {
  private currentLanguage: SupportedLanguage;
  private translationCache: Map<string, string>;
  private aiConfig: AITranslatorConfig;

  constructor(
    defaultLang: SupportedLanguage = 'en',
    aiConfig: Partial<AITranslatorConfig> = {}
  ) {
    this.currentLanguage = defaultLang;
    this.translationCache = new Map();
    this.aiConfig = { ...DEFAULT_AI_CONFIG, ...aiConfig };
    this.loadCache();
  }

  /**
   * Translate a key with optional parameter substitution
   */
  t(key: string, params?: TranslationParams): string {
    const keys = key.split('.');
    let result: any = translations[this.currentLanguage];

    // Navigate nested keys
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English
        result = translations.en;
        for (const k2 of keys) {
          result = result?.[k2];
        }
        break;
      }
    }

    // Return key if translation not found
    if (typeof result !== 'string') {
      return key;
    }

    // Substitute parameters
    if (params) {
      for (const [paramKey, value] of Object.entries(params)) {
        result = result.replace(`{${paramKey}}`, String(value));
      }
    }

    return result;
  }

  /**
   * Set current language
   */
  setLanguage(lang: SupportedLanguage): void {
    if (LANGUAGES[lang]) {
      this.currentLanguage = lang;
    }
  }

  /**
   * Get current language
   */
  getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageInfo[] {
    return Object.values(LANGUAGES);
  }

  /**
   * Get language info
   */
  getLanguageInfo(lang?: SupportedLanguage): LanguageInfo {
    return LANGUAGES[lang || this.currentLanguage];
  }

  /**
   * Format currency for Indian Rupees
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format date in Indian format
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  /**
   * Format number in Indian style (lakhs, crores)
   */
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-IN').format(num);
  }

  /**
   * Format time
   */
  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  /**
   * Format date and time
   */
  formatDateTime(date: Date): string {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  }

  /**
   * AI-powered translation for dynamic content
   */
  async translateText(text: string, targetLang?: SupportedLanguage): Promise<string> {
    const lang = targetLang || this.currentLanguage;
    if (lang === 'en') return text;

    // Check cache
    const cacheKey = `${lang}:${text}`;
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!;
    }

    try {
      const translation = await this.callAITranslator([text], lang);
      if (translation[0]) {
        this.translationCache.set(cacheKey, translation[0]);
        this.saveCache();
        return translation[0];
      }
    } catch (error) {
      console.error('AI translation failed:', error);
    }

    return text;
  }

  /**
   * Batch translate multiple texts
   */
  async translateBatch(
    texts: string[],
    targetLang?: SupportedLanguage
  ): Promise<string[]> {
    const lang = targetLang || this.currentLanguage;
    if (lang === 'en') return texts;

    const results: string[] = [];
    const toTranslate: { index: number; text: string }[] = [];

    // Check cache first
    for (let i = 0; i < texts.length; i++) {
      const cacheKey = `${lang}:${texts[i]}`;
      if (this.translationCache.has(cacheKey)) {
        results[i] = this.translationCache.get(cacheKey)!;
      } else {
        toTranslate.push({ index: i, text: texts[i] });
      }
    }

    // Translate uncached texts
    if (toTranslate.length > 0) {
      const textsToTranslate = toTranslate.map(t => t.text);
      const translations = await this.callAITranslator(textsToTranslate, lang);

      for (let i = 0; i < toTranslate.length; i++) {
        const { index, text } = toTranslate[i];
        const translation = translations[i] || text;
        results[index] = translation;
        this.translationCache.set(`${lang}:${text}`, translation);
      }
      this.saveCache();
    }

    return results;
  }

  /**
   * Call AI Proxy for translation
   */
  private async callAITranslator(
    texts: string[],
    targetLang: SupportedLanguage
  ): Promise<string[]> {
    const langName = LANGUAGES[targetLang].name;

    const prompt = `Translate the following texts to ${langName}. Keep it natural and culturally appropriate for Indian audience. Preserve any technical terms, brand names, numbers, and symbols as-is.

Return ONLY a JSON array of translations in the same order, nothing else.

Texts to translate:
${JSON.stringify(texts)}`;

    try {
      const response = await fetch(this.aiConfig.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.aiConfig.model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator specializing in Indian languages for banking domain. Translate naturally while preserving brand names, technical terms, and formatting. Return only valid JSON array.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';

      // Parse JSON response
      let cleaned = content.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '');
      }
      return JSON.parse(cleaned);
    } catch (error) {
      // Try fallback
      if (this.aiConfig.fallbackUrl) {
        try {
          const fallbackResponse = await fetch(this.aiConfig.fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: this.aiConfig.fallbackModel,
              messages: [
                { role: 'system', content: `Translate to ${langName}. Return JSON array only.` },
                { role: 'user', content: JSON.stringify(texts) },
              ],
            }),
          });

          const data = await fallbackResponse.json();
          const content = data.choices?.[0]?.message?.content || '[]';
          return JSON.parse(content.replace(/```json?\n?/g, '').replace(/```/g, ''));
        } catch {
          // Fallback also failed
        }
      }
      return texts;
    }
  }

  /**
   * Load translation cache from storage
   */
  private loadCache(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(this.aiConfig.cacheKey || 'bfc_translations');
        if (cached) {
          const parsed = JSON.parse(cached);
          this.translationCache = new Map(Object.entries(parsed));
        }
      } catch {
        // Ignore cache errors
      }
    }
  }

  /**
   * Save translation cache to storage
   */
  private saveCache(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const obj = Object.fromEntries(this.translationCache);
        localStorage.setItem(this.aiConfig.cacheKey || 'bfc_translations', JSON.stringify(obj));
      } catch {
        // Ignore cache errors
      }
    }
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.translationCache.clear();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.aiConfig.cacheKey || 'bfc_translations');
    }
  }

  /**
   * Detect user's preferred language
   */
  static detectLanguage(): SupportedLanguage {
    // Check environment variable (Node.js)
    if (typeof process !== 'undefined') {
      const envLang = process.env.BFC_LANG || process.env.LANG || '';
      const detected = envLang.split('.')[0].split('_')[0].toLowerCase();
      if (detected in LANGUAGES) {
        return detected as SupportedLanguage;
      }
    }

    // Check browser language
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0].toLowerCase();
      if (browserLang in LANGUAGES) {
        return browserLang as SupportedLanguage;
      }
    }

    return 'en';
  }
}

/**
 * Create localization service instance
 */
export function createLocalizationService(
  defaultLang?: SupportedLanguage,
  aiConfig?: Partial<AITranslatorConfig>
): BFCLocalizationService {
  return new BFCLocalizationService(
    defaultLang || BFCLocalizationService.detectLanguage(),
    aiConfig
  );
}

/**
 * React hook for localization (client-side)
 */
export function useLocalization(lang?: SupportedLanguage) {
  const service = new BFCLocalizationService(lang || BFCLocalizationService.detectLanguage());

  return {
    t: (key: string, params?: TranslationParams) => service.t(key, params),
    lang: service.getLanguage(),
    languages: service.getSupportedLanguages(),
    formatCurrency: service.formatCurrency.bind(service),
    formatDate: service.formatDate.bind(service),
    formatNumber: service.formatNumber.bind(service),
    setLanguage: service.setLanguage.bind(service),
    translateText: service.translateText.bind(service),
  };
}

export default BFCLocalizationService;
