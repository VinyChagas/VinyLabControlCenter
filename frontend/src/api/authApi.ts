import { apiClient } from '@/api/client';
import type { AuthUser, SessionScope } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  scope: SessionScope;
  user: AuthUser | null;
}

export interface SetupStatusResponse {
  setupRequired: boolean;
}

export interface CreateOwnerPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export async function login(payload: LoginPayload): Promise<AuthSessionResponse> {
  return apiClient.post<AuthSessionResponse>('/auth/login', payload);
}

export async function logout(): Promise<void> {
  await apiClient.post<void>('/auth/logout');
}

export async function getMe(): Promise<AuthSessionResponse> {
  return apiClient.get<AuthSessionResponse>('/auth/me');
}

export async function getSetupStatus(): Promise<SetupStatusResponse> {
  return apiClient.get<SetupStatusResponse>('/setup/status');
}

export async function createOwner(payload: CreateOwnerPayload): Promise<{ ok: boolean }> {
  return apiClient.post<{ ok: boolean }>('/setup/owner', payload);
}
