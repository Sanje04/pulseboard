import { apiRequest } from "./api";

export async function listIncidents(projectId: string): Promise<ListIncidentsResponse> {
  const res = await apiRequest<any>(`/projects/${projectId}/incidents`);
  console.log("listIncidents raw:", res);
  return res as ListIncidentsResponse;
}

