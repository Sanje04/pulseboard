import { api } from "@/lib/api";

export interface Incident {
  id: string;
  title: string;
  status: string;
  severity: string;
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
