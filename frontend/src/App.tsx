import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { login, logout, saveToken } from "./auth";
import { listProjects } from "./projects";
import { listIncidents } from "./incidents";
import { getIncident, getIncidentTimeline } from "./incidentDetail";
import { getAuditFeed } from "./audit";


function hasToken() {
  return Boolean(localStorage.getItem("accessToken"));
}

interface Project {
  id: string;
  name: string;
  role: string;
  description?: string;
}

interface ProjectsResponse {
  items: Project[];
}

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
}

interface IncidentsResponse {
  incidents: Incident[];
}

export default function App() {
  const [authed, setAuthed] = useState(hasToken());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [view, setView] = useState<"incidents" | "audit">("incidents");


  const queryClient = useQueryClient();

  const projectsQuery = useQuery<ProjectsResponse>({
    queryKey: ["projects"],
    queryFn: listProjects,
    enabled: authed,
  });

  const incidentsQuery = useQuery<IncidentsResponse>({
    queryKey: ["incidents", selectedProject?.id],
    queryFn: () => listIncidents(selectedProject!.id),
    enabled: authed && selectedProject !== null,
  });

  const incidentDetailQuery = useQuery({
    queryKey: ["incident", selectedProject?.id, selectedIncidentId],
    queryFn: () => getIncident(selectedProject!.id, selectedIncidentId!),
    enabled: Boolean(selectedProject && selectedIncidentId),
  });

  const timelineQuery = useQuery({
    queryKey: ["timeline", selectedProject?.id, selectedIncidentId],
    queryFn: () => getIncidentTimeline(selectedProject!.id, selectedIncidentId!),
    enabled: Boolean(selectedProject && selectedIncidentId),
  });

  const auditQuery = useQuery({
    queryKey: ["audit", selectedProject?.id],
    queryFn: () => getAuditFeed(selectedProject!.id),
    enabled: authed && selectedProject !== null,
  });


  function formatTimelineEntry(t: any) {
    const typeLabels: Record<string, string> = {
      CREATED: "Incident created",
      DESCRIPTION_CHANGE: "Description updated",
      SEVERITY_CHANGE: "Severity changed",
      STATUS_CHANGE: "Status changed",
      COMMENT: "Comment",
    };

    const label = typeLabels[t.type] || t.type;

    if (t.type === "COMMENT") {
      return { label: "Comment", detail: t.message };
    }

    if (t.from && t.to) {
      return { label, detail: `${t.from} → ${t.to}` };
    }

    if (t.to) {
      return { label, detail: t.to };
    }

    return { label, detail: t.message };
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      saveToken(res.accessToken);
      setAuthed(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setAuthed(false);
    queryClient.clear(); // or queryClient.removeQueries({ queryKey: ["projects"] })
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !selectedProject || !selectedIncidentId) return;

    setSubmittingComment(true);
    try {
      await fetch(
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
      setCommentText("");
      await timelineQuery.refetch();
      await incidentDetailQuery.refetch();
    } catch (err: any) {
      alert("Failed to add comment: " + err.message);
    } finally {
      setSubmittingComment(false);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-white text-2xl font-bold">PB</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">PulseBoard</h2>
            <p className="text-gray-500">Incident Management Platform</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                required
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
              <strong className="font-semibold">Error: </strong>{error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">PB</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Projects</h1>
                <p className="text-gray-500 text-sm mt-0.5">Manage your incident tracking projects</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all shadow-sm hover:shadow"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </span>
            </button>
          </div>
          {projectsQuery.data && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{projectsQuery.data.items.length}</div>
                  <div className="text-sm text-gray-500 mt-1">Total Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">{projectsQuery.data.items.filter(p => p.role === 'OWNER').length}</div>
                  <div className="text-sm text-gray-500 mt-1">Owned</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{projectsQuery.data.items.filter(p => p.role === 'MEMBER').length}</div>
                  <div className="text-sm text-gray-500 mt-1">Member</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {projectsQuery.isLoading && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading projects...</p>
          </div>
        )}
        {projectsQuery.isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {(projectsQuery.error as Error).message}
          </div>
        )}

      {projectsQuery.data && (
        <div className="space-y-4">
          {projectsQuery.data.items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No projects yet</h3>
              <p className="text-gray-500">Get started by creating your first project</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projectsQuery.data.items.map((p: Project) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    console.log("Clicked project:", p);
                    setSelectedProject(p);
                    setSelectedIncidentId(null);
                  }}
                  className={`group bg-white rounded-2xl shadow-md p-6 text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 ${
                    selectedProject?.id === p.id 
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl' 
                      : 'border-transparent hover:border-blue-200'
                  }`}
                  >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                      {p.description && <p className="text-gray-600 text-sm leading-relaxed">{p.description}</p>}
                    </div>
                    <span className={`ml-4 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                      p.role === 'OWNER' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                      p.role === 'MEMBER' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {p.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 font-mono">{p.id}</p>
                    <svg className={`w-5 h-5 transition-transform ${
                      selectedProject?.id === p.id ? 'text-blue-600 rotate-90' : 'text-gray-400 group-hover:translate-x-1'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedProject && (
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b-2 border-gray-100">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{selectedProject.name}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedProject.role === 'OWNER' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                  selectedProject.role === 'MEMBER' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {selectedProject.role}
                </span>
              </div>
              {selectedProject.description && (
                <p className="text-gray-600">{selectedProject.description}</p>
              )}
            </div>
            <button 
              type="button" 
              onClick={() => setSelectedProject(null)}
              className="flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all shadow-sm hover:shadow whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to projects</span>
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex gap-3 mb-8">
            <button
              type="button"
              onClick={() => {
                setView("incidents");
                setSelectedIncidentId(null);
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
                view === "incidents" 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-lg'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Incidents</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setView("audit");
                setSelectedIncidentId(null);
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
                view === "audit" 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-lg'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Audit Feed</span>
            </button>
          </div>

          {/* Incidents View */}
          {view === "incidents" && (
            <>

          {incidentsQuery.isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-3">Loading incidents...</p>
            </div>
          )}
          {incidentsQuery.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {(incidentsQuery.error as Error).message}
            </div>
          )}

          {incidentsQuery.data && incidentsQuery.data.incidents && (
            incidentsQuery.data.incidents.length === 0 ? (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 text-center border-2 border-dashed border-blue-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No incidents found</h3>
                <p className="text-gray-600">This project has no active incidents</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incidentsQuery.data.incidents.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setSelectedIncidentId(i.id)}
                    className="group w-full text-left p-5 bg-white border-2 border-gray-200 rounded-xl hover:shadow-xl hover:border-blue-400 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors flex-1">{i.title}</h4>
                      <div className="flex gap-2 flex-shrink-0">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                          i.severity === 'SEV1' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' :
                          i.severity === 'SEV2' ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white' :
                          i.severity === 'SEV3' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {i.severity}
                        </span>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                          i.status === 'OPEN' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                          i.status === 'MITIGATING' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                          i.status === 'RESOLVED' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {i.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}

          {selectedProject && selectedIncidentId && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Incident Detail</h3>
                <button 
                  type="button" 
                  onClick={() => setSelectedIncidentId(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  ← Back to incidents
                </button>
              </div>

              {incidentDetailQuery.isLoading && (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-3">Loading incident...</p>
                </div>
              )}
              {incidentDetailQuery.isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {(incidentDetailQuery.error as Error).message}
                </div>
              )}

              {incidentDetailQuery.data && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 mb-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-3">
                    {incidentDetailQuery.data.incident.title}
                  </h4>
                  <div className="flex gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      incidentDetailQuery.data.incident.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                      incidentDetailQuery.data.incident.status === 'MITIGATING' ? 'bg-purple-100 text-purple-700' :
                      incidentDetailQuery.data.incident.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {incidentDetailQuery.data.incident.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      incidentDetailQuery.data.incident.severity === 'SEV1' ? 'bg-red-100 text-red-700' :
                      incidentDetailQuery.data.incident.severity === 'SEV2' ? 'bg-orange-100 text-orange-700' :
                      incidentDetailQuery.data.incident.severity === 'SEV3' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {incidentDetailQuery.data.incident.severity}
                    </span>
                  </div>
                  {incidentDetailQuery.data.incident.description && (
                    <p className="text-gray-700 mb-3">{incidentDetailQuery.data.incident.description}</p>
                  )}
                  <p className="text-xs text-gray-500 font-mono">
                    ID: {incidentDetailQuery.data.incident.id}
                  </p>
                </div>
              )}

              {/* Role-aware actions */}
              {selectedProject.role === "VIEWER" ? (
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6 text-gray-600 text-center">
                  🔒 Read-only access - You cannot modify this incident
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 mb-6">
                  <button 
                    type="button"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm hover:shadow-md"
                  >
                    💬 Add Comment
                  </button>
                  <button 
                    type="button"
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition shadow-sm hover:shadow-md"
                  >
                    🔄 Change Status
                  </button>
                  <button 
                    type="button"
                    className="px-5 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition shadow-sm hover:shadow-md"
                  >
                    ⚠️ Update Severity
                  </button>
                </div>
              )}

              <h4 className="text-lg font-bold text-gray-800 mt-6 mb-4">📅 Timeline</h4>

              {timelineQuery.isLoading && (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-3">Loading timeline...</p>
                </div>
              )}
              {timelineQuery.isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {(timelineQuery.error as Error).message}
                </div>
              )}

              {timelineQuery.data && (
                <div className="space-y-3">
                  {timelineQuery.data.items.map((t) => {
                    const formatted = formatTimelineEntry(t);
                    return (
                      <div
                        key={t.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
                      >
                        <div className="font-semibold text-gray-800">{formatted.label}</div>

                        {formatted.detail && (
                          <div className="text-sm text-gray-600 mt-2">{formatted.detail}</div>
                        )}

                        <div className="text-xs text-gray-400 mt-3">
                          {new Date(t.createdAt).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Comment Form */}
              {selectedProject.role !== "VIEWER" && (
                <form onSubmit={handleAddComment} className="mt-6 bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">💬 Add a comment</label>
                  <textarea
                    placeholder="Share an update, note, or observation..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="mt-3 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-sm hover:shadow-md"
                  >
                    {submittingComment ? "Posting..." : "Post Comment"}
                  </button>
                </form>
              )}
            </div>
          )}
          </>
          )}

          {/* Audit Feed View */}
          {view === "audit" && (
            <>
              <h4 className="text-lg font-bold text-gray-800 mb-4">📊 Audit Feed</h4>

              {auditQuery.isLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-3">Loading audit feed...</p>
                </div>
              )}
              {auditQuery.isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {(auditQuery.error as Error).message}
                </div>
              )}

              {auditQuery.data && auditQuery.data.items && (
                <div className="space-y-3">
                  {auditQuery.data.items.map((a: any) => (
                    <div
                      key={a.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-semibold text-gray-800">{a.action}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(a.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        <strong>User:</strong> <span className="font-mono text-xs">{a.userId}</span>
                      </div>
                      {a.metadata && (
                        <div className="mt-3 bg-gray-50 rounded p-2 text-xs font-mono text-gray-600 overflow-x-auto">
                          {JSON.stringify(a.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
