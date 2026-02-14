import { LLMProvider, LLMRequest, LLMResponse } from '@swayam/types';
import { config } from '@swayam/config';

export class LLMRouter {
  private usageCount = new Map<LLMProvider, number>();
  private totalCost = 0;

  async route(request: LLMRequest): Promise<LLMResponse> {
    const providers = this.getAvailableProviders();
    
    for (const { provider, model, apiKey, free } of providers) {
      try {
        console.log(`🔄 Trying ${provider}...`);
        const response = await this.callProvider(provider, model, apiKey, request);
        this.incrementUsage(provider);
        if (!free) this.totalCost += response.cost;
        console.log(`✅ ${provider} responded in ${response.latencyMs}ms`);
        return response;
      } catch (error) {
        console.warn(`⚠️ ${provider} failed:`, (error as Error).message);
        continue;
      }
    }
    
    // Mock fallback
    console.log('🎭 Using mock response');
    return {
      content: 'नमस्ते! मैं Swayam हूं। अभी मेरे पास कोई LLM provider उपलब्ध नहीं है, लेकिन मैं जल्द ही आपकी मदद कर पाऊंगा।',
      provider: 'local',
      model: 'mock',
      tokens: { input: 0, output: 0 },
      latencyMs: 100,
      cost: 0
    };
  }

  private getAvailableProviders() {
    const providers: { provider: LLMProvider; model: string; apiKey: string; free: boolean }[] = [];
    const env = config.env;
    
    if (env.GROQ_API_KEY) {
      providers.push({ provider: 'groq', model: 'llama-3.3-70b-versatile', apiKey: env.GROQ_API_KEY, free: true });
    }
    if (env.GEMINI_API_KEY) {
      providers.push({ provider: 'gemini', model: 'gemini-2.0-flash-exp', apiKey: env.GEMINI_API_KEY, free: true });
    }
    if (env.ANTHROPIC_API_KEY) {
      providers.push({ provider: 'claude', model: 'claude-3-haiku-20240307', apiKey: env.ANTHROPIC_API_KEY, free: false });
    }
    
    return providers;
  }

  private async callProvider(provider: LLMProvider, model: string, apiKey: string, request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 4096,
        }),
      });
      if (!res.ok) throw new Error(`Groq error: ${res.status}`);
      const data = await res.json();
      return {
        content: data.choices[0].message.content,
        provider: 'groq',
        model,
        tokens: { input: data.usage?.prompt_tokens ?? 0, output: data.usage?.completion_tokens ?? 0 },
        latencyMs: Date.now() - startTime,
        cost: 0,
      };
    }
    
    if (provider === 'gemini') {
      const contents = request.messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });
      if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
      const data = await res.json();
      return {
        content: data.candidates[0].content.parts[0].text,
        provider: 'gemini',
        model,
        tokens: { input: data.usageMetadata?.promptTokenCount ?? 0, output: data.usageMetadata?.candidatesTokenCount ?? 0 },
        latencyMs: Date.now() - startTime,
        cost: 0,
      };
    }
    
    if (provider === 'claude') {
      const systemMsg = request.messages.find(m => m.role === 'system');
      const otherMsgs = request.messages.filter(m => m.role !== 'system');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          system: systemMsg?.content,
          messages: otherMsgs,
          max_tokens: request.maxTokens ?? 4096,
        }),
      });
      if (!res.ok) throw new Error(`Claude error: ${res.status}`);
      const data = await res.json();
      const inputCost = (data.usage?.input_tokens ?? 0) * 0.00000025;
      const outputCost = (data.usage?.output_tokens ?? 0) * 0.00000125;
      return {
        content: data.content[0].text,
        provider: 'claude',
        model,
        tokens: { input: data.usage?.input_tokens ?? 0, output: data.usage?.output_tokens ?? 0 },
        latencyMs: Date.now() - startTime,
        cost: inputCost + outputCost,
      };
    }
    
    throw new Error(`Unknown provider: ${provider}`);
  }

  private incrementUsage(provider: LLMProvider) {
    this.usageCount.set(provider, (this.usageCount.get(provider) || 0) + 1);
  }

  getFreeUsagePercentage(): number {
    let free = 0, total = 0;
    for (const [p, c] of this.usageCount) {
      total += c;
      if (p === 'groq' || p === 'gemini') free += c;
    }
    return total > 0 ? Math.round((free / total) * 100) : 100;
  }
}

export const llmRouter = new LLMRouter();
