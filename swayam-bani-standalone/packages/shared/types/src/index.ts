import { z } from 'zod';

// Intent types
export const IntentSchema = z.enum([
  'code', 'question', 'task', 'search', 'creative', 'chat', 'command', 'unknown'
]);
export type Intent = z.infer<typeof IntentSchema>;

// Persona types
export const PersonaSchema = z.enum([
  'general', 'farmer', 'student', 'business', 'senior', 'professional'
]);
export type Persona = z.infer<typeof PersonaSchema>;

// Language types
export const LanguageSchema = z.enum([
  'hi', 'en', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa', 'ur'
]);
export type Language = z.infer<typeof LanguageSchema>;

// LLM types
export const LLMProviderSchema = z.enum(['groq', 'gemini', 'claude', 'openai', 'local']);
export type LLMProvider = z.infer<typeof LLMProviderSchema>;

export const LLMRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  model: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
});
export type LLMRequest = z.infer<typeof LLMRequestSchema>;

export const LLMResponseSchema = z.object({
  content: z.string(),
  provider: LLMProviderSchema,
  model: z.string(),
  tokens: z.object({ input: z.number(), output: z.number() }),
  latencyMs: z.number(),
  cost: z.number()
});
export type LLMResponse = z.infer<typeof LLMResponseSchema>;

// Voice types
export const STTProviderSchema = z.enum(['sarvam', 'whisper', 'mock']);
export type STTProvider = z.infer<typeof STTProviderSchema>;

export const TTSProviderSchema = z.enum(['sarvam', 'piper', 'xtts', 'mock']);
export type TTSProvider = z.infer<typeof TTSProviderSchema>;

// Swayam types
export interface SwayamRequest {
  audio?: Buffer;
  text?: string;
  conversationId?: string;
  userId?: string;
  language?: Language;
  persona?: Persona;
}

export interface SwayamResponse {
  text: string;
  voice: string;
  audio?: Buffer;
  code?: string;
  codeLanguage?: string;
  intent: Intent;
  confidence: number;
  sources?: string[];
  metadata?: Record<string, unknown>;
}
