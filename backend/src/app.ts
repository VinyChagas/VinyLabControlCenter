import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { AppError } from './utils/errors.js';
import type { ApiErrorResponse } from './types/common.js';

import { healthRoutes } from './modules/health/health.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { systemRoutes } from './modules/system/system.routes.js';
import { servicesRoutes } from './modules/services/services.routes.js';
import { projectsRoutes } from './modules/projects/projects.routes.js';
import { integrationsRoutes } from './modules/integrations/integrations.routes.js';
import { costsRoutes } from './modules/costs/costs.routes.js';
import { settingsRoutes } from './modules/settings/settings.routes.js';
import { secretsRoutes } from './security/secrets.routes.js';
import { HealthController } from './modules/health/health.controller.js';

const BODY_LIMIT_BYTES = 100 * 1024;

function sanitizeLogMessage(message: string): string {
  return message
    .replace(/postgresql:\/\/[^\s]+/gi, 'postgresql://***')
    .replace(/postgres:\/\/[^\s]+/gi, 'postgres://***')
    .replace(/password=\S+/gi, 'password=***');
}

export async function buildApp() {
  const app = Fastify({
    logger: false,
    bodyLimit: BODY_LIMIT_BYTES,
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
  });

  app.addHook('onRequest', async (request) => {
    logger.info({ reqId: request.id, method: request.method, url: request.url }, 'incoming request');
  });

  app.addHook('onResponse', async (request, reply) => {
    logger.info(
      {
        reqId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      'request completed',
    );
  });

  await app.register(helmet, { global: true });
  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? env.FRONTEND_URL : true,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      const body: ApiErrorResponse = {
        error: { code: error.code, message: error.message },
      };
      return reply.status(error.statusCode).send(body);
    }

    if (error instanceof ZodError) {
      const body: ApiErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
        },
      };
      return reply.status(400).send(body);
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    const safeMessage = sanitizeLogMessage(message);
    logger.error({ err: { message: safeMessage } }, 'unhandled error');

    const body: ApiErrorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: env.NODE_ENV === 'production' ? 'Internal server error' : safeMessage,
      },
    };
    return reply.status(500).send(body);
  });

  // Health sem prefixo — útil para Docker/Caddy healthchecks
  const healthController = new HealthController();
  app.get('/health', healthController.check.bind(healthController));

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(dashboardRoutes, { prefix: '/api' });
  await app.register(systemRoutes, { prefix: '/api' });
  await app.register(servicesRoutes, { prefix: '/api' });
  await app.register(projectsRoutes, { prefix: '/api' });
  await app.register(integrationsRoutes, { prefix: '/api' });
  await app.register(costsRoutes, { prefix: '/api' });
  await app.register(settingsRoutes, { prefix: '/api' });
  await app.register(secretsRoutes, { prefix: '/api' });

  return app;
}
