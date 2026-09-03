import type { FastifyReply, FastifyRequest } from 'fastify';
import { cookieSecure } from '../../config/env.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { SESSION_COOKIE_NAME } from '../../security/session-token.js';
import { loginSchema } from './auth.schemas.js';
import type { AuthService } from './auth.service.js';

function clientIp(request: FastifyRequest): string | null {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() || null;
  }
  return request.ip || null;
}

export class AuthController {
  constructor(private readonly service: AuthService) {}

  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = loginSchema.parse(request.body);
    const result = await this.service.login({
      email: body.email,
      password: body.password,
      ip: clientIp(request),
      userAgent: typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : null,
    });

    reply.setCookie(SESSION_COOKIE_NAME, result.token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: cookieSecure(),
      signed: false,
    });

    return reply.send({
      authenticated: true,
      scope: result.scope,
      user: result.user,
    });
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    if (request.auth) {
      await this.service.logout(request.auth.sessionId, request.auth.user?.id ?? null);
    }

    reply.clearCookie(SESSION_COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: cookieSecure(),
    });

    return reply.status(204).send();
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    if (!request.auth) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Não autenticado', 401);
    }
    return reply.send(this.service.toSessionResponse(request.auth));
  }
}
