import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { buildApp } from './app.js';

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Server running on http://localhost:${env.PORT}`);

    // Collector must not block startup; start after listen.
    if (env.NODE_ENV !== 'test') {
      app.services.metricsCollector.start();
    }

    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'shutting down');
      app.services.metricsCollector.stop();
      await app.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  } catch (err) {
    logger.fatal(err, 'Failed to start server');
    process.exit(1);
  }
}

main();
