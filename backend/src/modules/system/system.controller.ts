import type { FastifyReply, FastifyRequest } from 'fastify';
import { SystemService } from './system.service.js';

export class SystemController {
  constructor(private readonly service: SystemService) {}

  async getMetrics(_request: FastifyRequest, reply: FastifyReply) {
    const metrics = await this.service.getMetrics();
    return reply.send(metrics);
  }
}
