import { useCallback, useEffect, useState } from 'react';
import { getDashboard } from '@/api/dashboardApi';
import type { CurrentUser, DashboardData, SystemHealthData } from '@/types';

interface LayoutBootstrap {
  user: CurrentUser;
  health: SystemHealthData;
  notificationCount: number;
  loading: boolean;
  error: string | null;
}

const defaultUser: CurrentUser = {
  name: 'Vini Chagas',
  role: 'Administrador',
  initials: 'VC',
};

const defaultHealth: SystemHealthData = {
  statusLabel: 'Carregando...',
  detail: 'Conectando ao backend',
  percentage: 0,
  incidentsLabel: '—',
  sparkline: [],
};

export function useLayoutBootstrap(): LayoutBootstrap {
  const [state, setState] = useState<LayoutBootstrap>({
    user: defaultUser,
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
          user: data.user,
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
