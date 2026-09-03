import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  process.env.SECRET_MASTER_KEY = 'test-master-key-that-is-at-least-32-chars-long!!';
  process.env.NODE_ENV = 'test';
  process.env.APP_ENV = 'test';
  process.env.DATABASE_URL = '';
  process.env.SESSION_TTL_HOURS = '72';
  process.env.FRONTEND_URL = 'http://localhost:5173';
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('GET /health', () => {
  it('returns 200 at root health endpoint without auth', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('ok');
    expect(body.database).toBe('not_configured');
    expect(body.environment).toBe('test');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
  });
});

describe('GET /api/health', () => {
  it('requires authentication', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(401);
  });
});

describe('GET /api/setup/status', () => {
  it('is public and returns setupRequired when database is not configured', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/setup/status' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ setupRequired: true });
  });
});

describe('protected routes without session', () => {
  it('rejects dashboard without session', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/dashboard' });
    expect(response.statusCode).toBe(401);
  });
});
