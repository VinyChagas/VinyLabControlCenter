import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

/**
 * Isolated rate-limit check with AUTH_LOGIN_RATE_MAX=3.
 * Note: if auth modules were already loaded with a higher limit in the same process,
 * this override may not apply — vitest file isolation usually loads fresh.
 */

const TEST_DATABASE_URL =
  process.env.DATABASE_URL_TEST ||
  process.env.DATABASE_URL ||
  'postgresql://vinylab_control:devpass@127.0.0.1:5432/vinylab_control_center';

describe.skipIf(!TEST_DATABASE_URL)('login rate limit (isolated)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_ENV = 'test';
    process.env.SECRET_MASTER_KEY = 'test-master-key-that-is-at-least-32-chars-long!!';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    process.env.SESSION_TTL_HOURS = '72';
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.AUTH_LOGIN_RATE_MAX = '3';

    const migrate = await import('../src/db/migrate.js');
    await migrate.runMigrations();

    const { buildApp } = await import('../src/app.js');
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('returns 429 after exceeding login rate limit', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { origin: 'http://localhost:5173' },
        payload: { email: 'admin', password: 'bad-password' },
      });
      statuses.push(response.statusCode);
    }

    expect(statuses.slice(0, 3).every((code) => code === 401 || code === 429)).toBe(true);
    expect(statuses.some((code) => code === 429)).toBe(true);
  });
});
