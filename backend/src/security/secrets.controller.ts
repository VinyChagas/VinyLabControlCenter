import type { FastifyReply, FastifyRequest } from 'fastify';
import { SecretsService } from './secrets.service.js';
import { storeSecretSchema, testSecretSchema } from './secrets.schemas.js';

export class SecretsController {
  constructor(private readonly service: SecretsService) {}

  async store(request: FastifyRequest, reply: FastifyReply) {
    const body = storeSecretSchema.parse(request.body);
    const result = this.service.store(body);
    return reply.status(201).send(result);
  }

  async list(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(this.service.listMasked());
  }

  async remove(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    this.service.delete(id);
    return reply.status(204).send();
  }

  async test(request: FastifyRequest, reply: FastifyReply) {
    const body = testSecretSchema.parse(request.body);
    const result = await this.service.test(body);
    return reply.send(result);
  }
}
