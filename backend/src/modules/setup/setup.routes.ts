import type { FastifyInstance } from 'fastify';
import { SetupController } from './setup.controller.js';
import { SetupService } from './setup.service.js';

export async function setupRoutes(app: FastifyInstance) {
  const service = new SetupService();
  const controller = new SetupController(service);

  app.get('/setup/status', controller.status.bind(controller));
  app.post('/setup/owner', controller.createOwner.bind(controller));
}

export { SetupService };
