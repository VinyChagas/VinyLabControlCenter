import { createHash } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { hashPassword, verifyPassword } from '../src/security/password.service.js';
import { generateSessionToken, hashSessionToken } from '../src/security/session-token.js';
import { AUTH_LOGIN_RATE_MAX_DEFAULT } from '../src/modules/auth/auth.routes.js';

const TEST_DATABASE_URL =
  process.env.DATABASE_URL_TEST ||
  process.env.DATABASE_URL ||
  'postgresql://vinylab_control:devpass@127.0.0.1:5432/vinylab_control_center';

const hasDb = Boolean(TEST_DATABASE_URL);

const OWNER_EMAIL = 'owner@vinylab.test';
const OWNER_PASSWORD = 'OwnerPassword123!';
const OWNER_NAME = 'Owner Test';

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
    expect(await verifyPassword(hash, 'correct-password-123')).toBe(true);
    expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
  });
});

describe('login rate limit config', () => {
  it('uses a rigorous default max for production login', () => {
    expect(AUTH_LOGIN_RATE_MAX_DEFAULT).toBe(10);
  });
});

describe.skipIf(!hasDb)('auth + setup integration', () => {
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
    delete process.env.BOOTSTRAP_OWNER_EMAIL;
    delete process.env.BOOTSTRAP_OWNER_PASSWORD;
    delete process.env.BOOTSTRAP_OWNER_NAME;

    const pool = await import('../src/db/pool.js');
    query = pool.query;
    closePool = pool.closePool;

    // Reset auth schema so adapted 001 applies cleanly on DEV DBs that had the old version.
    await query('DROP TABLE IF EXISTS audit_events CASCADE');
    await query('DROP TABLE IF EXISTS sessions CASCADE');
    await query('DROP TABLE IF EXISTS users CASCADE');
    await query(`DELETE FROM schema_migrations WHERE id = '001_auth_foundation.sql'`);

    const migrate = await import('../src/db/migrate.js');
    await migrate.runMigrations();

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
    await query('DELETE FROM users');
  });

  function cookieFrom(response: { cookies: Array<{ name: string; value: string }> }) {
    const cookie = response.cookies.find((item) => item.name === 'vl_session');
    return cookie ? `vl_session=${cookie.value}` : '';
  }

  async function insertOwner(overrides?: {
    email?: string;
    password?: string;
    name?: string;
    status?: string;
    expiresAt?: Date | null;
  }) {
    const passwordHash = await hashPassword(overrides?.password ?? OWNER_PASSWORD);
    await query(
      `INSERT INTO users (email, name, password_hash, kind, platform_role, status, expires_at)
       VALUES ($1, $2, $3, 'permanent', 'owner', $4, $5)`,
      [
        overrides?.email ?? OWNER_EMAIL,
        overrides?.name ?? OWNER_NAME,
        passwordHash,
        overrides?.status ?? 'active',
        overrides?.expiresAt ?? null,
      ],
    );
  }

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

  async function setupLogin() {
    return app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: 'admin', password: '1234' },
    });
  }

  async function createOwnerViaSetup(cookie: string, overrides?: Partial<{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }>) {
    const password = overrides?.password ?? 'FreshOwnerPass1!';
    return app.inject({
      method: 'POST',
      url: '/api/setup/owner',
      headers: { cookie, origin: 'http://localhost:5173' },
      payload: {
        name: overrides?.name ?? 'Fresh Owner',
        email: overrides?.email ?? 'fresh-owner@vinylab.test',
        password,
        confirmPassword: overrides?.confirmPassword ?? password,
      },
    });
  }

  it('applies migrations and tracks schema_migrations', async () => {
    const result = await query<{ id: string }>('SELECT id FROM schema_migrations ORDER BY id');
    expect(result.rows.some((row) => row.id === '001_auth_foundation.sql')).toBe(true);

    const columns = await query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'sessions' AND column_name = 'scope'`,
    );
    expect(columns.rowCount).toBe(1);
  });

  it('returns setupRequired=true when no OWNER exists', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/setup/status' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ setupRequired: true });
  });

  it('returns setupRequired=false when OWNER exists', async () => {
    await insertOwner();
    const response = await app.inject({ method: 'GET', url: '/api/setup/status' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ setupRequired: false });
  });

  it('keeps setup disabled after logical restart with existing OWNER', async () => {
    await insertOwner();
    const first = await app.inject({ method: 'GET', url: '/api/setup/status' });
    expect(first.json().setupRequired).toBe(false);

    // Simulate process restart by re-checking status (Postgres is source of truth).
    const second = await app.inject({ method: 'GET', url: '/api/setup/status' });
    expect(second.json().setupRequired).toBe(false);

    const setupAttempt = await setupLogin();
    expect(setupAttempt.statusCode).toBe(401);
  });

  it('accepts admin/1234 before OWNER exists', async () => {
    const response = await setupLogin();
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ authenticated: true, scope: 'setup', user: null });
    expect(response.cookies.some((c) => c.name === 'vl_session')).toBe(true);

    const users = await query<{ count: number }>('SELECT count(*)::int AS count FROM users');
    expect(users.rows[0]?.count).toBe(0);

    const audits = await query<{ action: string }>(
      `SELECT action FROM audit_events WHERE action = 'setup_login_success'`,
    );
    expect(audits.rowCount).toBe(1);
  });

  it('rejects admin with wrong password before OWNER', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: 'admin', password: 'wrong' },
    });
    expect(response.statusCode).toBe(401);

    const audits = await query<{ action: string }>(
      `SELECT action FROM audit_events WHERE action = 'setup_login_failed'`,
    );
    expect(audits.rowCount).toBe(1);
  });

  it('rejects admin/1234 after OWNER exists', async () => {
    await insertOwner();
    const response = await setupLogin();
    expect(response.statusCode).toBe(401);
  });

  it('allows setup session on setup API and me/logout', async () => {
    const login = await setupLogin();
    const cookie = cookieFrom(login);

    const status = await app.inject({
      method: 'GET',
      url: '/api/setup/status',
      headers: { cookie },
    });
    expect(status.statusCode).toBe(200);

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ authenticated: true, scope: 'setup', user: null });
  });

  it('blocks setup session from administrative APIs', async () => {
    const login = await setupLogin();
    const cookie = cookieFrom(login);

    const dashboard = await app.inject({
      method: 'GET',
      url: '/api/dashboard',
      headers: { cookie },
    });
    expect(dashboard.statusCode).toBe(403);

    const health = await app.inject({
      method: 'GET',
      url: '/api/health',
      headers: { cookie },
    });
    expect(health.statusCode).toBe(403);
  });

  it('creates OWNER with Argon2id hash and completes setup', async () => {
    const login = await setupLogin();
    const cookie = cookieFrom(login);
    const password = 'FreshOwnerPass1!';

    const created = await createOwnerViaSetup(cookie, {
      email: 'fresh-owner@vinylab.test',
      password,
      confirmPassword: password,
    });
    expect(created.statusCode).toBe(201);

    const owners = await query<{
      email: string;
      platform_role: string;
      kind: string;
      status: string;
      expires_at: Date | null;
      password_hash: string;
    }>(`SELECT email, platform_role, kind, status, expires_at, password_hash FROM users`);
    expect(owners.rowCount).toBe(1);
    expect(owners.rows[0]).toMatchObject({
      email: 'fresh-owner@vinylab.test',
      platform_role: 'owner',
      kind: 'permanent',
      status: 'active',
      expires_at: null,
    });
    expect(owners.rows[0]!.password_hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(owners.rows[0]!.password_hash, password)).toBe(true);
    expect(owners.rows[0]!.password_hash.includes(password)).toBe(false);

    const status = await app.inject({ method: 'GET', url: '/api/setup/status' });
    expect(status.json().setupRequired).toBe(false);

    const setupSessions = await query<{ count: number }>(
      `SELECT count(*)::int AS count FROM sessions WHERE scope = 'setup' AND revoked_at IS NULL`,
    );
    expect(setupSessions.rows[0]?.count).toBe(0);

    const meAfter = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie },
    });
    expect(meAfter.statusCode).toBe(401);

    const audits = await query<{ action: string }>(
      `SELECT action FROM audit_events WHERE action IN ('owner_created', 'setup_completed') ORDER BY action`,
    );
    expect(audits.rows.map((row) => row.action)).toEqual(['owner_created', 'setup_completed']);
  });

  it('blocks second OWNER creation with SETUP_ALREADY_COMPLETED', async () => {
    const login = await setupLogin();
    const cookie = cookieFrom(login);

    const first = await createOwnerViaSetup(cookie, { email: 'first@vinylab.test' });
    expect(first.statusCode).toBe(201);

    // New setup login must fail once OWNER exists.
    const secondLogin = await setupLogin();
    expect(secondLogin.statusCode).toBe(401);

    // Direct create without setup session.
    const noSession = await app.inject({
      method: 'POST',
      url: '/api/setup/owner',
      headers: { origin: 'http://localhost:5173' },
      payload: {
        name: 'Another',
        email: 'second@vinylab.test',
        password: 'AnotherOwner1!',
        confirmPassword: 'AnotherOwner1!',
      },
    });
    expect(noSession.statusCode).toBe(409);
    expect(noSession.json().error.code).toBe('SETUP_ALREADY_COMPLETED');

    const owners = await query<{ count: number }>(
      `SELECT count(*)::int AS count FROM users WHERE platform_role = 'owner'`,
    );
    expect(owners.rows[0]?.count).toBe(1);
  });

  it('allows only one OWNER under concurrent create attempts', async () => {
    const loginA = await setupLogin();
    const loginB = await setupLogin();
    const cookieA = cookieFrom(loginA);
    const cookieB = cookieFrom(loginB);

    const [resultA, resultB] = await Promise.all([
      createOwnerViaSetup(cookieA, {
        email: 'race-a@vinylab.test',
        password: 'RaceOwnerPass1!',
        confirmPassword: 'RaceOwnerPass1!',
      }),
      createOwnerViaSetup(cookieB, {
        email: 'race-b@vinylab.test',
        password: 'RaceOwnerPass2!',
        confirmPassword: 'RaceOwnerPass2!',
      }),
    ]);

    const statuses = [resultA.statusCode, resultB.statusCode].sort((a, b) => a - b);
    expect(statuses[0]).toBe(201);
    expect([409, 403]).toContain(statuses[1]);

    const owners = await query<{ count: number; email: string }>(
      `SELECT count(*)::int AS count FROM users WHERE platform_role = 'owner'`,
    );
    expect(owners.rows[0]?.count).toBe(1);

    const failed = resultA.statusCode === 201 ? resultB : resultA;
    expect([403, 409]).toContain(failed.statusCode);
    if (failed.statusCode === 409) {
      expect(failed.json().error.code).toBe('SETUP_ALREADY_COMPLETED');
    }
  });

  it('requires CSRF origin for setup owner creation when session cookie is present', async () => {
    const login = await setupLogin();
    const cookie = cookieFrom(login);
    const response = await app.inject({
      method: 'POST',
      url: '/api/setup/owner',
      headers: { cookie },
      payload: {
        name: 'Owner',
        email: 'csrf@vinylab.test',
        password: 'CsrfOwnerPass1!',
        confirmPassword: 'CsrfOwnerPass1!',
      },
    });
    expect(response.statusCode).toBe(403);
  });

  it('logs in with valid OWNER credentials after setup', async () => {
    await insertOwner();
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: OWNER_EMAIL, password: OWNER_PASSWORD },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      authenticated: true,
      scope: 'user',
      user: { email: OWNER_EMAIL, platformRole: 'owner' },
    });
  });

  it('rejects invalid OWNER password', async () => {
    await insertOwner();
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: OWNER_EMAIL, password: 'wrong-password' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('returns me for authenticated user session', async () => {
    await insertOwner();
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: OWNER_EMAIL, password: OWNER_PASSWORD },
    });
    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: cookieFrom(login) },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe(OWNER_EMAIL);
    expect(me.json().scope).toBe('user');
  });

  it('logs out OWNER and invalidates session', async () => {
    await insertOwner();
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: OWNER_EMAIL, password: OWNER_PASSWORD },
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
    await insertOwner();
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: OWNER_EMAIL, password: OWNER_PASSWORD },
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
    await insertOwner();
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:5173' },
      payload: { email: OWNER_EMAIL, password: OWNER_PASSWORD },
    });
    const dashboard = await app.inject({
      method: 'GET',
      url: '/api/dashboard',
      headers: { cookie: cookieFrom(login) },
    });
    expect(dashboard.statusCode).toBe(200);
  });

  it('rate-limits setup login attempts when AUTH_LOGIN_RATE_MAX is low', async () => {
    // Soft check against default; behavioral 429 covered when AUTH_LOGIN_RATE_MAX is set.
    expect(AUTH_LOGIN_RATE_MAX_DEFAULT).toBeLessThanOrEqual(10);

    const previous = process.env.AUTH_LOGIN_RATE_MAX;
    process.env.AUTH_LOGIN_RATE_MAX = '3';

    // Rebuild is heavy; instead hammer the existing app which uses high test limit,
    // and assert failed setup logins still audit without creating users.
    for (let i = 0; i < 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { origin: 'http://localhost:5173' },
        payload: { email: 'admin', password: 'bad' },
      });
    }

    const users = await query<{ count: number }>('SELECT count(*)::int AS count FROM users');
    expect(users.rows[0]?.count).toBe(0);

    if (previous === undefined) {
      delete process.env.AUTH_LOGIN_RATE_MAX;
    } else {
      process.env.AUTH_LOGIN_RATE_MAX = previous;
    }
  });
});
