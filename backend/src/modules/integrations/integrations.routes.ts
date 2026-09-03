import type { FastifyInstance } from 'fastify';
import { IntegrationsController } from './integrations.controller.js';
import { IntegrationsService, InMemoryIntegrationRepository } from './integrations.service.js';
import { OpenRouterProvider } from './providers/openrouter.provider.js';
import { ElevenLabsProvider } from './providers/elevenlabs.provider.js';
import { TelegramProvider } from './providers/telegram.provider.js';

export async function integrationsRoutes(app: FastifyInstance) {
  const repo = new InMemoryIntegrationRepository();
  const providerMap = new Map([
    ['openrouter', new OpenRouterProvider()],
    ['elevenlabs', new ElevenLabsProvider()],
    ['telegram', new TelegramProvider()],
  ]);
  const service = new IntegrationsService(repo, providerMap);
  const controller = new IntegrationsController(service);

  app.get('/integrations/providers', controller.getProviders.bind(controller));
  app.get('/integrations', controller.getAll.bind(controller));
  app.post('/integrations', controller.create.bind(controller));
  app.get('/projects/:projectId/integrations', controller.getByProjectId.bind(controller));
  app.post('/integrations/:id/test', controller.testConnection.bind(controller));
}
