import type { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';

/** Production login rate limit (overridable via AUTH_LOGIN_RATE_MAX for isolated tests). */
export const AUTH_LOGIN_RATE_MAX_DEFAULT = 10;

export async function authRoutes(app: FastifyInstance) {
  const service = new AuthService();
  const controller = new AuthController(service);

  const loginMax =
    Number(process.env.AUTH_LOGIN_RATE_MAX) ||
    (env.NODE_ENV === 'test' ? 10_000 : AUTH_LOGIN_RATE_MAX_DEFAULT);

  const loginLimit = { config: { rateLimit: { max: loginMax, timeWindow: '1 minute' } } };

  app.post('/auth/login', loginLimit, controller.login.bind(controller));
  app.post('/auth/logout', controller.logout.bind(controller));
  app.get('/auth/me', controller.me.bind(controller));
}

export { AuthService };
