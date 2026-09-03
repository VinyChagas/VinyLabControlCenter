import { apiClient } from '@/api/client';
import type { AuthUser } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthMeResponse {
  user: AuthUser;
}

export async function login(payload: LoginPayload): Promise<AuthMeResponse> {
  return apiClient.post<AuthMeResponse>('/auth/login', payload);
}

export async function logout(): Promise<void> {
  await apiClient.post<void>('/auth/logout');
}

export async function getMe(): Promise<AuthMeResponse> {
  return apiClient.get<AuthMeResponse>('/auth/me');
}
