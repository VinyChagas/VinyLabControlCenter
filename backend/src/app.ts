import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
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
import { authRoutes } from './modules/auth/auth.routes.js';
import { setupRoutes } from './modules/setup/setup.routes.js';
import { HealthController } from './modules/health/health.controller.js';
import { authPlugin } from './plugins/auth.plugin.js';
import { csrfPlugin } from './plugins/csrf.plugin.js';
import { metricsRoutes } from './modules/metrics/metrics.routes.js';
import { PrometheusClient } from './modules/metrics/prometheus.client.js';
import { MetricsService } from './modules/metrics/metrics.service.js';
import { ContainerMetricsService } from './modules/metrics/container-metrics.service.js';
import { SystemMetricsRepository } from './modules/metrics/system-metrics.repository.js';
import { MetricsCollector } from './modules/metrics/metrics.collector.js';
import { ProjectMetricsCollector } from './modules/projects/project-metrics.collector.js';

const BODY_LIMIT_BYTES = 100 * 1024;

function sanitizeLogMessage(message: string): string {
  return message
    .replace(/postgresql:\/\/[^\s]+/gi, 'postgresql://***')
    .replace(/postgres:\/\/[^\s]+/gi, 'postgres://***')
    .replace(/password=\S+/gi, 'password=***');
}

export interface AppServices {
  metricsCollector: MetricsCollector;
  metricsService: MetricsService;
  containers: ContainerMetricsService;
  prometheus: PrometheusClient;
}

export type AppInstance = FastifyInstance & { services: AppServices };

export async function buildApp(): Promise<AppInstance> {
  const app = Fastify({
    logger: false,
    bodyLimit: BODY_LIMIT_BYTES,
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
  }) as unknown as AppInstance;

  const prometheus = new PrometheusClient();
  const metricsService = new MetricsService(prometheus);
  const containers = new ContainerMetricsService(prometheus);
  const systemRepo = new SystemMetricsRepository();
  const projectCollector = new ProjectMetricsCollector(containers);
  const metricsCollector = new MetricsCollector(metricsService, systemRepo, projectCollector);

  app.services = {
    metricsCollector,
    metricsService,
    containers,
    prometheus,
  };

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
  await app.register(cookie);

  await app.register(csrfPlugin);
  await app.register(authPlugin);

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

    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof (error as { statusCode: unknown }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : undefined;

    if (statusCode === 429) {
      const body: ApiErrorResponse = {
        error: { code: 'RATE_LIMITED', message: 'Muitas tentativas. Tente novamente em instantes.' },
      };
      return reply.status(429).send(body);
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

  const healthController = new HealthController();
  app.get('/health', healthController.check.bind(healthController));

  await app.register(authRoutes, { prefix: '/api' });
  await app.register(setupRoutes, { prefix: '/api' });
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(dashboardRoutes, { prefix: '/api' });
  await app.register(async (instance) => systemRoutes(instance, { metricsService }), {
    prefix: '/api',
  });
  await app.register(
    async (instance) => metricsRoutes(instance, { metricsService, historyRepo: systemRepo }),
    { prefix: '/api' },
  );
  await app.register(
    async (instance) => servicesRoutes(instance, { containers, metricsService }),
    {
      prefix: '/api',
    },
  );
  await app.register(async (instance) => projectsRoutes(instance, { containers }), {
    prefix: '/api',
  });
  await app.register(integrationsRoutes, { prefix: '/api' });
  await app.register(costsRoutes, { prefix: '/api' });
  await app.register(settingsRoutes, { prefix: '/api' });
  await app.register(secretsRoutes, { prefix: '/api' });

  return app;
}
