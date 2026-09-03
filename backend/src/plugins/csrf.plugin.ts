import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { SESSION_COOKIE_NAME } from '../security/session-token.js';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function allowedOrigins(): Set<string> {
  const origins = new Set<string>([env.FRONTEND_URL]);
  if (env.NODE_ENV === 'development' || env.APP_ENV === 'development' || env.NODE_ENV === 'test') {
    origins.add('http://localhost:5173');
    origins.add('http://127.0.0.1:5173');
  }
  return origins;
}

function originFromReferer(referer: string | undefined): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

const csrfPluginImpl: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', async (request) => {
    if (!MUTATING.has(request.method.toUpperCase())) {
      return;
    }

    const originHeader = typeof request.headers.origin === 'string' ? request.headers.origin : null;
    const refererOrigin = originFromReferer(
      typeof request.headers.referer === 'string' ? request.headers.referer : undefined,
    );
    const candidate = originHeader ?? refererOrigin;

    const hasSessionCookie = Boolean(request.cookies?.[SESSION_COOKIE_NAME]);
    if (!candidate) {
      if (hasSessionCookie) {
        throw new AppError(ErrorCodes.FORBIDDEN, 'Origem da requisição inválida', 403);
      }
      return;
    }

    if (!allowedOrigins().has(candidate)) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Origem da requisição inválida', 403);
    }
  });
};

export const csrfPlugin = fp(csrfPluginImpl, {
  name: 'vinylab-csrf',
  dependencies: ['@fastify/cookie'],
});
