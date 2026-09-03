import type { IntegrationRepository, IntegrationProvider, ProviderInfo, CreateIntegrationInput, Integration } from './integrations.types.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { maskSecret } from '../../security/encryption.service.js';

const PROVIDERS: ProviderInfo[] = [
  { id: 'openrouter', name: 'OpenRouter', description: 'LLM API Gateway', category: 'ai' },
  { id: 'elevenlabs', name: 'ElevenLabs', description: 'Text-to-Speech API', category: 'voice' },
  { id: 'telegram', name: 'Telegram', description: 'Telegram Bot API', category: 'messaging' },
];

const SENSITIVE_CONFIG_KEY = /key|token|secret|password|authorization/i;

function sanitizeConfig(config: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => [
      key,
      SENSITIVE_CONFIG_KEY.test(key) ? maskSecret(value) : value,
    ]),
  );
}

function toPublicIntegration(integration: Integration): Integration {
  return {
    ...integration,
    config: sanitizeConfig(integration.config),
  };
}

export class IntegrationsService {
  constructor(
    private readonly repo: IntegrationRepository,
    private readonly providerMap: Map<string, IntegrationProvider>,
  ) {}

  getProviders(): ProviderInfo[] {
    return PROVIDERS;
  }

  getAll() {
    return this.repo.findAll().map(toPublicIntegration);
  }

  getByProjectId(projectId: string) {
    return this.repo.findByProjectId(projectId).map(toPublicIntegration);
  }

  create(input: CreateIntegrationInput) {
    if (!PROVIDERS.find((p) => p.id === input.providerId)) {
      throw new AppError(ErrorCodes.BAD_REQUEST, `Unknown provider: ${input.providerId}`, 400);
    }
    return toPublicIntegration(this.repo.create(input));
  }

  async testConnection(id: string) {
    const integration = this.repo.findById(id);
    if (!integration) throw new AppError(ErrorCodes.NOT_FOUND, `Integration '${id}' not found`, 404);
    const provider = this.providerMap.get(integration.providerId);
    if (!provider) throw new AppError(ErrorCodes.BAD_REQUEST, `No provider for '${integration.providerId}'`, 400);
    return provider.testConnection(integration.config);
  }
}

export class InMemoryIntegrationRepository implements IntegrationRepository {
  private items: Map<string, Integration> = new Map();

  constructor() {
    const seed: Integration = {
      id: '1',
      providerId: 'openrouter',
      projectId: '1',
      name: 'Hermes OpenRouter',
      config: { apiKey: 'mock-openrouter-key-not-real' },
      status: 'active',
      createdAt: '2026-08-01T10:00:00Z',
    };
    this.items.set(seed.id, seed);
  }

  findAll() {
    return Array.from(this.items.values());
  }

  findById(id: string) {
    return this.items.get(id);
  }

  findByProjectId(projectId: string) {
    return Array.from(this.items.values()).filter((i) => i.projectId === projectId);
  }

  create(input: CreateIntegrationInput) {
    const id = crypto.randomUUID();
    const integration: Integration = {
      id,
      ...input,
      projectId: input.projectId ?? null,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    this.items.set(id, integration);
    return integration;
  }
}
