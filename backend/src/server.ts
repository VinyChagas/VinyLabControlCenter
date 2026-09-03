import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { buildApp } from './app.js';
import { bootstrapOwner } from './db/bootstrap-owner.js';
import { hasDatabase } from './db/pool.js';

async function main() {
  if (hasDatabase()) {
    try {
      await bootstrapOwner();
    } catch (err) {
      logger.fatal(err, 'Failed to bootstrap owner');
      process.exit(1);
    }
  }

  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Server running on http://localhost:${env.PORT}`);
  } catch (err) {
    logger.fatal(err, 'Failed to start server');
    process.exit(1);
  }
}

main();
