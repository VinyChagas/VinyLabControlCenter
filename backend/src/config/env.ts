import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_ENV: z.enum(['development', 'vps', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(1).optional(),
  ),
  SECRET_MASTER_KEY: z.string().min(32, 'SECRET_MASTER_KEY must be at least 32 characters'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(72),
  BOOTSTRAP_OWNER_EMAIL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().email().optional(),
  ),
  BOOTSTRAP_OWNER_PASSWORD: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(12).optional(),
  ),
  BOOTSTRAP_OWNER_NAME: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(1).max(200).optional(),
  ),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error('❌ Invalid environment variables:', formatted);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();

export function cookieSecure(): boolean {
  return env.FRONTEND_URL.startsWith('https://') || env.APP_ENV === 'vps' || env.APP_ENV === 'production';
}

export function requiresDatabase(): boolean {
  return env.APP_ENV === 'vps' || env.APP_ENV === 'production';
}
