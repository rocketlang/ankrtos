/**
 * Smart Suggestions for RocketLang
 *
 * Provides helpful suggestions when:
 * - File not found (similar files)
 * - Command fails (possible fixes)
 * - Ambiguous input (clarifications)
 *
 * @author ANKR Labs
 */
export interface Suggestion {
    type: 'file' | 'command' | 'fix';
    value: string;
    confidence: number;
    description?: string;
}
export interface SuggestionResult {
    hasSuggestions: boolean;
    suggestions: Suggestion[];
    message: string;
    messageHindi: string;
}
declare function similarity(a: string, b: string): number;
/**
 * Find similar files when requested file not found
 */
export declare function findSimilarFiles(requestedPath: string, maxSuggestions?: number): Suggestion[];
/**
 * Find files with similar extension
 */
export declare function findFilesWithExtension(ext: string, dir?: string): string[];
/**
 * Generate suggestions based on error type
 */
export declare function suggestForError(error: string, context: {
    tool?: string;
    params?: Record<string, unknown>;
}): SuggestionResult;
/**
 * Format suggestions for voice output
 */
export declare function formatSuggestionsForVoice(result: SuggestionResult, language?: 'hi' | 'en'): string;
declare const _default: {
    findSimilarFiles: typeof findSimilarFiles;
    findFilesWithExtension: typeof findFilesWithExtension;
    suggestForError: typeof suggestForError;
    formatSuggestionsForVoice: typeof formatSuggestionsForVoice;
    similarity: typeof similarity;
};
export default _default;
//# sourceMappingURL=suggestions.d.ts.map