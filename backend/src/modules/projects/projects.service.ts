import type { ProjectRepository, CreateProjectInput, UpdateProjectInput } from './projects.types.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';

export class ProjectsService {
  constructor(private readonly repo: ProjectRepository) {}

  getAll() {
    return this.repo.findAll();
  }

  getById(id: string) {
    const project = this.repo.findById(id);
    if (!project) throw new AppError(ErrorCodes.NOT_FOUND, `Project '${id}' not found`, 404);
    return project;
  }

  create(input: CreateProjectInput) {
    return this.repo.create(input);
  }

  update(id: string, input: UpdateProjectInput) {
    const project = this.repo.update(id, input);
    if (!project) throw new AppError(ErrorCodes.NOT_FOUND, `Project '${id}' not found`, 404);
    return project;
  }

  delete(id: string) {
    const deleted = this.repo.delete(id);
    if (!deleted) throw new AppError(ErrorCodes.NOT_FOUND, `Project '${id}' not found`, 404);
  }
}
