import { createContext, useContext } from 'react';
import type { CurrentUser, SystemHealthData } from '@/types';

export interface LayoutContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: CurrentUser;
  health: SystemHealthData;
  notificationCount: number;
}

export const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayoutContext(): LayoutContextValue {
  const value = useContext(LayoutContext);

  if (!value) {
    throw new Error('useLayoutContext deve ser usado dentro de AppLayout.');
  }

  return value;
}
