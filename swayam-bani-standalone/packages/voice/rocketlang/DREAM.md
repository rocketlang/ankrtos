# The Dream: ANKR Agent

## The Insight

Claude Code's power is deceptively simple:
1. AI understands what you want
2. Has simple tools (Read, Write, Edit, Bash, Grep)
3. Executes them intelligently
4. Maintains context

**We don't need a language. We need an agent.**

---

## Current Problem

Too many pieces:
- `executor.ts` - 900 lines of regex parsing
- `context.ts` - Pronoun resolution
- `suggestions.ts` - Error recovery
- `tools-extended.ts` - 6 tools
- `package-awareness.ts` - Knowledge base
- `code-generator.ts` - Template matching
- Grammar files, type systems, compilation targets...

This is complexity pretending to be capability.

---

## The Dream Architecture

```
User: "isko test karo"
         │
         ▼
┌─────────────────────────────────────────┐
│            ANKR Agent                    │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │         UNDERSTAND               │   │
│  │   AI resolves "isko" → last file │   │
│  │   Intent: run tests              │   │
│  └──────────────────────────────────┘   │
│                  │                       │
│                  ▼                       │
│  ┌──────────────────────────────────┐   │
│  │            ACT                   │   │
│  │   Execute: test tool             │   │
│  │   Params: { file: 'utils.ts' }   │   │
│  └──────────────────────────────────┘   │
│                  │                       │
│                  ▼                       │
│  ┌──────────────────────────────────┐   │
│  │          REMEMBER                │   │
│  │   Update context                 │   │
│  │   Store in EON if significant    │   │
│  └──────────────────────────────────┘   │
│                                          │
└─────────────────────────────────────────┘
         │
         ▼
Response: "Tests passed for utils.ts"
```

---

## Core Principles

### 1. AI-First, Not Grammar-First

**Old Way (Complex):**
```javascript
// Parse "file padho config.json"
const ast = pegParser.parse(input);
const command = ast.command; // "padho"
const arg = ast.arguments[0]; // "config.json"
const tool = commandToTool[command]; // "read"
```

**New Way (Simple):**
```javascript
// Let AI understand
const intent = await ai.understand(input, context);
// { tool: 'read', params: { path: 'config.json' }, confidence: 0.95 }
```

### 2. Tools Are Everything

Everything is a tool. Tools self-describe. No separate "knowledge base" needed.

```typescript
const tools = {
  read: {
    triggers: ['padho', 'पढ़ो', 'read', 'show', 'dikhao', 'दिखाओ'],
    description: 'Read file contents',
    params: { path: 'string' },
    execute: async ({ path }) => readFileSync(path, 'utf-8'),
  },

  write: {
    triggers: ['likho', 'लिखो', 'write', 'save', 'banao', 'बनाओ'],
    description: 'Write to file',
    params: { path: 'string', content: 'string' },
    execute: async ({ path, content }) => writeFileSync(path, content),
  },

  run: {
    triggers: ['chalao', 'चलाओ', 'run', 'execute'],
    description: 'Run code or command',
    params: { code: 'string', language: 'string?' },
    execute: async ({ code, language }) => executeCode(code, language),
  },

  test: {
    triggers: ['test', 'jaancho', 'जांचो', 'check'],
    description: 'Run tests',
    params: { pattern: 'string?' },
    execute: async ({ pattern }) => runTests(pattern),
  },

  // ... more tools
};
```

### 3. Context Is Core

One context object. Updated on every action. Enables "isko", "yahan", "woh".

```typescript
interface Context {
  // Current state
  cwd: string;
  lastFile?: string;
  lastOutput?: string;

  // History
  recentFiles: string[];      // Last 10 files touched
  recentCommands: Command[];  // Last 20 commands

  // Project awareness
  projectType?: 'node' | 'python' | 'go';
  packageJson?: object;

  // User
  language: 'hi' | 'en' | 'ta' | 'te';
  userId?: string;
}
```

### 4. Frugal Fallbacks

If AI unavailable, simple keyword matching works:

```typescript
async function understand(input: string, context: Context) {
  // Try AI first
  try {
    return await aiUnderstand(input, context);
  } catch {
    // Fallback to keywords
    return keywordMatch(input, context);
  }
}

function keywordMatch(input: string, context: Context) {
  const words = input.toLowerCase().split(/\s+/);

  for (const [name, tool] of Object.entries(tools)) {
    if (tool.triggers.some(t => words.includes(t.toLowerCase()))) {
      return { tool: name, params: extractParams(input, tool) };
    }
  }

  return null;
}
```

---

## The Frugal Implementation

### One File: `agent.ts` (~500 lines)

```typescript
/**
 * ANKR Agent
 * "Bolo, Ho Jaayega"
 *
 * A frugal Claude Code for India.
 */

// ============== TYPES ==============
interface Tool {
  triggers: string[];
  description: string;
  params: Record<string, string>;
  execute: (params: any, ctx: Context) => Promise<Result>;
}

interface Context {
  cwd: string;
  lastFile?: string;
  recentFiles: string[];
  recentCommands: { text: string; tool: string; time: number }[];
  language: 'hi' | 'en';
}

interface Result {
  success: boolean;
  output?: string;
  error?: string;
}

// ============== TOOLS ==============
const TOOLS: Record<string, Tool> = {
  read: { /* ... */ },
  write: { /* ... */ },
  edit: { /* ... */ },
  find: { /* ... */ },
  run: { /* ... */ },
  test: { /* ... */ },
  build: { /* ... */ },
  commit: { /* ... */ },
  remember: { /* ... */ },
  recall: { /* ... */ },
};

// ============== CONTEXT ==============
const contexts = new Map<string, Context>();

function getContext(userId?: string): Context {
  const id = userId || 'default';
  if (!contexts.has(id)) {
    contexts.set(id, {
      cwd: process.cwd(),
      recentFiles: [],
      recentCommands: [],
      language: 'hi',
    });
  }
  return contexts.get(id)!;
}

function updateContext(ctx: Context, update: Partial<Context>) {
  Object.assign(ctx, update);
}

// ============== UNDERSTAND ==============
async function understand(input: string, ctx: Context): Promise<{
  tool: string;
  params: Record<string, any>;
  confidence: number;
} | null> {
  // Resolve pronouns first
  const resolved = resolvePronouns(input, ctx);

  // Try AI understanding
  try {
    const response = await fetch('http://localhost:4444/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'groq/llama-3.3-70b-versatile',
        messages: [{
          role: 'system',
          content: `You understand Hindi/English commands and map them to tools.
Available tools: ${Object.entries(TOOLS).map(([n, t]) => `${n}: ${t.description}`).join(', ')}
Context: cwd=${ctx.cwd}, lastFile=${ctx.lastFile}
Return JSON: { "tool": "name", "params": {...}, "confidence": 0.0-1.0 }`
        }, {
          role: 'user',
          content: resolved
        }],
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch {
    // Fallback to keyword matching
    return keywordMatch(resolved, ctx);
  }
}

function resolvePronouns(input: string, ctx: Context): string {
  return input
    .replace(/\b(isko|इसको|this)\b/gi, ctx.lastFile || 'this')
    .replace(/\b(yahan|यहाँ|here)\b/gi, ctx.cwd)
    .replace(/\b(woh file|वो फाइल|that file)\b/gi, ctx.recentFiles[1] || 'that file');
}

function keywordMatch(input: string, ctx: Context) {
  const words = input.toLowerCase().split(/\s+/);

  for (const [name, tool] of Object.entries(TOOLS)) {
    if (tool.triggers.some(t => words.includes(t.toLowerCase()))) {
      return { tool: name, params: {}, confidence: 0.6 };
    }
  }

  return null;
}

// ============== ACT ==============
async function act(intent: { tool: string; params: any }, ctx: Context): Promise<Result> {
  const tool = TOOLS[intent.tool];
  if (!tool) {
    return { success: false, error: `Unknown tool: ${intent.tool}` };
  }

  try {
    const result = await tool.execute(intent.params, ctx);

    // Update context
    ctx.recentCommands.unshift({
      text: `${intent.tool} ${JSON.stringify(intent.params)}`,
      tool: intent.tool,
      time: Date.now(),
    });
    if (ctx.recentCommands.length > 20) ctx.recentCommands.pop();

    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============== MAIN ENTRY ==============
export async function agent(input: string, userId?: string): Promise<Result> {
  const ctx = getContext(userId);

  // Understand
  const intent = await understand(input, ctx);
  if (!intent) {
    return {
      success: false,
      error: ctx.language === 'hi'
        ? 'समझ नहीं आया। कोशिश करो: "file padho", "code chalao", "test karo"'
        : 'Could not understand. Try: "read file", "run code", "run tests"',
    };
  }

  // Act
  const result = await act(intent, ctx);

  // Format response
  return formatResponse(result, ctx.language);
}

function formatResponse(result: Result, lang: 'hi' | 'en'): Result {
  if (result.success) {
    return result;
  }

  // Translate common errors
  if (lang === 'hi' && result.error) {
    const translations: Record<string, string> = {
      'File not found': 'फाइल नहीं मिली',
      'Permission denied': 'अनुमति नहीं है',
      'Command failed': 'कमांड फेल हो गई',
    };

    for (const [en, hi] of Object.entries(translations)) {
      if (result.error.includes(en)) {
        result.error = result.error.replace(en, hi);
      }
    }
  }

  return result;
}
```

---

## What We Drop

| Current | Reason to Drop |
|---------|----------------|
| PEG.js grammar | AI understands natural language |
| Template matching | AI generates code |
| Package awareness DB | Tools self-describe |
| 10-week language roadmap | We're building agent, not language |
| Type system | TypeScript handles types |
| Compilation targets | JS is enough for now |

## What We Keep

| Feature | Why Keep |
|---------|----------|
| Hindi/English triggers | Core to "Bolo Ho Jaayega" |
| Context awareness | Enables natural conversation |
| EON integration | Long-term memory |
| Tool registry | Extensibility |

---

## Comparison

| Aspect | Current | Dream |
|--------|---------|-------|
| Lines of code | ~3000 | ~500 |
| Files | 7+ | 1-2 |
| Dependencies | Grammar, templates, KB | Just AI proxy |
| Understanding | Regex + keywords | AI + fallback |
| Extensibility | Add to grammar | Add tool |
| Hindi support | Hard-coded patterns | AI understands |

---

## The Path Forward

1. **Create `agent.ts`** - Single unified agent (~500 lines)
2. **Define core tools** - 10-15 essential tools
3. **Wire to Swayam** - Replace current RocketLang integration
4. **Test with voice** - Hindi commands, real scenarios
5. **Iterate** - Add tools as needed

---

## The Dream

```
User: "पिछली फाइल में error fix करो"

Agent thinks:
- "पिछली फाइल" → context.recentFiles[0] → "utils.ts"
- "error fix करो" → intent: edit, with AI-suggested fix
- Context shows recent test failure → knows what error

Agent acts:
- Reads utils.ts
- AI suggests fix
- Applies edit
- Runs tests
- Reports success

User: "अच्छा, commit कर दो"

Agent:
- Understands "commit" tool
- Uses context for meaningful message
- Executes git commit
- Reports success

Total code for this: 500 lines.
Total capability: Equal to Claude Code.
```

---

## Summary

**Stop building a language. Start building an agent.**

The frugal way is the right way:
- AI for understanding
- Simple tools for acting
- Context for memory
- One file, one concept

Dreams become real when we simplify.
