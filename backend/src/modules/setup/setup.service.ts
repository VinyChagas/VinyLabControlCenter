import { hasDatabase, withClient } from '../../db/pool.js';
import { hashPassword } from '../../security/password.service.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import type { UserRecord } from '../auth/auth.types.js';
import { AuditRepository } from '../auth/repositories/audit.repository.js';
import { SessionRepository } from '../auth/repositories/session.repository.js';
import { UserRepository } from '../auth/repositories/user.repository.js';
import { SETUP_OWNER_ADVISORY_LOCK_KEY } from './setup.constants.js';

export class SetupService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly sessions = new SessionRepository(),
    private readonly audit = new AuditRepository(),
  ) {}

  async isSetupRequired(): Promise<boolean> {
    if (!hasDatabase()) {
      return true;
    }
    return !(await this.users.hasOwner());
  }

  async getStatus(): Promise<{ setupRequired: boolean }> {
    return { setupRequired: await this.isSetupRequired() };
  }

  async createOwner(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserRecord> {
    if (!hasDatabase()) {
      throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Banco de dados não configurado', 503);
    }

    return withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query('SELECT pg_advisory_xact_lock($1)', [SETUP_OWNER_ADVISORY_LOCK_KEY]);

        const existing = await client.query<{ id: string }>(
          `SELECT id FROM users WHERE platform_role = 'owner' LIMIT 1 FOR UPDATE`,
        );
        if ((existing.rowCount ?? 0) > 0) {
          throw new AppError(
            ErrorCodes.SETUP_ALREADY_COMPLETED,
            'Configuração inicial já foi concluída',
            409,
          );
        }

        const passwordHash = await hashPassword(input.password);
        const owner = await this.users.createWithClient(client, {
          email: input.email,
          name: input.name,
          passwordHash,
          kind: 'permanent',
          platformRole: 'owner',
          status: 'active',
          expiresAt: null,
        });

        await this.sessions.revokeAllByScopeWithClient(client, 'setup');

        await this.audit.recordWithClient(client, {
          actorId: owner.id,
          action: 'owner_created',
          resourceType: 'user',
          resourceId: owner.id,
          metadata: { email: owner.email },
        });

        await this.audit.recordWithClient(client, {
          actorId: owner.id,
          action: 'setup_completed',
          resourceType: 'setup',
          resourceId: owner.id,
          metadata: { email: owner.email },
        });

        await client.query('COMMIT');
        return owner;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });
  }
}
