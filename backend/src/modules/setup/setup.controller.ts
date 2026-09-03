import type { FastifyReply, FastifyRequest } from 'fastify';
import { cookieSecure } from '../../config/env.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { SESSION_COOKIE_NAME } from '../../security/session-token.js';
import { createOwnerSchema } from './setup.schemas.js';
import type { SetupService } from './setup.service.js';

export class SetupController {
  constructor(private readonly service: SetupService) {}

  async status(_request: FastifyRequest, reply: FastifyReply) {
    const status = await this.service.getStatus();
    return reply.send(status);
  }

  async createOwner(request: FastifyRequest, reply: FastifyReply) {
    const setupRequired = await this.service.isSetupRequired();
    if (!setupRequired) {
      throw new AppError(
        ErrorCodes.SETUP_ALREADY_COMPLETED,
        'Configuração inicial já foi concluída',
        409,
      );
    }

    if (!request.auth || request.auth.scope !== 'setup') {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Sessão de configuração necessária', 403);
    }

    const body = createOwnerSchema.parse(request.body);
    await this.service.createOwner({
      name: body.name,
      email: body.email,
      password: body.password,
    });

    reply.clearCookie(SESSION_COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: cookieSecure(),
    });

    return reply.status(201).send({ ok: true });
  }
}
