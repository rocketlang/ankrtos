"use strict";
/**
 * Wake Word Detection for SWAYAM
 *
 * Supports multiple wake words:
 * - "Hey Swayam" (हे स्वयं)
 * - "OK Swayam"
 * - "Swayam" (direct)
 *
 * Uses phonetic matching for Hindi/English variations
 *
 * @author ANKR Labs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERSONA_WAKE_WORDS = exports.WakeWordDetector = void 0;
exports.createWakeWordDetector = createWakeWordDetector;
// ============================================================================
// WAKE WORD PATTERNS
// ============================================================================
const WAKE_WORD_PATTERNS = {
    // English variations
    'hey swayam': ['hey swayam', 'hey swayum', 'hey swaym', 'hay swayam', 'he swayam'],
    'ok swayam': ['ok swayam', 'okay swayam', 'o k swayam'],
    'swayam': ['swayam', 'swayum', 'swaym', 'svayam'],
    // Hindi variations (transliterated)
    'हे स्वयं': ['he swayam', 'hey swayam', 'hei swayam'],
    'ओके स्वयं': ['ok swayam', 'oke swayam'],
    'स्वयं': ['swayam', 'swayum'],
    // Persona-specific wake words
    'hey wowtruck': ['hey wowtruck', 'hey wow truck', 'he wowtruck'],
    'hey complymitra': ['hey complymitra', 'hey comply mitra', 'he complymitra'],
    'hey freightbox': ['hey freightbox', 'hey freight box', 'he freightbox'],
};
// Phonetic similarity mappings for fuzzy matching
const PHONETIC_MAP = {
    'swayam': ['swayam', 'swayum', 'swaym', 'svayam', 'suayam', 'swayum', 'स्वयं'],
    'hey': ['hey', 'hay', 'he', 'hei', 'हे', 'हाय'],
    'ok': ['ok', 'okay', 'oke', 'ओके', 'ओ के'],
    'wowtruck': ['wowtruck', 'wow truck', 'vow truck', 'वाव ट्रक'],
    'complymitra': ['complymitra', 'comply mitra', 'कंप्लाई मित्र'],
    'freightbox': ['freightbox', 'freight box', 'फ्रेट बॉक्स'],
};
// ============================================================================
// WAKE WORD DETECTOR CLASS
// ============================================================================
class WakeWordDetector {
    keywords;
    sensitivity;
    language;
    onDetected;
    isListening = false;
    lastDetection = 0;
    cooldownMs = 2000; // Prevent rapid re-triggers
    constructor(config) {
        this.keywords = config.keywords.map(k => k.toLowerCase());
        this.sensitivity = config.sensitivity;
        this.language = config.language;
        this.onDetected = config.onDetected;
        console.log(`🎤 WakeWordDetector initialized`);
        console.log(`   Keywords: ${this.keywords.join(', ')}`);
        console.log(`   Sensitivity: ${this.sensitivity}`);
    }
    /**
     * Check if text contains a wake word
     * Used for text-based wake word detection (from STT output)
     */
    detectInText(text) {
        const normalizedText = this.normalizeText(text);
        const now = Date.now();
        // Check cooldown
        if (now - this.lastDetection < this.cooldownMs) {
            return { detected: false, keyword: '', confidence: 0, timestamp: now };
        }
        for (const keyword of this.keywords) {
            const result = this.matchKeyword(normalizedText, keyword);
            if (result.confidence >= this.sensitivity) {
                this.lastDetection = now;
                if (this.onDetected) {
                    this.onDetected(keyword, result.confidence);
                }
                return {
                    detected: true,
                    keyword,
                    confidence: result.confidence,
                    timestamp: now,
                    audioOffset: result.position,
                };
            }
        }
        return { detected: false, keyword: '', confidence: 0, timestamp: now };
    }
    /**
     * Extract command after wake word
     */
    extractCommand(text) {
        const normalizedText = this.normalizeText(text);
        for (const keyword of this.keywords) {
            const patterns = this.getPatterns(keyword);
            for (const pattern of patterns) {
                const idx = normalizedText.indexOf(pattern);
                if (idx !== -1) {
                    const command = text.substring(idx + pattern.length).trim();
                    return { wakeWord: keyword, command };
                }
            }
        }
        return null;
    }
    /**
     * Check if audio buffer contains wake word
     * Uses VAD (Voice Activity Detection) + STT
     */
    async detectInAudio(audioBuffer, sttProvider) {
        try {
            // Transcribe audio
            const result = await sttProvider.transcribe(audioBuffer, this.language);
            return this.detectInText(result.text);
        }
        catch (error) {
            console.error('Wake word audio detection error:', error);
            return { detected: false, keyword: '', confidence: 0, timestamp: Date.now() };
        }
    }
    /**
     * Start continuous listening mode
     */
    startListening() {
        this.isListening = true;
        console.log('🎤 Wake word listening started');
    }
    /**
     * Stop continuous listening
     */
    stopListening() {
        this.isListening = false;
        console.log('🎤 Wake word listening stopped');
    }
    /**
     * Check if currently listening
     */
    get listening() {
        return this.isListening;
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[.,!?;:'"]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    getPatterns(keyword) {
        // Get all phonetic variations for the keyword
        const parts = keyword.split(' ');
        let patterns = [keyword];
        for (const part of parts) {
            const variations = PHONETIC_MAP[part] || [part];
            const newPatterns = [];
            for (const pattern of patterns) {
                for (const variation of variations) {
                    newPatterns.push(pattern.replace(part, variation));
                }
            }
            patterns = newPatterns;
        }
        // Also add patterns from WAKE_WORD_PATTERNS
        const staticPatterns = WAKE_WORD_PATTERNS[keyword];
        if (staticPatterns) {
            patterns = [...patterns, ...staticPatterns];
        }
        return [...new Set(patterns)];
    }
    matchKeyword(text, keyword) {
        const patterns = this.getPatterns(keyword);
        for (const pattern of patterns) {
            const idx = text.indexOf(pattern);
            if (idx !== -1) {
                // Exact match
                return { confidence: 1.0, position: idx };
            }
        }
        // Fuzzy matching using Levenshtein distance
        const words = text.split(' ');
        const keywordParts = keyword.split(' ');
        for (let i = 0; i <= words.length - keywordParts.length; i++) {
            const slice = words.slice(i, i + keywordParts.length).join(' ');
            const distance = this.levenshteinDistance(slice, keyword);
            const maxLen = Math.max(slice.length, keyword.length);
            const similarity = 1 - distance / maxLen;
            if (similarity >= this.sensitivity) {
                return { confidence: similarity, position: i };
            }
        }
        return { confidence: 0, position: -1 };
    }
    levenshteinDistance(a, b) {
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
}
exports.WakeWordDetector = WakeWordDetector;
// ============================================================================
// FACTORY
// ============================================================================
function createWakeWordDetector(keywords = ['hey swayam', 'swayam'], options = {}) {
    return new WakeWordDetector({
        keywords,
        sensitivity: options.sensitivity ?? 0.7,
        language: options.language ?? 'hi',
        onDetected: options.onDetected,
    });
}
// Default wake words for each persona
exports.PERSONA_WAKE_WORDS = {
    swayam: ['hey swayam', 'ok swayam', 'swayam', 'हे स्वयं'],
    wowtruck: ['hey wowtruck', 'hey swayam', 'swayam'],
    complymitra: ['hey complymitra', 'hey swayam', 'swayam'],
    freightbox: ['hey freightbox', 'hey swayam', 'swayam'],
};
exports.default = WakeWordDetector;
//# sourceMappingURL=index.js.map