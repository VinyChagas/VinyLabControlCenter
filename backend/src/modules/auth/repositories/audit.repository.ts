import type { PoolClient } from 'pg';
import { query } from '../../../db/pool.js';

export type AuditAction =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'setup_login_success'
  | 'setup_login_failed'
  | 'owner_created'
  | 'setup_completed';

type Queryable = Pick<PoolClient, 'query'>;

export class AuditRepository {
  async record(input: {
    actorId?: string | null;
    action: AuditAction;
    resourceType?: string | null;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const metadata = sanitizeAuditMetadata(input.metadata ?? {});
    await query(
      `INSERT INTO audit_events (actor_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        input.actorId ?? null,
        input.action,
        input.resourceType ?? null,
        input.resourceId ?? null,
        JSON.stringify(metadata),
      ],
    );
  }

  async recordWithClient(
    client: Queryable,
    input: {
      actorId?: string | null;
      action: AuditAction;
      resourceType?: string | null;
      resourceId?: string | null;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    const metadata = sanitizeAuditMetadata(input.metadata ?? {});
    await client.query(
      `INSERT INTO audit_events (actor_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        input.actorId ?? null,
        input.action,
        input.resourceType ?? null,
        input.resourceId ?? null,
        JSON.stringify(metadata),
      ],
    );
  }
}

const FORBIDDEN_METADATA_KEYS = [
  'password',
  'password_hash',
  'token',
  'token_hash',
  'tokenHash',
  'session',
  'cookie',
  'authorization',
  'vl_session',
  'DATABASE_URL',
  'database_url',
  'secret',
  'apiKey',
  'api_key',
  'SECRET_MASTER_KEY',
  '1234',
];

function sanitizeAuditMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_METADATA_KEYS.some((forbidden) => key.toLowerCase().includes(forbidden.toLowerCase()))) {
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
      clean[key] = value;
    }
  }
  return clean;
}
