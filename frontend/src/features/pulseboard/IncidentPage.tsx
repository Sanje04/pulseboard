import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listIncidents, getIncident, getIncidentTimeline, addComment, createIncident, deleteIncident, type IncidentSeverity } from "./incidents.api";
import { useSelectedProject } from "./useSelectedProject";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

export function IncidentsPage() {
  const { projectId, currentProject } = useSelectedProject();
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    severity: "SEV3" as IncidentSeverity,
  });

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

  const createMutation = useMutation({
    mutationFn: async (input: { title: string; description?: string; severity: IncidentSeverity }) => {
      console.log('📤 Creating incident:', { 
        projectId, 
        payload: input,
        url: `/projects/${projectId}/incidents`
      });
      try {
        const result = await createIncident(projectId!, input);
        console.log('✅ Incident created:', result);
        return result;
      } catch (err) {
        console.error('❌ Failed to create incident:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incidents", projectId] });
      setIncidentId(data.incident.id);
      setDialogOpen(false);
      setNewIncident({ title: "", description: "", severity: "SEV3" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ incidentId }: { incidentId: string }) => {
      console.log('🗑️ Deleting incident:', incidentId);
      return deleteIncident(projectId!, incidentId);
    },
    onSuccess: (_, variables) => {
      console.log('✅ Incident deleted');
      queryClient.invalidateQueries({ queryKey: ["incidents", projectId] });
      // Clear selection if deleted incident was selected
      if (incidentId === variables.incidentId) {
        setIncidentId(null);
      }
      setDeleteConfirmId(null);
    },
    onError: (err) => {
      console.error('❌ Failed to delete incident:', err);
    },
  });

  const canCreateIncident = currentProject?.role === "OWNER" || currentProject?.role === "MEMBER";

  if (!projectId) {
    return <div className="text-sm text-muted-foreground">Select a project first.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Incidents</div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border hover:bg-muted/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canCreateIncident}
                title={!canCreateIncident ? "Only OWNER and MEMBER can create incidents" : "Create new incident"}
              >
                <Plus size={16} />
                New Incident
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-125">
              <DialogHeader>
                <DialogTitle>Create New Incident</DialogTitle>
                <DialogDescription>
                  Fill in the details below to create a new incident.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newIncident.title.trim()) return;
                  createMutation.mutate({
                    title: newIncident.title.trim(),
                    description: newIncident.description.trim() || undefined,
                    severity: newIncident.severity,
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                    required
                    placeholder="Brief description of the incident"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm min-h-20"
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                    placeholder="Additional details..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Severity <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`cursor-pointer rounded-lg border-2 p-3 transition ${
                        newIncident.severity === "SEV1"
                          ? "border-red-500 bg-red-950 bg-opacity-20"
                          : "border-border hover:bg-red-950 hover:bg-opacity-10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value="SEV1"
                        checked={newIncident.severity === "SEV1"}
                        onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as IncidentSeverity })}
                        className="sr-only"
                      />
                      <div className="font-medium text-sm">SEV1</div>
                      <div className="text-xs text-muted-foreground">Critical</div>
                    </label>

                    <label
                      className={`cursor-pointer rounded-lg border-2 p-3 transition ${
                        newIncident.severity === "SEV2"
                          ? "border-orange-500 bg-orange-950 bg-opacity-20"
                          : "border-border hover:bg-orange-950 hover:bg-opacity-10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value="SEV2"
                        checked={newIncident.severity === "SEV2"}
                        onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as IncidentSeverity })}
                        className="sr-only"
                      />
                      <div className="font-medium text-sm">SEV2</div>
                      <div className="text-xs text-muted-foreground">High</div>
                    </label>

                    <label
                      className={`cursor-pointer rounded-lg border-2 p-3 transition ${
                        newIncident.severity === "SEV3"
                          ? "border-yellow-500 bg-yellow-950 bg-opacity-20"
                          : "border-border hover:bg-yellow-950 hover:bg-opacity-10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value="SEV3"
                        checked={newIncident.severity === "SEV3"}
                        onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as IncidentSeverity })}
                        className="sr-only"
                      />
                      <div className="font-medium text-sm">SEV3</div>
                      <div className="text-xs text-muted-foreground">Medium</div>
                    </label>

                    <label
                      className={`cursor-pointer rounded-lg border-2 p-3 transition ${
                        newIncident.severity === "SEV4"
                          ? "border-blue-500 bg-blue-950 bg-opacity-20"
                          : "border-border hover:bg-blue-950 hover:bg-opacity-10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value="SEV4"
                        checked={newIncident.severity === "SEV4"}
                        onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as IncidentSeverity })}
                        className="sr-only"
                      />
                      <div className="font-medium text-sm">SEV4</div>
                      <div className="text-xs text-muted-foreground">Low</div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="px-4 py-2 text-sm rounded-lg border hover:bg-muted/30 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
                    disabled={!newIncident.title.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Incident"}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {incidentsQ.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {incidentsQ.isError && <div className="text-sm text-red-500">{(incidentsQ.error as Error).message}</div>}

        {incidents.map((i) => (
          <div
            key={i.id}
            className={`relative rounded-xl border p-4 transition ${
              incidentId === i.id ? "bg-muted/50" : ""
            }`}
          >
            <button
              onClick={() => setIncidentId(i.id)}
              className="w-full text-left hover:opacity-80 transition"
            >
              <div className="font-medium pr-8">{i.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {i.severity} • {i.status}
              </div>
            </button>
            
            {canCreateIncident && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(i.id);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-red-950 hover:text-red-400 transition"
                title="Delete incident"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Delete Incident</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this incident? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-muted/30 transition"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmId) {
                    deleteMutation.mutate({ incidentId: deleteConfirmId });
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
