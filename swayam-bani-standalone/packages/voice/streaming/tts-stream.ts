/**
 * Streaming TTS for SWAYAM
 *
 * Enables real-time audio streaming with:
 * - Sentence-by-sentence streaming
 * - Chunk-based audio delivery
 * - Low-latency first audio response
 * - Buffer management for smooth playback
 *
 * @author ANKR Labs
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface StreamingTTSConfig {
  serverUrl: string;
  apiKey?: string;
  defaultVoice: string;
  chunkSize: number; // Characters per chunk
  maxConcurrent: number; // Max parallel TTS requests
}

export interface AudioChunk {
  index: number;
  audio: Buffer;
  text: string;
  duration: number;
  isLast: boolean;
  timestamp: number;
}

export interface StreamingTTSEvents {
  chunk: (chunk: AudioChunk) => void;
  start: (totalChunks: number) => void;
  end: (totalDuration: number) => void;
  error: (error: Error) => void;
}

// ============================================================================
// TEXT CHUNKING
// ============================================================================

/**
 * Split text into speakable chunks at natural boundaries
 */
function splitIntoChunks(text: string, maxChunkSize: number = 150): string[] {
  const chunks: string[] = [];

  // First, split by sentence boundaries
  const sentences = text.split(/(?<=[।.!?])\s+/);

  let currentChunk = '';

  for (const sentence of sentences) {
    // If sentence itself is too long, split by clauses
    if (sentence.length > maxChunkSize) {
      // Save current chunk if any
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // Split long sentence by clauses (comma, semicolon, dash)
      const clauses = sentence.split(/(?<=[,;—])\s*/);
      for (const clause of clauses) {
        if (clause.length > maxChunkSize) {
          // Last resort: split by words
          const words = clause.split(/\s+/);
          let wordChunk = '';
          for (const word of words) {
            if ((wordChunk + ' ' + word).length > maxChunkSize) {
              if (wordChunk.trim()) chunks.push(wordChunk.trim());
              wordChunk = word;
            } else {
              wordChunk += (wordChunk ? ' ' : '') + word;
            }
          }
          if (wordChunk.trim()) chunks.push(wordChunk.trim());
        } else if ((currentChunk + ' ' + clause).length > maxChunkSize) {
          if (currentChunk.trim()) chunks.push(currentChunk.trim());
          currentChunk = clause;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + clause;
        }
      }
    } else if ((currentChunk + ' ' + sentence).length > maxChunkSize) {
      // Sentence doesn't fit in current chunk
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      // Add sentence to current chunk
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// ============================================================================
// STREAMING TTS PROVIDER
// ============================================================================

export class StreamingTTS extends EventEmitter {
  private config: StreamingTTSConfig;
  private activeStreams: Map<string, AbortController> = new Map();

  constructor(config: Partial<StreamingTTSConfig> = {}) {
    super();
    this.config = {
      serverUrl: config.serverUrl || process.env.BANI_URL || 'http://localhost:7777',
      apiKey: config.apiKey,
      defaultVoice: config.defaultVoice || 'anushka',
      chunkSize: config.chunkSize || 150,
      maxConcurrent: config.maxConcurrent || 3,
    };

    console.log(`🔊 StreamingTTS initialized`);
    console.log(`   Server: ${this.config.serverUrl}`);
    console.log(`   Voice: ${this.config.defaultVoice}`);
    console.log(`   Chunk size: ${this.config.chunkSize} chars`);
  }

  /**
   * Stream TTS for text, emitting audio chunks as they're ready
   */
  async streamText(
    text: string,
    language: string,
    voice?: string,
    streamId?: string
  ): Promise<void> {
    const id = streamId || `stream_${Date.now()}`;
    const abortController = new AbortController();
    this.activeStreams.set(id, abortController);

    const selectedVoice = voice || this.config.defaultVoice;
    const chunks = splitIntoChunks(text, this.config.chunkSize);

    console.log(`🔊 Streaming ${chunks.length} chunks for: "${text.substring(0, 50)}..."`);

    this.emit('start', chunks.length);

    let totalDuration = 0;
    const startTime = Date.now();

    try {
      // Process chunks with concurrency control
      const results: AudioChunk[] = new Array(chunks.length);
      let nextToEmit = 0;

      // Use a semaphore-like approach for concurrency
      const inFlight = new Set<number>();
      let currentIndex = 0;

      const processChunk = async (index: number): Promise<void> => {
        if (abortController.signal.aborted) return;

        inFlight.add(index);

        try {
          const chunkText = chunks[index];
          const audio = await this.synthesizeChunk(chunkText, language, selectedVoice);

          const chunk: AudioChunk = {
            index,
            audio,
            text: chunkText,
            duration: this.estimateDuration(chunkText),
            isLast: index === chunks.length - 1,
            timestamp: Date.now(),
          };

          results[index] = chunk;
          totalDuration += chunk.duration;

          // Emit chunks in order
          while (results[nextToEmit]) {
            this.emit('chunk', results[nextToEmit]);
            nextToEmit++;
          }
        } finally {
          inFlight.delete(index);
        }
      };

      // Start initial batch
      const promises: Promise<void>[] = [];
      while (currentIndex < chunks.length && inFlight.size < this.config.maxConcurrent) {
        promises.push(processChunk(currentIndex));
        currentIndex++;
      }

      // Continue processing
      while (currentIndex < chunks.length || inFlight.size > 0) {
        if (abortController.signal.aborted) break;

        // Wait for any to complete
        await Promise.race(promises.filter(Boolean));

        // Start more if available
        while (currentIndex < chunks.length && inFlight.size < this.config.maxConcurrent) {
          promises.push(processChunk(currentIndex));
          currentIndex++;
        }

        // Small delay to prevent tight loop
        await new Promise((r) => setTimeout(r, 10));
      }

      // Wait for all to complete
      await Promise.all(promises);

      this.emit('end', totalDuration);
      console.log(
        `🔊 Streaming complete: ${chunks.length} chunks, ${totalDuration.toFixed(1)}s, ${Date.now() - startTime}ms total`
      );
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    } finally {
      this.activeStreams.delete(id);
    }
  }

  /**
   * Stream with callback for each chunk (simpler API)
   */
  async streamWithCallback(
    text: string,
    language: string,
    onChunk: (chunk: AudioChunk) => void,
    voice?: string
  ): Promise<{ totalDuration: number; totalChunks: number }> {
    return new Promise((resolve, reject) => {
      let totalChunks = 0;
      let totalDuration = 0;

      this.on('chunk', (chunk: AudioChunk) => {
        onChunk(chunk);
        totalChunks++;
        totalDuration += chunk.duration;
      });

      this.on('end', () => {
        resolve({ totalDuration, totalChunks });
      });

      this.on('error', reject);

      this.streamText(text, language, voice).catch(reject);
    });
  }

  /**
   * Cancel an active stream
   */
  cancelStream(streamId: string): boolean {
    const controller = this.activeStreams.get(streamId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(streamId);
      return true;
    }
    return false;
  }

  /**
   * Cancel all active streams
   */
  cancelAll(): void {
    for (const [id, controller] of this.activeStreams) {
      controller.abort();
    }
    this.activeStreams.clear();
  }

  /**
   * Synthesize a single chunk
   */
  private async synthesizeChunk(text: string, language: string, voice: string): Promise<Buffer> {
    try {
      const response = await fetch(`${this.config.serverUrl}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
          voice,
          provider: 'sarvam',
          streaming: false, // Individual chunks aren't streamed
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS error: ${response.status}`);
      }

      const data = (await response.json()) as { audio?: string; audioBase64?: string };
      const audioBase64 = data.audio || data.audioBase64 || '';

      return Buffer.from(audioBase64, 'base64');
    } catch (error) {
      console.error('TTS chunk synthesis error:', error);
      // Return silence for failed chunks (don't break the stream)
      return Buffer.alloc(0);
    }
  }

  /**
   * Estimate duration based on text length and language
   * Average speaking rate: ~150 words/min for Hindi, ~180 for English
   */
  private estimateDuration(text: string): number {
    const wordCount = text.split(/\s+/).length;
    const avgWordsPerSecond = 2.5; // ~150 words/min
    return wordCount / avgWordsPerSecond;
  }
}

// ============================================================================
// WEBSOCKET STREAMING HELPER
// ============================================================================

export interface WebSocketStreamOptions {
  ws: { send: (data: string) => void };
  sessionId: string;
  language: string;
  voice?: string;
}

/**
 * Stream TTS directly to a WebSocket connection
 */
export async function streamTTSToWebSocket(
  text: string,
  options: WebSocketStreamOptions,
  ttsConfig?: Partial<StreamingTTSConfig>
): Promise<{ totalDuration: number; totalChunks: number }> {
  const streamer = new StreamingTTS(ttsConfig);

  return streamer.streamWithCallback(
    text,
    options.language,
    (chunk: AudioChunk) => {
      options.ws.send(
        JSON.stringify({
          type: 'audio_chunk',
          sessionId: options.sessionId,
          index: chunk.index,
          audio: chunk.audio.toString('base64'),
          text: chunk.text,
          duration: chunk.duration,
          isLast: chunk.isLast,
          timestamp: chunk.timestamp,
        })
      );
    },
    options.voice
  );
}

// ============================================================================
// FACTORY
// ============================================================================

export function createStreamingTTS(config?: Partial<StreamingTTSConfig>): StreamingTTS {
  return new StreamingTTS(config);
}

export default StreamingTTS;
