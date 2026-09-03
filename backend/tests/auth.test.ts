import { createHash } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { hashPassword } from '../src/security/password.service.js';
import { generateSessionToken, hashSessionToken } from '../src/security/session-token.js';

const TEST_DATABASE_URL =
  process.env.DATABASE_URL_TEST ||
  process.env.DATABASE_URL ||
  'postgresql://vinylab_control:devpass@127.0.0.1:5432/vinylab_control_center';

const hasDb = Boolean(TEST_DATABASE_URL);

describe('session token helpers', () => {
  it('hashes tokens with sha256', () => {
    const token = generateSessionToken();
    expect(token.length).toBeGreaterThan(20);
    expect(hashSessionToken(token)).toBe(createHash('sha256').update(token).digest('hex'));
  });
});

describe('password hashing', () => {
  it('verifies argon2id hashes', async () => {
    const hash = await hashPassword('correct-password-123');
    const { verifyPassword } = await import('../src/security/password.service.js');
    expect(await verifyPassword(hash, 'correct-password-123')).toBe(true);
    expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
  });
});

describe.skipIf(!hasDb)('auth integration', () => {
  let app: FastifyInstance;
  let query: typeof import('../src/db/pool.js').query;
  let closePool: typeof import('../src/db/pool.js').closePool;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_ENV = 'test';
    process.env.SECRET_MASTER_KEY = 'test-master-key-that-is-at-least-32-chars-long!!';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    process.env.SESSION_TTL_HOURS = '72';
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.BOOTSTRAP_OWNER_EMAIL = 'owner@vinylab.test';
    process.env.BOOTSTRAP_OWNER_PASSWORD = 'OwnerPassword123!';
    process.env.BOOTSTRAP_OWNER_NAME = 'Owner Test';

    const migrate = await import('../src/db/migrate.js');
    await migrate.runMigrations();

    const bootstrap = await import('../src/db/bootstrap-owner.js');
    await bootstrap.bootstrapOwner();

    const pool = await import('../src/db/pool.js');
    query = pool.query;
    closePool = pool.closePool;

    const { buildApp } = await import('../src/app.js');
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (closePool) await closePool();
  });

  beforeEach(async () => {
    await query('DELETE FROM audit_events');
    await query('DELETE FROM sessions');
    await query(`DELETE FROM users WHERE email <> 'owner@vinylab.test'`);
    await query(
      `UPDATE users SET status = 'active', expires_at = NULL WHERE email = 'owner@vinylab.test'`,
    );
  });

  async function createUser(input: {
    email: string;
    password: string;
    status?: string;
    expiresAt?: Date | null;
    role?: string;
    kind?: string;
  }) {
    const passwordHash = await hashPassword(input.password);
    await query(
      `INSERT INTO users (email, name, password_hash, kind, platform_role, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.email,
        'Test User',
        passwordHash,
        input.kind ?? 'permanent',
        input.role ?? 'viewer',
        input.status ?? 'active',
        input.expiresAt ?? null,
      ],
    );
  }

  function cookieFrom(response: { cookies: Array<{ name: string; value: string }> }) {
    const cookie = response.cookies.find((item) => item.name === 'vl_session');
    return cookie ? `vl_session=${cookie.value}` : '';
  }

  it('applies migrations and tracks schema_migrations', async () => {
    const result = await query<{ id: string }>('SELECT id FROM schema_migrations ORDER BY id');
    expect(result.rows.some((row) => row.id === '001_auth_foundation.sql')).toBe(true);
  });

  it('bootstrap owner is idempotent', async () => {
    const bootstrap = await import('../src/db/bootstrap-owner.js');
    const second = await bootstrap.bootstrapOwner();
    expect(second.created).toBe(false);
    const owners = await query<{ count: number }>(
      `SELECT count(*)::int AS count FROM users WHERE platform_role = 'owner'`,
    );
    expect(owners.rows[0]?.count).toBe(1);
  });

  it('logs in with valid owner credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: 'owner@vinylab.test', password: 'OwnerPassword123!' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().user.platformRole).toBe('owner');
    expect(response.cookies.some((c) => c.name === 'vl_session')).toBe(true);
  });

  it('rejects invalid password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: 'owner@vinylab.test', password: 'wrong-password' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('returns me for authenticated session', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: 'owner@vinylab.test', password: 'OwnerPassword123!' },
    });
    expect(login.statusCode).toBe(200);
    const cookie = cookieFrom(login);
    expect(cookie).toContain('vl_session=');

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe('owner@vinylab.test');
  });

  it('logs out and invalidates session', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: 'owner@vinylab.test', password: 'OwnerPassword123!' },
    });
    const cookie = cookieFrom(login);
    const logout = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie, origin: 'http://localhost:5173' },
    });
    expect(logout.statusCode).toBe(204);

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie },
    });
    expect(me.statusCode).toBe(401);
  });

  it('rejects invalid session token', async () => {
    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: 'vl_session=not-a-real-token' },
    });
    expect(me.statusCode).toBe(401);
  });

  it('rejects expired session', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: 'owner@vinylab.test', password: 'OwnerPassword123!' },
    });
    const cookie = cookieFrom(login);
    await query(`UPDATE sessions SET expires_at = NOW() - INTERVAL '1 minute'`);

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie },
    });
    expect(me.statusCode).toBe(401);
  });

  it('rejects expired user even with correct password', async () => {
    await createUser({
      email: 'temp@vinylab.test',
      password: 'TempPassword123!',
      kind: 'temporary',
      status: 'active',
      expiresAt: new Date(Date.now() - 60_000),
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: 'temp@vinylab.test', password: 'TempPassword123!' },
    });
    expect(response.statusCode).toBe(401);

    const status = await query<{ status: string }>(
      `SELECT status FROM users WHERE email = 'temp@vinylab.test'`,
    );
    expect(status.rows[0]?.status).toBe('expired');
  });

  it('rejects disabled user', async () => {
    await createUser({
      email: 'disabled@vinylab.test',
      password: 'DisabledPassword123!',
      status: 'disabled',
    });
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: 'disabled@vinylab.test', password: 'DisabledPassword123!' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('allows owner on protected route', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: 'owner@vinylab.test', password: 'OwnerPassword123!' },
    });
    const dashboard = await app.inject({
      method: 'GET',
      url: '/api/dashboard',
      headers: { cookie: cookieFrom(login) },
    });
    expect(dashboard.statusCode).toBe(200);
  });
});
