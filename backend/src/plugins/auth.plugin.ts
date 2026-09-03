import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { AuthService } from '../modules/auth/auth.service.js';
import type { AuthContext } from '../modules/auth/auth.service.js';
import type { PlatformRole } from '../modules/auth/auth.types.js';
import { SESSION_COOKIE_NAME } from '../security/session-token.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { hasDatabase } from '../db/pool.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext | null;
  }
}

function isPublicRoute(method: string, url: string): boolean {
  const path = url.split('?')[0] ?? url;
  if (method.toUpperCase() === 'GET' && path === '/health') return true;
  if (method.toUpperCase() === 'POST' && path === '/api/auth/login') return true;
  return false;
}

const authPluginImpl: FastifyPluginAsync = async (app) => {
  const authService = new AuthService();

  app.decorateRequest('auth', null);

  app.addHook('preHandler', async (request) => {
    request.auth = null;

    if (!hasDatabase()) {
      if (isPublicRoute(request.method, request.url)) {
        return;
      }
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Não autenticado', 401);
    }

    const token = request.cookies[SESSION_COOKIE_NAME];
    if (token) {
      request.auth = await authService.resolveSession(token);
    }

    if (isPublicRoute(request.method, request.url)) {
      return;
    }

    if (!request.auth) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Não autenticado', 401);
    }
  });
};

export const authPlugin = fp(authPluginImpl, {
  name: 'vinylab-auth',
  dependencies: ['@fastify/cookie'],
});

export function requireRoles(...roles: PlatformRole[]) {
  return async (request: { auth: AuthContext | null }) => {
    if (!request.auth) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Não autenticado', 401);
    }
    if (!roles.includes(request.auth.user.platformRole)) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Permissão insuficiente', 403);
    }
  };
}
