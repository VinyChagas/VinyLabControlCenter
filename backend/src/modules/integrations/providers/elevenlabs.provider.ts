import type { IntegrationProvider } from '../integrations.types.js';

export class ElevenLabsProvider implements IntegrationProvider {
  async testConnection(_config: Record<string, string>) {
    return { success: true, message: 'ElevenLabs connection successful (mock)' };
  }
}
