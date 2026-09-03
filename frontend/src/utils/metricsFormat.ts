import type { MetricCardData, ResourceHistoryPoint } from '@/types';
import type { SystemHistoryPoint, SystemMetricsSummary } from '@/api/metricsApi';

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return '--';
  const abs = Math.abs(bytes);
  if (abs >= 1024 ** 3) {
    const gb = bytes / 1024 ** 3;
    return `${gb >= 10 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  }
  if (abs >= 1024 ** 2) {
    const mb = bytes / 1024 ** 2;
    return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
  }
  if (abs >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${Math.round(bytes)} B`;
}

export function formatNetworkRate(bytesPerSecond: number | null | undefined): string {
  if (bytesPerSecond === null || bytesPerSecond === undefined || !Number.isFinite(bytesPerSecond)) {
    return '--';
  }
  const mbps = (bytesPerSecond * 8) / 1_000_000;
  if (Math.abs(mbps) >= 0.1) return `${mbps.toFixed(1)} Mbps`;
  const kb = bytesPerSecond / 1024;
  if (Math.abs(kb) >= 1) return `${kb.toFixed(1)} KB/s`;
  return `${Math.round(bytesPerSecond)} B/s`;
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return '--';
  }
  const totalHours = Math.floor(seconds / 3600);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  if (totalHours > 0) return `${totalHours}h ${mins}m`;
  return `${mins}m`;
}

export function formatBootDate(iso: string | null | undefined): string {
  if (!iso) return '--';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function pct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '--';
  return `${Math.round(value)}%`;
}

function usedCoresLabel(usagePercent: number | null, cores: number | null): string {
  if (usagePercent === null || cores === null) return '--';
  const used = ((usagePercent / 100) * cores).toFixed(1);
  return `${used} / ${cores} vCPU`;
}

export interface SparklineSeries {
  cpu: number[];
  memory: number[];
  disk: number[];
  network: number[];
  uptime: number[];
}

const EMPTY_SPARK: SparklineSeries = {
  cpu: [],
  memory: [],
  disk: [],
  network: [],
  uptime: [],
};

export function buildMetricCards(
  summary: SystemMetricsSummary | null,
  sparklines: SparklineSeries = EMPTY_SPARK,
): MetricCardData[] {
  if (!summary) {
    return [
      {
        id: 'cpu',
        label: 'CPU',
        value: '--',
        secondary: '--',
        icon: 'cpu',
        accent: 'blue',
        sparkline: sparklines.cpu,
      },
      {
        id: 'memory',
        label: 'Memória',
        value: '--',
        secondary: '--',
        icon: 'memory',
        accent: 'blue',
        sparkline: sparklines.memory,
      },
      {
        id: 'storage',
        label: 'Armazenamento',
        value: '--',
        secondary: '--',
        icon: 'storage',
        accent: 'blue',
        sparkline: sparklines.disk,
      },
      {
        id: 'network',
        label: 'Rede (E/S)',
        value: '↓ --',
        secondary: '↑ --',
        icon: 'network',
        accent: 'blue',
        sparkline: sparklines.network,
      },
      {
        id: 'uptime',
        label: 'Uptime',
        value: '--',
        secondary: 'Desde --',
        icon: 'uptime',
        accent: 'orange',
        sparkline: sparklines.uptime.length ? sparklines.uptime : [100],
      },
    ];
  }

  return [
    {
      id: 'cpu',
      label: 'CPU',
      value: pct(summary.cpu.usagePercent),
      secondary: usedCoresLabel(summary.cpu.usagePercent, summary.cpu.cores),
      icon: 'cpu',
      accent: 'blue',
      sparkline: sparklines.cpu,
    },
    {
      id: 'memory',
      label: 'Memória',
      value: pct(summary.memory.usagePercent),
      secondary: `${formatBytes(summary.memory.usedBytes)} / ${formatBytes(summary.memory.totalBytes)}`,
      icon: 'memory',
      accent: 'blue',
      sparkline: sparklines.memory,
    },
    {
      id: 'storage',
      label: 'Armazenamento',
      value: pct(summary.disk.usagePercent),
      secondary: `${formatBytes(summary.disk.usedBytes)} / ${formatBytes(summary.disk.totalBytes)}`,
      icon: 'storage',
      accent: 'blue',
      sparkline: sparklines.disk,
    },
    {
      id: 'network',
      label: 'Rede (E/S)',
      value: `↓ ${formatNetworkRate(summary.network.rxBytesPerSecond)}`,
      secondary: `↑ ${formatNetworkRate(summary.network.txBytesPerSecond)}`,
      icon: 'network',
      accent: 'blue',
      sparkline: sparklines.network,
    },
    {
      id: 'uptime',
      label: 'Uptime',
      value: formatUptime(summary.uptime.seconds),
      secondary: `Desde ${formatBootDate(summary.uptime.bootTime)}`,
      icon: 'uptime',
      accent: 'orange',
      sparkline: sparklines.uptime.length ? sparklines.uptime : [100],
    },
  ];
}

export function historyToChartPoints(points: SystemHistoryPoint[]): ResourceHistoryPoint[] {
  if (points.length === 0) return [];

  return points.map((point, index) => {
    const date = new Date(point.timestamp);
    const label = Number.isNaN(date.getTime())
      ? String(index)
      : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });

    return {
      hour: index,
      label,
      cpu: point.cpu ?? 0,
      memory: point.memory ?? 0,
      storage: point.disk ?? 0,
    };
  });
}

export function buildSparklinesFromHistory(points: SystemHistoryPoint[]): SparklineSeries {
  const last = points.slice(-12);
  return {
    cpu: last.map((p) => p.cpu ?? 0),
    memory: last.map((p) => p.memory ?? 0),
    disk: last.map((p) => p.disk ?? 0),
    network: last.map((p) => ((p.cpu ?? 0) + (p.memory ?? 0)) / 2),
    uptime: last.map(() => 100),
  };
}
