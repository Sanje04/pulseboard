import { api } from '@/lib/api'

export interface Project {
  id: string
  name: string
  description?: string
  role: string
}

export interface ProjectsResponse {
  items: Project[]
}

export interface CreateProjectInput {
  name: string
  description?: string
}

export interface CreateProjectResponse {
  project: Project
}

export async function listProjects(): Promise<ProjectsResponse> {
  return api<ProjectsResponse>('/projects')
}

export async function createProject(input: CreateProjectInput): Promise<CreateProjectResponse> {
  return api<CreateProjectResponse>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}