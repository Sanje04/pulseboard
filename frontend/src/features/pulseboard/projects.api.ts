import { api } from '@/lib/api'

export type ProjectMembershipStatus = 'ACTIVE' | 'INVITED'

export interface Project {
  id: string
  name: string
  description?: string
  role: string
  // Optional metadata from the backend
  createdAt?: string
  // Optional membership status for the current user on this project.
  // When 'INVITED', the project will appear in the "Pending invitations" list
  // on the Projects page until the user accepts.
  // Optional membership status for the current user on this project.
  // When 'INVITED', the project will appear in the "Pending invitations" list
  // on the Projects page until the user accepts.
  membershipStatus?: ProjectMembershipStatus
  // Optional invite message set by the inviter when sending the project invite.
  inviteMessage?: string
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

export interface UpdateProjectInput {
  name?: string
  description?: string | null
}

export async function updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  return api<Project>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

// Accept an invitation for the given project. The backend should mark the
// membership as active and return a 200/204 response.
export async function acceptProjectInvite(projectId: string): Promise<void> {
  await api<void>(`/projects/${projectId}/accept`, {
    method: 'POST',
  })
}

// Decline an invitation for the given project. The backend should remove the
// pending membership and return a 200/204 response.
export async function declineProjectInvite(projectId: string): Promise<void> {
  await api<void>(`/projects/${projectId}/decline`, {
    method: 'POST',
  })
}

// Permanently delete a project. Only allowed for project owners.
export async function deleteProject(projectId: string): Promise<void> {
  await api<void>(`/projects/${projectId}`, {
    method: 'DELETE',
  })
}

export async function createProject(input: CreateProjectInput): Promise<CreateProjectResponse> {
  return api<CreateProjectResponse>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// Leave a project the current user is a member of.
export async function leaveProject(projectId: string): Promise<void> {
  await api<void>(`/projects/${projectId}/leave`, {
    method: 'POST',
  })
}