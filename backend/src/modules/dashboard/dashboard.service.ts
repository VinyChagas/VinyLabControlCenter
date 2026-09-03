import type { DashboardData } from '../../types/common.js';

const RESOURCE_LABELS = [
  '08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00',
  '16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00',
  '00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00',
] as const;
const CPU_SERIES = [16,18,15,14,22,19,17,21,18,16,20,24,19,17,15,14,12,11,13,15,18,20,17,16,18];
const MEMORY_SERIES = [30,31,32,33,34,32,31,33,35,36,34,33,32,31,30,29,28,29,30,31,32,33,32,31,32];
const STORAGE_SERIES = [40,40,41,41,41,41,41,41,41,41,41,41,41,41,41,41,41,41,41,41,41,41,41,41,41];

export class DashboardService {
  getData(): DashboardData {
    return {
      metrics: [
        { id: 'cpu', label: 'CPU', value: '18%', secondary: '2.4 / 16 vCPU', icon: 'cpu', accent: 'blue', sparkline: [12,14,13,16,15,18,17,19,16,18,17,18] },
        { id: 'memory', label: 'Memória', value: '32%', secondary: '5.1 / 16 GB', icon: 'memory', accent: 'blue', sparkline: [28,29,30,31,30,32,33,31,32,34,32,32] },
        { id: 'storage', label: 'Armazenamento', value: '41%', secondary: '82 / 200 GB', icon: 'storage', accent: 'blue', sparkline: [39,40,40,41,41,40,41,41,42,41,41,41] },
        { id: 'network', label: 'Rede (E/S)', value: '↓ 12.4 Mbps', secondary: '↑ 8.7 Mbps', icon: 'network', accent: 'blue', sparkline: [8,11,9,14,12,10,13,15,11,12,14,12] },
        { id: 'uptime', label: 'Uptime', value: '12d 4h', secondary: 'Desde 21/08/2026', icon: 'uptime', accent: 'orange', sparkline: [98,99,99,100,100,99,100,100,100,100,100,100] },
      ],
      resourceHistory: RESOURCE_LABELS.map((label, hour) => ({
        hour,
        label,
        cpu: CPU_SERIES[hour] ?? 0,
        memory: MEMORY_SERIES[hour] ?? 0,
        storage: STORAGE_SERIES[hour] ?? 0,
      })),
      apiUsage: [
        { id: 'openrouter', provider: 'OpenRouter', amount: '$ 12.48', variation: 18.6, used: '1.25M', limit: '5M', percentage: 25, unit: 'tokens', accentColor: 'blue' },
        { id: 'elevenlabs', provider: 'ElevenLabs', amount: '$ 6.32', variation: 9.3, used: '320k', limit: '1M', percentage: 32, unit: 'caracteres', accentColor: 'orange' },
      ],
      quickLinks: [
        { id: 'n8n', name: 'n8n', url: 'https://n8n.vinichagas.cloud', icon: 'n8n' },
        { id: 'hermes', name: 'Hermes', url: 'https://hermes.vinichagas.cloud', icon: 'hermes' },
        { id: 'grafana', name: 'Grafana', url: 'https://grafana.vinichagas.cloud', icon: 'grafana' },
        { id: 'portainer', name: 'Portainer', url: 'https://portainer.vinichagas.cloud', icon: 'portainer' },
        { id: 'postgres', name: 'PostgreSQL', url: 'https://postgres.vinichagas.cloud', icon: 'postgres' },
        { id: 'telegram', name: 'Telegram Bot', url: 'https://t.me/vinichagas_bot', icon: 'telegram' },
      ],
      services: [
        { id: 'hermes', name: 'Hermes', description: 'Agente de IA', port: 3000, status: 'online', uptime: '12d 4h', cpu: 2, memoryLabel: '128 MB', memoryPercent: 13 },
        { id: 'n8n', name: 'n8n', description: 'Automação de fluxos', port: 5678, status: 'online', uptime: '12d 3h', cpu: 5, memoryLabel: '256 MB', memoryPercent: 25 },
        { id: 'postgres', name: 'PostgreSQL', description: 'Banco de dados', port: 5432, status: 'online', uptime: '12d 2h', cpu: 4, memoryLabel: '512 MB', memoryPercent: 50 },
        { id: 'grafana', name: 'Grafana', description: 'Monitoramento', port: 3001, status: 'online', uptime: '12d 2h', cpu: 1, memoryLabel: '96 MB', memoryPercent: 9 },
        { id: 'caddy', name: 'Caddy', description: 'Proxy/Reverse', port: 443, status: 'online', uptime: '12d 4h', cpu: 1, memoryLabel: '64 MB', memoryPercent: 6 },
      ],
      system: {
        hostname: 'vps-vinichagas',
        primaryIp: '192.168.1.10',
        os: 'Ubuntu 24.04 LTS',
        kernel: '6.8.0-41-generic',
        loadAverage: [0.32, 0.41, 0.38],
        updatedAt: '03/09/2026 11:45',
      },
      health: {
        statusLabel: 'Sistema Online',
        detail: 'Todos os serviços',
        percentage: 100,
        incidentsLabel: 'Sem incidentes',
        sparkline: [96,97,98,99,98,99,100,100,99,100,100,100],
      },
      user: { name: 'Vini Chagas', role: 'Administrador', initials: 'VC' },
      notificationCount: 3,
    };
  }
}
