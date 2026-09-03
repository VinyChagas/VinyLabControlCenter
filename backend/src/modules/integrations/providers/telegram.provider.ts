import type { IntegrationProvider } from '../integrations.types.js';

export class TelegramProvider implements IntegrationProvider {
  async testConnection(_config: Record<string, string>) {
    return { success: true, message: 'Telegram Bot connection successful (mock)' };
  }
}
