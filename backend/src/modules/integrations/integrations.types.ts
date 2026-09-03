export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  category: 'ai' | 'voice' | 'messaging' | 'monitoring';
}

export interface Integration {
  id: string;
  providerId: string;
  projectId: string | null;
  name: string;
  config: Record<string, string>;
  status: 'active' | 'inactive' | 'error';
  createdAt: string;
}

export interface CreateIntegrationInput {
  providerId: string;
  projectId?: string;
  name: string;
  config: Record<string, string>;
}

export interface IntegrationRepository {
  findAll(): Integration[];
  findById(id: string): Integration | undefined;
  findByProjectId(projectId: string): Integration[];
  create(input: CreateIntegrationInput): Integration;
}

export interface IntegrationProvider {
  testConnection(config: Record<string, string>): Promise<{ success: boolean; message: string }>;
}
