/**
 * ANKR AI Translator - Core Translation Engine
 * Real-time AI-powered translation for Indian languages
 */

import type {
  Language,
  Languages,
  TranslatorConfig,
  TranslationResult,
  TranslationCache,
  CacheEntry
} from './types';

// Supported Indian languages with native names
export const LANGUAGES: Languages = {
  en: { name: 'English', native: 'English', flag: '🇬🇧' },
  hi: { name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  bn: { name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  ta: { name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  te: { name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  mr: { name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  gu: { name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  kn: { name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ml: { name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  pa: { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  or: { name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' }
};

// Default configuration
const DEFAULT_CONFIG: Required<TranslatorConfig> = {
  apiUrl: '/api/ai/chat/completions',
  fallbackUrl: 'https://ankr.in/api/ai/chat/completions',
  batchSize: 20,
  cachePrefix: 'ankr_translate',
  model: 'gpt-4o-mini',
  fallbackModel: 'gemini-2.0-flash',
  onTranslationStart: () => {},
  onTranslationProgress: () => {},
  onTranslationComplete: () => {},
  onTranslationError: () => {}
};

export class AITranslatorCore {
  private config: Required<TranslatorConfig>;
  private cache: TranslationCache = {};
  private isTranslating = false;

  constructor(config: TranslatorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadCache();
  }

  /**
   * Get list of supported languages
   */
  getLanguages(): Languages {
    return LANGUAGES;
  }

  /**
   * Get a specific language by code
   */
  getLanguage(code: string): Language | undefined {
    return LANGUAGES[code];
  }

  /**
   * Check if a language is supported
   */
  isSupported(code: string): boolean {
    return code in LANGUAGES;
  }

  /**
   * Translate a single text
   */
  async translate(text: string, targetLang: string, sourceLang = 'en'): Promise<string> {
    if (targetLang === sourceLang) return text;

    const result = await this.translateBatch([text], targetLang, sourceLang);
    return result.translations[0] || text;
  }

  /**
   * Translate multiple texts in a batch
   */
  async translateBatch(
    texts: string[],
    targetLang: string,
    sourceLang = 'en'
  ): Promise<TranslationResult> {
    if (!this.isSupported(targetLang)) {
      throw new Error(`Unsupported target language: ${targetLang}`);
    }

    const translations: string[] = [];
    const uncachedTexts: string[] = [];
    const uncachedIndices: number[] = [];

    // Check cache first
    texts.forEach((text, index) => {
      const cacheKey = this.getCacheKey(text, targetLang);
      const cached = this.cache[cacheKey];

      if (cached) {
        translations[index] = cached.translation;
      } else {
        uncachedTexts.push(text);
        uncachedIndices.push(index);
      }
    });

    // If all cached, return immediately
    if (uncachedTexts.length === 0) {
      return { translations, cached: true, model: 'cache' };
    }

    // Translate uncached texts
    const langName = LANGUAGES[targetLang].name;
    const translatedTexts = await this.callTranslationAPI(uncachedTexts, langName);

    // Map results back and cache
    translatedTexts.forEach((translation, i) => {
      const originalIndex = uncachedIndices[i];
      const originalText = texts[originalIndex];
      translations[originalIndex] = translation;

      // Cache the result
      this.setCacheEntry(originalText, targetLang, translation);
    });

    return {
      translations,
      cached: false,
      model: this.config.model
    };
  }

  /**
   * Call the translation API
   */
  private async callTranslationAPI(texts: string[], targetLangName: string): Promise<string[]> {
    const prompt = `Translate the following texts to ${targetLangName}. Keep it natural and culturally appropriate for Indian audience. Preserve any technical terms, brand names (like ANKR, SWAYAM), numbers, and emojis as-is.

Return ONLY a JSON array of translations in the same order, nothing else.

Texts to translate:
${JSON.stringify(texts)}`;

    try {
      const response = await this.makeAPIRequest(this.config.apiUrl, this.config.model, prompt);
      return this.parseTranslationResponse(response, texts);
    } catch (error) {
      console.warn('Primary API failed, trying fallback:', error);

      try {
        const response = await this.makeAPIRequest(
          this.config.fallbackUrl,
          this.config.fallbackModel,
          `Translate to ${targetLangName}. Return JSON array only.\n${JSON.stringify(texts)}`
        );
        return this.parseTranslationResponse(response, texts);
      } catch (fallbackError) {
        console.error('Both APIs failed:', fallbackError);
        return texts; // Return originals on failure
      }
    }
  }

  /**
   * Make API request
   */
  private async makeAPIRequest(url: string, model: string, prompt: string): Promise<string> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator specializing in Indian languages. Translate naturally while preserving brand names, technical terms, and formatting. Return only valid JSON array.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '[]';
  }

  /**
   * Parse translation response
   */
  private parseTranslationResponse(content: string, originals: string[]): string[] {
    try {
      let cleaned = content.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '');
      }
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse translation response:', content);
      return originals;
    }
  }

  /**
   * Get cache key for a text
   */
  private getCacheKey(text: string, targetLang: string): string {
    return `${targetLang}:${text}`;
  }

  /**
   * Set a cache entry
   */
  private setCacheEntry(text: string, targetLang: string, translation: string): void {
    const key = this.getCacheKey(text, targetLang);
    this.cache[key] = {
      translation,
      timestamp: Date.now(),
      model: this.config.model
    };
    this.saveCache();
  }

  /**
   * Load cache from storage
   */
  private loadCache(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const cached = localStorage.getItem(`${this.config.cachePrefix}_cache`);
      if (cached) {
        this.cache = JSON.parse(cached);
      }
    } catch (e) {
      this.cache = {};
    }
  }

  /**
   * Save cache to storage
   */
  private saveCache(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(`${this.config.cachePrefix}_cache`, JSON.stringify(this.cache));
    } catch (e) {
      console.warn('Failed to save translation cache:', e);
    }
  }

  /**
   * Clear the translation cache
   */
  clearCache(): void {
    this.cache = {};
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`${this.config.cachePrefix}_cache`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; languages: string[] } {
    const languages = new Set<string>();
    Object.keys(this.cache).forEach(key => {
      const lang = key.split(':')[0];
      languages.add(lang);
    });

    return {
      entries: Object.keys(this.cache).length,
      languages: Array.from(languages)
    };
  }
}

export default AITranslatorCore;
