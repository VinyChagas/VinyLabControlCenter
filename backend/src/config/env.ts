import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_ENV: z.enum(['development', 'vps', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SECRET_MASTER_KEY: z.string().min(32, 'SECRET_MASTER_KEY must be at least 32 characters'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(72),
  /** URL interna do Prometheus (ex.: http://prometheus:9090). Nunca expor ao frontend. */
  PROMETHEUS_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  METRICS_COLLECTION_INTERVAL_SECONDS: z.coerce.number().int().positive().default(60),
  PROMETHEUS_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  /** Hostname real do host quando node_uname_info reporta o hostname do container. */
  SYSTEM_HOSTNAME: z.preprocess(emptyToUndefined, z.string().min(1).max(255).optional()),
  /** IP principal do host (não disponível via Node Exporter nesta VPS). */
  SYSTEM_PRIMARY_IP: z.preprocess(emptyToUndefined, z.string().min(1).max(64).optional()),
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
