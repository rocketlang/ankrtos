/**
 * Logic Challenge Generator
 *
 * Creates logic puzzles and critical thinking challenges from NCERT content
 * Types: fallacies, conditional reasoning, argument analysis, necessary/sufficient conditions
 */

interface LogicChallenge {
  id: string;
  type: 'fallacy' | 'conditional' | 'argument' | 'necessary-sufficient';
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  concept: string;
}

export class LogicGenerator {
  private aiProxyUrl: string;

  constructor() {
    this.aiProxyUrl = process.env.AI_PROXY_URL || 'http://localhost:4444';
  }

  /**
   * Generate logic challenges from NCERT content
   */
  async generateChallenges(
    chapterId: string,
    concept: string,
    content: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    count: number = 3
  ): Promise<LogicChallenge[]> {
    try {
      const prompt = `You are a critical thinking educator creating logic challenges for NCERT Class 10 students.

Given this concept: "${concept}"
Content excerpt: ${content.substring(0, 400)}...

Create ${count} logic challenges that test:
1. Identifying logical fallacies
2. Understanding conditional statements (if-then)
3. Analyzing arguments
4. Distinguishing necessary vs sufficient conditions

For each challenge:
- Question text (scenario or statement to analyze)
- 4 multiple choice options
- Correct answer index (0-3)
- Clear explanation why the answer is correct

Difficulty: ${difficulty}

Return as JSON array with this structure:
[{
  "type": "fallacy" | "conditional" | "argument" | "necessary-sufficient",
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "explanation": "...",
  "concept": "${concept}"
}]`;

      const response = await fetch(`${this.aiProxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content:
                'You are an expert in logic, critical thinking, and creating educational assessments.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error('AI proxy request failed');
      }

      const result = await response.json();
      const aiResponse = result.choices?.[0]?.message?.content || result.response || '[]';

      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      const challengesData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      // Map to LogicChallenge format
      return challengesData.map((c: any, index: number) => ({
        id: `logic_${chapterId}_${Date.now()}_${index}`,
        type: c.type,
        question: c.question,
        options: c.options,
        correctAnswer: c.correctAnswer,
        explanation: c.explanation,
        difficulty,
        concept: c.concept || concept,
      }));
    } catch (error) {
      console.error('Error generating logic challenges:', error);

      // Return fallback challenges
      return [
        {
          id: `logic_${chapterId}_fallback_1`,
          type: 'conditional',
          question: `A student says: "If electric current flows through a conductor, then there must be a potential difference across it."

Is the converse statement also true? (If there is potential difference, current must flow)`,
          options: [
            'Yes, the converse is always true',
            'No, the converse is not necessarily true (conductor could have infinite resistance)',
            'Only true for metallic conductors',
            'Cannot be determined from the given information',
          ],
          correctAnswer: 1,
          explanation:
            'The converse is not always true. While potential difference is necessary for current flow, it is not sufficient - the conductor must also have finite resistance. With infinite resistance (open circuit), there can be potential difference but no current.',
          difficulty,
          concept: concept,
        },
        {
          id: `logic_${chapterId}_fallback_2`,
          type: 'fallacy',
          question: `A student argues: "All good conductors are metals, and copper is a good conductor, therefore copper is a metal."

What type of reasoning is this?`,
          options: [
            'Valid deductive reasoning',
            'Circular reasoning fallacy',
            'Appeal to authority',
            'Post hoc fallacy',
          ],
          correctAnswer: 0,
          explanation:
            'This is valid deductive reasoning. The conclusion (copper is a metal) logically follows from the premises: (1) All good conductors are metals, (2) Copper is a good conductor.',
          difficulty,
          concept: concept,
        },
      ];
    }
  }

  /**
   * Validate student answer
   */
  validateAnswer(
    challengeId: string,
    selectedAnswer: number,
    correctAnswer: number
  ): {
    correct: boolean;
    feedback: string;
  } {
    const correct = selectedAnswer === correctAnswer;

    return {
      correct,
      feedback: correct
        ? 'Excellent logical reasoning!'
        : `Not quite. The correct answer is option ${correctAnswer + 1}.`,
    };
  }

  /**
   * Generate hint for challenge
   */
  async generateHint(challenge: LogicChallenge): Promise<string> {
    try {
      const response = await fetch(`${this.aiProxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You provide helpful hints for logic puzzles without giving away the answer.',
            },
            {
              role: 'user',
              content: `Give a hint for this ${challenge.type} logic challenge:\n\n${challenge.question}\n\nDon't reveal the answer, just guide their thinking.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error('AI proxy request failed');
      }

      const result = await response.json();
      return result.choices?.[0]?.message?.content || result.response || 'Think about the logical structure of the statement carefully.';
    } catch (error) {
      console.error('Error generating hint:', error);
      return 'Consider what makes the reasoning valid or invalid. Break down the argument step by step.';
    }
  }
}
