import { apiClient } from '@/api/client';
import type { DashboardData } from '@/types';

export async function getDashboard(): Promise<DashboardData> {
  return apiClient.get<DashboardData>('/dashboard');
}
