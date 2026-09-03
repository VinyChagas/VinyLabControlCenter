import type { FastifyReply, FastifyRequest } from 'fastify';
import { env, requiresDatabase } from '../../config/env.js';
import { checkDatabaseHealth } from './database-health.js';

export class HealthController {
  async check(_request: FastifyRequest, reply: FastifyReply) {
    const database = await checkDatabaseHealth();
    const dbRequired = requiresDatabase();

    const healthy =
      database.status === 'connected' ||
      (!dbRequired && database.status === 'not_configured');

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
