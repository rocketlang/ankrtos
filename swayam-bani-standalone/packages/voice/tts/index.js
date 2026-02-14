"use strict";
/**
 * TTS (Text-to-Speech) Provider Factory
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTSFactory = exports.SARVAM_VOICES = void 0;
// Mock TTS for testing
class MockTTSProvider {
    name = 'mock';
    async synthesize(text, language = 'hi') {
        await new Promise(r => setTimeout(r, 50));
        return { audio: Buffer.alloc(16000), duration: 1.0 };
    }
}
// Sarvam TTS Provider (11 Indian Languages)
class SarvamTTSProvider {
    name = 'sarvam';
    apiKey;
    serverUrl;
    defaultVoice;
    constructor(options) {
        this.apiKey = options.apiKey || process.env.SARVAM_API_KEY || '';
        this.serverUrl = options.serverUrl || 'https://api.sarvam.ai';
        this.defaultVoice = options.defaultVoice || 'anushka';
    }
    async synthesize(text, language = 'hi', voice) {
        if (!this.apiKey) {
            return { audio: Buffer.alloc(0), duration: 0 };
        }
        try {
            // Language code mapping for Sarvam
            const langCodes = {
                hi: 'hi-IN',
                en: 'en-IN',
                ta: 'ta-IN',
                te: 'te-IN',
                bn: 'bn-IN',
                mr: 'mr-IN',
                gu: 'gu-IN',
                kn: 'kn-IN',
                ml: 'ml-IN',
                pa: 'pa-IN',
                od: 'od-IN',
            };
            const response = await fetch(`${this.serverUrl}/text-to-speech`, {
                method: 'POST',
                headers: {
                    'api-subscription-key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: [text],
                    target_language_code: langCodes[language] || 'hi-IN',
                    speaker: voice || this.defaultVoice,
                    model: 'bulbul:v1',
                    enable_preprocessing: true,
                }),
            });
            if (!response.ok) {
                console.error('Sarvam TTS error:', response.status);
                return { audio: Buffer.alloc(0), duration: 0 };
            }
            const result = await response.json();
            if (result.audios?.[0]) {
                const audio = Buffer.from(result.audios[0], 'base64');
                return { audio, duration: audio.length / 32000 }; // Rough estimate
            }
            return { audio: Buffer.alloc(0), duration: 0 };
        }
        catch (error) {
            console.error('TTS error:', error);
            return { audio: Buffer.alloc(0), duration: 0 };
        }
    }
}
// Piper TTS Provider (Local, Fast, Free)
class PiperTTSProvider {
    name = 'piper';
    serverUrl;
    constructor(options) {
        this.serverUrl = options.serverUrl || 'http://localhost:5000';
    }
    async synthesize(text, language = 'hi') {
        try {
            const response = await fetch(`${this.serverUrl}/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, language }),
            });
            if (!response.ok) {
                return { audio: Buffer.alloc(0), duration: 0 };
            }
            const arrayBuffer = await response.arrayBuffer();
            const audio = Buffer.from(arrayBuffer);
            return { audio, duration: audio.length / 22050 };
        }
        catch (error) {
            console.error('Piper TTS error:', error);
            return { audio: Buffer.alloc(0), duration: 0 };
        }
    }
}
// Sarvam Voice Options
exports.SARVAM_VOICES = [
    'anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun',
    'hitesh', 'aditya', 'ritu', 'chirag', 'priya', 'neha',
    'rahul', 'pooja', 'rohan', 'simran', 'kavya', 'sunita'
];
// Factory
exports.TTSFactory = {
    create(provider = 'mock', options = {}) {
        switch (provider) {
            case 'sarvam':
                return new SarvamTTSProvider(options);
            case 'piper':
                return new PiperTTSProvider(options);
            default:
                return new MockTTSProvider();
        }
    }
};
exports.default = exports.TTSFactory;
//# sourceMappingURL=index.js.map