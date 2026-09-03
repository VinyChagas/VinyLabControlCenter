import type { FastifyReply, FastifyRequest } from 'fastify';
import { CostsService } from './costs.service.js';

export class CostsController {
  constructor(private readonly service: CostsService) {}

  async getSummary(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await this.service.getSummary());
  }

  async getByProvider(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await this.service.getByProvider());
  }

  async getByProject(request: FastifyRequest<{ Params: { projectId: string } }>, reply: FastifyReply) {
    return reply.send(await this.service.getByProject(request.params.projectId));
  }
}
