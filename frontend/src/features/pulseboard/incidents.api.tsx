import { api } from "@/lib/api";

export interface Incident {
  id: string;
  title: string;
  status: string;
  severity: string;
  description?: string;
}

export type IncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";
export type IncidentStatus = "OPEN" | "MITIGATING" | "RESOLVED";

export interface CreateIncidentInput {
  title: string;
  description?: string;
  severity: IncidentSeverity;
}

export interface UpdateIncidentInput {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
}

export function listIncidents(projectId: string) {
  return api<{ incidents: Incident[] }>(`/projects/${projectId}/incidents`);
}

export function getIncident(projectId: string, incidentId: string) {
  return api<{ incident: any }>(`/projects/${projectId}/incidents/${incidentId}`);
}

export function getIncidentTimeline(projectId: string, incidentId: string) {
  return api<{ items: any[] }>(`/projects/${projectId}/incidents/${incidentId}/timeline`);
}

export function addComment(projectId: string, incidentId: string, message: string) {
  return api<{ ok: true }>(`/projects/${projectId}/incidents/${incidentId}/comments`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function createIncident(projectId: string, input: CreateIncidentInput) {
  return api<{ incident: Incident }>(`/projects/${projectId}/incidents`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteIncident(projectId: string, incidentId: string) {
  return api<{ ok: true }>(`/projects/${projectId}/incidents/${incidentId}`, {
    method: "DELETE",
  });
}

export function updateIncident(projectId: string, incidentId: string, input: UpdateIncidentInput) {
  return api<{ incident: Incident }>(`/projects/${projectId}/incidents/${incidentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
