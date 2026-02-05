/**
 * Voyage AI Client for Embeddings
 * Uses voyage-2 model for maritime document embeddings
 */

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';

export interface VoyageEmbeddingRequest {
  input: string | string[];
  model?: string;
  input_type?: 'query' | 'document';
}

export interface VoyageEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    total_tokens: number;
  };
}

export class VoyageAIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || VOYAGE_API_KEY || '';
    this.baseUrl = VOYAGE_API_URL;

    if (!this.apiKey) {
      console.warn('[VoyageAI] API key not configured - embeddings will fail');
    }
  }

  /**
   * Generate embeddings for text using Voyage AI
   */
  async embed(
    text: string | string[],
    options: {
      model?: string;
      inputType?: 'query' | 'document';
    } = {}
  ): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error('Voyage AI API key not configured');
    }

    const model = options.model || 'voyage-2';
    const inputType = options.inputType || 'document';

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model,
          input_type: inputType,
        } as VoyageEmbeddingRequest),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Voyage AI API error: ${response.status} - ${error}`);
      }

      const data = (await response.json()) as VoyageEmbeddingResponse;

      // Return embeddings in order
      return data.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
    } catch (error) {
      console.error('[VoyageAI] Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate embedding for a single text (convenience method)
   */
  async embedSingle(text: string, inputType: 'query' | 'document' = 'document'): Promise<number[]> {
    const embeddings = await this.embed(text, { inputType });
    return embeddings[0];
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts: string[], inputType: 'query' | 'document' = 'document'): Promise<number[][]> {
    // Voyage AI supports batching natively
    return await this.embed(texts, { inputType });
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.embedSingle('test connection');
      console.log('[VoyageAI] ✅ Connection test successful');
      return true;
    } catch (error) {
      console.error('[VoyageAI] ❌ Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const voyageAI = new VoyageAIClient();

// Test on startup if configured
if (VOYAGE_API_KEY && process.env.NODE_ENV !== 'test') {
  voyageAI.testConnection().catch(console.error);
}
