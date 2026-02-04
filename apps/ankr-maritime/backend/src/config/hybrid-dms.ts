/**
 * Hybrid DMS Configuration
 *
 * Supports both dev (Ollama - free) and prod (Voyage AI + Groq - cheap) modes
 */

export interface HybridDMSConfig {
  mode: 'dev' | 'prod';

  storage: {
    provider: 'minio' | 's3' | 'local';
    endpoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    bucket: string;
    region: string;
  };

  embeddings: {
    provider: 'ollama' | 'voyage';
    endpoint?: string;
    model: string;
    dimensions: number;
    apiKey?: string;
  };

  llm: {
    provider: 'ollama' | 'groq' | 'openai';
    endpoint?: string;
    model: string;
    apiKey?: string;
    temperature: number;
  };

  ocr: {
    enabled: boolean;
    provider: 'tesseract' | 'google' | 'aws';
    languages: string[];
  };

  search: {
    provider: 'postgres';
    enableVector: boolean;
    enableHybrid: boolean;
  };

  cache: {
    enabled: boolean;
    url: string;
    ttl: number;
  };

  backup: {
    enabled: boolean;
    schedule: string;
    path: string;
    retentionDays: number;
  };
}

export const hybridDMSConfig: HybridDMSConfig = {
  mode: (process.env.DMS_MODE as 'dev' | 'prod') || 'dev',

  storage: {
    provider: 'minio',
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'mari8x',
    secretKey: process.env.MINIO_SECRET_KEY || 'mari8x_secure_2026',
    bucket: process.env.MINIO_BUCKET || 'maritime-docs',
    region: process.env.MINIO_REGION || 'us-east-1',
  },

  embeddings: {
    provider: (process.env.EMBEDDINGS_PROVIDER as 'ollama' | 'voyage') || 'ollama',
    endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
    model: process.env.EMBEDDINGS_PROVIDER === 'voyage'
      ? 'voyage-code-2'
      : (process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text'),
    dimensions: 1536,
    apiKey: process.env.VOYAGE_API_KEY,
  },

  llm: {
    provider: (process.env.LLM_PROVIDER as 'ollama' | 'groq' | 'openai') || 'ollama',
    endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
    model: getLLMModel(),
    apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
    temperature: 0.2,
  },

  ocr: {
    enabled: process.env.OCR_ENABLED === 'true',
    provider: (process.env.OCR_PROVIDER as 'tesseract') || 'tesseract',
    languages: (process.env.OCR_LANGUAGES || 'eng').split(','),
  },

  search: {
    provider: 'postgres',
    enableVector: process.env.ENABLE_VECTOR_SEARCH === 'true',
    enableHybrid: process.env.ENABLE_HYBRID_SEARCH === 'true',
  },

  cache: {
    enabled: !!process.env.REDIS_URL,
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL || '300'),
  },

  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
    path: process.env.BACKUP_PATH || '/mnt/backup/maritime-docs',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  },
};

function getLLMModel(): string {
  const provider = process.env.LLM_PROVIDER || 'ollama';

  if (provider === 'ollama') {
    return process.env.OLLAMA_LLM_MODEL || 'qwen2.5:14b';
  } else if (provider === 'groq') {
    return process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
  } else {
    return 'gpt-4o-mini';
  }
}

export const isDevMode = () => hybridDMSConfig.mode === 'dev';
export const isProdMode = () => hybridDMSConfig.mode === 'prod';
export const useOllama = () => hybridDMSConfig.embeddings.provider === 'ollama';
export const useVoyage = () => hybridDMSConfig.embeddings.provider === 'voyage';
