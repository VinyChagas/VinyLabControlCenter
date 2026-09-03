import { describe, it, expect, beforeEach } from 'vitest';
import { SecretsService } from '../src/security/secrets.service.js';
import { EncryptionService } from '../src/security/encryption.service.js';
import type { SecretRepository, StoredSecret } from '../src/security/repositories/secret.repository.js';
import type { EncryptedPayload } from '../src/security/encryption.service.js';

class InMemorySecretRepository implements SecretRepository {
  private store = new Map<string, StoredSecret>();

  findAll(): StoredSecret[] {
    return Array.from(this.store.values());
  }

  findById(id: string): StoredSecret | undefined {
    return Array.from(this.store.values()).find((secret) => secret.id === id);
  }

  findByKey(key: string): StoredSecret | undefined {
    return this.store.get(key);
  }

  save(input: {
    key: string;
    provider: StoredSecret['provider'];
    name: string;
    payload: EncryptedPayload;
  }): StoredSecret {
    const now = new Date().toISOString();
    const existing = this.store.get(input.key);
    const secret: StoredSecret = {
      id: existing?.id ?? crypto.randomUUID(),
      key: input.key,
      provider: input.provider,
      name: input.name,
      payload: input.payload,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.store.set(input.key, secret);
    return secret;
  }

  delete(id: string): boolean {
    const secret = this.findById(id);
    if (!secret) return false;
    this.store.delete(secret.key);
    return true;
  }
}

const KEY = 'test-master-key-that-is-at-least-32-chars-long!!';
let service: SecretsService;

beforeEach(() => {
  const encryption = new EncryptionService(KEY);
  const repo = new InMemorySecretRepository();
  service = new SecretsService(repo, encryption);
});

describe('SecretsService', () => {
  it('stores and lists masked secrets', () => {
    service.store({
      provider: 'database',
      name: 'PostgreSQL Principal',
      secret: 'postgresql://user:secretpass@host:5432/db',
    });
    const list = service.listMasked();
    expect(list).toHaveLength(1);
    expect(list[0]?.provider).toBe('database');
    expect(list[0]?.name).toBe('PostgreSQL Principal');
    expect(list[0]?.maskedSecret).toMatch(/^••••••••.{4}$/);
    expect(list[0]?.maskedSecret).not.toContain('secretpass');
    expect(list[0]?.maskedSecret).not.toContain('postgresql://');
  });

  it('rejects Zod validation for invalid input', async () => {
    const { storeSecretSchema } = await import('../src/security/secrets.schemas.js');
    const result = storeSecretSchema.safeParse({ provider: 'database', name: '', secret: '' });
    expect(result.success).toBe(false);
  });
});
