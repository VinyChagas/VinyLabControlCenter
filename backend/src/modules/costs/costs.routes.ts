import type { FastifyInstance } from 'fastify';
import { CostsController } from './costs.controller.js';
import { CostsService } from './costs.service.js';
import { MockCostProvider } from './providers/mock-cost.provider.js';

export async function costsRoutes(app: FastifyInstance) {
  const provider = new MockCostProvider();
  const service = new CostsService(provider);
  const controller = new CostsController(service);

  app.get('/costs/summary', controller.getSummary.bind(controller));
  app.get('/costs/providers', controller.getByProvider.bind(controller));
  app.get('/projects/:projectId/costs', controller.getByProject.bind(controller));
}
