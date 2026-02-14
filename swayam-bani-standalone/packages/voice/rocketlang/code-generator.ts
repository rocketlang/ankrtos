/**
 * RocketLang Code Generator
 *
 * "Bolo, Code Ban Jaayega" - Speak, Code Will Be Created
 *
 * Generates TypeScript/JavaScript code from natural language (Hindi/English).
 * Uses package awareness to understand ANKR ecosystem capabilities.
 *
 * @author ANKR Labs
 */

import { getPackageAwareness, type PackageCapability, type CodePattern } from './package-awareness.js';
import { getContextManager } from './context.js';

// ============================================================================
// TYPES
// ============================================================================

export interface CodeGenerationResult {
  success: boolean;
  code?: string;
  language: 'typescript' | 'javascript' | 'sql' | 'rocketlang';
  explanation?: string;
  explanationHindi?: string;
  package?: string;
  pattern?: string;
  confidence: number;
  missingParams?: string[];
}

export interface GenerationContext {
  userId?: string;
  projectPath?: string;
  existingFiles?: string[];
  preferredLanguage?: 'hi' | 'en';
}

// ============================================================================
// CODE GENERATION PATTERNS
// ============================================================================

// Common code structures that can be generated
const GENERATION_PATTERNS = {
  // Function generation
  function: {
    triggers: ['function बनाओ', 'fn बनाओ', 'method create', 'function create'],
    template: (name: string, params: string, body: string) => `
function ${name}(${params}) {
  ${body}
}`,
  },

  // API endpoint
  apiEndpoint: {
    triggers: ['API बनाओ', 'endpoint बनाओ', 'route add'],
    template: (method: string, path: string, handler: string) => `
app.${method}('${path}', async (c) => {
  ${handler}
  return c.json({ success: true });
});`,
  },

  // React component
  reactComponent: {
    triggers: ['component बनाओ', 'React component', 'UI बनाओ'],
    template: (name: string, props: string) => `
import React from 'react';

interface ${name}Props {
  ${props}
}

export function ${name}({ ${props.split(':')[0]} }: ${name}Props) {
  return (
    <div>
      {/* TODO: Add UI */}
    </div>
  );
}`,
  },

  // Database model
  prismaModel: {
    triggers: ['model बनाओ', 'schema create', 'database model'],
    template: (name: string, fields: string) => `
model ${name} {
  id        Int      @id @default(autoincrement())
  ${fields}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`,
  },

  // Test file
  testFile: {
    triggers: ['test लिखो', 'test बनाओ', 'test create'],
    template: (name: string, testCases: string) => `
import { describe, it, expect } from 'vitest';
import { ${name} } from './${name}';

describe('${name}', () => {
  ${testCases}
});`,
  },
};

// ============================================================================
// CODE GENERATOR CLASS
// ============================================================================

export class CodeGenerator {
  private initialized = false;

  /**
   * Generate code from natural language input
   */
  async generate(input: string, context: GenerationContext = {}): Promise<CodeGenerationResult> {
    const awareness = await getPackageAwareness();
    const ctxManager = getContextManager();
    const lang = context.preferredLanguage || 'hi';

    // 1. Try to match against known package patterns
    const patternMatch = awareness.findPattern(input);

    if (patternMatch) {
      const params = awareness.extractParams(input, patternMatch.pattern);
      const missingParams = patternMatch.pattern.requiredParams.filter(p => !params[p]);

      if (missingParams.length > 0) {
        return {
          success: false,
          language: 'typescript',
          confidence: 0.6,
          missingParams,
          explanation: `Missing required parameters: ${missingParams.join(', ')}`,
          explanationHindi: `ये parameters चाहिए: ${missingParams.join(', ')}`,
        };
      }

      const code = awareness.generateCode(patternMatch.pattern, params);

      return {
        success: true,
        code,
        language: this.detectLanguage(code),
        explanation: patternMatch.pattern.description,
        explanationHindi: this.translateExplanation(patternMatch.pattern.description),
        package: patternMatch.package.name,
        pattern: patternMatch.pattern.name,
        confidence: 0.85,
      };
    }

    // 2. Try generic code generation patterns
    const genericResult = this.tryGenericPatterns(input);
    if (genericResult) {
      return genericResult;
    }

    // 3. If no pattern matched, use AI-assisted generation
    return this.aiAssistedGeneration(input, context, lang);
  }

  /**
   * Try to match generic code patterns
   */
  private tryGenericPatterns(input: string): CodeGenerationResult | null {
    const normalized = input.toLowerCase();

    // Function pattern
    if (/function|fn|method|फंक्शन/.test(normalized)) {
      const nameMatch = input.match(/(?:called?|named?|नाम)\s+(\w+)/i) || input.match(/(\w+)\s+(?:function|fn)/i);
      const name = nameMatch ? nameMatch[1] : 'myFunction';

      return {
        success: true,
        code: GENERATION_PATTERNS.function.template(name, '', '// TODO: Add implementation'),
        language: 'typescript',
        explanation: `Created function ${name}`,
        explanationHindi: `${name} function बना दिया`,
        confidence: 0.7,
      };
    }

    // React component pattern
    if (/component|कम्पोनेंट|UI/.test(normalized)) {
      const nameMatch = input.match(/(\w+)\s+component/i);
      const name = nameMatch ? this.capitalize(nameMatch[1]) : 'MyComponent';

      return {
        success: true,
        code: GENERATION_PATTERNS.reactComponent.template(name, ''),
        language: 'typescript',
        explanation: `Created React component ${name}`,
        explanationHindi: `${name} React component बना दिया`,
        confidence: 0.7,
      };
    }

    // API endpoint pattern
    if (/API|endpoint|route/.test(normalized)) {
      const methodMatch = input.match(/\b(get|post|put|delete|patch)\b/i);
      const method = methodMatch ? methodMatch[1].toLowerCase() : 'get';
      const pathMatch = input.match(/\/[\w/]+/);
      const path = pathMatch ? pathMatch[0] : '/api/endpoint';

      return {
        success: true,
        code: GENERATION_PATTERNS.apiEndpoint.template(method, path, '// TODO: Add handler'),
        language: 'typescript',
        explanation: `Created ${method.toUpperCase()} ${path} endpoint`,
        explanationHindi: `${method.toUpperCase()} ${path} endpoint बना दिया`,
        confidence: 0.7,
      };
    }

    // Test pattern
    if (/test|टेस्ट/.test(normalized)) {
      const forMatch = input.match(/(?:for|के लिए)\s+(\w+)/i);
      const name = forMatch ? forMatch[1] : 'myModule';

      return {
        success: true,
        code: GENERATION_PATTERNS.testFile.template(name, `it('should work', () => {\n    expect(true).toBe(true);\n  });`),
        language: 'typescript',
        explanation: `Created test file for ${name}`,
        explanationHindi: `${name} के लिए test file बनाई`,
        confidence: 0.7,
      };
    }

    return null;
  }

  /**
   * AI-assisted code generation (placeholder for future AI integration)
   */
  private async aiAssistedGeneration(
    input: string,
    context: GenerationContext,
    lang: 'hi' | 'en'
  ): Promise<CodeGenerationResult> {
    // For now, return a helpful message
    // In production, this would call an AI model

    return {
      success: false,
      language: 'typescript',
      confidence: 0.3,
      explanation: lang === 'en'
        ? `Could not generate code for: "${input}". Try being more specific, like "create a function called X" or "make an API endpoint for Y".`
        : `"${input}" के लिए code नहीं बना पाया। थोड़ा specific बोलो जैसे "X नाम का function बनाओ" या "Y के लिए API बनाओ"।`,
    };
  }

  /**
   * Detect language from code content
   */
  private detectLanguage(code: string): 'typescript' | 'javascript' | 'sql' | 'rocketlang' {
    if (/CREATE TABLE|SELECT|INSERT|UPDATE|DELETE/i.test(code)) return 'sql';
    if (/fn\s+\w+\(|karya\s+\w+|समानांतर:|उपयोग से/.test(code)) return 'rocketlang';
    if (/interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean)/.test(code)) return 'typescript';
    return 'javascript';
  }

  /**
   * Translate explanation to Hindi (simplified)
   */
  private translateExplanation(text: string): string {
    const translations: Record<string, string> = {
      'Create': 'बनाओ',
      'Created': 'बना दिया',
      'Generate': 'बनाओ',
      'function': 'function',
      'component': 'component',
      'table': 'table',
      'API': 'API',
      'endpoint': 'endpoint',
      'for': 'के लिए',
    };

    let result = text;
    for (const [en, hi] of Object.entries(translations)) {
      result = result.replace(new RegExp(en, 'gi'), hi);
    }
    return result;
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let codeGenerator: CodeGenerator | null = null;

export function getCodeGenerator(): CodeGenerator {
  if (!codeGenerator) {
    codeGenerator = new CodeGenerator();
  }
  return codeGenerator;
}

export default {
  CodeGenerator,
  getCodeGenerator,
};
