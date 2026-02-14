/**
 * ANKR AI Translator - Type Definitions
 */

export interface Language {
  name: string;
  native: string;
  flag: string;
}

export interface Languages {
  [code: string]: Language;
}

export interface TranslatorConfig {
  apiUrl?: string;
  fallbackUrl?: string;
  batchSize?: number;
  cachePrefix?: string;
  model?: string;
  fallbackModel?: string;
  onTranslationStart?: (targetLang: string) => void;
  onTranslationProgress?: (progress: number, targetLang: string) => void;
  onTranslationComplete?: (targetLang: string) => void;
  onTranslationError?: (error: Error, targetLang: string) => void;
}

export interface TranslationRequest {
  texts: string[];
  targetLang: string;
  sourceLang?: string;
}

export interface TranslationResult {
  translations: string[];
  cached: boolean;
  model: string;
}

export interface CacheEntry {
  translation: string;
  timestamp: number;
  model: string;
}

export interface TranslationCache {
  [key: string]: CacheEntry;
}

export interface NodeMapping {
  node: Text;
  text: string;
  cacheKey: string;
}

export interface AttributeMapping {
  element: HTMLElement;
  attribute: 'placeholder' | 'title';
  original: string;
  cacheKey: string;
}
