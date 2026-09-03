import type { FastifyInstance } from 'fastify';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { InMemoryProjectRepository } from './repositories/in-memory-project.repository.js';
import { ProjectsPgService } from './projects-pg.service.js';
import type { ContainerMetricsService } from '../metrics/container-metrics.service.js';
import { hasDatabase } from '../../db/pool.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { isMetricsHistoryRange } from '../metrics/metrics.types.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function projectsRoutes(
  app: FastifyInstance,
  opts: { containers: ContainerMetricsService },
) {
  // Legacy in-memory CRUD kept for environments without DATABASE_URL (local smoke).
  const legacy = new ProjectsService(new InMemoryProjectRepository());
  const legacyController = new ProjectsController(legacy);
  const pg = hasDatabase() ? new ProjectsPgService(opts.containers) : null;

  app.get('/projects', async (_request, reply) => {
    if (pg) return reply.send(await pg.list());
    return reply.send(legacy.getAll());
  });

  app.get('/projects/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    if (pg) return reply.send(await pg.getById(request.params.id));
    return reply.send(legacy.getById(request.params.id));
  });

  app.get(
    '/projects/:id/metrics/summary',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      if (!pg) {
        throw new AppError(ErrorCodes.METRICS_UNAVAILABLE, 'Banco não configurado', 503);
      }
      return reply.send(await pg.getMetricsSummary(request.params.id));
    },
  );

  app.get(
    '/projects/:id/metrics/history',
    async (
      request: FastifyRequest<{ Params: { id: string }; Querystring: { range?: string } }>,
      reply: FastifyReply,
    ) => {
      if (!pg) {
        throw new AppError(ErrorCodes.METRICS_UNAVAILABLE, 'Banco não configurado', 503);
      }
      const rangeParam = request.query.range ?? '24h';
      if (!isMetricsHistoryRange(rangeParam)) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'range deve ser um de: 1h, 6h, 24h, 7d, 30d',
          400,
        );
      }
      return reply.send(await pg.getMetricsHistory(request.params.id, rangeParam));
    },
  );

  // Write paths remain on in-memory until a full PG CRUD is needed.
  app.post('/projects', legacyController.create.bind(legacyController));
  app.put('/projects/:id', legacyController.update.bind(legacyController));
  app.delete('/projects/:id', legacyController.delete.bind(legacyController));
}
