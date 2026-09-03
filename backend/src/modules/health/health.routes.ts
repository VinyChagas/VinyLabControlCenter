import type { FastifyInstance } from 'fastify';
import { HealthController } from './health.controller.js';

export async function healthRoutes(app: FastifyInstance) {
  const controller = new HealthController();
  app.get('/health', controller.check.bind(controller));
}
