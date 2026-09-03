import type { SystemMetricsProvider } from './system.types.js';

export class SystemService {
  constructor(private readonly provider: SystemMetricsProvider) {}

  async getMetrics() {
    return this.provider.getMetrics();
  }
}
