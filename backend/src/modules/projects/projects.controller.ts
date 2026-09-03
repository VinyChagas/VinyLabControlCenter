import type { FastifyReply, FastifyRequest } from 'fastify';
import { ProjectsService } from './projects.service.js';
import { createProjectSchema, updateProjectSchema } from './projects.schemas.js';

export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  async getAll(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(this.service.getAll());
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    return reply.send(this.service.getById(request.params.id));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createProjectSchema.parse(request.body);
    const project = this.service.create(body);
    return reply.status(201).send(project);
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const body = updateProjectSchema.parse(request.body);
    return reply.send(this.service.update(request.params.id, body));
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    this.service.delete(request.params.id);
    return reply.status(204).send();
  }
}
