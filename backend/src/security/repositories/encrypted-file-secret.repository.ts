import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { EncryptedPayload } from '../encryption.service.js';
import type { SecretProvider, SecretRepository, StoredSecret } from './secret.repository.js';

interface PersistShape {
  id: string;
  key: string;
  provider?: SecretProvider;
  name?: string;
  payload: EncryptedPayload;
  createdAt: string;
  updatedAt: string;
}

export class EncryptedFileSecretRepository implements SecretRepository {
  private secrets: Map<string, StoredSecret> = new Map();

  constructor(private readonly filePath: string) {
    this.load();
  }

  private load() {
    if (!existsSync(this.filePath)) return;

    try {
      const data = JSON.parse(readFileSync(this.filePath, 'utf8')) as PersistShape[];
      for (const item of data) {
        const secret: StoredSecret = {
          id: item.id,
          key: item.key,
          provider: item.provider ?? 'database',
          name: item.name ?? item.key,
          payload: item.payload,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
        this.secrets.set(secret.key, secret);
      }
    } catch {
      this.secrets = new Map();
    }
  }

  private persist() {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(Array.from(this.secrets.values()), null, 2));
  }

  findAll(): StoredSecret[] {
    return Array.from(this.secrets.values());
  }

  findById(id: string): StoredSecret | undefined {
    return Array.from(this.secrets.values()).find((secret) => secret.id === id);
  }

  findByKey(key: string): StoredSecret | undefined {
    return this.secrets.get(key);
  }

  save(input: {
    key: string;
    provider: SecretProvider;
    name: string;
    payload: EncryptedPayload;
  }): StoredSecret {
    const existing = this.secrets.get(input.key);
    const now = new Date().toISOString();
    const secret: StoredSecret = {
      id: existing?.id ?? crypto.randomUUID(),
      key: input.key,
      provider: input.provider,
      name: input.name,
      payload: input.payload,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.secrets.set(input.key, secret);
    this.persist();
    return secret;
  }

  delete(id: string): boolean {
    const secret = this.findById(id);
    if (!secret) return false;
    this.secrets.delete(secret.key);
    this.persist();
    return true;
  }
}
