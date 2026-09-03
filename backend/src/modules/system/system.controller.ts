import type { FastifyReply, FastifyRequest } from 'fastify';
import type { MetricsService } from '../metrics/metrics.service.js';
import { SystemService } from './system.service.js';

export class SystemController {
  constructor(
    private readonly legacyService: SystemService,
    private readonly metricsService: MetricsService,
  ) {}

  async getMetrics(_request: FastifyRequest, reply: FastifyReply) {
    const metrics = await this.legacyService.getMetrics();
    return reply.send(metrics);
  }

  async getInfo(_request: FastifyRequest, reply: FastifyReply) {
    const info = await this.metricsService.getSystemInfo();
    return reply.send(info);
  }
}
