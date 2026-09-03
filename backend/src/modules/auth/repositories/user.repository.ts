import type { QueryResultRow, PoolClient } from 'pg';
import { query } from '../../../db/pool.js';
import type { PlatformRole, UserKind, UserRecord, UserStatus } from '../auth.types.js';

interface UserRow extends QueryResultRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  kind: UserKind;
  platform_role: PlatformRole;
  status: UserStatus;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

type Queryable = Pick<PoolClient, 'query'>;

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    kind: row.kind,
    platformRole: row.platform_role,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

export class UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await query<UserRow>(
      `SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1`,
      [email],
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const result = await query<UserRow>(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async hasOwner(): Promise<boolean> {
    const result = await query(`SELECT 1 FROM users WHERE platform_role = 'owner' LIMIT 1`);
    return (result.rowCount ?? 0) > 0;
  }

  async markExpired(id: string): Promise<void> {
    await query(
      `UPDATE users SET status = 'expired', updated_at = NOW() WHERE id = $1 AND status <> 'expired'`,
      [id],
    );
  }

  async touchLastLogin(id: string): Promise<void> {
    await query(`UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`, [id]);
  }

  async create(input: {
    email: string;
    name: string;
    passwordHash: string;
    kind: UserKind;
    platformRole: PlatformRole;
    status: UserStatus;
    expiresAt: Date | null;
  }): Promise<UserRecord> {
    const result = await query<UserRow>(
      `INSERT INTO users (
        email, name, password_hash, kind, platform_role, status, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        input.email.toLowerCase(),
        input.name,
        input.passwordHash,
        input.kind,
        input.platformRole,
        input.status,
        input.expiresAt,
      ],
    );
    return mapUser(result.rows[0]!);
  }

  async createWithClient(
    client: Queryable,
    input: {
      email: string;
      name: string;
      passwordHash: string;
      kind: UserKind;
      platformRole: PlatformRole;
      status: UserStatus;
      expiresAt: Date | null;
    },
  ): Promise<UserRecord> {
    const result = await client.query<UserRow>(
      `INSERT INTO users (
        email, name, password_hash, kind, platform_role, status, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        input.email.toLowerCase(),
        input.name,
        input.passwordHash,
        input.kind,
        input.platformRole,
        input.status,
        input.expiresAt,
      ],
    );
    return mapUser(result.rows[0]!);
  }
}
