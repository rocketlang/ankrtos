/**
 * Extended Tools for RocketLang
 *
 * New tools: explain, test, build, diff, undo, history
 *
 * @author ANKR Labs
 */

import {
  registerTool,
  type Tool,
} from '@ankr/ankrcode-core';
import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from 'fs';
import { resolve, basename, dirname, join } from 'path';
import { execSync } from 'child_process';
import { getContextManager } from './context.js';

// ============================================================================
// UNDO STACK
// ============================================================================

interface UndoAction {
  type: 'write' | 'delete' | 'create';
  path: string;
  previousContent?: string;
  timestamp: number;
  description: string;
}

const undoStack: UndoAction[] = [];
const MAX_UNDO_STACK = 20;

export function pushUndoAction(action: UndoAction): void {
  undoStack.unshift(action);
  if (undoStack.length > MAX_UNDO_STACK) {
    undoStack.pop();
  }
}

export function popUndoAction(): UndoAction | undefined {
  return undoStack.shift();
}

// ============================================================================
// EXTENDED TOOLS
// ============================================================================

export function registerExtendedTools(): void {
  // =========================================================================
  // EXPLAIN TOOL - समझाओ
  // =========================================================================
  const explainTool: Tool = {
    name: 'explain',
    description: 'Explain code or file contents (समझाओ/samjhao)',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to explain' },
        code: { type: 'string', description: 'Code snippet to explain' },
        language: { type: 'string', description: 'Response language (hi/en)', default: 'hi' },
      },
    },
    handler: async (params) => {
      let codeToExplain = '';

      if (params.path) {
        const filePath = resolve(String(params.path));
        if (!existsSync(filePath)) {
          return { success: false, error: `File not found: ${params.path}` };
        }
        codeToExplain = readFileSync(filePath, 'utf-8').substring(0, 2000);
      } else if (params.code) {
        codeToExplain = String(params.code);
      } else {
        // Try to get from context
        const ctx = getContextManager().getContext();
        if (ctx.lastFile && existsSync(ctx.lastFile)) {
          codeToExplain = readFileSync(ctx.lastFile, 'utf-8').substring(0, 2000);
        } else {
          return { success: false, error: 'No code or file specified' };
        }
      }

      // For now, return a structured analysis
      // In production, this would call AI for explanation
      const lines = codeToExplain.split('\n').length;
      const hasFunction = /function|const\s+\w+\s*=|def\s+\w+|fn\s+\w+/.test(codeToExplain);
      const hasClass = /class\s+\w+/.test(codeToExplain);
      const hasImport = /import\s+|require\(|from\s+/.test(codeToExplain);

      const lang = params.language || 'hi';
      const analysis = lang === 'hi'
        ? `इस कोड में ${lines} लाइनें हैं।${hasFunction ? ' Functions हैं।' : ''}${hasClass ? ' Classes हैं।' : ''}${hasImport ? ' Imports हैं।' : ''}`
        : `This code has ${lines} lines.${hasFunction ? ' Contains functions.' : ''}${hasClass ? ' Contains classes.' : ''}${hasImport ? ' Has imports.' : ''}`;

      return {
        success: true,
        output: analysis,
        data: { lines, hasFunction, hasClass, hasImport },
      };
    },
  };
  registerTool(explainTool);

  // =========================================================================
  // TEST TOOL - टेस्ट करो
  // =========================================================================
  const testTool: Tool = {
    name: 'test',
    description: 'Run tests (टेस्ट करो/test karo)',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Test file pattern' },
        watch: { type: 'boolean', description: 'Watch mode', default: false },
      },
    },
    handler: async (params) => {
      try {
        // Detect test framework
        let testCmd = 'npm test';

        if (existsSync('package.json')) {
          const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
          const scripts = pkg.scripts || {};

          if (scripts.test) {
            testCmd = 'pnpm test';
          } else if (pkg.devDependencies?.vitest || pkg.dependencies?.vitest) {
            testCmd = 'pnpm vitest run';
          } else if (pkg.devDependencies?.jest || pkg.dependencies?.jest) {
            testCmd = 'pnpm jest';
          }
        }

        if (params.pattern) {
          testCmd += ` ${params.pattern}`;
        }

        const output = execSync(testCmd, {
          encoding: 'utf-8',
          timeout: 120000,
          maxBuffer: 1024 * 1024,
        });

        const passed = output.includes('passed') || output.includes('✓') || !output.includes('failed');

        return {
          success: true,
          output: output.substring(0, 3000),
          data: { passed, command: testCmd },
        };
      } catch (error: any) {
        const output = error.stdout || error.message;
        return {
          success: false,
          output: output.substring(0, 3000),
          error: 'Tests failed',
          data: { passed: false },
        };
      }
    },
  };
  registerTool(testTool);

  // =========================================================================
  // BUILD TOOL - बिल्ड करो
  // =========================================================================
  const buildTool: Tool = {
    name: 'build',
    description: 'Build the project (बिल्ड करो/build karo)',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Build target (dev/prod)', default: 'prod' },
      },
    },
    handler: async (params) => {
      try {
        let buildCmd = 'pnpm build';

        if (existsSync('package.json')) {
          const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
          const scripts = pkg.scripts || {};

          if (params.target === 'dev' && scripts['build:dev']) {
            buildCmd = 'pnpm build:dev';
          } else if (scripts.build) {
            buildCmd = 'pnpm build';
          } else if (existsSync('tsconfig.json')) {
            buildCmd = 'pnpm tsc';
          }
        }

        const startTime = Date.now();
        const output = execSync(buildCmd, {
          encoding: 'utf-8',
          timeout: 300000,
          maxBuffer: 1024 * 1024 * 5,
        });
        const duration = Date.now() - startTime;

        return {
          success: true,
          output: `Build completed in ${(duration / 1000).toFixed(1)}s\n${output.substring(0, 2000)}`,
          data: { duration, command: buildCmd },
        };
      } catch (error: any) {
        return {
          success: false,
          output: (error.stdout || '').substring(0, 2000),
          error: error.message || 'Build failed',
        };
      }
    },
  };
  registerTool(buildTool);

  // =========================================================================
  // DIFF TOOL - फर्क देखो
  // =========================================================================
  const diffTool: Tool = {
    name: 'diff',
    description: 'Show file differences (फर्क देखो/diff dekho)',
    parameters: {
      type: 'object',
      properties: {
        file1: { type: 'string', description: 'First file' },
        file2: { type: 'string', description: 'Second file (optional, uses git if not provided)' },
      },
    },
    handler: async (params) => {
      try {
        let diffOutput: string;

        if (params.file1 && params.file2) {
          // Compare two files
          diffOutput = execSync(`diff -u "${params.file1}" "${params.file2}" || true`, {
            encoding: 'utf-8',
            timeout: 10000,
          });
        } else if (params.file1) {
          // Git diff for single file
          diffOutput = execSync(`git diff "${params.file1}" || git diff HEAD -- "${params.file1}"`, {
            encoding: 'utf-8',
            timeout: 10000,
          });
        } else {
          // Git diff all
          diffOutput = execSync('git diff', {
            encoding: 'utf-8',
            timeout: 10000,
          });
        }

        if (!diffOutput.trim()) {
          return {
            success: true,
            output: 'No differences found / कोई फर्क नहीं',
            data: { hasChanges: false },
          };
        }

        // Count changes
        const additions = (diffOutput.match(/^\+[^+]/gm) || []).length;
        const deletions = (diffOutput.match(/^-[^-]/gm) || []).length;

        return {
          success: true,
          output: diffOutput.substring(0, 3000),
          data: { hasChanges: true, additions, deletions },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Diff failed',
        };
      }
    },
  };
  registerTool(diffTool);

  // =========================================================================
  // UNDO TOOL - वापस करो
  // =========================================================================
  const undoTool: Tool = {
    name: 'undo',
    description: 'Undo last file operation (वापस करो/undo karo)',
    parameters: {
      type: 'object',
      properties: {
        steps: { type: 'number', description: 'Number of steps to undo', default: 1 },
      },
    },
    handler: async (params) => {
      const steps = Number(params.steps) || 1;
      const undone: string[] = [];

      for (let i = 0; i < steps; i++) {
        const action = popUndoAction();
        if (!action) break;

        try {
          switch (action.type) {
            case 'write':
              // Restore previous content
              if (action.previousContent !== undefined) {
                writeFileSync(action.path, action.previousContent);
                undone.push(`Restored ${basename(action.path)}`);
              }
              break;

            case 'create':
              // Delete created file
              if (existsSync(action.path)) {
                unlinkSync(action.path);
                undone.push(`Deleted ${basename(action.path)}`);
              }
              break;

            case 'delete':
              // Restore deleted file
              if (action.previousContent !== undefined) {
                writeFileSync(action.path, action.previousContent);
                undone.push(`Restored ${basename(action.path)}`);
              }
              break;
          }
        } catch (error) {
          undone.push(`Failed to undo: ${action.description}`);
        }
      }

      if (undone.length === 0) {
        return {
          success: false,
          error: 'Nothing to undo / वापस करने को कुछ नहीं',
        };
      }

      return {
        success: true,
        output: undone.join('\n'),
        data: { undoneCount: undone.length },
      };
    },
  };
  registerTool(undoTool);

  // =========================================================================
  // HISTORY TOOL - इतिहास
  // =========================================================================
  const historyTool: Tool = {
    name: 'history',
    description: 'Show command history (इतिहास/history)',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of commands to show', default: 10 },
      },
    },
    handler: async (params) => {
      const ctx = getContextManager();
      const history = ctx.getCommandHistory(undefined, Number(params.limit) || 10);

      if (history.length === 0) {
        return {
          success: true,
          output: 'No command history / कोई इतिहास नहीं',
          data: { commands: [] },
        };
      }

      const formatted = history
        .map((cmd, i) => {
          const ago = Math.round((Date.now() - cmd.timestamp) / 1000);
          const agoStr = ago < 60 ? `${ago}s ago` : `${Math.round(ago / 60)}m ago`;
          return `${i + 1}. ${cmd.text} (${agoStr})`;
        })
        .join('\n');

      return {
        success: true,
        output: formatted,
        data: { commands: history },
      };
    },
  };
  registerTool(historyTool);

  // =========================================================================
  // REPEAT TOOL - फिर से (alias for context-aware repeat)
  // =========================================================================
  const repeatTool: Tool = {
    name: 'repeat',
    description: 'Repeat last command (फिर से/phir se/dobara)',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const ctx = getContextManager();
      const lastCmd = ctx.getLastCommand();

      if (!lastCmd) {
        return {
          success: false,
          error: 'No previous command to repeat / पिछला कोई command नहीं',
        };
      }

      return {
        success: true,
        output: `Repeating: ${lastCmd.text}`,
        data: { command: lastCmd.text, tool: lastCmd.tool, shouldExecute: true },
      };
    },
  };
  registerTool(repeatTool);

  console.log('🔧 Extended RocketLang tools registered: explain, test, build, diff, undo, history, repeat');
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  registerExtendedTools,
  pushUndoAction,
  popUndoAction,
};
