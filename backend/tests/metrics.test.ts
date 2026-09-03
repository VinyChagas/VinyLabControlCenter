import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/db/pool.js', () => ({
  hasDatabase: vi.fn(() => true),
  query: vi.fn(),
  getPool: vi.fn(),
  withClient: vi.fn(),
  closePool: vi.fn(),
}));

import { hasDatabase } from '../src/db/pool.js';
import { MetricsService } from '../src/modules/metrics/metrics.service.js';
import { ContainerMetricsService } from '../src/modules/metrics/container-metrics.service.js';
import { downsample } from '../src/modules/metrics/system-metrics.repository.js';
import {
  bytesToLabel,
  formatBootDate,
  formatNetworkRate,
  formatUptime,
  percentOrNull,
} from '../src/modules/metrics/format.js';
import { MetricsCollector } from '../src/modules/metrics/metrics.collector.js';
import { AppError, ErrorCodes } from '../src/utils/errors.js';
import { SERVICE_REGISTRY } from '../src/modules/services/service-registry.js';
import type { PrometheusClient } from '../src/modules/metrics/prometheus.client.js';
import type { SystemMetricsSummary } from '../src/modules/metrics/metrics.types.js';

function mockPrometheus(overrides?: Partial<PrometheusClient>): PrometheusClient {
  return {
    isConfigured: () => true,
    query: vi.fn(),
    queryScalar: vi.fn().mockResolvedValue(null),
    queryVector: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as PrometheusClient;
}

describe('format helpers', () => {
  it('formats bytes, uptime, network and boot date', () => {
    expect(bytesToLabel(128 * 1024 * 1024)).toContain('MB');
    expect(formatUptime(12 * 24 * 3600 + 4 * 3600)).toBe('12d 4h');
    expect(formatNetworkRate(1_550_000)).toContain('Mbps');
    expect(formatBootDate('2026-08-21T10:00:00.000Z')).toMatch(/\d{2}\/\d{2}\/2026/);
    expect(percentOrNull(50, 100)).toBe(50);
    expect(percentOrNull(null, 100)).toBeNull();
  });
});

describe('downsample', () => {
  it('reduces points while keeping ends', () => {
    const points = Array.from({ length: 100 }, (_, i) => ({ i }));
    const result = downsample(points, 10);
    expect(result).toHaveLength(10);
    expect(result[0]?.i).toBe(0);
    expect(result[9]?.i).toBe(99);
  });
});

describe('MetricsService', () => {
  it('throws when prometheus is not configured', async () => {
    const client = mockPrometheus({ isConfigured: () => false });
    const service = new MetricsService(client);
    await expect(service.getSummary()).rejects.toMatchObject({
      code: ErrorCodes.METRICS_UNAVAILABLE,
    });
  });

  it('builds summary from scalar queries', async () => {
    const client = mockPrometheus({
      queryScalar: vi.fn(async (q: string) => {
        if (q.includes('idle')) return 18.2;
        if (q.includes('count(count')) return 8;
        if (q.includes('node_load1')) return 0.32;
        if (q.includes('node_load5')) return 0.41;
        if (q.includes('node_load15')) return 0.38;
        if (q.includes('MemTotal')) return 16_000_000_000;
        if (q.includes('MemAvailable')) return 10_000_000_000;
        if (q.includes('filesystem_size')) return 200_000_000_000;
        if (q.includes('filesystem_avail')) return 100_000_000_000;
        if (q.includes('receive_bytes')) return 1_500_000;
        if (q.includes('transmit_bytes')) return 800_000;
        if (q.includes('node_time_seconds - node_boot')) return 100_000;
        if (q.includes('node_boot_time_seconds')) return 1_700_000_000;
        return null;
      }),
    });

    const summary = await new MetricsService(client).getSummary();
    expect(summary.cpu.usagePercent).toBe(18.2);
    expect(summary.cpu.cores).toBe(8);
    expect(summary.memory.usagePercent).toBe(37.5);
    expect(summary.disk.usagePercent).toBe(50);
    expect(summary.network.rxBytesPerSecond).toBe(1_500_000);
    expect(summary.uptime.bootTime).toBeTruthy();
  });
});

describe('ContainerMetricsService aggregation', () => {
  it('sums Control Center containers and uses min uptime', async () => {
    const now = Date.now() / 1000;
    const client = mockPrometheus({
      queryVector: vi.fn(async (q: string) => {
        if (q.includes('container_cpu_usage')) {
          return [
            { metric: { name: 'vinylab-control-frontend' }, value: [0, '0.02'] },
            { metric: { name: 'vinylab-control-backend' }, value: [0, '0.03'] },
          ];
        }
        if (q.includes('working_set')) {
          return [
            { metric: { name: 'vinylab-control-frontend' }, value: [0, '40000000'] },
            { metric: { name: 'vinylab-control-backend' }, value: [0, '60000000'] },
          ];
        }
        if (q.includes('receive_bytes')) {
          return [
            { metric: { name: 'vinylab-control-frontend' }, value: [0, '10'] },
            { metric: { name: 'vinylab-control-backend' }, value: [0, '20'] },
          ];
        }
        if (q.includes('transmit_bytes')) {
          return [
            { metric: { name: 'vinylab-control-frontend' }, value: [0, '5'] },
            { metric: { name: 'vinylab-control-backend' }, value: [0, '7'] },
          ];
        }
        if (q.includes('start_time')) {
          return [
            { metric: { name: 'vinylab-control-frontend' }, value: [0, String(now - 3600)] },
            { metric: { name: 'vinylab-control-backend' }, value: [0, String(now - 1800)] },
          ];
        }
        if (q.includes('last_seen')) {
          return [
            { metric: { name: 'vinylab-control-frontend' }, value: [0, String(now)] },
            { metric: { name: 'vinylab-control-backend' }, value: [0, String(now)] },
          ];
        }
        return [];
      }),
    });

    const aggregated = await new ContainerMetricsService(client).aggregate(
      ['vinylab-control-frontend', 'vinylab-control-backend'],
      { essentialNames: ['vinylab-control-frontend', 'vinylab-control-backend'] },
    );

    expect(aggregated.status).toBe('online');
    expect(aggregated.cpuUsagePercent).toBe(5);
    expect(aggregated.memoryUsageBytes).toBe(100_000_000);
    expect(aggregated.uptimeSeconds).toBeLessThanOrEqual(1800 + 5);
  });

  it('marks empty container list as offline', async () => {
    const aggregated = await new ContainerMetricsService(mockPrometheus()).aggregate([]);
    expect(aggregated.status).toBe('offline');
  });
});

describe('service registry', () => {
  it('includes Control Center composed of frontend+backend and real VPS names', () => {
    const cc = SERVICE_REGISTRY.find((s) => s.id === 'control-center');
    expect(cc?.containers).toEqual(['vinylab-control-frontend', 'vinylab-control-backend']);
    expect(SERVICE_REGISTRY.map((s) => s.id)).toEqual([
      'control-center',
      'hermes',
      'n8n',
      'postgres',
      'grafana',
      'caddy',
    ]);
    const hermes = SERVICE_REGISTRY.find((s) => s.id === 'hermes');
    expect(hermes?.containers).toEqual([]);
  });
});

describe('MetricsCollector', () => {
  beforeEach(() => {
    vi.mocked(hasDatabase).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('inserts summary via repository', async () => {
    const summary: SystemMetricsSummary = {
      timestamp: new Date().toISOString(),
      cpu: { usagePercent: 1, cores: 4, load1: 0.1, load5: 0.1, load15: 0.1 },
      memory: { usedBytes: 1, totalBytes: 2, availableBytes: 1, usagePercent: 50 },
      disk: { usedBytes: 1, totalBytes: 2, availableBytes: 1, usagePercent: 50 },
      network: { rxBytesPerSecond: 1, txBytesPerSecond: 1 },
      uptime: { seconds: 10, bootTime: new Date().toISOString() },
    };

    const metricsService = { getSummary: vi.fn().mockResolvedValue(summary) };
    const systemRepo = { insertSummary: vi.fn().mockResolvedValue(undefined) };
    const projectCollector = { collect: vi.fn().mockResolvedValue(undefined) };

    const collector = new MetricsCollector(
      metricsService as never,
      systemRepo as never,
      projectCollector as never,
      60,
    );

    await collector.runOnce();
    expect(systemRepo.insertSummary).toHaveBeenCalledWith(summary);
    expect(projectCollector.collect).toHaveBeenCalled();
  });

  it('propagates prometheus errors from runOnce', async () => {
    const metricsService = {
      getSummary: vi
        .fn()
        .mockRejectedValue(new AppError(ErrorCodes.METRICS_UNAVAILABLE, 'down', 503)),
    };
    const systemRepo = { insertSummary: vi.fn() };
    const collector = new MetricsCollector(metricsService as never, systemRepo as never, null, 60);
    await expect(collector.runOnce()).rejects.toBeInstanceOf(AppError);
    expect(systemRepo.insertSummary).not.toHaveBeenCalled();
  });

  it('prevents duplicate active collectors in the same process', () => {
    const metricsService = { getSummary: vi.fn() };
    const systemRepo = { insertSummary: vi.fn() };
    const a = new MetricsCollector(metricsService as never, systemRepo as never, null, 60);
    const b = new MetricsCollector(metricsService as never, systemRepo as never, null, 60);
    a.start();
    b.start();
    a.stop();
    b.stop();
  });
});
