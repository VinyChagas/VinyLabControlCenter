import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectsService } from '../src/modules/projects/projects.service.js';
import { InMemoryProjectRepository } from '../src/modules/projects/repositories/in-memory-project.repository.js';

let service: ProjectsService;

beforeEach(() => {
  service = new ProjectsService(new InMemoryProjectRepository());
});

describe('ProjectsService', () => {
  it('lists seeded projects', () => {
    const projects = service.getAll();
    expect(projects.length).toBeGreaterThanOrEqual(3);
  });

  it('gets a project by id', () => {
    const project = service.getById('1');
    expect(project.name).toBe('Hermes AI');
  });

  it('creates a project', () => {
    const project = service.create({ name: 'Test', description: 'A test project' });
    expect(project.id).toBeDefined();
    expect(project.status).toBe('active');
  });

  it('updates a project', () => {
    const updated = service.update('1', { name: 'Hermes v2' });
    expect(updated.name).toBe('Hermes v2');
  });

  it('deletes a project', () => {
    service.delete('1');
    expect(() => service.getById('1')).toThrow();
  });

  it('throws on non-existent project', () => {
    expect(() => service.getById('999')).toThrow();
  });
});
