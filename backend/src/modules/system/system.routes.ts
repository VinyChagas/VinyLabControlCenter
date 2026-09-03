import type { FastifyInstance } from 'fastify';
import { SystemController } from './system.controller.js';
import { SystemService } from './system.service.js';
import { MockSystemMetricsProvider } from './providers/mock-system-metrics.provider.js';

export async function systemRoutes(app: FastifyInstance) {
  const provider = new MockSystemMetricsProvider();
  const service = new SystemService(provider);
  const controller = new SystemController(service);
  app.get('/system/metrics', controller.getMetrics.bind(controller));
}
