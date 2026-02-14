/**
 * ANKR Agent
 * "Bolo, Ho Jaayega" - Just Say It, It Happens
 *
 * A frugal Claude Code for India.
 * One file. Full capability.
 *
 * @author ANKR Labs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { resolve, basename, dirname, join, extname } from 'path';
import { remember, recall } from '@ankr/ankrcode-core';

// ============================================================================
// TYPES
// ============================================================================

export type Language = 'hi' | 'en' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'od';

export interface Tool {
  triggers: string[];
  description: string;
  descriptionHi?: string;
  params: Record<string, 'string' | 'number' | 'boolean' | 'string?'>;
  execute: (params: Record<string, unknown>, ctx: Context) => Promise<Result>;
}

export interface Context {
  cwd: string;
  lastFile?: string;
  lastOutput?: string;
  lastError?: string;
  recentFiles: string[];
  recentCommands: { input: string; tool: string; time: number; success: boolean }[];
  language: Language;
  userId?: string;
  projectType?: 'node' | 'python' | 'go' | 'rust' | 'unknown';
}

export interface Result {
  success: boolean;
  output?: string;
  outputHi?: string;
  error?: string;
  data?: Record<string, unknown>;
}

export interface Intent {
  tool: string;
  params: Record<string, unknown>;
  confidence: number;
  resolved?: string;
}

// ============================================================================
// TOOLS
// ============================================================================

const TOOLS: Record<string, Tool> = {
  // -------------------------------------------------------------------------
  // FILE OPERATIONS
  // -------------------------------------------------------------------------
  read: {
    triggers: ['padho', 'पढ़ो', 'read', 'show', 'dikhao', 'दिखाओ', 'cat', 'dekho', 'देखो'],
    description: 'Read file contents',
    descriptionHi: 'फाइल पढ़ो',
    params: { path: 'string' },
    execute: async ({ path }, ctx) => {
      const filePath = resolve(ctx.cwd, String(path));
      if (!existsSync(filePath)) {
        return { success: false, error: `File not found: ${path}` };
      }
      const content = readFileSync(filePath, 'utf-8');
      ctx.lastFile = filePath;
      ctx.recentFiles.unshift(filePath);
      if (ctx.recentFiles.length > 10) ctx.recentFiles.pop();
      return { success: true, output: content, data: { path: filePath, lines: content.split('\n').length } };
    },
  },

  write: {
    triggers: ['likho', 'लिखो', 'write', 'save', 'banao', 'बनाओ', 'create'],
    description: 'Write content to file',
    descriptionHi: 'फाइल में लिखो',
    params: { path: 'string', content: 'string' },
    execute: async ({ path, content }, ctx) => {
      const filePath = resolve(ctx.cwd, String(path));
      const existed = existsSync(filePath);
      writeFileSync(filePath, String(content));
      ctx.lastFile = filePath;
      ctx.recentFiles.unshift(filePath);
      return {
        success: true,
        output: existed ? `Updated: ${path}` : `Created: ${path}`,
        outputHi: existed ? `अपडेट किया: ${path}` : `बनाया: ${path}`,
      };
    },
  },

  delete: {
    triggers: ['hatao', 'हटाओ', 'delete', 'remove', 'mitao', 'मिटाओ', 'rm'],
    description: 'Delete a file',
    descriptionHi: 'फाइल हटाओ',
    params: { path: 'string' },
    execute: async ({ path }, ctx) => {
      const filePath = resolve(ctx.cwd, String(path));
      if (!existsSync(filePath)) {
        return { success: false, error: `File not found: ${path}` };
      }
      unlinkSync(filePath);
      return { success: true, output: `Deleted: ${path}`, outputHi: `हटाया: ${path}` };
    },
  },

  find: {
    triggers: ['dhundho', 'ढूंढो', 'find', 'search', 'khojo', 'खोजो', 'grep'],
    description: 'Find files or search content',
    descriptionHi: 'फाइल खोजो',
    params: { pattern: 'string', content: 'string?' },
    execute: async ({ pattern, content }, ctx) => {
      const results: string[] = [];
      const searchDir = (dir: string, depth = 0) => {
        if (depth > 5) return; // Max depth
        try {
          const items = readdirSync(dir);
          for (const item of items) {
            if (item.startsWith('.') || item === 'node_modules') continue;
            const fullPath = join(dir, item);
            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
              searchDir(fullPath, depth + 1);
            } else if (item.includes(String(pattern)) || fullPath.includes(String(pattern))) {
              if (content) {
                // Search inside file
                try {
                  const fileContent = readFileSync(fullPath, 'utf-8');
                  if (fileContent.includes(String(content))) {
                    results.push(fullPath);
                  }
                } catch {}
              } else {
                results.push(fullPath);
              }
            }
          }
        } catch {}
      };
      searchDir(ctx.cwd);
      return {
        success: true,
        output: results.length ? results.join('\n') : 'No files found',
        outputHi: results.length ? results.join('\n') : 'कोई फाइल नहीं मिली',
        data: { count: results.length, files: results },
      };
    },
  },

  list: {
    triggers: ['list', 'ls', 'suchi', 'सूची', 'files', 'dir'],
    description: 'List files in directory',
    descriptionHi: 'फाइलों की सूची',
    params: { path: 'string?' },
    execute: async ({ path }, ctx) => {
      const dir = path ? resolve(ctx.cwd, String(path)) : ctx.cwd;
      if (!existsSync(dir)) {
        return { success: false, error: `Directory not found: ${path || ctx.cwd}` };
      }
      const items = readdirSync(dir);
      const formatted = items.map(item => {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        return stat.isDirectory() ? `📁 ${item}/` : `📄 ${item}`;
      });
      return { success: true, output: formatted.join('\n'), data: { count: items.length, items } };
    },
  },

  // -------------------------------------------------------------------------
  // CODE OPERATIONS
  // -------------------------------------------------------------------------
  run: {
    triggers: ['chalao', 'चलाओ', 'run', 'execute', 'exec'],
    description: 'Run code or script',
    descriptionHi: 'कोड चलाओ',
    params: { code: 'string?', file: 'string?', language: 'string?' },
    execute: async ({ code, file, language }, ctx) => {
      let cmd: string;
      let targetFile = file ? resolve(ctx.cwd, String(file)) : ctx.lastFile;

      if (code) {
        // Direct code execution
        const lang = String(language || 'javascript');
        if (lang === 'python' || lang === 'py') {
          cmd = `python3 -c "${String(code).replace(/"/g, '\\"')}"`;
        } else if (lang === 'bash' || lang === 'sh') {
          cmd = String(code);
        } else {
          cmd = `node -e "${String(code).replace(/"/g, '\\"')}"`;
        }
      } else if (targetFile) {
        // Run file
        const ext = extname(targetFile);
        if (ext === '.py') {
          cmd = `python3 "${targetFile}"`;
        } else if (ext === '.sh') {
          cmd = `bash "${targetFile}"`;
        } else if (ext === '.ts') {
          cmd = `npx tsx "${targetFile}"`;
        } else {
          cmd = `node "${targetFile}"`;
        }
      } else {
        return { success: false, error: 'No code or file specified' };
      }

      try {
        const output = execSync(cmd, { cwd: ctx.cwd, encoding: 'utf-8', timeout: 30000 });
        ctx.lastOutput = output;
        return { success: true, output };
      } catch (err: any) {
        ctx.lastError = err.message;
        return { success: false, error: err.message, output: err.stdout };
      }
    },
  },

  test: {
    triggers: ['test', 'jaancho', 'जांचो', 'check', 'verify'],
    description: 'Run tests',
    descriptionHi: 'टेस्ट करो',
    params: { pattern: 'string?' },
    execute: async ({ pattern }, ctx) => {
      let cmd = 'npm test';

      // Detect test framework
      const pkgPath = join(ctx.cwd, 'package.json');
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (pkg.devDependencies?.vitest || pkg.dependencies?.vitest) {
          cmd = 'npx vitest run';
        } else if (pkg.devDependencies?.jest || pkg.dependencies?.jest) {
          cmd = 'npx jest';
        }
      }

      if (pattern) cmd += ` ${pattern}`;

      try {
        const output = execSync(cmd, { cwd: ctx.cwd, encoding: 'utf-8', timeout: 120000 });
        return { success: true, output, outputHi: 'टेस्ट पास हो गए' };
      } catch (err: any) {
        return { success: false, error: 'Tests failed', output: err.stdout || err.message };
      }
    },
  },

  build: {
    triggers: ['build', 'banao', 'compile'],
    description: 'Build the project',
    descriptionHi: 'प्रोजेक्ट बिल्ड करो',
    params: {},
    execute: async (_, ctx) => {
      let cmd = 'npm run build';

      const pkgPath = join(ctx.cwd, 'package.json');
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (!pkg.scripts?.build && existsSync(join(ctx.cwd, 'tsconfig.json'))) {
          cmd = 'npx tsc';
        }
      }

      try {
        const output = execSync(cmd, { cwd: ctx.cwd, encoding: 'utf-8', timeout: 300000 });
        return { success: true, output: 'Build successful\n' + output, outputHi: 'बिल्ड हो गया' };
      } catch (err: any) {
        return { success: false, error: 'Build failed', output: err.stdout || err.message };
      }
    },
  },

  // -------------------------------------------------------------------------
  // GIT OPERATIONS
  // -------------------------------------------------------------------------
  commit: {
    triggers: ['commit', 'save', 'bachao', 'बचाओ'],
    description: 'Git commit changes',
    descriptionHi: 'बदलाव सेव करो',
    params: { message: 'string?' },
    execute: async ({ message }, ctx) => {
      try {
        // Check for changes
        const status = execSync('git status --porcelain', { cwd: ctx.cwd, encoding: 'utf-8' });
        if (!status.trim()) {
          return { success: true, output: 'Nothing to commit', outputHi: 'कुछ भी कमिट करने को नहीं' };
        }

        // Add all changes
        execSync('git add -A', { cwd: ctx.cwd });

        // Generate message if not provided
        const commitMsg = message || `Update: ${new Date().toLocaleString('hi-IN')}`;

        // Commit
        const output = execSync(`git commit -m "${commitMsg}"`, { cwd: ctx.cwd, encoding: 'utf-8' });
        return { success: true, output, outputHi: 'कमिट हो गया' };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  },

  push: {
    triggers: ['push', 'bhejo', 'भेजो', 'upload'],
    description: 'Push to remote',
    descriptionHi: 'रिमोट पर भेजो',
    params: {},
    execute: async (_, ctx) => {
      try {
        const output = execSync('git push', { cwd: ctx.cwd, encoding: 'utf-8' });
        return { success: true, output, outputHi: 'पुश हो गया' };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  },

  diff: {
    triggers: ['diff', 'farak', 'फर्क', 'changes', 'badlav', 'बदलाव'],
    description: 'Show git diff',
    descriptionHi: 'बदलाव दिखाओ',
    params: { file: 'string?' },
    execute: async ({ file }, ctx) => {
      try {
        const cmd = file ? `git diff "${file}"` : 'git diff';
        const output = execSync(cmd, { cwd: ctx.cwd, encoding: 'utf-8' });
        return {
          success: true,
          output: output || 'No changes',
          outputHi: output ? output : 'कोई बदलाव नहीं',
        };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  },

  // -------------------------------------------------------------------------
  // MEMORY OPERATIONS
  // -------------------------------------------------------------------------
  remember: {
    triggers: ['yaad', 'याद', 'remember', 'note', 'save'],
    description: 'Remember something for later',
    descriptionHi: 'याद रखो',
    params: { what: 'string' },
    execute: async ({ what }, ctx) => {
      try {
        await remember(String(what), { type: 'fact', metadata: { userId: ctx.userId } });
        return { success: true, output: 'Remembered!', outputHi: 'याद रख लिया!' };
      } catch {
        return { success: false, error: 'Could not remember (EON not available)' };
      }
    },
  },

  recall: {
    triggers: ['batao', 'बताओ', 'recall', 'kya', 'क्या'],
    description: 'Recall from memory',
    descriptionHi: 'याद करो',
    params: { query: 'string' },
    execute: async ({ query }, ctx) => {
      try {
        const results = await recall(String(query), 5);
        if (!results?.length) {
          return { success: true, output: 'Nothing found', outputHi: 'कुछ नहीं मिला' };
        }
        const formatted = results.map(r => `- ${r.memory.content}`).join('\n');
        return { success: true, output: formatted };
      } catch {
        return { success: false, error: 'Could not recall (EON not available)' };
      }
    },
  },

  // -------------------------------------------------------------------------
  // UTILITY OPERATIONS
  // -------------------------------------------------------------------------
  help: {
    triggers: ['help', 'madad', 'मदद', 'sahayata', 'सहायता'],
    description: 'Show available commands',
    descriptionHi: 'मदद दिखाओ',
    params: {},
    execute: async (_, ctx) => {
      const lines = Object.entries(TOOLS).map(([name, tool]) => {
        const desc = ctx.language === 'hi' && tool.descriptionHi ? tool.descriptionHi : tool.description;
        const triggers = tool.triggers.slice(0, 3).join(', ');
        return `• ${name}: ${desc} (${triggers})`;
      });
      return { success: true, output: lines.join('\n') };
    },
  },

  history: {
    triggers: ['history', 'itihas', 'इतिहास', 'pichla', 'पिछला'],
    description: 'Show command history',
    descriptionHi: 'पिछले कमांड दिखाओ',
    params: {},
    execute: async (_, ctx) => {
      if (!ctx.recentCommands.length) {
        return { success: true, output: 'No history', outputHi: 'कोई इतिहास नहीं' };
      }
      const lines = ctx.recentCommands.slice(0, 10).map((cmd, i) => {
        const ago = Math.round((Date.now() - cmd.time) / 1000);
        const agoStr = ago < 60 ? `${ago}s` : `${Math.round(ago / 60)}m`;
        const status = cmd.success ? '✓' : '✗';
        return `${i + 1}. ${status} ${cmd.input} (${agoStr} ago)`;
      });
      return { success: true, output: lines.join('\n') };
    },
  },

  undo: {
    triggers: ['undo', 'vapas', 'वापस', 'cancel'],
    description: 'Undo last action (limited)',
    descriptionHi: 'वापस करो',
    params: {},
    execute: async (_, ctx) => {
      // For now, just show what was last done
      const last = ctx.recentCommands[0];
      if (!last) {
        return { success: false, error: 'Nothing to undo' };
      }
      return {
        success: false,
        error: `Cannot auto-undo "${last.tool}". Manual action needed.`,
      };
    },
  },
};

// ============================================================================
// CONTEXT MANAGEMENT
// ============================================================================

const contexts = new Map<string, Context>();

function getContext(userId?: string): Context {
  const id = userId || 'default';
  if (!contexts.has(id)) {
    const cwd = process.cwd();
    let projectType: Context['projectType'] = 'unknown';

    // Detect project type
    if (existsSync(join(cwd, 'package.json'))) projectType = 'node';
    else if (existsSync(join(cwd, 'requirements.txt'))) projectType = 'python';
    else if (existsSync(join(cwd, 'go.mod'))) projectType = 'go';
    else if (existsSync(join(cwd, 'Cargo.toml'))) projectType = 'rust';

    contexts.set(id, {
      cwd,
      recentFiles: [],
      recentCommands: [],
      language: 'hi',
      userId: id,
      projectType,
    });
  }
  return contexts.get(id)!;
}

// ============================================================================
// UNDERSTANDING (AI + Fallback)
// ============================================================================

const PRONOUNS: Record<string, (ctx: Context) => string | undefined> = {
  // Hindi pronouns
  'isko': ctx => ctx.lastFile,
  'इसको': ctx => ctx.lastFile,
  'isme': ctx => ctx.lastFile,
  'इसमें': ctx => ctx.lastFile,
  'yahan': ctx => ctx.cwd,
  'यहाँ': ctx => ctx.cwd,
  'woh': ctx => ctx.recentFiles[1],
  'वो': ctx => ctx.recentFiles[1],
  'pichli': ctx => ctx.recentFiles[0],
  'पिछली': ctx => ctx.recentFiles[0],
  // English pronouns
  'this': ctx => ctx.lastFile,
  'it': ctx => ctx.lastFile,
  'here': ctx => ctx.cwd,
  'that': ctx => ctx.recentFiles[1],
  'last': ctx => ctx.recentFiles[0],
};

function resolvePronouns(input: string, ctx: Context): string {
  let resolved = input;
  for (const [pronoun, getter] of Object.entries(PRONOUNS)) {
    const regex = new RegExp(`\\b${pronoun}\\b`, 'gi');
    if (regex.test(resolved)) {
      const value = getter(ctx);
      if (value) {
        resolved = resolved.replace(regex, value);
      }
    }
  }
  return resolved;
}

async function understandWithAI(input: string, ctx: Context): Promise<Intent | null> {
  const toolDescriptions = Object.entries(TOOLS)
    .map(([name, t]) => `${name}: ${t.description}. Triggers: ${t.triggers.join(', ')}`)
    .join('\n');

  const systemPrompt = `You are a command parser for a voice-controlled coding assistant.
Parse the user's command (Hindi or English) and return a JSON object.

Available tools:
${toolDescriptions}

Context:
- Current directory: ${ctx.cwd}
- Last file: ${ctx.lastFile || 'none'}
- Recent files: ${ctx.recentFiles.slice(0, 3).join(', ') || 'none'}
- Project type: ${ctx.projectType}

Return ONLY valid JSON in this format:
{"tool": "toolname", "params": {"key": "value"}, "confidence": 0.0-1.0}

If you cannot understand, return: {"tool": null, "confidence": 0}`;

  try {
    const response = await fetch(process.env.AI_PROXY_URL || 'http://localhost:4444/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'groq/llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) throw new Error('AI request failed');

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No response');

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.tool) return null;

    return {
      tool: parsed.tool,
      params: parsed.params || {},
      confidence: parsed.confidence || 0.7,
    };
  } catch (err) {
    // AI failed, will fall back to keyword matching
    return null;
  }
}

function understandWithKeywords(input: string, ctx: Context): Intent | null {
  const words = input.toLowerCase().split(/\s+/);

  // Find matching tool
  for (const [name, tool] of Object.entries(TOOLS)) {
    for (const trigger of tool.triggers) {
      if (words.includes(trigger.toLowerCase())) {
        // Extract simple params
        const params: Record<string, string> = {};

        // Common patterns
        const pathMatch = input.match(/["']([^"']+)["']/) || input.match(/(\S+\.\w+)/);
        if (pathMatch) {
          if (tool.params.path) params.path = pathMatch[1];
          if (tool.params.file) params.file = pathMatch[1];
          if (tool.params.pattern) params.pattern = pathMatch[1];
        }

        // Content after ":" or "="
        const contentMatch = input.match(/[=:]\s*(.+)$/);
        if (contentMatch && tool.params.content) {
          params.content = contentMatch[1];
        }

        // Message after tool trigger
        const msgMatch = input.match(new RegExp(`${trigger}\\s+(.+)`, 'i'));
        if (msgMatch) {
          if (tool.params.message) params.message = msgMatch[1];
          if (tool.params.what) params.what = msgMatch[1];
          if (tool.params.query) params.query = msgMatch[1];
          if (tool.params.code) params.code = msgMatch[1];
        }

        return { tool: name, params, confidence: 0.6 };
      }
    }
  }

  return null;
}

async function understand(input: string, ctx: Context): Promise<Intent | null> {
  // First resolve pronouns
  const resolved = resolvePronouns(input, ctx);

  // Check for repeat command
  if (/\b(phir|फिर|again|repeat|dobara|दोबारा)\b/i.test(input)) {
    const last = ctx.recentCommands[0];
    if (last) {
      return { tool: last.tool, params: {}, confidence: 0.9, resolved: `Repeating: ${last.input}` };
    }
  }

  // Try AI first
  const aiIntent = await understandWithAI(resolved, ctx);
  if (aiIntent && aiIntent.confidence > 0.5) {
    return { ...aiIntent, resolved };
  }

  // Fall back to keywords
  const keywordIntent = understandWithKeywords(resolved, ctx);
  if (keywordIntent) {
    return { ...keywordIntent, resolved };
  }

  return null;
}

// ============================================================================
// EXECUTION
// ============================================================================

async function execute(intent: Intent, ctx: Context): Promise<Result> {
  const tool = TOOLS[intent.tool];
  if (!tool) {
    return { success: false, error: `Unknown tool: ${intent.tool}` };
  }

  try {
    const result = await tool.execute(intent.params, ctx);

    // Update history
    ctx.recentCommands.unshift({
      input: intent.resolved || intent.tool,
      tool: intent.tool,
      time: Date.now(),
      success: result.success,
    });
    if (ctx.recentCommands.length > 20) ctx.recentCommands.pop();

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================================================
// RESPONSE FORMATTING
// ============================================================================

function formatResponse(result: Result, language: Language): string {
  if (result.success) {
    if (language === 'hi' && result.outputHi) {
      return result.outputHi;
    }
    return result.output || 'Done';
  } else {
    // Translate common errors for Hindi
    let error = result.error || 'Unknown error';
    if (language === 'hi') {
      const translations: Record<string, string> = {
        'File not found': 'फाइल नहीं मिली',
        'Permission denied': 'अनुमति नहीं है',
        'Command failed': 'कमांड फेल हो गई',
        'Nothing to commit': 'कमिट करने को कुछ नहीं',
        'Tests failed': 'टेस्ट फेल हो गए',
        'Build failed': 'बिल्ड फेल हो गया',
        'Unknown error': 'अनजान एरर',
      };
      for (const [en, hi] of Object.entries(translations)) {
        error = error.replace(en, hi);
      }
    }
    return `Error: ${error}`;
  }
}

// ============================================================================
// MAIN AGENT
// ============================================================================

export async function agent(input: string, options?: { userId?: string; language?: Language }): Promise<{
  success: boolean;
  response: string;
  data?: Record<string, unknown>;
}> {
  const ctx = getContext(options?.userId);
  if (options?.language) ctx.language = options.language;

  // Understand
  const intent = await understand(input, ctx);

  if (!intent) {
    const helpMsg = ctx.language === 'hi'
      ? 'समझ नहीं आया। "मदद" बोलो commands देखने के लिए।'
      : 'Could not understand. Say "help" to see available commands.';
    return { success: false, response: helpMsg };
  }

  // Execute
  const result = await execute(intent, ctx);

  // Format response
  const response = formatResponse(result, ctx.language);

  return {
    success: result.success,
    response,
    data: result.data,
  };
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { TOOLS, getContext, understand, execute };

export default agent;
