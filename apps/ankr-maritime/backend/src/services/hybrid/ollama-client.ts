/**
 * Ollama Client for Local LLM and Embeddings
 *
 * Free, self-hosted alternative to cloud providers
 */

import { hybridDMSConfig } from '../../config/hybrid-dms.js';

interface OllamaEmbeddingResponse {
  embedding: number[];
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface OllamaListResponse {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
  }>;
}

class OllamaClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = hybridDMSConfig.embeddings.endpoint || 'http://localhost:11434';
  }

  /**
   * Generate embeddings for text
   */
  async embed(text: string, model?: string): Promise<number[]> {
    const embeddingModel = model || hybridDMSConfig.embeddings.model;

    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: embeddingModel,
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama embeddings failed: ${response.statusText}`);
      }

      const data: OllamaEmbeddingResponse = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Ollama embedding error:', error);
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }

  /**
   * Generate text completion
   */
  async generate(prompt: string, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }): Promise<string> {
    const model = options?.model || hybridDMSConfig.llm.model;
    const temperature = options?.temperature ?? hybridDMSConfig.llm.temperature;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          temperature,
          stream: false,
          options: {
            num_predict: options?.maxTokens || 512,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama generate failed: ${response.statusText}`);
      }

      const data: OllamaGenerateResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw new Error(`Failed to generate text: ${error}`);
    }
  }

  /**
   * Chat completion (conversational)
   */
  async chat(messages: Array<{ role: string; content: string }>, options?: {
    model?: string;
    temperature?: number;
  }): Promise<string> {
    const model = options?.model || hybridDMSConfig.llm.model;
    const temperature = options?.temperature ?? hybridDMSConfig.llm.temperature;

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama chat failed: ${response.statusText}`);
      }

      const data: any = await response.json();
      return data.message?.content || '';
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw new Error(`Failed to chat: ${error}`);
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`Ollama list failed: ${response.statusText}`);
      }

      const data: OllamaListResponse = await response.json();
      return data.models.map((m) => m.name);
    } catch (error) {
      console.error('Ollama list models error:', error);
      return [];
    }
  }

  /**
   * Pull a model (download if not available)
   */
  async pullModel(modelName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error(`Ollama pull failed: ${response.statusText}`);
      }

      console.log(`Pulling model: ${modelName}...`);
      // Note: This streams progress, but we're ignoring it for simplicity
    } catch (error) {
      console.error('Ollama pull model error:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const ollamaClient = new OllamaClient();

/**
 * Maritime-specific prompts for Ollama
 */
export const MARITIME_PROMPTS = {
  qa: (context: string, question: string) => `You are a maritime operations expert with deep knowledge of charter parties, bills of lading, and shipping operations.

Answer the question based ONLY on the provided documents. If you cannot answer from the documents, say "I don't have enough information in the provided documents."

Documents:
${context}

Question: ${question}

Answer:`,

  classify: (text: string) => `Classify this maritime document into one of these categories:
- charter_party: Charter party agreements (GENCON, NYPE, etc.)
- bol: Bill of Lading
- email: Correspondence and emails
- market_report: Market analysis and freight reports
- compliance: Certificates, surveys, compliance docs
- invoice: Invoices and financial documents
- general: Other documents

Document text:
${text}

Category:`,

  extract_entities: (text: string) => `Extract maritime entities from this document as JSON:

{
  "vessels": ["M/V Ship Name", ...],
  "ports": ["SGSIN", "USNYC", ...],
  "cargo": ["grain", "containers", ...],
  "parties": ["Owner: ABC Shipping", "Charterer: XYZ Lines", ...],
  "amounts": ["$50,000", "10,000 MT", ...],
  "dates": ["15 Feb 2026", "Laycan 10-15 March", ...]
}

Document:
${text}

JSON:`,
};
