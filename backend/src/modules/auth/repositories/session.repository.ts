import type { QueryResultRow, PoolClient } from 'pg';
import { isIP } from 'node:net';
import { query } from '../../../db/pool.js';
import type { SessionRecord, SessionScope } from '../auth.types.js';

interface SessionRow extends QueryResultRow {
  id: string;
  user_id: string | null;
  scope: SessionScope;
  token_hash: string;
  created_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  ip: string | null;
  user_agent: string | null;
}

type Queryable = Pick<PoolClient, 'query'>;

function mapSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    scope: row.scope,
    tokenHash: row.token_hash,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    ip: row.ip,
    userAgent: row.user_agent,
  };
}

function sanitizeIp(ip: string | null): string | null {
  if (!ip) return null;
  const candidate = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  return isIP(candidate) ? candidate : null;
}

export class SessionRepository {
  async create(input: {
    userId: string | null;
    scope: SessionScope;
    tokenHash: string;
    expiresAt: Date;
    ip: string | null;
    userAgent: string | null;
  }): Promise<SessionRecord> {
    const result = await query<SessionRow>(
      `INSERT INTO sessions (user_id, scope, token_hash, expires_at, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5::inet, $6)
       RETURNING *`,
      [
        input.userId,
        input.scope,
        input.tokenHash,
        input.expiresAt,
        sanitizeIp(input.ip),
        input.userAgent,
      ],
    );
    return mapSession(result.rows[0]!);
  }

  async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const result = await query<SessionRow>(
      `SELECT * FROM sessions WHERE token_hash = $1 LIMIT 1`,
      [tokenHash],
    );
    return result.rows[0] ? mapSession(result.rows[0]) : null;
  }

  async revoke(id: string): Promise<void> {
    await query(
      `UPDATE sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL`,
      [id],
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await query(
      `UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );
  }

  async revokeAllByScope(scope: SessionScope): Promise<void> {
    await query(
      `UPDATE sessions SET revoked_at = NOW() WHERE scope = $1 AND revoked_at IS NULL`,
      [scope],
    );
  }

  async revokeAllByScopeWithClient(client: Queryable, scope: SessionScope): Promise<void> {
    await client.query(
      `UPDATE sessions SET revoked_at = NOW() WHERE scope = $1 AND revoked_at IS NULL`,
      [scope],
    );
  }
}
