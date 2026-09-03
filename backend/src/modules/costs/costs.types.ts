export interface CostSummary {
  totalMonth: number;
  totalPrevMonth: number;
  variation: number;
  currency: string;
}

export interface ProviderCost {
  providerId: string;
  providerName: string;
  currentMonth: number;
  previousMonth: number;
  variation: number;
}

export interface ProjectCost {
  projectId: string;
  projectName: string;
  totalCost: number;
  providers: { providerId: string; cost: number }[];
}

export interface CostUsageProvider {
  getSummary(): Promise<CostSummary>;
  getByProvider(): Promise<ProviderCost[]>;
  getByProject(projectId: string): Promise<ProjectCost>;
}
