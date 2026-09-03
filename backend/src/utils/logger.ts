import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers.Cookie',
      'headers.authorization',
      'headers.cookie',
      '*.secret',
      '*.password',
      '*.passwordHash',
      '*.password_hash',
      '*.apiKey',
      '*.api_key',
      '*.token',
      '*.tokenHash',
      '*.token_hash',
      '*.vl_session',
      '*.masterKey',
      '*.SECRET_MASTER_KEY',
      '*.DATABASE_URL',
      'DATABASE_URL',
      '*.connectionString',
      'connectionString',
    ],
    censor: '[REDACTED]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});
