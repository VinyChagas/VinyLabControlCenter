import type { EncryptedPayload } from '../encryption.service.js';

export type SecretProvider = 'database' | 'openrouter' | 'elevenlabs' | 'telegram';

export interface StoredSecret {
  id: string;
  key: string;
  provider: SecretProvider;
  name: string;
  payload: EncryptedPayload;
  createdAt: string;
  updatedAt: string;
}

export interface SecretRepository {
  findAll(): StoredSecret[];
  findById(id: string): StoredSecret | undefined;
  findByKey(key: string): StoredSecret | undefined;
  save(input: {
    key: string;
    provider: SecretProvider;
    name: string;
    payload: EncryptedPayload;
  }): StoredSecret;
  delete(id: string): boolean;
}
