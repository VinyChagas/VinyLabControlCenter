import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import type { MetricsService } from './metrics.service.js';
import type { SystemMetricsRepository } from './system-metrics.repository.js';
import { isMetricsHistoryRange, type MetricsHistoryRange } from './metrics.types.js';

export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly historyRepo: SystemMetricsRepository,
  ) {}

  async getSummary(_request: FastifyRequest, reply: FastifyReply) {
    const summary = await this.metricsService.getSummary();
    return reply.send(summary);
  }

  async getHistory(
    request: FastifyRequest<{ Querystring: { range?: string } }>,
    reply: FastifyReply,
  ) {
    const rangeParam = request.query.range ?? '24h';
    if (!isMetricsHistoryRange(rangeParam)) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'range deve ser um de: 1h, 6h, 24h, 7d, 30d',
        400,
      );
    }
    const range = rangeParam as MetricsHistoryRange;
    const points = await this.historyRepo.getHistory(range);
    return reply.send({ range, points });
  }
}
