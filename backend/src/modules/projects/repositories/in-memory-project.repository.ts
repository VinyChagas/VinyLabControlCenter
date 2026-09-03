import type { Project, ProjectRepository, CreateProjectInput, UpdateProjectInput } from '../projects.types.js';

export class InMemoryProjectRepository implements ProjectRepository {
  private projects: Map<string, Project> = new Map();

  constructor() {
    const seed: Project[] = [
      { id: '1', name: 'Hermes AI', description: 'Agente de IA conversacional', status: 'active', createdAt: '2026-08-01T10:00:00Z', updatedAt: '2026-09-01T10:00:00Z' },
      { id: '2', name: 'VinyLab Web', description: 'Dashboard de controle', status: 'active', createdAt: '2026-07-15T10:00:00Z', updatedAt: '2026-09-01T10:00:00Z' },
      { id: '3', name: 'Telegram Bot', description: 'Bot de notificações', status: 'active', createdAt: '2026-06-20T10:00:00Z', updatedAt: '2026-08-15T10:00:00Z' },
    ];
    for (const p of seed) this.projects.set(p.id, p);
  }

  findAll(): Project[] {
    return Array.from(this.projects.values());
  }

  findById(id: string): Project | undefined {
    return this.projects.get(id);
  }

  create(input: CreateProjectInput): Project {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const project: Project = { id, ...input, status: 'active', createdAt: now, updatedAt: now };
    this.projects.set(id, project);
    return project;
  }

  update(id: string, input: UpdateProjectInput): Project | undefined {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    const updated: Project = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.projects.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.projects.delete(id);
  }
}
