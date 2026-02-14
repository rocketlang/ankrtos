/**
 * ANKR AI Translator - Browser Implementation
 * Drop-in solution for translating entire websites
 */

import { AITranslatorCore, LANGUAGES } from './translator';
import type { TranslatorConfig, NodeMapping, AttributeMapping } from './types';

interface BrowserConfig extends TranslatorConfig {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'dark' | 'light' | 'auto';
  autoInit?: boolean;
  storageKey?: string;
}

const DEFAULT_BROWSER_CONFIG: BrowserConfig = {
  position: 'bottom-right',
  theme: 'dark',
  autoInit: true,
  storageKey: 'ankr_language'
};

class AITranslatorBrowser extends AITranslatorCore {
  private browserConfig: BrowserConfig;
  private originalTexts = new Map<Text, string>();
  private currentLang = 'en';
  private isPageTranslating = false;

  constructor(config: BrowserConfig = {}) {
    super(config);
    this.browserConfig = { ...DEFAULT_BROWSER_CONFIG, ...config };

    if (this.browserConfig.autoInit) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }
  }

  /**
   * Initialize the translator
   */
  init(): void {
    // Load saved language preference
    const saved = localStorage.getItem(this.browserConfig.storageKey!);
    if (saved && this.isSupported(saved)) {
      this.currentLang = saved;
    }

    // Store original texts
    this.storeOriginalTexts();

    // Create UI
    this.createLanguageSelector();

    // Apply saved language if not English
    if (this.currentLang !== 'en') {
      this.translatePage(this.currentLang);
    }

    console.log('🌐 ANKR AI Translator initialized');
  }

  /**
   * Store all original text content
   */
  private storeOriginalTexts(): void {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node: Text) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tag = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'code', 'pre'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }

          if (!node.textContent?.trim() || node.textContent.trim().length < 2) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node: Text | null;
    while ((node = walker.nextNode() as Text)) {
      const text = node.textContent?.trim();
      if (text && !this.originalTexts.has(node)) {
        this.originalTexts.set(node, text);
      }
    }

    // Store placeholders and titles
    document.querySelectorAll<HTMLInputElement | HTMLElement>('input[placeholder], button, [title]').forEach(el => {
      if ('placeholder' in el && el.placeholder) {
        (el as any)._ankrPlaceholder = el.placeholder;
      }
      if (el.title) {
        (el as any)._ankrTitle = el.title;
      }
    });

    console.log(`📝 Stored ${this.originalTexts.size} text nodes for translation`);
  }

  /**
   * Create floating language selector
   */
  private createLanguageSelector(): void {
    // Hide old selector if exists
    const oldSelector = document.querySelector('.lang-selector');
    if (oldSelector) {
      (oldSelector as HTMLElement).style.display = 'none';
    }

    const position = this.browserConfig.position!;
    const positionStyles = {
      'bottom-right': 'bottom: 100px; right: 20px;',
      'bottom-left': 'bottom: 100px; left: 20px;',
      'top-right': 'top: 100px; right: 20px;',
      'top-left': 'top: 100px; left: 20px;'
    };

    const selector = document.createElement('div');
    selector.id = 'ai-lang-selector';
    selector.innerHTML = `
      <style>
        #ai-lang-selector {
          position: fixed;
          ${positionStyles[position]}
          z-index: 9999;
          font-family: 'Inter', system-ui, sans-serif;
        }

        #ai-lang-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
          transition: all 0.3s ease;
        }

        #ai-lang-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 30px rgba(99, 102, 241, 0.6);
        }

        #ai-lang-btn.translating {
          animation: pulse-translate 1s infinite;
        }

        @keyframes pulse-translate {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        #ai-lang-menu {
          position: absolute;
          bottom: 70px;
          right: 0;
          background: #1a1a2e;
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 16px;
          padding: 8px;
          min-width: 200px;
          display: none;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          max-height: 400px;
          overflow-y: auto;
        }

        #ai-lang-menu.show {
          display: block;
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ai-lang-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.2s;
          color: #fff;
        }

        .ai-lang-option:hover {
          background: rgba(99, 102, 241, 0.2);
        }

        .ai-lang-option.active {
          background: rgba(99, 102, 241, 0.3);
        }

        .ai-lang-option .flag { font-size: 20px; }
        .ai-lang-option .name { flex: 1; }
        .ai-lang-option .native { font-weight: 600; }
        .ai-lang-option .english { font-size: 12px; color: #a1a1aa; }
        .ai-lang-option .check { color: #10b981; display: none; }
        .ai-lang-option.active .check { display: block; }

        #ai-lang-header {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #a1a1aa;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        #translation-status {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: 500;
          display: none;
          z-index: 10000;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
        }

        #translation-status.show {
          display: flex;
          align-items: center;
          gap: 10px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      </style>

      <div id="translation-status">
        <div class="spinner"></div>
        <span>Translating with AI...</span>
      </div>

      <div id="ai-lang-menu">
        <div id="ai-lang-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>
          AI-Powered Translation
        </div>
        ${Object.entries(LANGUAGES).map(([code, lang]) => `
          <div class="ai-lang-option ${code === this.currentLang ? 'active' : ''}" data-lang="${code}">
            <span class="flag">${lang.flag}</span>
            <div class="name">
              <div class="native">${lang.native}</div>
              ${code !== 'en' ? `<div class="english">${lang.name}</div>` : ''}
            </div>
            <span class="check">✓</span>
          </div>
        `).join('')}
      </div>

      <button id="ai-lang-btn" title="Translate Page">🌐</button>
    `;

    document.body.appendChild(selector);

    // Event listeners
    const btn = document.getElementById('ai-lang-btn')!;
    const menu = document.getElementById('ai-lang-menu')!;

    btn.addEventListener('click', () => menu.classList.toggle('show'));

    document.addEventListener('click', (e) => {
      if (!selector.contains(e.target as Node)) {
        menu.classList.remove('show');
      }
    });

    menu.querySelectorAll('.ai-lang-option').forEach(option => {
      option.addEventListener('click', () => {
        const lang = (option as HTMLElement).dataset.lang!;
        this.translatePage(lang);
        menu.classList.remove('show');
      });
    });
  }

  /**
   * Show/hide translation status
   */
  private showStatus(show: boolean, message = 'Translating with AI...'): void {
    const status = document.getElementById('translation-status');
    const btn = document.getElementById('ai-lang-btn');
    if (!status || !btn) return;

    if (show) {
      status.querySelector('span')!.textContent = message;
      status.classList.add('show');
      btn.classList.add('translating');
    } else {
      status.classList.remove('show');
      btn.classList.remove('translating');
    }
  }

  /**
   * Update active state in menu
   */
  private updateMenuState(lang: string): void {
    document.querySelectorAll('.ai-lang-option').forEach(opt => {
      opt.classList.toggle('active', (opt as HTMLElement).dataset.lang === lang);
    });
  }

  /**
   * Translate entire page
   */
  async translatePage(targetLang: string): Promise<void> {
    if (this.isPageTranslating) return;

    // If switching to English, restore originals
    if (targetLang === 'en') {
      this.restoreOriginals();
      this.currentLang = 'en';
      localStorage.setItem(this.browserConfig.storageKey!, 'en');
      this.updateMenuState('en');
      return;
    }

    this.isPageTranslating = true;
    this.showStatus(true, `Translating to ${LANGUAGES[targetLang].native}...`);

    try {
      const textsToTranslate: string[] = [];
      const nodes: NodeMapping[] = [];

      // Collect texts and apply cached translations
      this.originalTexts.forEach((text, node) => {
        const cacheKey = `${targetLang}:${text}`;
        const cached = this['cache']?.[cacheKey];

        if (cached) {
          if (node.parentElement) {
            node.textContent = cached.translation;
          }
        } else {
          textsToTranslate.push(text);
          nodes.push({ node, text, cacheKey });
        }
      });

      // Batch translate uncached texts
      if (textsToTranslate.length > 0) {
        console.log(`🔄 Translating ${textsToTranslate.length} text segments to ${targetLang}`);

        const batchSize = 20;
        for (let i = 0; i < textsToTranslate.length; i += batchSize) {
          const batch = textsToTranslate.slice(i, i + batchSize);
          const batchNodes = nodes.slice(i, i + batchSize);

          const result = await this.translateBatch(batch, targetLang);

          result.translations.forEach((translation, idx) => {
            const { node } = batchNodes[idx];
            if (translation && node.parentElement) {
              node.textContent = translation;
            }
          });

          const progress = Math.min(100, Math.round(((i + batchSize) / textsToTranslate.length) * 100));
          this.showStatus(true, `Translating... ${progress}%`);
        }
      }

      // Translate attributes
      await this.translateAttributes(targetLang);

      this.currentLang = targetLang;
      localStorage.setItem(this.browserConfig.storageKey!, targetLang);
      this.updateMenuState(targetLang);

      this.showStatus(true, `✓ Translated to ${LANGUAGES[targetLang].native}`);
      setTimeout(() => this.showStatus(false), 2000);

    } catch (error) {
      console.error('Translation error:', error);
      this.showStatus(true, '❌ Translation failed');
      setTimeout(() => this.showStatus(false), 3000);
    } finally {
      this.isPageTranslating = false;
    }
  }

  /**
   * Translate placeholders and titles
   */
  private async translateAttributes(targetLang: string): Promise<void> {
    const elements = document.querySelectorAll<HTMLInputElement | HTMLElement>('input[placeholder], button, [title]');
    const toTranslate: string[] = [];
    const attrs: AttributeMapping[] = [];

    elements.forEach(el => {
      if ((el as any)._ankrPlaceholder) {
        const cacheKey = `${targetLang}:${(el as any)._ankrPlaceholder}`;
        const cached = this['cache']?.[cacheKey];
        if (cached) {
          (el as HTMLInputElement).placeholder = cached.translation;
        } else {
          toTranslate.push((el as any)._ankrPlaceholder);
          attrs.push({ element: el, attribute: 'placeholder', original: (el as any)._ankrPlaceholder, cacheKey });
        }
      }
      if ((el as any)._ankrTitle) {
        const cacheKey = `${targetLang}:${(el as any)._ankrTitle}`;
        const cached = this['cache']?.[cacheKey];
        if (cached) {
          el.title = cached.translation;
        } else {
          toTranslate.push((el as any)._ankrTitle);
          attrs.push({ element: el, attribute: 'title', original: (el as any)._ankrTitle, cacheKey });
        }
      }
    });

    if (toTranslate.length > 0) {
      const result = await this.translateBatch(toTranslate, targetLang);
      result.translations.forEach((translation, idx) => {
        const { element, attribute } = attrs[idx];
        if (translation) {
          (element as any)[attribute] = translation;
        }
      });
    }
  }

  /**
   * Restore original English texts
   */
  private restoreOriginals(): void {
    this.originalTexts.forEach((text, node) => {
      if (node.parentElement) {
        node.textContent = text;
      }
    });

    document.querySelectorAll<HTMLInputElement | HTMLElement>('input[placeholder], button, [title]').forEach(el => {
      if ((el as any)._ankrPlaceholder) {
        (el as HTMLInputElement).placeholder = (el as any)._ankrPlaceholder;
      }
      if ((el as any)._ankrTitle) {
        el.title = (el as any)._ankrTitle;
      }
    });
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLang;
  }

  /**
   * Set language programmatically
   */
  setLanguage(lang: string): void {
    if (this.isSupported(lang)) {
      this.translatePage(lang);
    }
  }
}

// Auto-initialize instance
const translator = new AITranslatorBrowser();

// Export for module use and attach to window
export { AITranslatorBrowser, LANGUAGES };
export default translator;

// Attach to window for direct script inclusion
if (typeof window !== 'undefined') {
  (window as any).AITranslator = translator;
  (window as any).AITranslatorBrowser = AITranslatorBrowser;
}
