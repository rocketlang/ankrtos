"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSimilarFiles = findSimilarFiles;
exports.findFilesWithExtension = findFilesWithExtension;
exports.suggestForError = suggestForError;
exports.formatSuggestionsForVoice = formatSuggestionsForVoice;
const fs_1 = require("fs");
const path_1 = require("path");
// ============================================================================
// STRING SIMILARITY (Levenshtein Distance)
// ============================================================================
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
}
function similarity(a, b) {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0)
        return 1;
    return 1 - levenshteinDistance(a.toLowerCase(), b.toLowerCase()) / maxLen;
}
// ============================================================================
// FILE SUGGESTIONS
// ============================================================================
/**
 * Find similar files when requested file not found
 */
function findSimilarFiles(requestedPath, maxSuggestions = 5) {
    const suggestions = [];
    const requestedName = (0, path_1.basename)(requestedPath).toLowerCase();
    const requestedExt = (0, path_1.extname)(requestedPath).toLowerCase();
    const requestedDir = (0, path_1.dirname)(requestedPath);
    // Directories to search
    const searchDirs = [
        requestedDir,
        process.cwd(),
        (0, path_1.join)(process.cwd(), 'src'),
        (0, path_1.join)(process.cwd(), 'packages'),
    ].filter(d => (0, fs_1.existsSync)(d));
    const seenFiles = new Set();
    for (const dir of searchDirs) {
        try {
            const files = (0, fs_1.readdirSync)(dir);
            for (const file of files) {
                const fullPath = (0, path_1.join)(dir, file);
                // Skip directories and already seen files
                if (seenFiles.has(fullPath))
                    continue;
                try {
                    if ((0, fs_1.statSync)(fullPath).isDirectory())
                        continue;
                }
                catch {
                    continue;
                }
                seenFiles.add(fullPath);
                const fileName = file.toLowerCase();
                const fileExt = (0, path_1.extname)(file).toLowerCase();
                // Calculate similarity score
                let score = similarity(requestedName, fileName);
                // Boost if extension matches
                if (requestedExt && fileExt === requestedExt) {
                    score += 0.2;
                }
                // Boost if starts with same characters
                if (fileName.startsWith(requestedName.slice(0, 3))) {
                    score += 0.1;
                }
                // Only include if reasonably similar
                if (score > 0.3) {
                    suggestions.push({
                        type: 'file',
                        value: fullPath,
                        confidence: Math.min(score, 1),
                        description: `in ${(0, path_1.dirname)(fullPath)}`,
                    });
                }
            }
        }
        catch {
            // Directory not readable
        }
    }
    // Sort by confidence and limit
    return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxSuggestions);
}
/**
 * Find files with similar extension
 */
function findFilesWithExtension(ext, dir = process.cwd()) {
    const files = [];
    try {
        const entries = (0, fs_1.readdirSync)(dir);
        for (const entry of entries) {
            const fullPath = (0, path_1.join)(dir, entry);
            try {
                const stat = (0, fs_1.statSync)(fullPath);
                if (stat.isFile() && (0, path_1.extname)(entry).toLowerCase() === ext.toLowerCase()) {
                    files.push(fullPath);
                }
                else if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
                    // Recursively search (limited depth)
                    files.push(...findFilesWithExtension(ext, fullPath).slice(0, 5));
                }
            }
            catch {
                // Skip inaccessible files
            }
        }
    }
    catch {
        // Directory not readable
    }
    return files.slice(0, 10);
}
// ============================================================================
// ERROR SUGGESTIONS
// ============================================================================
/**
 * Generate suggestions based on error type
 */
function suggestForError(error, context) {
    const suggestions = [];
    let message = '';
    let messageHindi = '';
    // File not found
    if (error.includes('not found') || error.includes('ENOENT') || error.includes('नहीं मिली')) {
        const pathMatch = error.match(/['"]?([^'"]+\.\w+)['"]?/);
        if (pathMatch) {
            const similarFiles = findSimilarFiles(pathMatch[1]);
            suggestions.push(...similarFiles);
            if (similarFiles.length > 0) {
                message = `File not found. Did you mean one of these?`;
                messageHindi = `फ़ाइल नहीं मिली। शायद इनमें से कोई?`;
            }
            else {
                message = `File not found. No similar files found.`;
                messageHindi = `फ़ाइल नहीं मिली। कोई मिलती-जुलती फ़ाइल भी नहीं मिली।`;
            }
        }
    }
    // Permission denied
    if (error.includes('permission denied') || error.includes('EACCES')) {
        message = `Permission denied. Try running with elevated privileges.`;
        messageHindi = `Permission नहीं है। Admin rights से try करें।`;
        suggestions.push({
            type: 'fix',
            value: 'sudo',
            confidence: 0.8,
            description: 'Run with sudo',
        });
    }
    // Command not found
    if (error.includes('command not found') || error.includes('not recognized')) {
        const cmdMatch = error.match(/['"]?(\w+)['"]?\s*(?:not found|not recognized)/i);
        if (cmdMatch) {
            message = `Command "${cmdMatch[1]}" not found. Is it installed?`;
            messageHindi = `"${cmdMatch[1]}" command नहीं मिला। क्या install है?`;
            suggestions.push({
                type: 'command',
                value: `pnpm add ${cmdMatch[1]}`,
                confidence: 0.5,
                description: 'Install via pnpm',
            });
        }
    }
    // Git errors
    if (error.includes('not a git repository')) {
        message = `This is not a git repository.`;
        messageHindi = `यह git repository नहीं है।`;
        suggestions.push({
            type: 'command',
            value: 'git init',
            confidence: 0.9,
            description: 'Initialize git repository',
        });
    }
    // No changes to commit
    if (error.includes('nothing to commit')) {
        message = `No changes to commit.`;
        messageHindi = `Commit करने के लिए कोई changes नहीं हैं।`;
    }
    return {
        hasSuggestions: suggestions.length > 0,
        suggestions,
        message: message || error,
        messageHindi: messageHindi || error,
    };
}
// ============================================================================
// FORMAT SUGGESTIONS FOR VOICE
// ============================================================================
/**
 * Format suggestions for voice output
 */
function formatSuggestionsForVoice(result, language = 'hi') {
    if (!result.hasSuggestions) {
        return language === 'hi' ? result.messageHindi : result.message;
    }
    const intro = language === 'hi' ? result.messageHindi : result.message;
    const suggestionList = result.suggestions
        .slice(0, 3)
        .map((s, i) => {
        const name = (0, path_1.basename)(s.value);
        return language === 'hi'
            ? `${i + 1}. ${name}`
            : `${i + 1}. ${name}`;
    })
        .join(', ');
    return `${intro}\n${suggestionList}`;
}
// ============================================================================
// EXPORT
// ============================================================================
exports.default = {
    findSimilarFiles,
    findFilesWithExtension,
    suggestForError,
    formatSuggestionsForVoice,
    similarity,
};
//# sourceMappingURL=suggestions.js.map