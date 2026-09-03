import { Client } from 'pg';
import type { SecretProvider } from './repositories/secret.repository.js';

export interface ConnectionTestResult {
  success: boolean;
  provider: SecretProvider;
  message: string;
  latencyMs?: number;
  database?: string;
  user?: string;
  version?: string;
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/postgresql:\/\/[^\s]+/gi, 'postgresql://***')
    .replace(/postgres:\/\/[^\s]+/gi, 'postgres://***')
    .replace(/password=\S+/gi, 'password=***')
    .replace(/user=\S+/gi, 'user=***')
    .slice(0, 200);
}

function validatePostgresConnectionString(connectionString: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error('Connection string inválida');
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error('Connection string deve usar o protocolo postgresql://');
  }

  if (!parsed.hostname) {
    throw new Error('Connection string sem hostname');
  }

  return parsed;
}

function shortenPostgresVersion(raw: string): string {
  const match = raw.match(/PostgreSQL\s+([\d.]+)/i);
  if (match?.[1]) {
    return `PostgreSQL ${match[1]}`;
  }
  return raw.split(',')[0]?.trim().slice(0, 80) ?? 'PostgreSQL';
}

export async function testDatabaseConnection(connectionString: string): Promise<ConnectionTestResult> {
  const started = Date.now();

  try {
    validatePostgresConnectionString(connectionString);
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Connection string inválida';
    return {
      success: false,
      provider: 'database',
      message: sanitizeErrorMessage(raw),
      latencyMs: Date.now() - started,
    };
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
  });

  try {
    await client.connect();
    const result = await client.query<{
      database: string;
      user: string;
      version: string;
    }>('SELECT current_database() AS database, current_user AS "user", version() AS version');

    const row = result.rows[0];
    const database = row?.database ?? 'unknown';
    const user = row?.user ?? 'unknown';
    const version = shortenPostgresVersion(row?.version ?? 'PostgreSQL');

    return {
      success: true,
      provider: 'database',
      message: 'Conexão com PostgreSQL bem-sucedida',
      latencyMs: Date.now() - started,
      database,
      user,
      version,
    };
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Falha desconhecida';
    return {
      success: false,
      provider: 'database',
      message: sanitizeErrorMessage(raw),
      latencyMs: Date.now() - started,
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function testProviderConnection(
  provider: SecretProvider,
  secret: string,
): Promise<ConnectionTestResult> {
  if (provider === 'database') {
    return testDatabaseConnection(secret);
  }

  // Providers de API: validação estrutural nesta fase (integração real depois)
  if (provider === 'openrouter' && secret.startsWith('sk-or-')) {
    return { success: true, provider, message: 'Formato da chave OpenRouter válido' };
  }

  if (provider === 'elevenlabs' && secret.length >= 20) {
    return { success: true, provider, message: 'Formato da chave ElevenLabs válido' };
  }

  if (provider === 'telegram' && secret.includes(':')) {
    return { success: true, provider, message: 'Formato do token Telegram válido' };
  }

  return {
    success: false,
    provider,
    message: `Formato inválido para provider '${provider}'`,
  };
}
