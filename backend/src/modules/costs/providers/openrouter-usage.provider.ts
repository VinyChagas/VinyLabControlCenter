export interface OpenRouterUsageProvider {
  getUsage(): Promise<{ tokens: number; cost: number }>;
}
