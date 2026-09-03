import type { SystemMetrics, SystemMetricsProvider } from '../system.types.js';

export class MockSystemMetricsProvider implements SystemMetricsProvider {
  async getMetrics(): Promise<SystemMetrics> {
    return {
      cpu: { usage: 18, cores: 16 },
      memory: { total: 16384, used: 5222, percentage: 32 },
      disk: { total: 204800, used: 83968, percentage: 41 },
      network: { download: 12.4, upload: 8.7 },
      uptime: 1051200,
      loadAverage: [0.32, 0.41, 0.38],
    };
  }
}
