import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listIncidents, getIncident, getIncidentTimeline, addComment } from "./incidents.api";
import { useSelectedProject } from "./useSelectedProject";

export function IncidentsPage() {
  const { projectId } = useSelectedProject();
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  const incidentsQ = useQuery({
    queryKey: ["incidents", projectId],
    queryFn: () => listIncidents(projectId!),
    enabled: Boolean(projectId),
  });

  const detailQ = useQuery({
    queryKey: ["incident", projectId, incidentId],
    queryFn: () => getIncident(projectId!, incidentId!),
    enabled: Boolean(projectId && incidentId),
  });

  const timelineQ = useQuery({
    queryKey: ["timeline", projectId, incidentId],
    queryFn: () => getIncidentTimeline(projectId!, incidentId!),
    enabled: Boolean(projectId && incidentId),
  });

  const incidents = incidentsQ.data?.incidents ?? [];

  if (!projectId) {
    return <div className="text-sm text-muted-foreground">Select a project first.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: list */}
      <div className="space-y-3">
        <div className="text-lg font-semibold">Incidents</div>
        {incidentsQ.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {incidentsQ.isError && <div className="text-sm text-red-500">{(incidentsQ.error as Error).message}</div>}

        {incidents.map((i) => (
          <button
            key={i.id}
            onClick={() => setIncidentId(i.id)}
            className={`w-full text-left rounded-xl border p-4 hover:bg-muted/30 transition ${
              incidentId === i.id ? "bg-muted/50" : ""
            }`}
          >
            <div className="font-medium">{i.title}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {i.severity} • {i.status}
            </div>
          </button>
        ))}
      </div>

      {/* Right: detail */}
      <div className="space-y-3">
        <div className="text-lg font-semibold">Detail</div>
        {!incidentId && <div className="text-sm text-muted-foreground">Pick an incident.</div>}

        {incidentId && (
          <>
            {detailQ.isLoading && <div className="text-sm text-muted-foreground">Loading detail…</div>}
            {detailQ.isError && <div className="text-sm text-red-500">{(detailQ.error as Error).message}</div>}

            {detailQ.data?.incident && (
              <div className="rounded-xl border p-4">
                <div className="font-semibold">{detailQ.data.incident.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {detailQ.data.incident.severity} • {detailQ.data.incident.status}
                </div>
                {detailQ.data.incident.description && (
                  <div className="text-sm mt-3">{detailQ.data.incident.description}</div>
                )}
              </div>
            )}

            <div className="rounded-xl border p-4">
              <div className="font-semibold mb-2">Timeline</div>

              {timelineQ.isLoading && <div className="text-sm text-muted-foreground">Loading timeline…</div>}
              {timelineQ.isError && <div className="text-sm text-red-500">{(timelineQ.error as Error).message}</div>}

              <div className="space-y-2">
                {(timelineQ.data?.items ?? []).map((t: any) => (
                  <div key={t.id} className="rounded-lg border p-3">
                    <div className="text-sm font-medium">{t.type}</div>
                    {t.message && <div className="text-sm text-muted-foreground mt-1">{t.message}</div>}
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* comment */}
              <form
                className="mt-4 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!comment.trim() || !incidentId) return;
                  setPosting(true);
                  try {
                    await addComment(projectId, incidentId, comment.trim());
                    setComment("");
                    await Promise.all([timelineQ.refetch(), detailQ.refetch()]);
                  } finally {
                    setPosting(false);
                  }
                }}
              >
                <input
                  className="flex-1 rounded-xl border bg-transparent px-3 py-2 text-sm"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment…"
                />
                <button
                  className="rounded-xl border px-3 py-2 text-sm hover:bg-muted/30"
                  disabled={posting}
                >
                  {posting ? "Posting…" : "Post"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
