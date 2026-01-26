import { apiRequest } from "./api";

export function getAuditFeed(projectId: string) {
  return apiRequest(`/projects/${projectId}/audit`, { method: "GET" });
}
