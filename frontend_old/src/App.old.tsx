import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { login, logout, saveToken } from "./auth";
import { listProjects } from "./projects";
import { listIncidents } from "./incidents";
import { getIncident, getIncidentTimeline } from "./incidentDetail";
import { getAuditFeed } from "./audit";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";

function hasToken() {
  return Boolean(localStorage.getItem("accessToken"));
}

type Role = "OWNER" | "MEMBER" | "VIEWER";

interface Project {
  id: string;
  name: string;
  role: Role;
  description?: string;
}

interface ProjectsResponse {
  items: Project[];
}

function formatTimelineEntry(t: any) {
  const typeLabels: Record<string, string> = {
    CREATED: "Incident created",
    DESCRIPTION_CHANGE: "Description updated",
    TITLE_CHANGE: "Title changed",
    SEVERITY_CHANGE: "Severity changed",
    STATUS_CHANGE: "Status changed",
    COMMENT: "Comment",
  };

  const label = typeLabels[t.type] || t.type;

  if (t.type === "COMMENT") return { label: "Comment", detail: t.message };
  if (t.from && t.to) return { label, detail: `${t.from} → ${t.to}` };
  if (t.to) return { label, detail: t.to };
  return { label, detail: t.message };
}

function roleBadgeClass(role: Role) {
  switch (role) {
    case "OWNER":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "MEMBER":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "VIEWER":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function severityBadgeClass(sev: string) {
  switch (sev) {
    case "SEV1":
      return "bg-red-50 text-red-700 border-red-200";
    case "SEV2":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "SEV3":
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case "SEV4":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "MITIGATING":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "RESOLVED":
      return "bg-green-50 text-green-700 border-green-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function App() {
  const queryClient = useQueryClient();

  const [authed, setAuthed] = useState(hasToken());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const [view, setView] = useState<"incidents" | "audit">("incidents");

  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const canEdit = useMemo(() => {
    return selectedProject?.role === "OWNER" || selectedProject?.role === "MEMBER";
  }, [selectedProject]);

  const projectsQuery = useQuery<ProjectsResponse>({
    queryKey: ["projects"],
    queryFn: listProjects,
    enabled: authed,
  });

  // Normalize incidents response: supports {items: []} or {incidents: []}
  const incidentsQuery = useQuery<any>({
    queryKey: ["incidents", selectedProject?.id],
    queryFn: () => listIncidents(selectedProject!.id),
    enabled: authed && Boolean(selectedProject),
  });

  const incidentDetailQuery = useQuery<any>({
    queryKey: ["incident", selectedProject?.id, selectedIncidentId],
    queryFn: () => getIncident(selectedProject!.id, selectedIncidentId!),
    enabled: Boolean(selectedProject && selectedIncidentId),
  });

  const timelineQuery = useQuery<any>({
    queryKey: ["timeline", selectedProject?.id, selectedIncidentId],
    queryFn: () => getIncidentTimeline(selectedProject!.id, selectedIncidentId!),
    enabled: Boolean(selectedProject && selectedIncidentId),
  });

  // Normalize audit response: supports {items: []} or {events: []}
  const auditQuery = useQuery<any>({
    queryKey: ["audit", selectedProject?.id],
    queryFn: () => getAuditFeed(selectedProject!.id),
    enabled: authed && Boolean(selectedProject),
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      saveToken(res.accessToken);
      setAuthed(true);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setAuthed(false);
    setSelectedProject(null);
    setSelectedIncidentId(null);
    setView("incidents");
    queryClient.clear();
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !selectedProject || !selectedIncidentId) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/v1/projects/${selectedProject.id}/incidents/${selectedIncidentId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({ message: commentText }),
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to add comment");
      }

      setCommentText("");
      await Promise.all([timelineQuery.refetch(), incidentDetailQuery.refetch()]);
    } catch (err: any) {
      alert("Failed to add comment: " + err.message);
    } finally {
      setSubmittingComment(false);
    }
  }

  // ===== Auth screen =====
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>PulseBoard</CardTitle>
            <CardDescription>Sign in to your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Password</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              {authError && <p className="text-sm text-red-600">{authError}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== App shell =====
  const incidents = (incidentsQuery.data?.items ?? incidentsQuery.data?.incidents ?? []) as any[];
  const timelineItems = (timelineQuery.data?.items ?? timelineQuery.data?.updates ?? []) as any[];
  const auditItems = (auditQuery.data?.items ?? auditQuery.data?.events ?? []) as any[];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900">PulseBoard</div>
            <div className="text-sm text-slate-600">Incidents • RBAC • Timeline • Audit</div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar: Projects */}
        <aside className="col-span-12 md:col-span-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Projects</CardTitle>
                {selectedProject && (
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${roleBadgeClass(selectedProject.role)}`}>
                    {selectedProject.role} {canEdit ? "• can edit" : "• read-only"}
                  </span>
                )}
              </div>
              <CardDescription>Select a project to view incidents and audit events.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              {projectsQuery.isLoading && <p className="text-sm text-slate-600">Loading projects...</p>}
              {projectsQuery.isError && (
                <p className="text-sm text-red-600">{(projectsQuery.error as Error).message}</p>
              )}

              {projectsQuery.data?.items?.map((p) => {
                const active = selectedProject?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProject(p);
                      setSelectedIncidentId(null);
                      setView("incidents");
                    }}
                    className={[
                      "w-full text-left rounded-2xl border px-4 py-3 transition",
                      active
                        ? "border-slate-300 bg-slate-50"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-slate-900">{p.name}</div>
                        {p.description && <div className="text-sm text-slate-600 mt-1">{p.description}</div>}
                        <div className="text-xs text-slate-400 mt-2 font-mono">{p.id}</div>
                      </div>
                      <Badge className={roleBadgeClass(p.role)}>{p.role}</Badge>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </aside>

        {/* Main */}
        <main className="col-span-12 md:col-span-8 space-y-6">
          {!selectedProject && (
            <Card>
              <CardHeader>
                <CardTitle>Select a project</CardTitle>
                <CardDescription>Pick a project from the left to view incidents, timeline updates, and audit history.</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          )}

          {selectedProject && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{selectedProject.name}</CardTitle>
                    <CardDescription>{selectedProject.description || "Project dashboard"}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedProject(null);
                      setSelectedIncidentId(null);
                    }}
                  >
                    Back to projects
                  </Button>
                </div>

                <div className="mt-4">
                  <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                    <TabsList>
                      <TabsTrigger tabValue="incidents">Incidents</TabsTrigger>
                      <TabsTrigger tabValue="audit">Audit Feed</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>

              <CardContent>
                {/* Incidents view */}
                {view === "incidents" && (
                  <div className="space-y-4">
                    {incidentsQuery.isLoading && <p className="text-sm text-slate-600">Loading incidents...</p>}
                    {incidentsQuery.isError && (
                      <p className="text-sm text-red-600">{(incidentsQuery.error as Error).message}</p>
                    )}

                    {incidentsQuery.isSuccess && incidents.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                        <div className="text-slate-900 font-medium">No incidents found</div>
                        <div className="text-sm text-slate-600 mt-1">Create one in Postman to demo the UI.</div>
                      </div>
                    )}

                    {incidents.length > 0 && (
                      <div className="space-y-2">
                        {incidents.map((i: any) => (
                          <button
                            key={i.id}
                            type="button"
                            onClick={() => setSelectedIncidentId(i.id)}
                            className={[
                              "w-full text-left rounded-2xl border px-4 py-3 transition hover:bg-slate-50",
                              selectedIncidentId === i.id ? "border-slate-300 bg-slate-50" : "border-slate-200 bg-white",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="font-medium text-slate-900">{i.title}</div>
                              <div className="flex gap-2">
                                <Badge className={severityBadgeClass(i.severity)}>{i.severity}</Badge>
                                <Badge className={statusBadgeClass(i.status)}>{i.status}</Badge>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Detail + timeline */}
                    {selectedIncidentId && (
                      <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-slate-900">Incident Detail</div>
                          <Button variant="ghost" onClick={() => setSelectedIncidentId(null)}>
                            Back to incidents
                          </Button>
                        </div>

                        {incidentDetailQuery.isLoading && <p className="text-sm text-slate-600">Loading incident...</p>}
                        {incidentDetailQuery.isError && (
                          <p className="text-sm text-red-600">{(incidentDetailQuery.error as Error).message}</p>
                        )}

                        {incidentDetailQuery.data?.incident && (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-lg font-semibold text-slate-900">
                              {incidentDetailQuery.data.incident.title}
                            </div>
                            <div className="mt-2 flex gap-2">
                              <Badge className={statusBadgeClass(incidentDetailQuery.data.incident.status)}>
                                Status: {incidentDetailQuery.data.incident.status}
                              </Badge>
                              <Badge className={severityBadgeClass(incidentDetailQuery.data.incident.severity)}>
                                Severity: {incidentDetailQuery.data.incident.severity}
                              </Badge>
                              <Badge className={canEdit ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-700 border-slate-200"}>
                                {canEdit ? "Editable" : "Read-only"}
                              </Badge>
                            </div>

                            {incidentDetailQuery.data.incident.description && (
                              <p className="mt-3 text-slate-700">{incidentDetailQuery.data.incident.description}</p>
                            )}

                            <div className="mt-3 text-xs text-slate-400 font-mono">
                              id: {incidentDetailQuery.data.incident.id}
                            </div>
                          </div>
                        )}

                        {/* Timeline */}
                        <div>
                          <div className="text-sm font-semibold text-slate-900 mb-2">Timeline</div>

                          {timelineQuery.isLoading && <p className="text-sm text-slate-600">Loading timeline...</p>}
                          {timelineQuery.isError && (
                            <p className="text-sm text-red-600">{(timelineQuery.error as Error).message}</p>
                          )}

                          {timelineQuery.isSuccess && timelineItems.length === 0 && (
                            <p className="text-sm text-slate-600">No timeline events yet.</p>
                          )}

                          {timelineItems.length > 0 && (
                            <div className="space-y-2">
                              {timelineItems.map((t: any) => {
                                const formatted = formatTimelineEntry(t);
                                return (
                                  <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="font-medium text-slate-900">{formatted.label}</div>
                                      <div className="text-xs text-slate-400">
                                        {new Date(t.createdAt).toLocaleString()}
                                      </div>
                                    </div>
                                    {formatted.detail && <div className="text-sm text-slate-700 mt-2">{formatted.detail}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Comment form */}
                        {!canEdit ? (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                            🔒 You have read-only access to this incident.
                          </div>
                        ) : (
                          <form onSubmit={handleAddComment} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Add comment</div>
                            <textarea
                              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                              rows={3}
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Share an update, decision, or observation..."
                            />
                            <div className="mt-3 flex justify-end">
                              <Button disabled={submittingComment || !commentText.trim()}>
                                {submittingComment ? "Posting..." : "Post comment"}
                              </Button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Audit view */}
                {view === "audit" && (
                  <div className="space-y-3">
                    {auditQuery.isLoading && <p className="text-sm text-slate-600">Loading audit feed...</p>}
                    {auditQuery.isError && (
                      <p className="text-sm text-red-600">{(auditQuery.error as Error).message}</p>
                    )}

                    {auditQuery.isSuccess && auditItems.length === 0 && (
                      <p className="text-sm text-slate-600">No audit events yet.</p>
                    )}

                    {auditItems.length > 0 && (
                      <div className="space-y-2">
                        {auditItems.map((a: any) => {
                          const action = a.event ?? a.action ?? "AUDIT_EVENT";
                          const timestamp = a.createdAt ?? a.timestamp ?? a.time;
                          const actor = a.actorId ?? a.userId ?? a.actor ?? "unknown";

                          return (
                            <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="font-medium text-slate-900">{action}</div>
                                <div className="text-xs text-slate-400">
                                  {timestamp ? new Date(timestamp).toLocaleString() : ""}
                                </div>
                              </div>
                              <div className="text-sm text-slate-700 mt-2">
                                <span className="text-slate-600">actor:</span>{" "}
                                <span className="font-mono text-xs">{String(actor)}</span>
                              </div>
                              {a.metadata && (
                                <pre className="mt-3 rounded-xl bg-slate-50 p-3 text-xs overflow-x-auto border border-slate-200">
                                  {JSON.stringify(a.metadata, null, 2)}
                                </pre>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
