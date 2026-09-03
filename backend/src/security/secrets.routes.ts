import { resolve } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { SecretsController } from './secrets.controller.js';
import { SecretsService } from './secrets.service.js';
import { EncryptionService } from './encryption.service.js';
import { EncryptedFileSecretRepository } from './repositories/encrypted-file-secret.repository.js';
import { env } from '../config/env.js';
import { requireRoles } from '../plugins/auth.plugin.js';

export async function secretsRoutes(app: FastifyInstance) {
  const encryption = new EncryptionService(env.SECRET_MASTER_KEY);
  const repo = new EncryptedFileSecretRepository(resolve('data', 'secrets.enc.json'));
  const service = new SecretsService(repo, encryption);
  const controller = new SecretsController(service);

  const strictLimit = { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } };
  const adminOnly = { preHandler: requireRoles('owner', 'admin') };

  app.post('/secrets', { ...strictLimit, ...adminOnly }, controller.store.bind(controller));
  app.get('/secrets', adminOnly, controller.list.bind(controller));
  app.delete('/secrets/:id', { ...strictLimit, ...adminOnly }, controller.remove.bind(controller));
  app.post('/secrets/test', { ...strictLimit, ...adminOnly }, controller.test.bind(controller));
}
