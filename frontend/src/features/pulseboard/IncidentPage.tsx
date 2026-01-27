import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listIncidents, getIncident, getIncidentTimeline, addComment, createIncident, deleteIncident, updateIncident, type IncidentSeverity, type IncidentStatus } from "./incidents.api";
import { useSelectedProject } from "./useSelectedProject";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, AlertCircle, User, MessageSquare, ArrowRightLeft, AlertTriangle } from "lucide-react";

type IncidentsPageProps = {
  projectId?: string;
  initialIncidentId?: string;
};

export function IncidentsPage({ projectId: projectIdFromRoute, initialIncidentId }: IncidentsPageProps) {
  const { projectId, currentProject } = useSelectedProject(projectIdFromRoute);
  const [incidentId, setIncidentId] = useState<string | null>(() => initialIncidentId ?? null);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<{ status?: IncidentStatus; severity?: IncidentSeverity } | null>(null);
  const queryClient = useQueryClient();

  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    severity: "SEV3" as IncidentSeverity,
  });

  // Keep local incident selection in sync with URL-driven initialIncidentId
  useEffect(() => {
    setIncidentId(initialIncidentId ?? null);
    setPendingUpdates(null);
  }, [initialIncidentId]);

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
    queryFn: async () => {
      const result = await getIncidentTimeline(projectId!, incidentId!);
      console.log('📋 Timeline data:', result);
      return result;
    },
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

  const updateMutation = useMutation({
    mutationFn: ({ incidentId, updates }: { incidentId: string; updates: { status?: IncidentStatus; severity?: IncidentSeverity } }) => {
      console.log('✏️ Updating incident:', { incidentId, updates });
      return updateIncident(projectId!, incidentId, updates);
    },
    onSuccess: () => {
      console.log('✅ Incident updated - Refetching timeline...');
      queryClient.invalidateQueries({ queryKey: ["incident", projectId, incidentId] });
      queryClient.invalidateQueries({ queryKey: ["timeline", projectId, incidentId] });
      queryClient.invalidateQueries({ queryKey: ["incidents", projectId] });
      
      // Force refetch timeline to see new changes
      setTimeout(() => {
        timelineQ.refetch().then((result) => {
          console.log('🔄 Timeline refetched:', result.data);
        });
      }, 500);
    },
    onError: (err) => {
      console.error('❌ Failed to update incident:', err);
    },
  });

  const canCreateIncident = currentProject?.role === "OWNER" || currentProject?.role === "MEMBER";
  const canEditIncident = canCreateIncident;

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
              onClick={() => {
                setIncidentId(i.id);
                setPendingUpdates(null); // Clear pending updates when switching incidents
              }}
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
              <>
                {/* Read-only callout for viewers */}
                {!canEditIncident && (
                  <div className="rounded-lg border border-blue-900 bg-blue-950 bg-opacity-20 p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-blue-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-400">
                      <strong>Read-only:</strong> You can view this incident but cannot make changes.
                    </div>
                  </div>
                )}

                <div className="rounded-xl border p-4 space-y-4">
                  <div className="font-semibold">{detailQ.data.incident.title}</div>
                  
                  {/* Status and Severity Controls */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Status Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Status</label>
                      <select
                        value={pendingUpdates?.status ?? detailQ.data.incident.status}
                        onChange={(e) => {
                          setPendingUpdates(prev => ({
                            ...prev,
                            status: e.target.value as IncidentStatus
                          }));
                        }}
                        disabled={!canEditIncident || updateMutation.isPending}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="OPEN">Open</option>
                        <option value="MITIGATING">Mitigating</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </div>

                    {/* Severity Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Severity</label>
                      <select
                        value={pendingUpdates?.severity ?? detailQ.data.incident.severity}
                        onChange={(e) => {
                          setPendingUpdates(prev => ({
                            ...prev,
                            severity: e.target.value as IncidentSeverity
                          }));
                        }}
                        disabled={!canEditIncident || updateMutation.isPending}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="SEV1">SEV1 - Critical</option>
                        <option value="SEV2">SEV2 - High</option>
                        <option value="SEV3">SEV3 - Medium</option>
                        <option value="SEV4">SEV4 - Low</option>
                      </select>
                    </div>
                  </div>

                  {/* Save/Cancel buttons - show when there are pending changes */}
                  {pendingUpdates && canEditIncident && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          updateMutation.mutate(
                            { incidentId: incidentId!, updates: pendingUpdates },
                            {
                              onSuccess: () => {
                                setPendingUpdates(null);
                              }
                            }
                          );
                        }}
                        disabled={
                          updateMutation.isPending ||
                          (pendingUpdates.status === detailQ.data.incident.status &&
                           pendingUpdates.severity === detailQ.data.incident.severity)
                        }
                        className="flex-1 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => setPendingUpdates(null)}
                        disabled={updateMutation.isPending}
                        className="px-4 py-2 text-sm rounded-lg border hover:bg-muted/30 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {detailQ.data.incident.description && (
                    <div className="pt-2 border-t">
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">Description</div>
                      <div className="text-sm">{detailQ.data.incident.description}</div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="rounded-xl border p-4">
              <div className="font-semibold mb-2">Timeline</div>

              {timelineQ.isLoading && <div className="text-sm text-muted-foreground">Loading timeline…</div>}
              {timelineQ.isError && <div className="text-sm text-red-500">{(timelineQ.error as Error).message}</div>}

              <div className="space-y-2">
                {(timelineQ.data?.items ?? []).map((t: any) => {
                  // Helper function to get icon and label for event type
                  const getEventDisplay = () => {
                    switch (t.type) {
                      case "STATUS_CHANGE":
                        return {
                          icon: <ArrowRightLeft size={14} className="text-blue-500" />,
                          label: "Status changed",
                          showBadges: true
                        };
                      case "SEVERITY_CHANGE":
                        return {
                          icon: <AlertTriangle size={14} className="text-orange-500" />,
                          label: "Severity changed",
                          showBadges: true
                        };
                      case "COMMENT":
                        return {
                          icon: <MessageSquare size={14} className="text-green-500" />,
                          label: "Comment added",
                          showBadges: false
                        };
                      case "TITLE_CHANGE":
                        return {
                          icon: <ArrowRightLeft size={14} className="text-purple-500" />,
                          label: "Title changed",
                          showBadges: true
                        };
                      case "DESCRIPTION_CHANGE":
                        return {
                          icon: <ArrowRightLeft size={14} className="text-gray-500" />,
                          label: "Description changed",
                          showBadges: false
                        };
                      default:
                        return {
                          icon: <MessageSquare size={14} className="text-muted-foreground" />,
                          label: t.type,
                          showBadges: false
                        };
                    }
                  };

                  const eventDisplay = getEventDisplay();
                  
                  return (
                    <div key={t.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {eventDisplay.icon}
                          <span className="text-sm font-medium">{eventDisplay.label}</span>
                        </div>
                        {t.createdBy && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User size={14} />
                            <span>{typeof t.createdBy === 'string' ? t.createdBy : t.createdBy.name || t.createdBy.email}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Show from/to badges for changes */}
                      {eventDisplay.showBadges && t.from && t.to && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs">
                            {t.from}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-xs">
                            {t.to}
                          </span>
                        </div>
                      )}
                      
                      {/* Show message for comments or other events without badges */}
                      {t.message && !eventDisplay.showBadges && (
                        <div className="text-sm text-muted-foreground mt-2 pl-6">{t.message}</div>
                      )}
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(t.createdAt).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
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
