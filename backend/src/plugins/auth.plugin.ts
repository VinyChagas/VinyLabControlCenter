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

function pathOnly(url: string): string {
  return url.split('?')[0] ?? url;
}

function isPublicRoute(method: string, url: string): boolean {
  const path = pathOnly(url);
  const verb = method.toUpperCase();
  if (verb === 'GET' && path === '/health') return true;
  if (verb === 'POST' && path === '/api/auth/login') return true;
  if (verb === 'GET' && path === '/api/setup/status') return true;
  // Allow reaching the handler so SETUP_ALREADY_COMPLETED can be returned without a session.
  if (verb === 'POST' && path === '/api/setup/owner') return true;
  return false;
}

function isSetupAllowedRoute(method: string, url: string): boolean {
  const path = pathOnly(url);
  const verb = method.toUpperCase();
  if (verb === 'GET' && path === '/api/setup/status') return true;
  if (verb === 'POST' && path === '/api/setup/owner') return true;
  if (verb === 'POST' && path === '/api/auth/logout') return true;
  if (verb === 'GET' && path === '/api/auth/me') return true;
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

    if (request.auth.scope === 'setup' && !isSetupAllowedRoute(request.method, request.url)) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Sessão de configuração sem permissão para este recurso', 403);
    }
  });
};

export const authPlugin = fp(authPluginImpl, {
  name: 'vinylab-auth',
  dependencies: ['@fastify/cookie'],
});

export function requireRoles(...roles: PlatformRole[]) {
  return async (request: { auth: AuthContext | null }) => {
    if (!request.auth || request.auth.scope !== 'user' || !request.auth.user) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Não autenticado', 401);
    }
    if (!roles.includes(request.auth.user.platformRole)) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Permissão insuficiente', 403);
    }
  };
}
