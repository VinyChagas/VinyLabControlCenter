import type { SystemMetrics, SystemMetricsProvider } from './system.types.js';
import type { MetricsService } from '../metrics/metrics.service.js';

/** Adapts the real MetricsService to the legacy SystemMetrics shape. */
export class PrometheusSystemMetricsProvider implements SystemMetricsProvider {
  constructor(private readonly metrics: MetricsService) {}

  async getMetrics(): Promise<SystemMetrics> {
    const summary = await this.metrics.getSummary();
    return {
      cpu: {
        usage: summary.cpu.usagePercent ?? 0,
        cores: summary.cpu.cores ?? 0,
      },
      memory: {
        total: summary.memory.totalBytes ? Math.round(summary.memory.totalBytes / (1024 ** 2)) : 0,
        used: summary.memory.usedBytes ? Math.round(summary.memory.usedBytes / (1024 ** 2)) : 0,
        percentage: summary.memory.usagePercent ?? 0,
      },
      disk: {
        total: summary.disk.totalBytes ? Math.round(summary.disk.totalBytes / (1024 ** 2)) : 0,
        used: summary.disk.usedBytes ? Math.round(summary.disk.usedBytes / (1024 ** 2)) : 0,
        percentage: summary.disk.usagePercent ?? 0,
      },
      network: {
        download: summary.network.rxBytesPerSecond
          ? (summary.network.rxBytesPerSecond * 8) / 1_000_000
          : 0,
        upload: summary.network.txBytesPerSecond
          ? (summary.network.txBytesPerSecond * 8) / 1_000_000
          : 0,
      },
      uptime: summary.uptime.seconds ?? 0,
      loadAverage: [
        summary.cpu.load1 ?? 0,
        summary.cpu.load5 ?? 0,
        summary.cpu.load15 ?? 0,
      ],
    };
  }
}

export class SystemService {
  constructor(private readonly provider: SystemMetricsProvider) {}

  async getMetrics() {
    return this.provider.getMetrics();
  }
}
