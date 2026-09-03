import type { FastifyInstance } from 'fastify';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';
import { requireRoles } from '../../plugins/auth.plugin.js';

export async function settingsRoutes(app: FastifyInstance) {
  const service = new SettingsService();
  const controller = new SettingsController(service);
  app.get('/settings', controller.getSections.bind(controller));
  app.put(
    '/settings/:section',
    { preHandler: requireRoles('owner', 'admin') },
    controller.updateSection.bind(controller),
  );
}
