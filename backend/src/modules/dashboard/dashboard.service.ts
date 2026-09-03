import type { DashboardData } from '../../types/common.js';

/**
 * Dashboard extras that are still mocked (API costs / quick links / health badge).
 * System metrics, services and system info are served by dedicated endpoints.
 */
export class DashboardService {
  getExtras(): Pick<
    DashboardData,
    'apiUsage' | 'quickLinks' | 'health' | 'notificationCount'
  > {
    return {
      apiUsage: [
        {
          id: 'openrouter',
          provider: 'OpenRouter',
          amount: '$ 12.48',
          variation: 18.6,
          used: '1.25M',
          limit: '5M',
          percentage: 25,
          unit: 'tokens',
          accentColor: 'blue',
        },
        {
          id: 'elevenlabs',
          provider: 'ElevenLabs',
          amount: '$ 6.32',
          variation: 9.3,
          used: '320k',
          limit: '1M',
          percentage: 32,
          unit: 'caracteres',
          accentColor: 'orange',
        },
      ],
      quickLinks: [
        { id: 'n8n', name: 'n8n', url: 'https://n8n.vinichagas.cloud', icon: 'n8n' },
        { id: 'hermes', name: 'Hermes', url: 'https://hermes.vinichagas.cloud', icon: 'hermes' },
        { id: 'grafana', name: 'Grafana', url: 'https://grafana.vinichagas.cloud', icon: 'grafana' },
        {
          id: 'portainer',
          name: 'Portainer',
          url: 'https://portainer.vinichagas.cloud',
          icon: 'portainer',
        },
        {
          id: 'postgres',
          name: 'PostgreSQL',
          url: 'https://postgres.vinichagas.cloud',
          icon: 'postgres',
        },
        { id: 'telegram', name: 'Telegram Bot', url: 'https://t.me/vinichagas_bot', icon: 'telegram' },
      ],
      health: {
        statusLabel: 'Sistema Online',
        detail: 'Todos os serviços',
        percentage: 100,
        incidentsLabel: 'Sem incidentes',
        sparkline: [96, 97, 98, 99, 98, 99, 100, 100, 99, 100, 100, 100],
      },
      notificationCount: 3,
    };
  }

  /** @deprecated Prefer dedicated metrics/services endpoints. Kept for layout bootstrap. */
  getData(): DashboardData {
    const extras = this.getExtras();
    return {
      metrics: [],
      resourceHistory: [],
      services: [],
      system: {
        hostname: '--',
        primaryIp: '--',
        os: '--',
        kernel: '--',
        loadAverage: [0, 0, 0],
        updatedAt: '--',
      },
      user: { name: '--', role: '--', initials: '--' },
      ...extras,
    };
  }
}
