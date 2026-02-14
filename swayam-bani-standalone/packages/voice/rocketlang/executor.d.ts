/**
 * RocketLang Executor for Swayam
 *
 * "Bolo Ho Jaayega" - Just say it, it happens!
 *
 * Integrates RocketLang parsing with real tool execution.
 * Supports Hindi, Tamil, Telugu + English commands.
 *
 * Features:
 * - Pronoun resolution (isko, yahan, woh file)
 * - Similar file suggestions on error
 * - "phir se" to repeat last command
 * - Extended tools: explain, test, build, diff, undo
 *
 * @author ANKR Labs
 */
export interface ExecutionResult {
    success: boolean;
    isCommand: boolean;
    command?: string;
    resolvedCommand?: string;
    tool?: string;
    output?: string;
    error?: string;
    data?: unknown;
    executionTime: number;
    suggestions?: Array<{
        type: string;
        value: string;
        confidence: number;
    }>;
    wasRepeat?: boolean;
}
export interface ResponseFormat {
    text: string;
    speakText: string;
    data?: unknown;
}
type SupportedLanguage = 'hi' | 'en' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'od';
/**
 * Register real tool implementations
 */
export declare function registerSwayamTools(): void;
export declare class RocketLangExecutor {
    private workingDirectory;
    private initialized;
    private contextManager;
    constructor(workingDirectory?: string);
    /**
     * Initialize executor and register tools
     */
    initialize(): void;
    /**
     * Try to execute text as a RocketLang command
     * Returns null if not a recognizable command
     *
     * Enhanced features:
     * - Pronoun resolution (isko → last file)
     * - "phir se" repeat last command
     * - Suggestions on error
     */
    tryExecute(text: string, language?: SupportedLanguage, userId?: string): Promise<ExecutionResult | null>;
    /**
     * Format execution result for response
     */
    formatResult(result: ExecutionResult, language: SupportedLanguage): ResponseFormat;
    /**
     * Format result based on tool type
     */
    private formatToolResult;
    /**
     * Check if text looks like a command (quick heuristic)
     */
    looksLikeCommand(text: string): boolean;
    /**
     * Get command history
     */
    getHistory(userId?: string, limit?: number): Array<{
        text: string;
        tool: string;
        timestamp: number;
    }>;
    /**
     * Get recent files
     */
    getRecentFiles(userId?: string): string[];
}
export declare function getRocketLangExecutor(workingDirectory?: string): RocketLangExecutor;
declare const _default: {
    RocketLangExecutor: typeof RocketLangExecutor;
    getRocketLangExecutor: typeof getRocketLangExecutor;
    registerSwayamTools: typeof registerSwayamTools;
};
export default _default;
//# sourceMappingURL=executor.d.ts.map