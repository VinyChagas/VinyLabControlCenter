import { apiClient } from '@/api/client';

export type SecretProvider = 'database' | 'openrouter' | 'elevenlabs' | 'telegram';

export interface MaskedSecret {
  id: string;
  provider: SecretProvider;
  name: string;
  key: string;
  maskedSecret: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSecretInput {
  provider: SecretProvider;
  name: string;
  secret: string;
}

export interface ConnectionTestResult {
  success: boolean;
  provider: SecretProvider;
  message: string;
  latencyMs?: number;
  database?: string;
  user?: string;
  version?: string;
}

export async function listSecrets(): Promise<MaskedSecret[]> {
  return apiClient.get<MaskedSecret[]>('/secrets');
}

export async function storeSecret(input: StoreSecretInput): Promise<MaskedSecret> {
  return apiClient.post<MaskedSecret>('/secrets', input);
}

export async function deleteSecret(id: string): Promise<void> {
  await apiClient.delete<void>(`/secrets/${id}`);
}

export async function testSecret(input: {
  id?: string;
  provider?: SecretProvider;
  secret?: string;
}): Promise<ConnectionTestResult> {
  return apiClient.post<ConnectionTestResult>('/secrets/test', input);
}
