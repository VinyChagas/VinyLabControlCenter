import { useCallback, useEffect, useState } from 'react';
import { getDashboard } from '@/api/dashboardApi';
import type { DashboardData, SystemHealthData } from '@/types';

interface LayoutBootstrap {
  health: SystemHealthData;
  notificationCount: number;
  loading: boolean;
  error: string | null;
}

const defaultHealth: SystemHealthData = {
  statusLabel: 'Carregando...',
  detail: 'Conectando ao backend',
  percentage: 0,
  incidentsLabel: '—',
  sparkline: [],
};

export function useLayoutBootstrap(): LayoutBootstrap {
  const [state, setState] = useState<LayoutBootstrap>({
    health: defaultHealth,
    notificationCount: 0,
    loading: true,
    error: null,
  });

  const load = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }));

    void getDashboard()
      .then((data: DashboardData) => {
        setState({
          health: data.health,
          notificationCount: data.notificationCount,
          loading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Não foi possível conectar ao backend.';
        setState((current) => ({
          ...current,
          loading: false,
          error: message,
        }));
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return state;
}
