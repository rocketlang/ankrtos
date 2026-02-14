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
export interface CommandContext {
    lastFile?: string;
    lastDirectory?: string;
    lastCommand?: string;
    lastTool?: string;
    lastOutput?: string;
    lastError?: string;
    workingDirectory: string;
    recentFiles: string[];
    recentCommands: Array<{
        text: string;
        tool: string;
        timestamp: number;
    }>;
    userId?: string;
}
export interface ResolvedText {
    original: string;
    resolved: string;
    substitutions: Array<{
        from: string;
        to: string;
    }>;
}
export declare class ContextManager {
    private contexts;
    private defaultUserId;
    /**
     * Get or create context for user
     */
    getContext(userId?: string): CommandContext;
    /**
     * Update context after command execution
     */
    updateContext(userId: string | undefined, update: {
        file?: string;
        directory?: string;
        command?: string;
        tool?: string;
        output?: string;
        error?: string;
    }): void;
    /**
     * Resolve pronouns in text using context
     */
    resolvePronouns(text: string, userId?: string): ResolvedText;
    /**
     * Check if this is a "repeat last command" request
     */
    isRepeatCommand(text: string): boolean;
    /**
     * Get last command for repeat
     */
    getLastCommand(userId?: string): {
        text: string;
        tool: string;
    } | null;
    /**
     * Get recent files for suggestions
     */
    getRecentFiles(userId?: string): string[];
    /**
     * Get command history
     */
    getCommandHistory(userId?: string, limit?: number): Array<{
        text: string;
        tool: string;
        timestamp: number;
    }>;
    /**
     * Clear context for user
     */
    clearContext(userId?: string): void;
}
export declare function getContextManager(): ContextManager;
declare const _default: {
    ContextManager: typeof ContextManager;
    getContextManager: typeof getContextManager;
};
export default _default;
//# sourceMappingURL=context.d.ts.map