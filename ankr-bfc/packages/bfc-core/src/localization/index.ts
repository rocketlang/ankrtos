/**
 * BFC Localization Module
 *
 * Features:
 * - 11 Indian languages (en, hi, ta, te, kn, mr, bn, gu, ml, pa, or)
 * - Static banking translations (UI strings)
 * - AI-powered dynamic translation via @ankr/ai-translator
 * - Currency, date, number formatting for India
 * - React hook support
 *
 * @example
 * ```typescript
 * import { createLocalizationService, useLocalization } from '@bfc/core';
 *
 * // Service usage
 * const i18n = createLocalizationService('hi');
 * console.log(i18n.t('common.welcome')); // 'स्वागत है'
 * console.log(i18n.formatCurrency(50000)); // '₹50,000'
 *
 * // Dynamic translation
 * const translated = await i18n.translateText('Your loan is approved');
 *
 * // React hook
 * const { t, lang, formatCurrency } = useLocalization();
 * ```
 */

export * from './types.js';
export * from './translations.js';
export * from './service.js';
