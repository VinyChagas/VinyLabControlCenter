import { apiClient } from '@/api/client';
import type { SettingsSection } from '@/types';

export async function getSettingsSections(): Promise<SettingsSection[]> {
  return apiClient.get<SettingsSection[]>('/settings');
}
