import type { ApiUsageItemData } from '@/types';

export const apiUsageMock: ApiUsageItemData[] = [
  {
    id: 'openrouter',
    provider: 'OpenRouter',
    amount: '$ 12.48',
    variation: 18.6,
    used: '1.25M',
    limit: '5M',
    percentage: 25,
    unit: 'tokens',
    accentColor: 'blue',
  },
  {
    id: 'elevenlabs',
    provider: 'ElevenLabs',
    amount: '$ 6.32',
    variation: 9.3,
    used: '320k',
    limit: '1M',
    percentage: 32,
    unit: 'caracteres',
    accentColor: 'orange',
  },
];
