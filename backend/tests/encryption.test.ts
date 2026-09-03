import { describe, it, expect } from 'vitest';
import { EncryptionService, maskSecret } from '../src/security/encryption.service.js';

const KEY = 'test-master-key-that-is-at-least-32-chars-long!!';

describe('EncryptionService', () => {
  it('encrypts and decrypts roundtrip', () => {
    const service = new EncryptionService(KEY);
    const plaintext = 'my-super-secret-api-key-12345';
    const encrypted = service.encrypt(plaintext);

    expect(encrypted.ciphertext).not.toBe(plaintext);
    expect(encrypted.algorithm).toBe('aes-256-gcm');
    expect(encrypted.version).toBe(1);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertexts for same plaintext', () => {
    const service = new EncryptionService(KEY);
    const a = service.encrypt('hello');
    const b = service.encrypt('hello');
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });
});

describe('maskSecret', () => {
  it('masks all but last 4 chars', () => {
    expect(maskSecret('sk-1234567890abcdef')).toBe('••••••••cdef');
  });

  it('fully masks short secrets', () => {
    expect(maskSecret('ab')).toBe('••••••••');
  });
});
