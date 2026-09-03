import { useCallback, useEffect, useRef, useState } from 'react';
import { getDashboard } from '@/api/dashboardApi';
import {
  getServices,
  getSystemHistory,
  getSystemInfo,
  getSystemSummary,
  type MetricsHistoryRange,
  type SystemHistoryPoint,
  type SystemMetricsSummary,
} from '@/api/metricsApi';
import { ApiError } from '@/api/client';
import {
  buildMetricCards,
  buildSparklinesFromHistory,
  historyToChartPoints,
} from '@/utils/metricsFormat';
import type {
  ApiUsageItemData,
  AsyncState,
  MetricCardData,
  QuickLink,
  ResourceHistoryPoint,
  ServiceItem,
  SystemHealthData,
  SystemInfoData,
} from '@/types';

const POLL_MS = 5000;

export interface DashboardViewModel {
  metrics: MetricCardData[];
  resourceHistory: ResourceHistoryPoint[];
  historyRange: MetricsHistoryRange;
  setHistoryRange: (range: MetricsHistoryRange) => void;
  apiUsage: ApiUsageItemData[];
  quickLinks: QuickLink[];
  services: ServiceItem[];
  system: SystemInfoData;
  health: SystemHealthData;
  metricsUnavailable: boolean;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const defaultSystem: SystemInfoData = {
  hostname: '--',
  primaryIp: '--',
  os: '--',
  kernel: '--',
  loadAverage: [0, 0, 0],
  updatedAt: '--',
};

const defaultHealth: SystemHealthData = {
  statusLabel: 'Sistema Online',
  detail: 'Todos os serviços',
  percentage: 100,
  incidentsLabel: 'Sem incidentes',
  sparkline: [],
};

export function useDashboard(): DashboardViewModel {
  const [summary, setSummary] = useState<SystemMetricsSummary | null>(null);
  const [historyPoints, setHistoryPoints] = useState<SystemHistoryPoint[]>([]);
  const [historyRange, setHistoryRange] = useState<MetricsHistoryRange>('24h');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [system, setSystem] = useState<SystemInfoData>(defaultSystem);
  const [apiUsage, setApiUsage] = useState<ApiUsageItemData[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [health, setHealth] = useState<SystemHealthData>(defaultHealth);
  const [metricsUnavailable, setMetricsUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extrasLoaded, setExtrasLoaded] = useState(false);

  const historyRangeRef = useRef(historyRange);
  historyRangeRef.current = historyRange;

  const loadExtras = useCallback(async (signal: AbortSignal) => {
    try {
      const data = await getDashboard();
      if (signal.aborted) return;
      setApiUsage(data.apiUsage);
      setQuickLinks(data.quickLinks);
      setHealth(data.health);
      setExtrasLoaded(true);
    } catch {
      if (!signal.aborted) setExtrasLoaded(true);
    }
  }, []);

  const loadRealtime = useCallback(async (signal: AbortSignal) => {
    const results = await Promise.allSettled([
      getSystemSummary({ signal }),
      getServices({ signal }),
      getSystemInfo({ signal }),
      getSystemHistory(historyRangeRef.current, { signal }),
    ]);

    if (signal.aborted) return;

    const [summaryResult, servicesResult, infoResult, historyResult] = results;

    if (summaryResult.status === 'fulfilled') {
      setSummary(summaryResult.value);
      setMetricsUnavailable(false);
    } else {
      const err = summaryResult.reason;
      if (err instanceof ApiError && (err.status === 503 || err.code === 'METRICS_UNAVAILABLE')) {
        setMetricsUnavailable(true);
        setSummary(null);
      }
    }

    if (servicesResult.status === 'fulfilled') {
      setServices(servicesResult.value);
    }

    if (infoResult.status === 'fulfilled') {
      setSystem(infoResult.value);
    }

    if (historyResult.status === 'fulfilled') {
      setHistoryPoints(historyResult.value.points);
    }

    const hardFail =
      summaryResult.status === 'rejected' &&
      servicesResult.status === 'rejected' &&
      infoResult.status === 'rejected';

    if (hardFail) {
      const reason = summaryResult.status === 'rejected' ? summaryResult.reason : null;
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o dashboard.');
    } else {
      setError(null);
    }

    setLoading(false);
  }, []);

  const reload = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    void loadRealtime(controller.signal);
  }, [loadRealtime]);

  useEffect(() => {
    const controller = new AbortController();
    void loadExtras(controller.signal);
    void loadRealtime(controller.signal);

    const intervalId = window.setInterval(() => {
      void loadRealtime(controller.signal);
    }, POLL_MS);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [loadExtras, loadRealtime]);

  useEffect(() => {
    const controller = new AbortController();
    void getSystemHistory(historyRange, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setHistoryPoints(data.points);
      })
      .catch(() => {
        /* keep previous points */
      });
    return () => controller.abort();
  }, [historyRange]);

  const sparklines = buildSparklinesFromHistory(historyPoints);
  const metrics = buildMetricCards(summary, sparklines);
  const resourceHistory = historyToChartPoints(historyPoints);

  const waitingFirst = loading && !extrasLoaded && metrics.every((m) => m.value === '--');

  return {
    metrics,
    resourceHistory,
    historyRange,
    setHistoryRange,
    apiUsage,
    quickLinks,
    services,
    system,
    health,
    metricsUnavailable,
    loading: waitingFirst,
    error,
    reload,
  };
}

/** Kept for layout bootstrap compatibility. */
export type { AsyncState };
