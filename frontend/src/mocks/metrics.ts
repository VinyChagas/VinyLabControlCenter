import type { MetricCardData, ResourceHistoryPoint } from '@/types';

export const metricsMock: MetricCardData[] = [
  {
    id: 'cpu',
    label: 'CPU',
    value: '18%',
    secondary: '2.4 / 16 vCPU',
    icon: 'cpu',
    accent: 'blue',
    sparkline: [12, 14, 13, 16, 15, 18, 17, 19, 16, 18, 17, 18],
  },
  {
    id: 'memory',
    label: 'Memória',
    value: '32%',
    secondary: '5.1 / 16 GB',
    icon: 'memory',
    accent: 'blue',
    sparkline: [28, 29, 30, 31, 30, 32, 33, 31, 32, 34, 32, 32],
  },
  {
    id: 'storage',
    label: 'Armazenamento',
    value: '41%',
    secondary: '82 / 200 GB',
    icon: 'storage',
    accent: 'blue',
    sparkline: [39, 40, 40, 41, 41, 40, 41, 41, 42, 41, 41, 41],
  },
  {
    id: 'network',
    label: 'Rede (E/S)',
    value: '↓ 12.4 Mbps',
    secondary: '↑ 8.7 Mbps',
    icon: 'network',
    accent: 'blue',
    sparkline: [8, 11, 9, 14, 12, 10, 13, 15, 11, 12, 14, 12],
  },
  {
    id: 'uptime',
    label: 'Uptime',
    value: '12d 4h',
    secondary: 'Desde 21/08/2026',
    icon: 'uptime',
    accent: 'orange',
    sparkline: [98, 99, 99, 100, 100, 99, 100, 100, 100, 100, 100, 100],
  },
];

const RESOURCE_LABELS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
  '00:00',
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
  '07:00',
  '08:00',
] as const;

const CPU_SERIES = [16, 18, 15, 14, 22, 19, 17, 21, 18, 16, 20, 24, 19, 17, 15, 14, 12, 11, 13, 15, 18, 20, 17, 16, 18];
const MEMORY_SERIES = [30, 31, 32, 33, 34, 32, 31, 33, 35, 36, 34, 33, 32, 31, 30, 29, 28, 29, 30, 31, 32, 33, 32, 31, 32];
const STORAGE_SERIES = [40, 40, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41];

export const resourceHistoryMock: ResourceHistoryPoint[] = RESOURCE_LABELS.map((label, hour) => ({
  hour,
  label,
  cpu: CPU_SERIES[hour] ?? 0,
  memory: MEMORY_SERIES[hour] ?? 0,
  storage: STORAGE_SERIES[hour] ?? 0,
}));
