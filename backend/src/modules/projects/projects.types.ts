export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'archived';
}

export interface ProjectRepository {
  findAll(): Project[];
  findById(id: string): Project | undefined;
  create(input: CreateProjectInput): Project;
  update(id: string, input: UpdateProjectInput): Project | undefined;
  delete(id: string): boolean;
}
