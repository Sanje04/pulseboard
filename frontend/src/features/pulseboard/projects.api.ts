import { api } from '@/lib/api'

export interface Project {
  id: string;
  name: string;
  description?: string;
  role: string;
}

export interface ProjectsResponse {
  items: Project[];
}

export async function listProjects(): Promise<ProjectsResponse> {
  return api<ProjectsResponse>('/projects');
}