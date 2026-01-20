import { apiRequest } from "./api";

export interface ProjectListItem {
  id: string;
  name: string;
  description?: string;
  role: "OWNER" | "MEMBER" | "VIEWER";
}

export interface ListProjectsResponse {
  items: ProjectListItem[];
}

export async function listProjects(): Promise<ListProjectsResponse> {
  return apiRequest<ListProjectsResponse>("/projects", { method: "GET" });
}
