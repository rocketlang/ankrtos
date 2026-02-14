/**
 * @ankr/ai-translator
 *
 * AI-powered real-time translation for websites
 * Supports 10+ Indian languages with intelligent caching
 *
 * @example Browser Usage (drop-in)
 * ```html
 * <script src="https://cdn.ankr.in/ai-translator/browser.js"></script>
 * ```
 *
 * @example Node.js / Module Usage
 * ```typescript
 * import { AITranslatorCore, LANGUAGES } from '@ankr/ai-translator';
 *
 * const translator = new AITranslatorCore({
 *   apiUrl: 'https://your-api.com/translate'
 * });
 *
 * const result = await translator.translate('Hello World', 'hi');
 * console.log(result); // नमस्ते दुनिया
 * ```
 *
 * @example React Integration
 * ```tsx
 * import { AITranslatorBrowser } from '@ankr/ai-translator/browser';
 *
 * useEffect(() => {
 *   const translator = new AITranslatorBrowser({ autoInit: false });
 *   translator.init();
 * }, []);
 * ```
 */

// Export core translator
export { AITranslatorCore, LANGUAGES, default } from './translator';

// Export types
export type {
  Language,
  Languages,
  TranslatorConfig,
  TranslationRequest,
  TranslationResult,
  TranslationCache,
  CacheEntry,
  NodeMapping,
  AttributeMapping
} from './types';

// Browser version exported separately to avoid DOM dependencies in Node.js
// Use: import { AITranslatorBrowser } from '@ankr/ai-translator/browser'
