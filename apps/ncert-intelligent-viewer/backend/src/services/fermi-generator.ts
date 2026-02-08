/**
 * Fermi Question Generator
 *
 * Generates Fermi estimation questions from NCERT content
 * Uses AI to create order-of-magnitude estimation problems
 */

interface FermiQuestion {
  id: string;
  question: string;
  context: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints?: string[];
  orderOfMagnitude?: number;
  unit?: string;
}

export class FermiGenerator {
  private aiProxyUrl: string;

  constructor() {
    this.aiProxyUrl = process.env.AI_PROXY_URL || 'http://localhost:4444';
  }

  /**
   * Generate Fermi questions from NCERT content
   */
  async generateQuestions(
    chapterId: string,
    section: string,
    content: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    count: number = 3
  ): Promise<FermiQuestion[]> {
    try {
      const prompt = `You are an expert physics/science educator creating Fermi estimation questions for NCERT Class 10 students.

Given this content from "${section}":
${content.substring(0, 500)}...

Create ${count} Fermi estimation questions that:
1. Require order-of-magnitude reasoning
2. Are based on real-world scenarios
3. Connect to the chapter content
4. Are appropriate for ${difficulty} difficulty level

For each question, provide:
- The question text
- 2-3 hints to guide student thinking
- The expected order of magnitude (e.g., 10^18 for "electrons per second")

Return as JSON array: [{ "question": "...", "hints": ["...", "..."], "orderOfMagnitude": 18, "unit": "electrons/second" }]`;

      const response = await fetch(`${this.aiProxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a Fermi estimation expert for NCERT physics.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error('AI proxy request failed');
      }

      const result = await response.json();
      const aiResponse = result.choices?.[0]?.message?.content || result.response || '[]';

      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      const questionsData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      // Map to FermiQuestion format
      return questionsData.map((q: any, index: number) => ({
        id: `fermi_${chapterId}_${Date.now()}_${index}`,
        question: q.question,
        context: section,
        difficulty,
        hints: q.hints || [],
        orderOfMagnitude: q.orderOfMagnitude,
        unit: q.unit,
      }));
    } catch (error) {
      console.error('Error generating Fermi questions:', error);

      // Return fallback questions
      return [
        {
          id: `fermi_${chapterId}_fallback`,
          question: 'Estimate how many electrons flow through a 60W light bulb per second at 220V',
          context: section,
          difficulty,
          hints: [
            'Start with power = voltage × current',
            'Find current (I = P/V)',
            'Relate current to electron flow (I = charge/time)',
          ],
          orderOfMagnitude: 18,
          unit: 'electrons/second',
        },
      ];
    }
  }

  /**
   * Validate student answer (check order of magnitude)
   */
  validateAnswer(answer: number, expected: number, tolerance: number = 2): {
    correct: boolean;
    feedback: string;
  } {
    const answerMagnitude = Math.floor(Math.log10(Math.abs(answer)));
    const expectedMagnitude = expected;
    const diff = Math.abs(answerMagnitude - expectedMagnitude);

    if (diff === 0) {
      return {
        correct: true,
        feedback: 'Perfect! Your answer is within the correct order of magnitude.',
      };
    } else if (diff <= tolerance) {
      return {
        correct: true,
        feedback: `Good estimate! You're ${diff} order(s) of magnitude away, which is acceptable for Fermi estimation.`,
      };
    } else {
      return {
        correct: false,
        feedback: `Your answer (10^${answerMagnitude}) is ${diff} orders of magnitude away from the expected range (10^${expectedMagnitude}). Try breaking down the problem into smaller steps.`,
      };
    }
  }
}
