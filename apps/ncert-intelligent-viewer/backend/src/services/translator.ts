/**
 * Translation Service for NCERT Content
 *
 * Translates NCERT content between English and Hindi
 * Preserves markdown formatting and mathematical expressions
 */

type Language = 'en' | 'hi';

interface TranslationResult {
  translatedText: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  duration: number;
}

export class Translator {
  private aiProxyUrl: string;
  private cache: Map<string, string> = new Map();

  constructor() {
    this.aiProxyUrl = process.env.AI_PROXY_URL || 'http://localhost:4444';
  }

  /**
   * Translate text between English and Hindi
   */
  async translate(
    text: string,
    from: Language,
    to: Language
  ): Promise<TranslationResult> {
    const startTime = Date.now();

    // Check cache
    const cacheKey = `${from}-${to}-${text.substring(0, 100)}`;
    if (this.cache.has(cacheKey)) {
      return {
        translatedText: this.cache.get(cacheKey)!,
        sourceLanguage: from,
        targetLanguage: to,
        duration: Date.now() - startTime,
      };
    }

    try {
      const systemPrompt = `You are a professional translator specializing in educational content.

CRITICAL RULES:
1. Preserve all markdown formatting (headings, lists, bold, italic)
2. Keep mathematical expressions unchanged: $x^2 + 2x + 1$
3. Keep code blocks unchanged
4. Preserve technical terms appropriately (e.g., "resistance" → "प्रतिरोध")
5. Maintain the academic tone suitable for Class 10 students
6. Keep URLs and links unchanged

Source language: ${from === 'en' ? 'English' : 'Hindi'}
Target language: ${to === 'en' ? 'English' : 'Hindi'}`;

      const userPrompt = `Translate this educational content while preserving all formatting:

${text}

Return ONLY the translated text, no explanations or metadata.`;

      const response = await fetch(`${this.aiProxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3, // Lower temperature for more accurate translation
          max_tokens: Math.min(2000, text.length * 2), // Estimate token needs
        }),
      });

      if (!response.ok) {
        throw new Error('AI proxy request failed');
      }

      const result = await response.json();
      const translatedText = result.choices?.[0]?.message?.content || result.response || text;

      // Cache the result (limit cache size)
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(cacheKey, translatedText);

      return {
        translatedText,
        sourceLanguage: from,
        targetLanguage: to,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Error translating text:', error);

      return {
        translatedText: text, // Return original on error
        sourceLanguage: from,
        targetLanguage: to,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Translate entire chapter content
   */
  async translateChapter(
    content: string,
    from: Language,
    to: Language
  ): Promise<TranslationResult> {
    // Split into smaller chunks if too large
    const maxChunkSize = 2000; // characters
    if (content.length <= maxChunkSize) {
      return this.translate(content, from, to);
    }

    // Split by markdown sections (headings)
    const sections = content.split(/(?=^#+\s)/m);
    const translatedSections: string[] = [];

    for (const section of sections) {
      const result = await this.translate(section, from, to);
      translatedSections.push(result.translatedText);
    }

    return {
      translatedText: translatedSections.join('\n\n'),
      sourceLanguage: from,
      targetLanguage: to,
      duration: 0, // Could sum up individual durations if needed
    };
  }

  /**
   * Detect language of text
   */
  detectLanguage(text: string): Language {
    // Simple Devanagari detection
    const hindiChars = text.match(/[\u0900-\u097F]/g);
    return hindiChars && hindiChars.length > text.length * 0.3 ? 'hi' : 'en';
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): { code: Language; name: string }[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'हिंदी (Hindi)' },
    ];
  }
}
