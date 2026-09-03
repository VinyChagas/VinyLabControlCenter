import { apiClient } from '@/api/client';
import type { ServiceItem } from '@/types';

export async function getServices(): Promise<ServiceItem[]> {
  return apiClient.get<ServiceItem[]>('/services');
}

export async function getService(id: string): Promise<ServiceItem> {
  return apiClient.get<ServiceItem>(`/services/${id}`);
}
