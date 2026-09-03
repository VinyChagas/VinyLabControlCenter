import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { hasDatabase, query } from './pool.js';
import { hashPassword } from '../security/password.service.js';

export async function bootstrapOwner(): Promise<{ created: boolean }> {
  if (!hasDatabase()) {
    return { created: false };
  }

  const email = env.BOOTSTRAP_OWNER_EMAIL;
  const password = env.BOOTSTRAP_OWNER_PASSWORD;
  const name = env.BOOTSTRAP_OWNER_NAME;

  if (!email || !password || !name) {
    logger.warn('Bootstrap owner skipped: BOOTSTRAP_OWNER_* variables not fully set');
    return { created: false };
  }

  const existingOwner = await query<{ id: string }>(
    `SELECT id FROM users WHERE platform_role = 'owner' LIMIT 1`,
  );

  if ((existingOwner.rowCount ?? 0) > 0) {
    logger.info('Bootstrap owner skipped: owner already exists');
    return { created: false };
  }

  const passwordHash = await hashPassword(password);

  await query(
    `INSERT INTO users (
      email, name, password_hash, kind, platform_role, status, expires_at
    ) VALUES ($1, $2, $3, 'permanent', 'owner', 'active', NULL)`,
    [email.toLowerCase(), name, passwordHash],
  );

  logger.info({ email }, 'Bootstrap owner created');
  return { created: true };
}
