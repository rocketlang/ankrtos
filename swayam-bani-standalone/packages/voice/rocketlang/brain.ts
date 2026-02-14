/**
 * ANKR Brain
 * "Sochne Wala Dimag" - The Thinking Mind
 *
 * This is where the magic happens.
 * Routes tasks to the right model, manages context,
 * and lets LLMs write 100,000s of lines of code.
 *
 * The frugal approach: Use free/cheap models smartly.
 *
 * @author ANKR Labs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join, resolve, relative } from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const AI_PROXY = process.env.AI_PROXY_URL || 'http://localhost:4444';

// Model tiers - frugal by default, powerful when needed
const MODELS = {
  // FREE tier - use for most tasks
  fast: 'groq/llama-3.3-70b-versatile',     // Free, very fast

  // FREE tier - use for code generation
  smart: 'google/gemini-2.0-flash',          // Free tier available

  // PAID tier - use only for complex architecture
  best: 'anthropic/claude-sonnet-4-20250514', // When quality matters most
};

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface BrainContext {
  cwd: string;
  files: string[];           // Files in scope
  conversation: Message[];   // Full conversation
  projectInfo?: ProjectInfo;
}

interface ProjectInfo {
  type: 'node' | 'python' | 'go' | 'rust' | 'unknown';
  name?: string;
  dependencies?: string[];
  structure?: string;
}

// ============================================================================
// TOOLS FOR THE LLM
// ============================================================================

// These are the tools the LLM can use - same pattern as Claude Code
const LLM_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read contents of a file',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to read' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write content to a file. Creates if not exists, overwrites if exists.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to write' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Edit a file by replacing old content with new content',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to edit' },
          old_content: { type: 'string', description: 'Content to find and replace' },
          new_content: { type: 'string', description: 'New content to insert' },
        },
        required: ['path', 'old_content', 'new_content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Run a shell command',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to run' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files in a directory',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path' },
          pattern: { type: 'string', description: 'Optional glob pattern' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_files',
      description: 'Search for text in files',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Text or regex to search' },
          path: { type: 'string', description: 'Directory to search in' },
        },
        required: ['pattern'],
      },
    },
  },
];

// ============================================================================
// TOOL EXECUTION
// ============================================================================

function executeToolCall(name: string, args: Record<string, string>, ctx: BrainContext): string {
  const cwd = ctx.cwd;

  try {
    switch (name) {
      case 'read_file': {
        const filePath = resolve(cwd, args.path);
        if (!existsSync(filePath)) return `Error: File not found: ${args.path}`;
        return readFileSync(filePath, 'utf-8');
      }

      case 'write_file': {
        const filePath = resolve(cwd, args.path);
        writeFileSync(filePath, args.content);
        return `Successfully wrote ${args.content.split('\n').length} lines to ${args.path}`;
      }

      case 'edit_file': {
        const filePath = resolve(cwd, args.path);
        if (!existsSync(filePath)) return `Error: File not found: ${args.path}`;
        const content = readFileSync(filePath, 'utf-8');
        if (!content.includes(args.old_content)) {
          return `Error: Could not find the specified content to replace`;
        }
        const newContent = content.replace(args.old_content, args.new_content);
        writeFileSync(filePath, newContent);
        return `Successfully edited ${args.path}`;
      }

      case 'run_command': {
        try {
          const output = execSync(args.command, { cwd, encoding: 'utf-8', timeout: 60000 });
          return output || 'Command completed successfully';
        } catch (err: any) {
          return `Error: ${err.message}\n${err.stdout || ''}`;
        }
      }

      case 'list_files': {
        const dirPath = resolve(cwd, args.path || '.');
        if (!existsSync(dirPath)) return `Error: Directory not found: ${args.path}`;
        const items = readdirSync(dirPath);
        return items.map(item => {
          const stat = statSync(join(dirPath, item));
          return stat.isDirectory() ? `${item}/` : item;
        }).join('\n');
      }

      case 'search_files': {
        try {
          const searchPath = args.path || '.';
          const output = execSync(
            `grep -r "${args.pattern}" ${searchPath} --include="*.ts" --include="*.js" --include="*.py" -l 2>/dev/null | head -20`,
            { cwd, encoding: 'utf-8' }
          );
          return output || 'No matches found';
        } catch {
          return 'No matches found';
        }
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err: any) {
    return `Error: ${err.message}`;
  }
}

// ============================================================================
// TASK COMPLEXITY DETECTION
// ============================================================================

interface TaskAnalysis {
  complexity: 'simple' | 'medium' | 'complex';
  model: string;
  estimatedTokens: number;
  reasoning: string;
}

function analyzeTask(task: string): TaskAnalysis {
  const lower = task.toLowerCase();

  // Complex tasks - need best model
  const complexPatterns = [
    /architect/i, /design.*system/i, /refactor.*entire/i,
    /build.*complete/i, /create.*full/i, /implement.*from.*scratch/i,
    /microservice/i, /database.*schema/i, /security.*audit/i,
    /पूरा.*बनाओ/i, /सिस्टम.*डिजाइन/i,
  ];

  // Medium tasks - smart model
  const mediumPatterns = [
    /add.*feature/i, /create.*component/i, /write.*function/i,
    /fix.*bug/i, /implement/i, /update/i,
    /बनाओ/i, /लिखो/i, /ठीक.*करो/i,
  ];

  for (const pattern of complexPatterns) {
    if (pattern.test(task)) {
      return {
        complexity: 'complex',
        model: MODELS.best,
        estimatedTokens: 8000,
        reasoning: 'Complex architectural task - using best model',
      };
    }
  }

  for (const pattern of mediumPatterns) {
    if (pattern.test(task)) {
      return {
        complexity: 'medium',
        model: MODELS.smart,
        estimatedTokens: 4000,
        reasoning: 'Code generation task - using smart model (free)',
      };
    }
  }

  return {
    complexity: 'simple',
    model: MODELS.fast,
    estimatedTokens: 1000,
    reasoning: 'Simple task - using fast model (free)',
  };
}

// ============================================================================
// PROJECT UNDERSTANDING
// ============================================================================

function getProjectInfo(cwd: string): ProjectInfo {
  const info: ProjectInfo = { type: 'unknown' };

  // Detect project type
  if (existsSync(join(cwd, 'package.json'))) {
    info.type = 'node';
    try {
      const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8'));
      info.name = pkg.name;
      info.dependencies = Object.keys(pkg.dependencies || {}).slice(0, 10);
    } catch {}
  } else if (existsSync(join(cwd, 'requirements.txt'))) {
    info.type = 'python';
  } else if (existsSync(join(cwd, 'go.mod'))) {
    info.type = 'go';
  } else if (existsSync(join(cwd, 'Cargo.toml'))) {
    info.type = 'rust';
  }

  // Get structure (simplified)
  try {
    const output = execSync('find . -type f -name "*.ts" -o -name "*.js" -o -name "*.py" | head -30', {
      cwd,
      encoding: 'utf-8',
    });
    info.structure = output;
  } catch {}

  return info;
}

// ============================================================================
// THE BRAIN - MAIN FUNCTION
// ============================================================================

export interface ThinkResult {
  success: boolean;
  response: string;
  filesModified: string[];
  model: string;
  tokensUsed: number;
}

export async function think(
  task: string,
  options?: {
    cwd?: string;
    maxIterations?: number;
    forceModel?: string;
  }
): Promise<ThinkResult> {
  const cwd = options?.cwd || process.cwd();
  const maxIterations = options?.maxIterations || 10;

  // Analyze task complexity
  const analysis = analyzeTask(task);
  const model = options?.forceModel || analysis.model;

  console.log(`🧠 Brain: ${analysis.reasoning}`);
  console.log(`📊 Using model: ${model}`);

  // Build context
  const projectInfo = getProjectInfo(cwd);
  const ctx: BrainContext = {
    cwd,
    files: [],
    conversation: [],
    projectInfo,
  };

  // System prompt - this is key to quality
  const systemPrompt = `You are ANKR Code, an expert coding assistant for Indian developers.
You write production-quality code. You understand Hindi and English.

Current project: ${projectInfo.name || 'Unknown'}
Type: ${projectInfo.type}
Directory: ${cwd}
${projectInfo.dependencies ? `Dependencies: ${projectInfo.dependencies.join(', ')}` : ''}

You have these tools available:
- read_file: Read file contents
- write_file: Create or overwrite files
- edit_file: Make precise edits to files
- run_command: Execute shell commands
- list_files: List directory contents
- search_files: Search for text in files

IMPORTANT RULES:
1. Always read existing files before editing
2. Write complete, working code - no placeholders or TODOs
3. Follow the project's existing patterns and style
4. Test your changes with run_command when possible
5. Create necessary directories before writing files
6. Handle errors gracefully

When the task is complete, provide a clear summary of what you did.`;

  ctx.conversation.push({ role: 'system', content: systemPrompt });
  ctx.conversation.push({ role: 'user', content: task });

  const filesModified: string[] = [];
  let totalTokens = 0;

  // Agentic loop - let the LLM work
  for (let i = 0; i < maxIterations; i++) {
    console.log(`🔄 Iteration ${i + 1}/${maxIterations}`);

    // Call the AI
    const response = await fetch(`${AI_PROXY}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: ctx.conversation,
        tools: LLM_TOOLS,
        tool_choice: 'auto',
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI request failed: ${error}`);
    }

    const data = await response.json();
    const message = data.choices[0].message;
    totalTokens += data.usage?.total_tokens || 0;

    // Add assistant message to conversation
    ctx.conversation.push(message);

    // Check if we have tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Execute each tool call
      for (const toolCall of message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`  🔧 ${toolCall.function.name}(${JSON.stringify(args).slice(0, 50)}...)`);

        const result = executeToolCall(toolCall.function.name, args, ctx);

        // Track modified files
        if (toolCall.function.name === 'write_file' || toolCall.function.name === 'edit_file') {
          filesModified.push(args.path);
        }

        // Add tool result to conversation
        ctx.conversation.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result.slice(0, 10000), // Truncate large outputs
        });
      }
    } else {
      // No tool calls - LLM is done
      console.log(`✅ Task complete`);
      return {
        success: true,
        response: message.content,
        filesModified: [...new Set(filesModified)],
        model,
        tokensUsed: totalTokens,
      };
    }
  }

  return {
    success: false,
    response: 'Max iterations reached. Task may be incomplete.',
    filesModified: [...new Set(filesModified)],
    model,
    tokensUsed: totalTokens,
  };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick code generation - uses smart model
 */
export async function generateCode(prompt: string, cwd?: string): Promise<ThinkResult> {
  return think(prompt, { cwd, forceModel: MODELS.smart });
}

/**
 * Complex architecture - uses best model
 */
export async function architect(prompt: string, cwd?: string): Promise<ThinkResult> {
  return think(prompt, { cwd, forceModel: MODELS.best, maxIterations: 15 });
}

/**
 * Quick fix - uses fast model
 */
export async function quickFix(prompt: string, cwd?: string): Promise<ThinkResult> {
  return think(prompt, { cwd, forceModel: MODELS.fast, maxIterations: 5 });
}

// ============================================================================
// COST TRACKING (for awareness)
// ============================================================================

const COST_PER_1K_TOKENS: Record<string, number> = {
  'groq/llama-3.3-70b-versatile': 0,      // FREE
  'google/gemini-2.0-flash': 0,            // FREE tier
  'anthropic/claude-sonnet-4-20250514': 0.003, // $3 per 1M tokens
};

export function estimateCost(model: string, tokens: number): number {
  const costPer1k = COST_PER_1K_TOKENS[model] || 0.001;
  return (tokens / 1000) * costPer1k;
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  think,
  generateCode,
  architect,
  quickFix,
  analyzeTask,
  MODELS,
};
