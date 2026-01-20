import { apiRequest } from "./api";
import type { Incident, IncidentSeverity, IncidentStatus } from "./incidents";

export interface IncidentDetail extends Incident {
  projectId: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface GetIncidentResponse {
  incident: IncidentDetail;
}

export type TimelineType =
  | "COMMENT"
  | "STATUS_CHANGE"
  | "SEVERITY_CHANGE"
  | "TITLE_CHANGE"
  | "DESCRIPTION_CHANGE";

export interface TimelineItem {
  id: string;
  type: TimelineType;
  message: string;
  from?: string;
  to?: string;
  createdBy: string;
  createdAt: string;
}

export interface TimelineResponse {
  items: TimelineItem[];
}

export async function getIncident(projectId: string, incidentId: string): Promise<GetIncidentResponse> {
  return apiRequest<GetIncidentResponse>(`/projects/${projectId}/incidents/${incidentId}`);
}

export async function getIncidentTimeline(projectId: string, incidentId: string): Promise<TimelineResponse> {
  return apiRequest<TimelineResponse>(`/projects/${projectId}/incidents/${incidentId}/timeline`);
}
