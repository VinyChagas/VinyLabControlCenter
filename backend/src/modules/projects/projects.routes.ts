import type { FastifyInstance } from 'fastify';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { InMemoryProjectRepository } from './repositories/in-memory-project.repository.js';

export async function projectsRoutes(app: FastifyInstance) {
  const repo = new InMemoryProjectRepository();
  const service = new ProjectsService(repo);
  const controller = new ProjectsController(service);

  app.get('/projects', controller.getAll.bind(controller));
  app.get('/projects/:id', controller.getById.bind(controller));
  app.post('/projects', controller.create.bind(controller));
  app.put('/projects/:id', controller.update.bind(controller));
  app.delete('/projects/:id', controller.delete.bind(controller));
}
