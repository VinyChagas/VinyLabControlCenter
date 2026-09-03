import { useCallback, useEffect, useState } from 'react';
import { getDashboard } from '@/api/dashboardApi';
import type { AsyncState, DashboardData } from '@/types';

const initialState: AsyncState<DashboardData> = {
  data: null,
  loading: true,
  error: null,
};

export function useDashboard(): AsyncState<DashboardData> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<DashboardData>>(initialState);

  const load = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }));

    void getDashboard()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Não foi possível carregar o dashboard.';
        setState({ data: null, loading: false, error: message });
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
