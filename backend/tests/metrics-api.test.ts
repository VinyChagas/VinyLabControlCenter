import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { hashPassword } from '../src/security/password.service.js';

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST;
const hasDb = Boolean(TEST_DATABASE_URL);

const OWNER_EMAIL = 'metrics-owner@vinylab.test';
const OWNER_PASSWORD = 'OwnerPassword123!';

describe.skipIf(!hasDb)('metrics + projects API auth', () => {
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
    process.env.PROMETHEUS_URL = 'http://prometheus.test:9090';
    process.env.PROMETHEUS_TIMEOUT_MS = '1000';

    const pool = await import('../src/db/pool.js');
    query = pool.query;
    closePool = pool.closePool;

    await query('DROP TABLE IF EXISTS project_metrics CASCADE');
    await query('DROP TABLE IF EXISTS project_resources CASCADE');
    await query('DROP TABLE IF EXISTS projects CASCADE');
    await query('DROP TABLE IF EXISTS system_metrics CASCADE');
    await query(`DELETE FROM schema_migrations WHERE id IN (
      '002_system_metrics.sql',
      '003_projects_metrics.sql'
    )`);

    // Ensure auth foundation exists (may already be applied by other suites).
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
    await query('DELETE FROM project_metrics');
    await query('DELETE FROM system_metrics');
    await query('DELETE FROM sessions');
    await query('DELETE FROM users');
    vi.restoreAllMocks();
  });

  function cookieFrom(response: { cookies: Array<{ name: string; value: string }> }) {
    const cookie = response.cookies.find((item) => item.name === 'vl_session');
    return cookie ? `vl_session=${cookie.value}` : '';
  }

  async function loginOwner() {
    const passwordHash = await hashPassword(OWNER_PASSWORD);
    await query(
      `INSERT INTO users (email, name, password_hash, kind, platform_role, status)
       VALUES ($1, $2, $3, 'permanent', 'owner', 'active')`,
      [OWNER_EMAIL, 'Metrics Owner', passwordHash],
    );
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: OWNER_EMAIL, password: OWNER_PASSWORD },
    });
    expect(login.statusCode).toBe(200);
    return cookieFrom(login);
  }

  async function createSetupSessionCookie() {
    const tokenRes = await query<{ token_hash: string }>(
      `INSERT INTO sessions (scope, token_hash, expires_at)
       VALUES ('setup', $1, NOW() + INTERVAL '1 hour')
       RETURNING token_hash`,
      ['a'.repeat(64)],
    );
    // Setup sessions need the raw token cookie; create via setup status flow is complex.
    // Instead: mark a fake setup session is insufficient without raw token.
    void tokenRes;
    return '';
  }

  it('rejects unauthenticated metrics summary', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/metrics/system/summary' });
    expect(res.statusCode).toBe(401);
  });

  it('blocks setup session from metrics', async () => {
    // Create setup session the same way AuthService does.
    const { generateSessionToken, hashSessionToken } = await import(
      '../src/security/session-token.js'
    );
    const raw = generateSessionToken();
    await query(
      `INSERT INTO sessions (scope, token_hash, expires_at)
       VALUES ('setup', $1, NOW() + INTERVAL '1 hour')`,
      [hashSessionToken(raw)],
    );

    const res = await app.inject({
      method: 'GET',
      url: '/api/metrics/system/summary',
      headers: { cookie: `vl_session=${raw}` },
    });
    expect(res.statusCode).toBe(403);
    void createSetupSessionCookie;
  });

  it('returns history from postgres for authenticated user', async () => {
    const cookie = await loginOwner();
    await query(
      `INSERT INTO system_metrics (recorded_at, cpu_usage_percent, memory_usage_percent, disk_usage_percent)
       VALUES (NOW() - INTERVAL '10 minutes', 10, 20, 30),
              (NOW() - INTERVAL '5 minutes', 11, 21, 31)`,
    );

    const res = await app.inject({
      method: 'GET',
      url: '/api/metrics/system/history?range=1h',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { range: string; points: unknown[] };
    expect(body.range).toBe('1h');
    expect(body.points.length).toBeGreaterThanOrEqual(2);
  });

  it('seeds Control Center project with resources', async () => {
    const cookie = await loginOwner();
    const res = await app.inject({
      method: 'GET',
      url: '/api/projects',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const projects = res.json() as Array<{
      slug: string;
      monitoringEnabled: boolean;
      resources: Array<{ resourceIdentifier: string }>;
    }>;
    const cc = projects.find((p) => p.slug === 'control-center');
    expect(cc).toBeTruthy();
    expect(cc?.monitoringEnabled).toBe(true);
    const ids = cc?.resources.map((r) => r.resourceIdentifier).sort();
    expect(ids).toEqual(['vinylab-control-backend', 'vinylab-control-frontend']);
  });

  it('inserts system_metrics row via repository', async () => {
    const { SystemMetricsRepository } = await import(
      '../src/modules/metrics/system-metrics.repository.js'
    );
    const repo = new SystemMetricsRepository();
    await repo.insertSummary({
      timestamp: new Date().toISOString(),
      cpu: { usagePercent: 12, cores: 4, load1: 0.1, load5: 0.2, load15: 0.3 },
      memory: {
        usedBytes: 1000,
        totalBytes: 2000,
        availableBytes: 1000,
        usagePercent: 50,
      },
      disk: {
        usedBytes: 1000,
        totalBytes: 2000,
        availableBytes: 1000,
        usagePercent: 50,
      },
      network: { rxBytesPerSecond: 10, txBytesPerSecond: 5 },
      uptime: { seconds: 100, bootTime: new Date().toISOString() },
    });

    const count = await query<{ n: string }>('SELECT COUNT(*)::text AS n FROM system_metrics');
    expect(Number(count.rows[0]?.n)).toBeGreaterThanOrEqual(1);
  });
});
