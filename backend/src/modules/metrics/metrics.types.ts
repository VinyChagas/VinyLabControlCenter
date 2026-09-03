export interface SystemMetricsSummary {
  timestamp: string;
  cpu: {
    usagePercent: number | null;
    cores: number | null;
    load1: number | null;
    load5: number | null;
    load15: number | null;
  };
  memory: {
    usedBytes: number | null;
    totalBytes: number | null;
    availableBytes: number | null;
    usagePercent: number | null;
  };
  disk: {
    usedBytes: number | null;
    totalBytes: number | null;
    availableBytes: number | null;
    usagePercent: number | null;
  };
  network: {
    rxBytesPerSecond: number | null;
    txBytesPerSecond: number | null;
  };
  uptime: {
    seconds: number | null;
    bootTime: string | null;
  };
}

export interface SystemInfo {
  hostname: string;
  os: string;
  kernel: string;
  primaryIp: string;
  loadAverage: [number | null, number | null, number | null];
  updatedAt: string;
}

export type MetricsHistoryRange = '1h' | '6h' | '24h' | '7d' | '30d';

export interface SystemHistoryPoint {
  timestamp: string;
  cpu: number | null;
  memory: number | null;
  disk: number | null;
}

export interface SystemHistoryResponse {
  range: MetricsHistoryRange;
  points: SystemHistoryPoint[];
}

export interface ContainerMetrics {
  name: string;
  available: boolean;
  cpuUsagePercent: number | null;
  memoryUsageBytes: number | null;
  networkRxBps: number | null;
  networkTxBps: number | null;
  startTime: string | null;
  uptimeSeconds: number | null;
}

export interface AggregatedContainerMetrics {
  status: 'online' | 'offline' | 'degraded';
  cpuUsagePercent: number | null;
  memoryUsageBytes: number | null;
  networkRxBps: number | null;
  networkTxBps: number | null;
  uptimeSeconds: number | null;
  startTime: string | null;
  containers: ContainerMetrics[];
}

export const HISTORY_RANGE_MS: Record<MetricsHistoryRange, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

/** Max points returned per range (simple downsampling). */
export const HISTORY_MAX_POINTS: Record<MetricsHistoryRange, number> = {
  '1h': 60,
  '6h': 72,
  '24h': 96,
  '7d': 168,
  '30d': 180,
};

export function isMetricsHistoryRange(value: string): value is MetricsHistoryRange {
  return value in HISTORY_RANGE_MS;
}
