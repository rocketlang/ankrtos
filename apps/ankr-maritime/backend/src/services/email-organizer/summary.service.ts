/**
 * Email Summary Service
 * Generates concise AI summaries of emails
 *
 * @package @ankr/email-organizer
 * @version 1.0.0
 */

export interface EmailSummaryInput {
  subject: string;
  body: string;
  from: string;
  category?: string;
  urgency?: string;
  entities?: Record<string, any[]>;
}

export interface EmailSummary {
  summary: string; // One-line concise summary
  keyPoints: string[]; // Bullet points of key information
  action: string; // Required action
  confidence: number;
}

export class EmailSummaryService {
  private aiProxyEndpoint: string;

  constructor() {
    this.aiProxyEndpoint = process.env.AI_PROXY_ENDPOINT || 'http://localhost:8000/v1/chat/completions';
  }

  /**
   * Generate email summary
   */
  async generateSummary(input: EmailSummaryInput): Promise<EmailSummary> {
    const startTime = Date.now();

    try {
      // Build prompt
      const prompt = this.buildSummaryPrompt(input);

      // Call AI proxy
      const response = await this.callAIProxy(prompt);

      // Parse response
      const summary = this.parseAIResponse(response);

      const processingTime = Date.now() - startTime;
      console.log(`Email summary generated in ${processingTime}ms`);

      return summary;
    } catch (error) {
      console.error('Failed to generate email summary:', error);

      // Fallback to simple summary
      return this.generateFallbackSummary(input);
    }
  }

  /**
   * Batch generate summaries (more efficient)
   */
  async generateBatchSummaries(inputs: EmailSummaryInput[]): Promise<EmailSummary[]> {
    const promises = inputs.map((input) => this.generateSummary(input));
    return await Promise.all(promises);
  }

  /**
   * Build AI prompt for summary generation
   */
  private buildSummaryPrompt(input: EmailSummaryInput): string {
    let prompt = `Summarize this email concisely:\n\n`;
    prompt += `Subject: ${input.subject}\n`;
    prompt += `From: ${input.from}\n\n`;
    prompt += `Body:\n${input.body.slice(0, 2000)}\n\n`;

    if (input.entities && Object.keys(input.entities).length > 0) {
      prompt += `Extracted entities:\n`;
      for (const [type, values] of Object.entries(input.entities)) {
        if (values.length > 0) {
          prompt += `- ${type}: ${values.map((v: any) => v.value).join(', ')}\n`;
        }
      }
      prompt += `\n`;
    }

    prompt += `Requirements:\n`;
    prompt += `1. ONE-LINE SUMMARY (max 100 chars): Focus on WHO, WHAT, WHY, DEADLINE\n`;
    prompt += `2. KEY POINTS (3-5 bullet points): Specific numbers, names, dates, actions\n`;
    prompt += `3. ACTION REQUIRED: What does recipient need to do?\n\n`;

    prompt += `Format your response as JSON:\n`;
    prompt += `{\n`;
    prompt += `  "summary": "One-line summary here",\n`;
    prompt += `  "keyPoints": ["Point 1", "Point 2", "Point 3"],\n`;
    prompt += `  "action": "Action required"\n`;
    prompt += `}\n`;

    return prompt;
  }

  /**
   * Call AI Proxy
   */
  private async callAIProxy(prompt: string): Promise<string> {
    const response = await fetch(this.aiProxyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast, cheap model for summaries
        messages: [
          {
            role: 'system',
            content: 'You are an expert email assistant. Summarize emails concisely and extract key information.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Low temperature for consistent summaries
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Proxy error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(response: string): EmailSummary {
    try {
      // Try to parse as JSON
      const json = JSON.parse(response);

      return {
        summary: json.summary || '',
        keyPoints: json.keyPoints || [],
        action: json.action || '',
        confidence: 0.9,
      };
    } catch (error) {
      // If not JSON, try to parse manually
      const lines = response.split('\n').filter((line) => line.trim());

      const summary = lines[0] || '';
      const keyPoints = lines.slice(1, -1).map((line) => line.replace(/^[-•*]\s*/, '').trim());
      const action = lines[lines.length - 1] || '';

      return {
        summary,
        keyPoints,
        action,
        confidence: 0.7, // Lower confidence for non-JSON response
      };
    }
  }

  /**
   * Generate fallback summary (when AI fails)
   */
  private generateFallbackSummary(input: EmailSummaryInput): EmailSummary {
    const summary = input.subject.slice(0, 100);

    const keyPoints: string[] = [];
    if (input.from) keyPoints.push(`From: ${input.from}`);
    if (input.category) keyPoints.push(`Category: ${input.category}`);
    if (input.urgency) keyPoints.push(`Urgency: ${input.urgency}`);

    // Extract key entities
    if (input.entities) {
      for (const [type, values] of Object.entries(input.entities)) {
        if (values.length > 0) {
          keyPoints.push(`${type}: ${values[0].value}`);
        }
      }
    }

    const action = input.urgency === 'critical' || input.urgency === 'high'
      ? 'Requires urgent attention'
      : 'Review and respond as needed';

    return {
      summary,
      keyPoints: keyPoints.slice(0, 5),
      action,
      confidence: 0.5,
    };
  }

  /**
   * Generate summary with style variations
   */
  async generateStyledSummary(
    input: EmailSummaryInput,
    style: 'ultra_short' | 'detailed' | 'executive' = 'ultra_short'
  ): Promise<EmailSummary> {
    const stylePrompts = {
      ultra_short: 'Summarize in ONE sentence (max 80 chars). Be extremely concise.',
      detailed: 'Provide a detailed summary with context, background, and implications.',
      executive: 'Write an executive summary suitable for C-level: concise but complete.',
    };

    // Modify prompt based on style
    const basePrompt = this.buildSummaryPrompt(input);
    const styledPrompt = basePrompt.replace(
      'ONE-LINE SUMMARY (max 100 chars)',
      stylePrompts[style]
    );

    const response = await this.callAIProxy(styledPrompt);
    return this.parseAIResponse(response);
  }

  /**
   * Extract action items from email
   */
  async extractActionItems(input: EmailSummaryInput): Promise<string[]> {
    const prompt = `Extract action items from this email:\n\n${input.body}\n\nList all action items, one per line. Be specific about what needs to be done and by whom.`;

    const response = await this.callAIProxy(prompt);

    return response
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.replace(/^[-•*\d.)\s]+/, '').trim());
  }

  /**
   * Detect sentiment from email
   */
  async detectSentiment(input: EmailSummaryInput): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
    confidence: number;
  }> {
    const prompt = `Analyze the sentiment of this email:\n\nSubject: ${input.subject}\n\nBody: ${input.body.slice(0, 1000)}\n\nRespond with ONE word: positive, neutral, negative, or urgent.`;

    try {
      const response = await this.callAIProxy(prompt);
      const sentiment = response.trim().toLowerCase() as any;

      return {
        sentiment: ['positive', 'neutral', 'negative', 'urgent'].includes(sentiment)
          ? sentiment
          : 'neutral',
        confidence: 0.8,
      };
    } catch (error) {
      return { sentiment: 'neutral', confidence: 0.5 };
    }
  }
}

export const emailSummaryService = new EmailSummaryService();
