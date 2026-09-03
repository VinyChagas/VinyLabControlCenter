import type { FastifyReply, FastifyRequest } from 'fastify';
import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  async getData(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(this.service.getData());
  }
}
