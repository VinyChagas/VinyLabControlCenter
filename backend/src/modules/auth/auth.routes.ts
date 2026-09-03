import type { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

export async function authRoutes(app: FastifyInstance) {
  const service = new AuthService();
  const controller = new AuthController(service);

  const loginLimit = { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } };

  app.post('/auth/login', loginLimit, controller.login.bind(controller));
  app.post('/auth/logout', controller.logout.bind(controller));
  app.get('/auth/me', controller.me.bind(controller));
}

export { AuthService };
