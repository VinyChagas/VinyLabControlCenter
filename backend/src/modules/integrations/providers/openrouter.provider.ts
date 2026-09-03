import type { IntegrationProvider } from '../integrations.types.js';

export class OpenRouterProvider implements IntegrationProvider {
  async testConnection(_config: Record<string, string>) {
    return { success: true, message: 'OpenRouter connection successful (mock)' };
  }
}
