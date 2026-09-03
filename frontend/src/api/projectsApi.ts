import { apiClient } from '@/api/client';

export interface ProjectSummary {
  id: string;
  name: string;
}

export async function getProjects(): Promise<ProjectSummary[]> {
  return apiClient.get<ProjectSummary[]>('/projects');
}
