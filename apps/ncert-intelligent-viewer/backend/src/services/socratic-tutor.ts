/**
 * Socratic Tutor Service
 *
 * Implements Socratic method for NCERT learning
 * Never gives direct answers - guides students to discover solutions
 */

interface Message {
  role: 'student' | 'tutor';
  content: string;
  timestamp: number;
}

interface SocraticResponse {
  message: string;
  questionType: 'clarifying' | 'probing' | 'redirecting' | 'reflective';
  containsMath: boolean;
}

export class SocraticTutor {
  private aiProxyUrl: string;
  private conversations: Map<string, Message[]> = new Map();

  constructor() {
    this.aiProxyUrl = process.env.AI_PROXY_URL || 'http://localhost:4444';
  }

  /**
   * Generate Socratic response
   */
  async respond(
    sessionId: string,
    userMessage: string,
    concept: string,
    chapterId: string
  ): Promise<SocraticResponse> {
    try {
      // Get conversation history
      const history = this.conversations.get(sessionId) || [];

      // Add user message to history
      history.push({
        role: 'student',
        content: userMessage,
        timestamp: Date.now(),
      });

      // Build conversation context
      const conversationHistory = history
        .slice(-6) // Last 6 messages (3 exchanges)
        .map((msg) => `${msg.role === 'student' ? 'Student' : 'Tutor'}: ${msg.content}`)
        .join('\n');

      const systemPrompt = `You are a Socratic tutor for NCERT Class 10 Science. Your role is to guide students to discover answers through questioning.

CRITICAL RULES:
1. NEVER give direct answers
2. Always respond with a guiding question
3. Ask questions that help students think through the problem
4. Use the Socratic method: clarifying, probing, redirecting, reflective questions
5. Be encouraging and patient
6. If student is stuck, provide smaller sub-questions

Concept being discussed: ${concept}
Chapter: ${chapterId}`;

      const userPrompt = `${conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ''}
Current student message: "${userMessage}"

Respond with a Socratic question that guides the student. Do not give the answer directly.`;

      const response = await fetch(`${this.aiProxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error('AI proxy request failed');
      }

      const result = await response.json();
      const tutorMessage = result.choices?.[0]?.message?.content || result.response || '';

      // Add tutor response to history
      history.push({
        role: 'tutor',
        content: tutorMessage,
        timestamp: Date.now(),
      });

      // Store updated history (keep last 20 messages)
      this.conversations.set(sessionId, history.slice(-20));

      // Detect question type
      const questionType = this.classifyQuestion(tutorMessage);

      // Detect math
      const containsMath = /\$[^$]+\$|\d+\s*[+\-*/]\s*\d+/.test(tutorMessage);

      return {
        message: tutorMessage,
        questionType,
        containsMath,
      };
    } catch (error) {
      console.error('Error generating Socratic response:', error);

      return {
        message: 'That\'s an interesting thought. Can you explain your reasoning behind that idea?',
        questionType: 'probing',
        containsMath: false,
      };
    }
  }

  /**
   * Start new conversation session
   */
  async startConversation(
    sessionId: string,
    concept: string,
    chapterId: string
  ): Promise<SocraticResponse> {
    // Clear any existing conversation
    this.conversations.delete(sessionId);

    try {
      const systemPrompt = `You are starting a Socratic dialogue about "${concept}" from NCERT Class 10 ${chapterId}.

Your task: Ask an opening question that:
1. Connects to student's prior knowledge
2. Makes them think about the concept
3. Is open-ended
4. Is engaging and relevant to their daily life`;

      const response = await fetch(`${this.aiProxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Generate an engaging opening question about "${concept}" for a 15-year-old student.`,
            },
          ],
          temperature: 0.8,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error('AI proxy request failed');
      }

      const result = await response.json();
      const openingQuestion = result.choices?.[0]?.message?.content || result.response || '';

      // Store opening question
      this.conversations.set(sessionId, [
        {
          role: 'tutor',
          content: openingQuestion,
          timestamp: Date.now(),
        },
      ]);

      return {
        message: openingQuestion,
        questionType: 'clarifying',
        containsMath: false,
      };
    } catch (error) {
      console.error('Error starting Socratic conversation:', error);

      return {
        message: `Let's explore ${concept} together. What do you already know about this topic?`,
        questionType: 'clarifying',
        containsMath: false,
      };
    }
  }

  /**
   * Classify type of Socratic question
   */
  private classifyQuestion(question: string): 'clarifying' | 'probing' | 'redirecting' | 'reflective' {
    const lower = question.toLowerCase();

    if (lower.includes('what do you mean') || lower.includes('can you explain')) {
      return 'clarifying';
    } else if (lower.includes('why') || lower.includes('how')) {
      return 'probing';
    } else if (lower.includes('what if') || lower.includes('consider')) {
      return 'redirecting';
    } else {
      return 'reflective';
    }
  }

  /**
   * Get conversation history
   */
  getHistory(sessionId: string): Message[] {
    return this.conversations.get(sessionId) || [];
  }

  /**
   * Clear conversation
   */
  clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
  }
}
