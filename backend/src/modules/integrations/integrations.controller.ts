import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { IntegrationsService } from './integrations.service.js';

const createIntegrationSchema = z.object({
  providerId: z.string().min(1),
  projectId: z.string().optional(),
  name: z.string().min(1).max(100),
  config: z.record(z.string()),
});

export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  async getProviders(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(this.service.getProviders());
  }

  async getAll(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(this.service.getAll());
  }

  async getByProjectId(request: FastifyRequest<{ Params: { projectId: string } }>, reply: FastifyReply) {
    return reply.send(this.service.getByProjectId(request.params.projectId));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createIntegrationSchema.parse(request.body);
    const integration = this.service.create(body);
    return reply.status(201).send(integration);
  }

  async testConnection(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this.service.testConnection(request.params.id);
    return reply.send(result);
  }
}
