export interface SystemMetrics {
  cpu: { usage: number; cores: number };
  memory: { total: number; used: number; percentage: number };
  disk: { total: number; used: number; percentage: number };
  network: { download: number; upload: number };
  uptime: number;
  loadAverage: [number, number, number];
}

export interface SystemMetricsProvider {
  getMetrics(): Promise<SystemMetrics>;
}
