import type { CostUsageProvider, CostSummary, ProviderCost, ProjectCost } from '../costs.types.js';

export class MockCostProvider implements CostUsageProvider {
  async getSummary(): Promise<CostSummary> {
    return { totalMonth: 18.80, totalPrevMonth: 15.42, variation: 21.9, currency: 'USD' };
  }

  async getByProvider(): Promise<ProviderCost[]> {
    return [
      { providerId: 'openrouter', providerName: 'OpenRouter', currentMonth: 12.48, previousMonth: 10.52, variation: 18.6 },
      { providerId: 'elevenlabs', providerName: 'ElevenLabs', currentMonth: 6.32, previousMonth: 4.90, variation: 29.0 },
    ];
  }

  async getByProject(projectId: string): Promise<ProjectCost> {
    return {
      projectId,
      projectName: projectId === '1' ? 'Hermes AI' : 'Unknown',
      totalCost: 14.20,
      providers: [
        { providerId: 'openrouter', cost: 10.48 },
        { providerId: 'elevenlabs', cost: 3.72 },
      ],
    };
  }
}
