import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { login, logout, saveToken } from "./auth";
import { listProjects } from "./projects";
import { listIncidents } from "./incidents";
import { getIncident, getIncidentTimeline } from "./incidentDetail";


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

  if (!authed) {
    return (
      <div style={{ padding: 32, maxWidth: 400 }}>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div>
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Projects</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {projectsQuery.isLoading && <p>Loading projects...</p>}
      {projectsQuery.isError && (
        <p style={{ color: "red" }}>
          {(projectsQuery.error as Error).message}
        </p>
      )}

      {projectsQuery.data && (
        <>
          <p style={{ opacity: 0.8 }}>
            Selected: {selectedProject ? selectedProject.name : "(none)"}
          </p>

          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {projectsQuery.data.items.map((p: Project) => (
              <li key={p.id} style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    console.log("Clicked project:", p);
                    setSelectedProject(p);
                    setSelectedIncidentId(null);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 12,
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: selectedProject?.id === p.id ? "#f3f3f3" : "white",
                  }}
                >
                  <div>
                    <strong>{p.name}</strong> <span>({p.role})</span>
                  </div>
                  {p.description && <div>{p.description}</div>}
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{p.id}</div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {selectedProject && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Incidents — {selectedProject.name}</h3>
            <button type="button" onClick={() => setSelectedProject(null)}>
              Back to projects
            </button>
          </div>

          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
            <div>selectedProjectId: {selectedProject?.id}</div>
            <div>incidentsQuery.enabled: {String(Boolean(selectedProject))}</div>
            <div>incidentsQuery.status: {incidentsQuery.status}</div>
            <div>incidentsQuery.fetchStatus: {incidentsQuery.fetchStatus}</div>
            <div>incidentsQuery.data incidents: {String(incidentsQuery.data?.incidents?.length ?? "n/a")}</div>
            <div style={{ color: "red" }}>
              incidentsQuery.error: {(incidentsQuery.error as Error | null)?.message ?? ""}
            </div>
          </div>

          {incidentsQuery.isLoading && <p>Loading incidents...</p>}
          {incidentsQuery.isError && (
            <p style={{ color: "red" }}>{(incidentsQuery.error as Error).message}</p>
          )}

          {incidentsQuery.data && incidentsQuery.data.incidents && (
            <ul style={{ paddingLeft: 0, listStyle: "none" }}>
              {incidentsQuery.data.incidents.map((i) => (
                <li key={i.id} style={{ marginBottom: 10 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedIncidentId(i.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: 12,
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: "white",
                    }}
                  >
                    <strong>{i.title}</strong>{" "}
                    <span>
                      [{i.severity} | {i.status}]
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedProject && selectedIncidentId && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #eee" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>Incident Detail</h3>
                <button type="button" onClick={() => setSelectedIncidentId(null)}>
                  Back to incidents
                </button>
              </div>

              {incidentDetailQuery.isLoading && <p>Loading incident...</p>}
              {incidentDetailQuery.isError && (
                <p style={{ color: "red" }}>{(incidentDetailQuery.error as Error).message}</p>
              )}

              {incidentDetailQuery.data && (
                <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {incidentDetailQuery.data.incident.title}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <strong>Status:</strong> {incidentDetailQuery.data.incident.status}
                    {"  "}
                    <strong>Severity:</strong> {incidentDetailQuery.data.incident.severity}
                  </div>
                  {incidentDetailQuery.data.incident.description && (
                    <p style={{ marginTop: 8 }}>{incidentDetailQuery.data.incident.description}</p>
                  )}
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    id: {incidentDetailQuery.data.incident.id}
                  </div>
                </div>
              )}

              <h4>Timeline</h4>

              {timelineQuery.isLoading && <p>Loading timeline...</p>}
              {timelineQuery.isError && (
                <p style={{ color: "red" }}>{(timelineQuery.error as Error).message}</p>
              )}

              {timelineQuery.data && (
                <ul style={{ paddingLeft: 0, listStyle: "none" }}>
                  {timelineQuery.data.items.map((t) => (
                    <li
                      key={t.id}
                      style={{
                        padding: 12,
                        border: "1px solid #eee",
                        borderRadius: 8,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{t.type}</div>

                      {(t.from || t.to) && (
                        <div style={{ fontSize: 14 }}>
                          {t.from ? <span><strong>from:</strong> {t.from} </span> : null}
                          {t.to ? <span><strong>to:</strong> {t.to}</span> : null}
                        </div>
                      )}

                      {t.message && <div style={{ marginTop: 6 }}>{t.message}</div>}

                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                        {new Date(t.createdAt).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
