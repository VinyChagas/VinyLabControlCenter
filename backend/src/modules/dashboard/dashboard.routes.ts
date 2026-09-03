import type { FastifyInstance } from 'fastify';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

export async function dashboardRoutes(app: FastifyInstance) {
  const service = new DashboardService();
  const controller = new DashboardController(service);
  app.get('/dashboard', controller.getData.bind(controller));
}
