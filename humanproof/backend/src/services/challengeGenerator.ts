import { ChallengeType } from '../types';

interface ChallengePrompt {
  type: ChallengeType;
  prompt: string;
  hint: string;
}

// Creative writing prompts
const creativeWritingPrompts = [
  {
    prompt: "Write a 3-sentence story about a robot learning to feel nostalgia. Make us feel something.",
    hint: "AI struggles with genuine emotional depth and subtle human feelings"
  },
  {
    prompt: "Describe your most embarrassing childhood memory in exactly 50 words.",
    hint: "AI doesn't have personal memories or genuine embarrassment"
  },
  {
    prompt: "Write a haiku about the smell of rain. Don't just describe it - evoke the feeling.",
    hint: "Sensory memory is distinctly human"
  },
  {
    prompt: "Tell us about a time you were wrong about something important. What changed?",
    hint: "AI doesn't have lived experience of being wrong and learning"
  },
  {
    prompt: "Write 2 sentences: one truth and one lie about yourself. Make them equally believable.",
    hint: "Requires genuine personal context and deception skills"
  }
];

// Contextual reasoning prompts
const contextualReasoningPrompts = [
  {
    prompt: "Explain why someone might laugh at a funeral without being disrespectful.",
    hint: "Requires understanding complex social contexts and human grief"
  },
  {
    prompt: "Your friend texted 'I'm fine.' with a period. What might this actually mean?",
    hint: "Tests understanding of subtle social cues and text communication norms"
  },
  {
    prompt: "Why might someone pay $20 for a movie ticket but refuse to pay $5 for shipping?",
    hint: "Requires understanding irrational human psychology"
  },
  {
    prompt: "A child asks 'Why is the sky blue?' How would you explain it to make them MORE curious?",
    hint: "Tests pedagogical intuition and understanding of childhood wonder"
  },
  {
    prompt: "Someone says 'I'm not mad.' but they clearly are. What do you do?",
    hint: "Requires emotional intelligence and social navigation"
  }
];

// Emotional intelligence prompts
const emotionalIntelligencePrompts = [
  {
    prompt: "Your coworker has been quieter than usual for a week. What are 3 possible reasons (not work-related)?",
    hint: "Tests empathy and understanding of human complexity"
  },
  {
    prompt: "Describe a situation where saying nothing is the kindest response.",
    hint: "Requires nuanced understanding of social dynamics"
  },
  {
    prompt: "You notice a stranger crying in public. What goes through your mind?",
    hint: "Tests authentic human reaction and empathy"
  },
  {
    prompt: "What's something people do that annoys you, but you understand WHY they do it?",
    hint: "Requires self-awareness and empathy simultaneously"
  },
  {
    prompt: "Describe a compliment you received that made you uncomfortable. Why?",
    hint: "Tests understanding of social discomfort and self-perception"
  }
];

// Pattern creativity prompts
const patternCreativityPrompts = [
  {
    prompt: "Create a new word by combining two unrelated concepts. Define it and use it in a sentence.",
    hint: "Tests linguistic creativity that AI often does mechanically"
  },
  {
    prompt: "What's a useless superpower that would still somehow improve your life?",
    hint: "Requires creative constraint thinking and personal context"
  },
  {
    prompt: "Invent a conspiracy theory so absurd it becomes funny. Make it oddly specific.",
    hint: "Tests creative humor and absurdist thinking"
  },
  {
    prompt: "Design a social media app that would make the world WORSE. How does it work?",
    hint: "Tests dark creativity and social awareness"
  },
  {
    prompt: "If feelings had flavors, what would anxiety taste like? Describe it.",
    hint: "Tests synesthetic creativity and emotional understanding"
  }
];

// Cultural knowledge prompts
const culturalKnowledgePrompts = [
  {
    prompt: "Explain a meme or trend from the last 3 months that made you feel old or confused.",
    hint: "Requires current cultural awareness and self-awareness"
  },
  {
    prompt: "What's a phrase from your generation that younger people wouldn't understand?",
    hint: "Tests generational context and lived experience"
  },
  {
    prompt: "Describe a cultural habit or norm that seems weird when you really think about it.",
    hint: "Requires metacognitive cultural analysis"
  },
  {
    prompt: "What's something everyone pretends to understand but probably doesn't?",
    hint: "Tests social awareness and honesty"
  },
  {
    prompt: "Name a song everyone knows but nobody knows all the lyrics to. Why that one?",
    hint: "Requires cultural pattern recognition and analysis"
  }
];

export function generateRandomChallenge(): ChallengePrompt {
  const challengeTypes: ChallengeType[] = [
    'creative_writing',
    'contextual_reasoning',
    'emotional_intelligence',
    'pattern_creativity',
    'cultural_knowledge'
  ];

  const randomType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

  let promptSet;
  switch (randomType) {
    case 'creative_writing':
      promptSet = creativeWritingPrompts;
      break;
    case 'contextual_reasoning':
      promptSet = contextualReasoningPrompts;
      break;
    case 'emotional_intelligence':
      promptSet = emotionalIntelligencePrompts;
      break;
    case 'pattern_creativity':
      promptSet = patternCreativityPrompts;
      break;
    case 'cultural_knowledge':
      promptSet = culturalKnowledgePrompts;
      break;
  }

  const randomPrompt = promptSet[Math.floor(Math.random() * promptSet.length)];

  return {
    type: randomType,
    prompt: randomPrompt.prompt,
    hint: randomPrompt.hint
  };
}

export function scoreResponse(challengeType: ChallengeType, response: string): number {
  // Basic scoring heuristics (in production, this would be more sophisticated)
  const length = response.trim().length;

  // Too short = likely low effort or AI
  if (length < 30) return 20;

  // Check for common AI patterns
  const aiPatterns = [
    /as an ai/i,
    /i (don't|do not) have personal/i,
    /i (can't|cannot) (feel|experience)/i,
    /from my training/i,
    /i'm (just )?an? (language model|ai)/i
  ];

  for (const pattern of aiPatterns) {
    if (pattern.test(response)) {
      return 0; // Instant fail
    }
  }

  // Check for personal pronouns and specific details (humans use these more)
  const personalPronouns = (response.match(/\b(i|my|me|mine)\b/gi) || []).length;
  const specificDetails = (response.match(/\b(when|where|because|remember|felt)\b/gi) || []).length;

  let score = 50; // Base score

  // Reward personal voice
  score += Math.min(personalPronouns * 3, 20);

  // Reward specific details
  score += Math.min(specificDetails * 2, 15);

  // Reward appropriate length
  if (length > 50 && length < 500) {
    score += 15;
  }

  // Cap at 100
  return Math.min(score, 100);
}
