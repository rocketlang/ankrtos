/**
 * Context Manager for RocketLang
 *
 * Handles:
 * - Pronoun resolution (isko, yahan, woh file)
 * - Command history
 * - Working directory tracking
 * - "phir se" (repeat last command)
 *
 * @author ANKR Labs
 */

import { basename, dirname, resolve } from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface CommandContext {
  lastFile?: string;
  lastDirectory?: string;
  lastCommand?: string;
  lastTool?: string;
  lastOutput?: string;
  lastError?: string;
  workingDirectory: string;
  recentFiles: string[];
  recentCommands: Array<{ text: string; tool: string; timestamp: number }>;
  userId?: string;
}

export interface ResolvedText {
  original: string;
  resolved: string;
  substitutions: Array<{ from: string; to: string }>;
}

// ============================================================================
// PRONOUN PATTERNS
// ============================================================================

// Hindi pronouns and their meanings
const PRONOUN_PATTERNS: Array<{
  pattern: RegExp;
  type: 'file' | 'directory' | 'output' | 'command';
  description: string;
}> = [
  // File references
  { pattern: /\b(isko|इसको|इसे|ise)\b/gi, type: 'file', description: 'this (file)' },
  { pattern: /\b(isme|इसमें|इसमे)\b/gi, type: 'file', description: 'in this (file)' },
  { pattern: /\b(ye file|यह फाइल|yeh file)\b/gi, type: 'file', description: 'this file' },
  { pattern: /\b(woh file|वो फाइल|wo file)\b/gi, type: 'file', description: 'that file' },
  { pattern: /\b(same file|wahi file|वही फाइल)\b/gi, type: 'file', description: 'same file' },
  { pattern: /\b(last file|पिछली फाइल|pichli file)\b/gi, type: 'file', description: 'last file' },

  // Directory references
  { pattern: /\b(yahan|यहां|यहाँ|idhar)\b/gi, type: 'directory', description: 'here' },
  { pattern: /\b(is folder|इस फोल्डर|is directory)\b/gi, type: 'directory', description: 'this folder' },
  { pattern: /\b(current folder|current directory)\b/gi, type: 'directory', description: 'current folder' },

  // Output references
  { pattern: /\b(ye result|यह रिजल्ट|yeh output)\b/gi, type: 'output', description: 'this result' },
  { pattern: /\b(iska|इसका)\b/gi, type: 'output', description: 'its/of this' },

  // Repeat last command
  { pattern: /\b(phir se|फिर से|dobara|दोबारा|repeat|again)\b/gi, type: 'command', description: 'again' },
  { pattern: /\b(wahi karo|वही करो|same karo)\b/gi, type: 'command', description: 'do same' },
];

// ============================================================================
// CONTEXT MANAGER CLASS
// ============================================================================

export class ContextManager {
  private contexts: Map<string, CommandContext> = new Map();
  private defaultUserId = 'default';

  /**
   * Get or create context for user
   */
  getContext(userId?: string): CommandContext {
    const id = userId || this.defaultUserId;

    if (!this.contexts.has(id)) {
      this.contexts.set(id, {
        workingDirectory: process.cwd(),
        recentFiles: [],
        recentCommands: [],
      });
    }

    return this.contexts.get(id)!;
  }

  /**
   * Update context after command execution
   */
  updateContext(
    userId: string | undefined,
    update: {
      file?: string;
      directory?: string;
      command?: string;
      tool?: string;
      output?: string;
      error?: string;
    }
  ): void {
    const ctx = this.getContext(userId);

    if (update.file) {
      ctx.lastFile = update.file;
      ctx.recentFiles = [update.file, ...ctx.recentFiles.filter(f => f !== update.file)].slice(0, 10);
    }

    if (update.directory) {
      ctx.lastDirectory = update.directory;
    }

    if (update.command && update.tool) {
      ctx.lastCommand = update.command;
      ctx.lastTool = update.tool;
      ctx.recentCommands = [
        { text: update.command, tool: update.tool, timestamp: Date.now() },
        ...ctx.recentCommands,
      ].slice(0, 20);
    }

    if (update.output) {
      ctx.lastOutput = update.output;
    }

    if (update.error) {
      ctx.lastError = update.error;
    }
  }

  /**
   * Resolve pronouns in text using context
   */
  resolvePronouns(text: string, userId?: string): ResolvedText {
    const ctx = this.getContext(userId);
    let resolved = text;
    const substitutions: Array<{ from: string; to: string }> = [];

    for (const { pattern, type } of PRONOUN_PATTERNS) {
      const matches = resolved.match(pattern);
      if (!matches) continue;

      for (const match of matches) {
        let replacement: string | null = null;

        switch (type) {
          case 'file':
            if (ctx.lastFile) {
              replacement = ctx.lastFile;
            }
            break;

          case 'directory':
            replacement = ctx.lastDirectory || ctx.workingDirectory;
            break;

          case 'output':
            // Keep as is - will be handled differently
            break;

          case 'command':
            // This is "phir se" - will be handled by isRepeatCommand
            break;
        }

        if (replacement) {
          resolved = resolved.replace(match, replacement);
          substitutions.push({ from: match, to: replacement });
        }
      }
    }

    return { original: text, resolved, substitutions };
  }

  /**
   * Check if this is a "repeat last command" request
   */
  isRepeatCommand(text: string): boolean {
    const repeatPatterns = [
      /^(phir se|फिर से|dobara|दोबारा|repeat|again|wahi karo|वही करो)$/i,
      /^(phir se|फिर से)\s*(karo|करो)?$/i,
      /^(same|wahi|वही)\s*(command|karo|करो)?$/i,
    ];

    return repeatPatterns.some(p => p.test(text.trim()));
  }

  /**
   * Get last command for repeat
   */
  getLastCommand(userId?: string): { text: string; tool: string } | null {
    const ctx = this.getContext(userId);

    if (ctx.lastCommand && ctx.lastTool) {
      return { text: ctx.lastCommand, tool: ctx.lastTool };
    }

    if (ctx.recentCommands.length > 0) {
      const last = ctx.recentCommands[0];
      return { text: last.text, tool: last.tool };
    }

    return null;
  }

  /**
   * Get recent files for suggestions
   */
  getRecentFiles(userId?: string): string[] {
    return this.getContext(userId).recentFiles;
  }

  /**
   * Get command history
   */
  getCommandHistory(userId?: string, limit: number = 10): Array<{ text: string; tool: string; timestamp: number }> {
    return this.getContext(userId).recentCommands.slice(0, limit);
  }

  /**
   * Clear context for user
   */
  clearContext(userId?: string): void {
    const id = userId || this.defaultUserId;
    this.contexts.delete(id);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let contextManager: ContextManager | null = null;

export function getContextManager(): ContextManager {
  if (!contextManager) {
    contextManager = new ContextManager();
  }
  return contextManager;
}

export default {
  ContextManager,
  getContextManager,
};
