import type { FastifyInstance } from 'fastify';
import { SystemController } from './system.controller.js';
import { SystemService, PrometheusSystemMetricsProvider } from './system.service.js';
import { MockSystemMetricsProvider } from './providers/mock-system-metrics.provider.js';
import type { MetricsService } from '../metrics/metrics.service.js';
import { env } from '../../config/env.js';

export async function systemRoutes(
  app: FastifyInstance,
  opts: { metricsService: MetricsService },
) {
  const provider = env.PROMETHEUS_URL
    ? new PrometheusSystemMetricsProvider(opts.metricsService)
    : new MockSystemMetricsProvider();
  const service = new SystemService(provider);
  const controller = new SystemController(service, opts.metricsService);

  app.get('/system/metrics', controller.getMetrics.bind(controller));
  app.get('/system/info', controller.getInfo.bind(controller));
}
