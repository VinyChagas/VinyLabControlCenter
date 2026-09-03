import type { FastifyInstance } from 'fastify';
import { ServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';

export async function servicesRoutes(app: FastifyInstance) {
  const service = new ServicesService();
  const controller = new ServicesController(service);
  app.get('/services', controller.getAll.bind(controller));
  app.get('/services/:id', controller.getById.bind(controller));
}
