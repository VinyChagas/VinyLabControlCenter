import type { FastifyInstance } from 'fastify';
import { MetricsController } from './metrics.controller.js';
import type { MetricsService } from './metrics.service.js';
import type { SystemMetricsRepository } from './system-metrics.repository.js';

export async function metricsRoutes(
  app: FastifyInstance,
  opts: { metricsService: MetricsService; historyRepo: SystemMetricsRepository },
) {
  const controller = new MetricsController(opts.metricsService, opts.historyRepo);
  app.get('/metrics/system/summary', controller.getSummary.bind(controller));
  app.get('/metrics/system/history', controller.getHistory.bind(controller));
}
