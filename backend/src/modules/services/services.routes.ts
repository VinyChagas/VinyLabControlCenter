import type { FastifyInstance } from 'fastify';
import type { ContainerMetricsService } from '../metrics/container-metrics.service.js';
import type { MetricsService } from '../metrics/metrics.service.js';
import { ServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';

export async function servicesRoutes(
  app: FastifyInstance,
  opts: { containers: ContainerMetricsService; metricsService: MetricsService },
) {
  const service = new ServicesService(opts.containers, opts.metricsService);
  const controller = new ServicesController(service);
  app.get('/services', controller.getAll.bind(controller));
  app.get('/services/:id', controller.getById.bind(controller));
}
