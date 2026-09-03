import { EncryptionService, maskSecret } from './encryption.service.js';
import { testProviderConnection } from './connection-test.service.js';
import type { SecretProvider, SecretRepository } from './repositories/secret.repository.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

export interface MaskedSecret {
  id: string;
  provider: SecretProvider;
  name: string;
  key: string;
  maskedSecret: string;
  createdAt: string;
  updatedAt: string;
}

export class SecretsService {
  constructor(
    private readonly repo: SecretRepository,
    private readonly encryption: EncryptionService,
  ) {}

  store(input: { provider: SecretProvider; name: string; secret: string }): MaskedSecret {
    const key = input.provider;
    const payload = this.encryption.encrypt(input.secret);
    const stored = this.repo.save({
      key,
      provider: input.provider,
      name: input.name,
      payload,
    });

    return {
      id: stored.id,
      provider: stored.provider,
      name: stored.name,
      key: stored.key,
      maskedSecret: maskSecret(input.secret),
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
    };
  }

  listMasked(): MaskedSecret[] {
    return this.repo.findAll().map((stored) => {
      const decrypted = this.encryption.decrypt(stored.payload);
      return {
        id: stored.id,
        provider: stored.provider,
        name: stored.name,
        key: stored.key,
        maskedSecret: maskSecret(decrypted),
        createdAt: stored.createdAt,
        updatedAt: stored.updatedAt,
      };
    });
  }

  delete(id: string): void {
    const deleted = this.repo.delete(id);
    if (!deleted) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Secret not found', 404);
    }
  }

  async test(input: {
    id?: string;
    provider?: SecretProvider;
    secret?: string;
  }) {
    if (input.id) {
      const stored = this.repo.findById(input.id);
      if (!stored) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Secret not found', 404);
      }
      const decrypted = this.encryption.decrypt(stored.payload);
      return testProviderConnection(stored.provider, decrypted);
    }

    if (!input.provider || !input.secret) {
      throw new AppError(ErrorCodes.BAD_REQUEST, 'provider and secret are required', 400);
    }

    return testProviderConnection(input.provider, input.secret);
  }
}
