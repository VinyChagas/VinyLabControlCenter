import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { AppError, ErrorCodes } from '../utils/errors.js';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: string;
  version: number;
}

const ALGORITHM = 'aes-256-gcm';
const VERSION = 1;

export class EncryptionService {
  private readonly key: Buffer;

  constructor(masterKey: string) {
    this.key = scryptSync(masterKey, 'vinylab-salt', 32);
  }

  encrypt(plaintext: string): EncryptedPayload {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv(ALGORITHM, this.key, iv);
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return {
        ciphertext: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        algorithm: ALGORITHM,
        version: VERSION,
      };
    } catch {
      throw new AppError(ErrorCodes.ENCRYPTION_ERROR, 'Encryption failed', 500);
    }
  }

  decrypt(payload: EncryptedPayload): string {
    try {
      const decipher = createDecipheriv(
        ALGORITHM,
        this.key,
        Buffer.from(payload.iv, 'base64'),
      );
      decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(payload.ciphertext, 'base64')),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch {
      throw new AppError(ErrorCodes.ENCRYPTION_ERROR, 'Decryption failed', 500);
    }
  }
}

export function maskSecret(value: string): string {
  if (value.length <= 4) return '••••••••';
  return '••••••••' + value.slice(-4);
}
