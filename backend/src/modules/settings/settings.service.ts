import type { SettingsSection } from '../../types/common.js';

const SECTIONS: SettingsSection[] = [
  { id: 'geral', label: 'Geral' },
  { id: 'projetos', label: 'Projetos' },
  { id: 'integracoes', label: 'Integrações' },
  { id: 'api-keys', label: 'API Keys' },
  { id: 'custos', label: 'Custos e Limites' },
  { id: 'monitoramento', label: 'Monitoramento' },
  { id: 'notificacoes', label: 'Notificações' },
  { id: 'seguranca', label: 'Segurança' },
];

export class SettingsService {
  private store = new Map<string, Record<string, unknown>>();

  getSections(): SettingsSection[] {
    return SECTIONS;
  }

  updateSection(sectionId: string, data: Record<string, unknown>) {
    this.store.set(sectionId, data);
    return { id: sectionId, ...data, updatedAt: new Date().toISOString() };
  }
}
