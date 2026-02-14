import { Intent, IntentSchema, Language } from '@swayam/types';

export interface IntentResult {
  intent: Intent;
  confidence: number;
  entities: Record<string, string>;
}

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  code: ['बनाओ', 'code', 'program', 'app', 'website', 'function', 'script', 'लिखो', 'create'],
  question: ['क्या', 'कैसे', 'क्यों', 'कब', 'कहाँ', 'कौन', 'what', 'how', 'why', 'when', 'explain', 'समझाओ'],
  task: ['भेजो', 'करो', 'बुक', 'order', 'खरीदो', 'send', 'book', 'schedule', 'remind'],
  search: ['खोजो', 'ढूंढो', 'बताओ', 'search', 'find', 'tell', 'दिखाओ'],
  creative: ['कहानी', 'गाना', 'कविता', 'story', 'song', 'poem', 'design', 'compose'],
  chat: ['हाय', 'हेलो', 'नमस्ते', 'कैसे हो', 'hi', 'hello', 'thanks', 'धन्यवाद'],
  command: ['रुको', 'stop', 'cancel', 'reset', 'बंद', 'clear'],
  unknown: []
};

export function classifyIntent(text: string, language: Language = 'hi'): IntentResult {
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  
  let bestIntent: Intent = 'unknown';
  let bestConfidence = 0;
  
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const matchCount = keywords.filter(kw => 
      words.some(w => w.includes(kw.toLowerCase()))
    ).length;
    
    if (matchCount > 0) {
      const confidence = Math.min(matchCount / (keywords.length * 0.3) + 0.5, 1);
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestIntent = intent as Intent;
      }
    }
  }
  
  if (bestIntent === 'unknown') {
    bestIntent = 'chat';
    bestConfidence = 0.5;
  }
  
  return {
    intent: IntentSchema.parse(bestIntent),
    confidence: Math.round(bestConfidence * 100) / 100,
    entities: extractEntities(normalized)
  };
}

function extractEntities(text: string): Record<string, string> {
  const entities: Record<string, string> = {};
  const langs = ['python', 'javascript', 'typescript', 'java', 'rust', 'go'];
  for (const lang of langs) {
    if (text.includes(lang)) {
      entities.programmingLanguage = lang;
      break;
    }
  }
  const nums = text.match(/\d+/g);
  if (nums) entities.numbers = nums.join(',');
  return entities;
}

export { Intent, IntentResult };
