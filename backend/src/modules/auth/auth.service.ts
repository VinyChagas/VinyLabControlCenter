import { env } from '../../config/env.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { verifyPassword } from '../../security/password.service.js';
import { generateSessionToken, hashSessionToken } from '../../security/session-token.js';
import {
  SETUP_SESSION_TTL_MS,
  SETUP_TEMP_PASSWORD,
  SETUP_TEMP_USERNAME,
} from '../setup/setup.constants.js';
import {
  isUserAccessAllowed,
  isUserExpired,
  toPublicUser,
  type PublicUser,
  type SessionScope,
  type UserRecord,
} from './auth.types.js';
import { AuditRepository } from './repositories/audit.repository.js';
import { SessionRepository } from './repositories/session.repository.js';
import { UserRepository } from './repositories/user.repository.js';

export interface AuthContext {
  scope: SessionScope;
  user: UserRecord | null;
  sessionId: string;
}

export interface AuthSessionResponse {
  authenticated: true;
  scope: SessionScope;
  user: PublicUser | null;
}

export class AuthService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly sessions = new SessionRepository(),
    private readonly audit = new AuditRepository(),
  ) {}

  async login(input: {
    email: string;
    password: string;
    ip: string | null;
    userAgent: string | null;
  }): Promise<{ token: string; scope: SessionScope; user: PublicUser | null }> {
    const identifier = input.email.trim();

    if (identifier.toLowerCase() === SETUP_TEMP_USERNAME) {
      const setupRequired = !(await this.users.hasOwner());

      if (setupRequired) {
        if (input.password === SETUP_TEMP_PASSWORD) {
          const token = generateSessionToken();
          const tokenHash = hashSessionToken(token);
          const expiresAt = new Date(Date.now() + SETUP_SESSION_TTL_MS);

          await this.sessions.create({
            userId: null,
            scope: 'setup',
            tokenHash,
            expiresAt,
            ip: input.ip,
            userAgent: input.userAgent,
          });

          await this.audit.record({
            action: 'setup_login_success',
            resourceType: 'setup',
            metadata: { identifier: SETUP_TEMP_USERNAME },
          });

          return { token, scope: 'setup', user: null };
        }

        await this.audit.record({
          action: 'setup_login_failed',
          resourceType: 'setup',
          metadata: { reason: 'bad_password', identifier: SETUP_TEMP_USERNAME },
        });
        throw new AppError(ErrorCodes.UNAUTHORIZED, 'Credenciais inválidas', 401);
      }
    }

    const user = await this.users.findByEmail(identifier);

    if (!user) {
      await this.audit.record({
        action: 'login_failed',
        metadata: { reason: 'unknown_user', email: identifier.toLowerCase() },
      });
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Credenciais inválidas', 401);
    }

    if (isUserExpired(user)) {
      await this.users.markExpired(user.id);
      await this.sessions.revokeAllForUser(user.id);
      await this.audit.record({
        actorId: user.id,
        action: 'login_failed',
        metadata: { reason: 'user_expired' },
      });
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Conta expirada', 401);
    }

    if (user.status !== 'active') {
      await this.audit.record({
        actorId: user.id,
        action: 'login_failed',
        metadata: { reason: 'user_not_active', status: user.status },
      });
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Credenciais inválidas', 401);
    }

    const valid = await verifyPassword(user.passwordHash, input.password);
    if (!valid) {
      await this.audit.record({
        actorId: user.id,
        action: 'login_failed',
        metadata: { reason: 'bad_password' },
      });
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Credenciais inválidas', 401);
    }

    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);

    await this.sessions.create({
      userId: user.id,
      scope: 'user',
      tokenHash,
      expiresAt,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    await this.users.touchLastLogin(user.id);
    await this.audit.record({
      actorId: user.id,
      action: 'login_success',
      resourceType: 'user',
      resourceId: user.id,
      metadata: { email: user.email },
    });

    return { token, scope: 'user', user: toPublicUser(user) };
  }

  async logout(sessionId: string, actorId: string | null): Promise<void> {
    await this.sessions.revoke(sessionId);
    await this.audit.record({
      actorId,
      action: 'logout',
      resourceType: 'session',
      resourceId: sessionId,
    });
  }

  async resolveSession(token: string | undefined): Promise<AuthContext | null> {
    if (!token) return null;

    const tokenHash = hashSessionToken(token);
    const session = await this.sessions.findByTokenHash(tokenHash);
    if (!session) return null;

    const now = new Date();

    if (session.revokedAt) {
      return null;
    }

    if (session.expiresAt.getTime() <= now.getTime()) {
      await this.sessions.revoke(session.id);
      return null;
    }

    if (session.scope === 'setup') {
      const hasOwner = await this.users.hasOwner();
      if (hasOwner) {
        await this.sessions.revoke(session.id);
        return null;
      }
      return { scope: 'setup', user: null, sessionId: session.id };
    }

    if (!session.userId) {
      await this.sessions.revoke(session.id);
      return null;
    }

    const user = await this.users.findById(session.userId);
    if (!user) {
      await this.sessions.revoke(session.id);
      return null;
    }

    if (isUserExpired(user, now)) {
      await this.users.markExpired(user.id);
      await this.sessions.revokeAllForUser(user.id);
      return null;
    }

    if (!isUserAccessAllowed(user, now)) {
      await this.sessions.revoke(session.id);
      return null;
    }

    return { scope: 'user', user, sessionId: session.id };
  }

  toSessionResponse(auth: AuthContext): AuthSessionResponse {
    return {
      authenticated: true,
      scope: auth.scope,
      user: auth.user ? toPublicUser(auth.user) : null,
    };
  }
}
