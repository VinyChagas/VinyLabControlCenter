import { resolve } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { SecretsController } from './secrets.controller.js';
import { SecretsService } from './secrets.service.js';
import { EncryptionService } from './encryption.service.js';
import { EncryptedFileSecretRepository } from './repositories/encrypted-file-secret.repository.js';
import { env } from '../config/env.js';

export async function secretsRoutes(app: FastifyInstance) {
  const encryption = new EncryptionService(env.SECRET_MASTER_KEY);
  const repo = new EncryptedFileSecretRepository(resolve('data', 'secrets.enc.json'));
  const service = new SecretsService(repo, encryption);
  const controller = new SecretsController(service);

  const strictLimit = { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } };

  app.post('/secrets', strictLimit, controller.store.bind(controller));
  app.get('/secrets', controller.list.bind(controller));
  app.delete('/secrets/:id', strictLimit, controller.remove.bind(controller));
  app.post('/secrets/test', strictLimit, controller.test.bind(controller));
}
