import type { FastifyReply, FastifyRequest } from 'fastify';
import { ServicesService } from './services.service.js';

export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  async getAll(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await this.service.getAll());
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    return reply.send(await this.service.getById(request.params.id));
  }
}
