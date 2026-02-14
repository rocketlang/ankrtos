import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4002'),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  AI_PROXY_URL: z.string().default('http://localhost:4444'),
  JWT_SECRET: z.string().default('default_jwt_secret'),
});

export type Env = z.infer<typeof envSchema>;

export const config = {
  get env(): Env {
    return envSchema.parse(process.env);
  },
  
  get port(): number {
    return parseInt(process.env.PORT || '4002');
  },
  
  get host(): string {
    return process.env.HOST || '0.0.0.0';
  },
  
  get aiProxyUrl(): string {
    return process.env.AI_PROXY_URL || 'http://localhost:4444';
  },
  
  get isDev(): boolean {
    return process.env.NODE_ENV === 'development';
  },

  voice: {
    defaultLanguage: 'hi' as const,
    defaultVoice: 'anushka',
  },
};

export default config;
