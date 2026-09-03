import type { FastifyReply, FastifyRequest } from 'fastify';
import { SettingsService } from './settings.service.js';

export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  async getSections(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(this.service.getSections());
  }

  async updateSection(request: FastifyRequest<{ Params: { section: string } }>, reply: FastifyReply) {
    const body = request.body as Record<string, unknown>;
    return reply.send(this.service.updateSection(request.params.section, body));
  }
}
