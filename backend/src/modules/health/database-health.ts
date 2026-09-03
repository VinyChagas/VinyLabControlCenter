import { Client } from 'pg';
import { env } from '../../config/env.js';
import { hasDatabase, query } from '../../db/pool.js';

export type DatabaseHealthStatus = 'connected' | 'disconnected' | 'not_configured';

export interface DatabaseHealthResult {
  status: DatabaseHealthStatus;
  latencyMs?: number;
}

export async function checkDatabaseHealth(
  databaseUrl = env.DATABASE_URL,
): Promise<DatabaseHealthResult> {
  if (!databaseUrl) {
    return { status: 'not_configured' };
  }

  const started = Date.now();

  try {
    if (hasDatabase()) {
      await query('SELECT 1');
      return { status: 'connected', latencyMs: Date.now() - started };
    }
  } catch {
    // fall through to one-off client for clearer diagnostics when pool fails early
  }

  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 3000,
    query_timeout: 3000,
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
    return { status: 'connected', latencyMs: Date.now() - started };
  } catch {
    return { status: 'disconnected', latencyMs: Date.now() - started };
  } finally {
    await client.end().catch(() => undefined);
  }
}
