import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env.js';
import { checkDatabaseHealth } from './database-health.js';

export class HealthController {
  async check(_request: FastifyRequest, reply: FastifyReply) {
    const database = await checkDatabaseHealth();
    const requiresDatabase = env.APP_ENV === 'homologation' || env.APP_ENV === 'production';

    const healthy =
      database.status === 'connected' ||
      (!requiresDatabase && database.status === 'not_configured');

    return reply.status(healthy ? 200 : 503).send({
      status: healthy ? 'ok' : 'degraded',
      database: database.status,
      environment: env.APP_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      ...(database.latencyMs !== undefined ? { databaseLatencyMs: database.latencyMs } : {}),
    });
  }
}
