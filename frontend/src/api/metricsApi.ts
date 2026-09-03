import { apiClient } from '@/api/client';
import type { ServiceItem, SystemInfoData } from '@/types';

export type MetricsHistoryRange = '1h' | '6h' | '24h' | '7d' | '30d';

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

export function getSystemSummary(init?: RequestInit): Promise<SystemMetricsSummary> {
  return apiClient.get<SystemMetricsSummary>('/metrics/system/summary', init);
}

export function getSystemHistory(
  range: MetricsHistoryRange,
  init?: RequestInit,
): Promise<SystemHistoryResponse> {
  return apiClient.get<SystemHistoryResponse>(
    `/metrics/system/history?range=${encodeURIComponent(range)}`,
    init,
  );
}

export function getSystemInfo(init?: RequestInit): Promise<SystemInfoData> {
  return apiClient.get<SystemInfoData>('/system/info', init);
}

export function getServices(init?: RequestInit): Promise<ServiceItem[]> {
  return apiClient.get<ServiceItem[]>('/services', init);
}
