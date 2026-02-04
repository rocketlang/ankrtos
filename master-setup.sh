#!/bin/bash

# 🚀 SWAYAM COMPLETE SETUP - MASTER SCRIPT
# Creates the entire NX workspace with all packages
# 
# Usage on e2e server:
#   bash master-setup.sh

set -e

echo "
🎙️ ═══════════════════════════════════════════════════════════
   SWAYAM (स्वयं) - Voice-First AI for Bharat
   Complete Workspace Setup
═══════════════════════════════════════════════════════════════
"

SWAYAM_DIR="/root/swayam"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ Node.js $(node -v) | pnpm $(pnpm -v)"

# Create workspace
mkdir -p ${SWAYAM_DIR}
cd ${SWAYAM_DIR}

echo "📁 Creating directory structure..."

# All directories
mkdir -p apps/{api,web,mobile,worker}/src
mkdir -p apps/api/src/graphql
mkdir -p packages/shared/{types,config,db,utils}/src
mkdir -p packages/core/{swayam-engine,intent,llm-router,response}/src
mkdir -p packages/ai/{langchain,langgraph,agents,swarm}/src
mkdir -p packages/knowledge/{rag,embeddings,memory,brain}/src
mkdir -p packages/voice/{stt,tts,translate,streaming}/src
mkdir -p packages/personas/{farmer,student,business,senior}/src
mkdir -p packages/integrations/{mandi,weather,gst,government}/src
mkdir -p prisma docker tools/scripts docs

# ============================================
# ROOT CONFIG FILES
# ============================================
echo "⚙️ Creating root configuration..."

cat > package.json << 'ROOTPKG'
{
  "name": "@swayam/source",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @swayam/api dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "docker:up": "docker compose -f docker/docker-compose.yml up -d",
    "docker:down": "docker compose -f docker/docker-compose.yml down"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "prisma": "^5.14.0",
    "tsx": "^4.10.0",
    "typescript": "~5.4.0"
  },
  "dependencies": {
    "@prisma/client": "^5.14.0",
    "zod": "^3.23.0",
    "tslib": "^2.6.0"
  },
  "packageManager": "pnpm@9.0.0"
}
ROOTPKG

cat > pnpm-workspace.yaml << 'PNPMWS'
packages:
  - 'apps/*'
  - 'packages/**/*'
PNPMWS

cat > tsconfig.base.json << 'TSBASE'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@swayam/types": ["packages/shared/types/src/index.ts"],
      "@swayam/config": ["packages/shared/config/src/index.ts"],
      "@swayam/db": ["packages/shared/db/src/index.ts"],
      "@swayam/utils": ["packages/shared/utils/src/index.ts"],
      "@swayam/intent": ["packages/core/intent/src/index.ts"],
      "@swayam/llm-router": ["packages/core/llm-router/src/index.ts"],
      "@swayam/swayam-engine": ["packages/core/swayam-engine/src/index.ts"],
      "@swayam/stt": ["packages/voice/stt/src/index.ts"],
      "@swayam/tts": ["packages/voice/tts/src/index.ts"]
    }
  },
  "exclude": ["node_modules", "dist"]
}
TSBASE

cat > .env << 'ENVFILE'
NODE_ENV=development
PORT=4000
HOST=0.0.0.0
DATABASE_URL=postgresql://swayam:swayam_secret@localhost:5432/swayam
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
SARVAM_API_KEY=
JWT_SECRET=swayam_jwt_secret_change_me
ENVFILE

cat > .gitignore << 'GITIGN'
node_modules
dist
.env
*.log
.DS_Store
GITIGN

# ============================================
# @swayam/types
# ============================================
echo "📦 Creating @swayam/types..."

cat > packages/shared/types/package.json << 'TYPESPKG'
{
  "name": "@swayam/types",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.23.0"
  }
}
TYPESPKG

cat > packages/shared/types/src/index.ts << 'TYPESSRC'
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
TYPESSRC

# ============================================
# @swayam/config
# ============================================
echo "📦 Creating @swayam/config..."

cat > packages/shared/config/package.json << 'CFGPKG'
{
  "name": "@swayam/config",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.23.0"
  }
}
CFGPKG

cat > packages/shared/config/src/index.ts << 'CFGSRC'
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  SARVAM_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().default('default_jwt_secret'),
});

export type Env = z.infer<typeof envSchema>;

export const config = {
  get env(): Env {
    return envSchema.parse(process.env);
  },
  get isDev(): boolean {
    return process.env.NODE_ENV === 'development';
  },
  llm: {
    cascade: [
      { provider: 'groq' as const, model: 'llama-3.3-70b-versatile', free: true },
      { provider: 'gemini' as const, model: 'gemini-2.0-flash-exp', free: true },
      { provider: 'claude' as const, model: 'claude-3-haiku-20240307', free: false },
    ],
    defaultTemperature: 0.7,
    defaultMaxTokens: 4096,
  },
  voice: {
    defaultLanguage: 'hi' as const,
    defaultVoice: 'anushka',
  },
};

export default config;
CFGSRC

# ============================================
# @swayam/utils
# ============================================
echo "📦 Creating @swayam/utils..."

cat > packages/shared/utils/package.json << 'UTILSPKG'
{
  "name": "@swayam/utils",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
UTILSPKG

cat > packages/shared/utils/src/index.ts << 'UTILSSRC'
export function generateId(prefix = ''): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${ts}${rand}` : `${ts}${rand}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

export function extractCodeBlocks(text: string): { language: string; code: string }[] {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: { language: string; code: string }[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ language: match[1] || 'text', code: match[2].trim() });
  }
  return blocks;
}

export function removeCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, ' कोड ब्लॉक ').trim();
}

export function removeMarkdown(text: string): string {
  return text.replace(/[#*_`\[\]]/g, '').trim();
}
UTILSSRC

# ============================================
# @swayam/db
# ============================================
echo "📦 Creating @swayam/db..."

cat > packages/shared/db/package.json << 'DBPKG'
{
  "name": "@swayam/db",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@prisma/client": "^5.14.0"
  },
  "devDependencies": {
    "prisma": "^5.14.0"
  }
}
DBPKG

cat > packages/shared/db/src/index.ts << 'DBSRC'
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export * from '@prisma/client';
export default prisma;
DBSRC

# ============================================
# @swayam/intent
# ============================================
echo "📦 Creating @swayam/intent..."

cat > packages/core/intent/package.json << 'INTENTPKG'
{
  "name": "@swayam/intent",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@swayam/types": "workspace:*"
  }
}
INTENTPKG

cat > packages/core/intent/src/index.ts << 'INTENTSRC'
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
INTENTSRC

# ============================================
# @swayam/llm-router
# ============================================
echo "📦 Creating @swayam/llm-router..."

cat > packages/core/llm-router/package.json << 'LLMPKG'
{
  "name": "@swayam/llm-router",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@swayam/types": "workspace:*",
    "@swayam/config": "workspace:*"
  }
}
LLMPKG

cat > packages/core/llm-router/src/index.ts << 'LLMSRC'
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
LLMSRC

# ============================================
# @swayam/stt
# ============================================
echo "📦 Creating @swayam/stt..."

cat > packages/voice/stt/package.json << 'STTPKG'
{
  "name": "@swayam/stt",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@swayam/types": "workspace:*",
    "@swayam/config": "workspace:*"
  }
}
STTPKG

cat > packages/voice/stt/src/index.ts << 'STTSRC'
import { STTProvider, Language } from '@swayam/types';

export interface STTResult {
  text: string;
  language: Language;
  confidence: number;
  duration: number;
}

export interface STTProviderInterface {
  transcribe(audio: Buffer, language?: Language): Promise<STTResult>;
}

class MockSTT implements STTProviderInterface {
  async transcribe(audio: Buffer, language: Language = 'hi'): Promise<STTResult> {
    await new Promise(r => setTimeout(r, 100));
    return { text: 'नमस्ते, यह एक टेस्ट है', language, confidence: 1.0, duration: 2.5 };
  }
}

export function createSTTProvider(provider: STTProvider = 'mock'): STTProviderInterface {
  // For now, return mock. Real providers will be added.
  return new MockSTT();
}
STTSRC

# ============================================
# @swayam/tts
# ============================================
echo "📦 Creating @swayam/tts..."

cat > packages/voice/tts/package.json << 'TTSPKG'
{
  "name": "@swayam/tts",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@swayam/types": "workspace:*",
    "@swayam/config": "workspace:*"
  }
}
TTSPKG

cat > packages/voice/tts/src/index.ts << 'TTSSRC'
import { TTSProvider, Language } from '@swayam/types';

export interface TTSResult {
  audio: Buffer;
  duration: number;
}

export interface TTSProviderInterface {
  synthesize(text: string, language?: Language, voice?: string): Promise<TTSResult>;
}

class MockTTS implements TTSProviderInterface {
  async synthesize(text: string, language: Language = 'hi'): Promise<TTSResult> {
    await new Promise(r => setTimeout(r, 50));
    return { audio: Buffer.alloc(16000), duration: 1.0 };
  }
}

export function createTTSProvider(provider: TTSProvider = 'mock'): TTSProviderInterface {
  return new MockTTS();
}

export const SARVAM_VOICES = [
  'anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun',
  'hitesh', 'aditya', 'ritu', 'chirag', 'priya', 'neha',
  'rahul', 'pooja', 'rohan', 'simran', 'kavya', 'sunita'
];
TTSSRC

# ============================================
# @swayam/swayam-engine
# ============================================
echo "📦 Creating @swayam/swayam-engine..."

cat > packages/core/swayam-engine/package.json << 'ENGPKG'
{
  "name": "@swayam/swayam-engine",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@swayam/types": "workspace:*",
    "@swayam/config": "workspace:*",
    "@swayam/intent": "workspace:*",
    "@swayam/llm-router": "workspace:*",
    "@swayam/stt": "workspace:*",
    "@swayam/tts": "workspace:*",
    "@swayam/utils": "workspace:*"
  }
}
ENGPKG

cat > packages/core/swayam-engine/src/index.ts << 'ENGSRC'
import { classifyIntent } from '@swayam/intent';
import { llmRouter } from '@swayam/llm-router';
import { createSTTProvider } from '@swayam/stt';
import { createTTSProvider } from '@swayam/tts';
import { removeCodeBlocks, extractCodeBlocks, truncate } from '@swayam/utils';
import type { SwayamRequest, SwayamResponse, Intent, Persona, Language } from '@swayam/types';

const SYSTEM_PROMPTS: Record<Intent, string> = {
  code: `You are Swayam (स्वयं), an AI coding assistant for Hindi speakers. Generate clean code and explain in simple Hindi.`,
  question: `You are Swayam (स्वयं), a knowledgeable teacher. Answer clearly in Hindi with examples.`,
  task: `You are Swayam (स्वयं), a task assistant. Help complete tasks step by step in Hindi.`,
  search: `You are Swayam (स्वयं), an information finder. Present findings clearly in Hindi.`,
  creative: `You are Swayam (स्वयं), a creative partner. Generate creative content in Hindi.`,
  chat: `You are Swayam (स्वयं), a friendly AI companion. Be warm and conversational in Hindi.`,
  command: `You are Swayam (स्वयं). Process commands efficiently.`,
  unknown: `You are Swayam (स्वयं). Help the user in Hindi.`,
};

export class SwayamEngine {
  private stt = createSTTProvider('mock');
  private tts = createTTSProvider('mock');

  constructor() {
    console.log('🎙️ Swayam Engine initialized');
  }

  async process(request: SwayamRequest): Promise<SwayamResponse> {
    const startTime = Date.now();
    console.log('🔄 Processing request...');

    try {
      let inputText = request.text || '';
      if (request.audio && request.audio.length > 0) {
        const sttResult = await this.stt.transcribe(request.audio, request.language || 'hi');
        inputText = sttResult.text;
      }

      if (!inputText.trim()) {
        return this.errorResponse('कोई इनपुट नहीं मिला');
      }

      const intentResult = classifyIntent(inputText, request.language || 'hi');
      console.log(`✨ Intent: ${intentResult.intent} (${intentResult.confidence * 100}%)`);

      const systemPrompt = SYSTEM_PROMPTS[intentResult.intent];
      const llmResponse = await llmRouter.route({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: inputText }
        ],
      });

      const codeBlocks = extractCodeBlocks(llmResponse.content);
      const code = codeBlocks[0]?.code;
      const codeLanguage = codeBlocks[0]?.language;
      const voiceText = truncate(removeCodeBlocks(llmResponse.content), 500, '...');

      let audio: Buffer | undefined;
      try {
        const ttsResult = await this.tts.synthesize(voiceText, request.language || 'hi');
        audio = ttsResult.audio;
      } catch (e) {
        console.warn('TTS failed:', e);
      }

      const latencyMs = Date.now() - startTime;
      console.log(`✅ Processed in ${latencyMs}ms`);

      return {
        text: llmResponse.content,
        voice: voiceText,
        audio,
        code,
        codeLanguage,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        metadata: { latencyMs, provider: llmResponse.provider, model: llmResponse.model }
      };
    } catch (error) {
      console.error('❌ Error:', error);
      return this.errorResponse('माफ कीजिए, कुछ गड़बड़ हो गई।');
    }
  }

  private errorResponse(message: string): SwayamResponse {
    return { text: message, voice: message, intent: 'unknown', confidence: 0 };
  }
}

export const swayam = new SwayamEngine();
ENGSRC

# ============================================
# PRISMA SCHEMA
# ============================================
echo "📦 Creating Prisma schema..."

cat > prisma/schema.prisma << 'PRISMASCHEMA'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  phone         String?   @unique
  email         String?   @unique
  name          String?
  language      String    @default("hi")
  persona       Persona   @default(GENERAL)
  preferences   Json      @default("{}")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  conversations Conversation[]
  memories      Memory[]
}

enum Persona {
  GENERAL
  FARMER
  STUDENT
  BUSINESS
  SENIOR
  PROFESSIONAL
}

model Conversation {
  id        String    @id @default(cuid())
  userId    String
  title     String?
  status    String    @default("active")
  metadata  Json      @default("{}")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages  Message[]
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  role           MessageRole
  content        String
  intent         String?
  confidence     Float?
  metadata       Json         @default("{}")
  createdAt      DateTime     @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
  TOOL
}

model Memory {
  id        String     @id @default(cuid())
  userId    String
  type      MemoryType
  key       String
  value     String
  metadata  Json       @default("{}")
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, type, key])
}

enum MemoryType {
  FACT
  PREFERENCE
  SKILL
  PROJECT
}

model RequestLog {
  id        String   @id @default(cuid())
  userId    String?
  intent    String
  provider  String
  model     String
  tokens    Int
  latencyMs Int
  success   Boolean
  cost      Float    @default(0)
  timestamp DateTime @default(now())
  @@index([timestamp])
}
PRISMASCHEMA

# ============================================
# API SERVER
# ============================================
echo "🚀 Creating API server..."

cat > apps/api/package.json << 'APIPKG'
{
  "name": "@swayam/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@swayam/types": "workspace:*",
    "@swayam/config": "workspace:*",
    "@swayam/db": "workspace:*",
    "@swayam/swayam-engine": "workspace:*",
    "fastify": "^4.28.0",
    "mercurius": "^14.0.0",
    "@fastify/cors": "^9.0.0",
    "graphql": "^16.8.0"
  },
  "devDependencies": {
    "tsx": "^4.10.0",
    "@types/node": "^20.0.0",
    "typescript": "~5.4.0"
  }
}
APIPKG

cat > apps/api/tsconfig.json << 'APITSCONFIG'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
APITSCONFIG

cat > apps/api/src/server.ts << 'APISERVER'
import Fastify from 'fastify';
import mercurius from 'mercurius';
import cors from '@fastify/cors';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { swayam } from '@swayam/swayam-engine';

const PORT = parseInt(process.env.PORT || '4000');
const HOST = process.env.HOST || '0.0.0.0';

const typeDefs = `
  type Query {
    health: String!
  }
  
  type Mutation {
    processSwayam(input: SwayamInput!): SwayamResponse!
  }
  
  input SwayamInput {
    text: String
    audioBase64: String
    language: String
    persona: String
  }
  
  type SwayamResponse {
    text: String!
    voice: String!
    audioBase64: String
    code: String
    codeLanguage: String
    intent: String!
    confidence: Float!
  }
`;

const resolvers = {
  Query: {
    health: () => '🎙️ Swayam is ready!'
  },
  Mutation: {
    processSwayam: async (_: any, { input }: any) => {
      const request = {
        text: input.text || undefined,
        audio: input.audioBase64 ? Buffer.from(input.audioBase64, 'base64') : undefined,
        language: input.language || 'hi',
        persona: input.persona || 'general',
      };
      
      const response = await swayam.process(request);
      
      return {
        text: response.text,
        voice: response.voice,
        audioBase64: response.audio?.toString('base64'),
        code: response.code,
        codeLanguage: response.codeLanguage,
        intent: response.intent,
        confidence: response.confidence,
      };
    }
  }
};

async function main() {
  const fastify = Fastify({ logger: true });
  
  await fastify.register(cors, { origin: true });
  
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  await fastify.register(mercurius, { schema, graphiql: true, path: '/graphql' });
  
  fastify.get('/health', async () => ({ status: 'ok', service: 'swayam-api' }));
  fastify.get('/', async () => ({ message: '🎙️ Swayam API', graphql: '/graphql' }));
  
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`
🎙️ ═══════════════════════════════════════
   SWAYAM API Server Running
═══════════════════════════════════════
🚀 Server: http://${HOST}:${PORT}
📊 GraphQL: http://${HOST}:${PORT}/graphql
🏥 Health: http://${HOST}:${PORT}/health
═══════════════════════════════════════
  `);
}

main().catch(console.error);
APISERVER

# Add graphql-tools dependency
cat > apps/api/package.json << 'APIPKG2'
{
  "name": "@swayam/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@swayam/types": "workspace:*",
    "@swayam/config": "workspace:*",
    "@swayam/db": "workspace:*",
    "@swayam/swayam-engine": "workspace:*",
    "fastify": "^4.28.0",
    "mercurius": "^14.0.0",
    "@fastify/cors": "^9.0.0",
    "@graphql-tools/schema": "^10.0.0",
    "graphql": "^16.8.0"
  },
  "devDependencies": {
    "tsx": "^4.10.0",
    "@types/node": "^20.0.0",
    "typescript": "~5.4.0"
  }
}
APIPKG2

# ============================================
# DOCKER
# ============================================
echo "🐳 Creating Docker files..."

cat > docker/docker-compose.yml << 'DOCKERCOMPOSE'
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: swayam-db
    environment:
      POSTGRES_USER: swayam
      POSTGRES_PASSWORD: swayam_secret
      POSTGRES_DB: swayam
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U swayam"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: swayam-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
DOCKERCOMPOSE

# ============================================
# SCRIPTS
# ============================================
echo "📜 Creating helper scripts..."

cat > tools/scripts/start.sh << 'STARTSH'
#!/bin/bash
echo "🚀 Starting Swayam..."

# Start Docker
echo "📦 Starting PostgreSQL and Redis..."
docker compose -f docker/docker-compose.yml up -d
sleep 5

# Generate Prisma
echo "🔄 Generating Prisma client..."
pnpm prisma generate

# Push schema
echo "📊 Pushing database schema..."
pnpm prisma db push

# Start API
echo "🎙️ Starting API..."
pnpm dev
STARTSH

chmod +x tools/scripts/start.sh

# ============================================
# INSTALL DEPENDENCIES
# ============================================
echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🔄 Generating Prisma client..."
pnpm prisma generate || echo "⚠️ Prisma generate skipped (database not available)"

echo "
✅ ═══════════════════════════════════════════════════════════
   SWAYAM WORKSPACE CREATED SUCCESSFULLY!
═══════════════════════════════════════════════════════════════

📁 Location: ${SWAYAM_DIR}

📦 Packages created:
   • @swayam/types      - Zod schemas & types
   • @swayam/config     - Configuration
   • @swayam/utils      - Utilities
   • @swayam/db         - Prisma client
   • @swayam/intent     - Intent classification
   • @swayam/llm-router - FREE-FIRST LLM routing
   • @swayam/stt        - Speech-to-Text
   • @swayam/tts        - Text-to-Speech
   • @swayam/swayam-engine - Main orchestrator
   • @swayam/api        - Fastify GraphQL API

🚀 Quick Start:
   1. Add your API keys to .env:
      nano ${SWAYAM_DIR}/.env
      
   2. Start Docker services:
      docker compose -f docker/docker-compose.yml up -d
      
   3. Push database schema:
      pnpm prisma db push
      
   4. Start the API:
      pnpm dev

📊 Then visit: http://216.48.185.29:4000/graphql

🙏 Jai Guru Ji | ANKR Labs
═══════════════════════════════════════════════════════════════
"
