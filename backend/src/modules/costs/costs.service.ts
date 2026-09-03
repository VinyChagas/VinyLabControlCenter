import type { CostUsageProvider } from './costs.types.js';

export class CostsService {
  constructor(private readonly provider: CostUsageProvider) {}
  getSummary() { return this.provider.getSummary(); }
  getByProvider() { return this.provider.getByProvider(); }
  getByProject(projectId: string) { return this.provider.getByProject(projectId); }
}
