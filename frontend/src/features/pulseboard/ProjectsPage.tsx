import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Plus, Trash2, LogOut } from "lucide-react";
import { acceptProjectInvite, declineProjectInvite, createProject, deleteProject, leaveProject, listProjects, updateProject, type Project } from "./projects.api";
import { useSelectedProject } from "./useSelectedProject";
import { listIncidents } from "@/incidents";
import { getProjectUsers } from "@/users";
import { listTasks } from "@/tasks";

export function ProjectsPage() {
  const q = useQuery<Awaited<ReturnType<typeof listProjects>>>({
    queryKey: ["projects"],
    queryFn: listProjects,
  });
  const { projectId, setProjectId } = useSelectedProject();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [actionProject, setActionProject] = useState<Project | null>(null);
  const [inviteProject, setInviteProject] = useState<Project | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: (input: { name: string; description?: string }) => createProject(input),
    onSuccess: (data) => {
      // Refresh list and auto-select the new project
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProjectId(data.project.id);
      setDialogOpen(false);
      setNewProject({ name: "", description: "" });
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: (id: string) => acceptProjectInvite(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (projectId === id) {
        setProjectId(null);
      }
      setInviteProject(null);
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: (id: string) => declineProjectInvite(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (projectId === id) {
        setProjectId(null);
      }
      setInviteProject(null);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (projectId === id) {
        setProjectId(null);
      }
      setActionProject(null);
    },
  });

  const leaveProjectMutation = useMutation({
    mutationFn: (id: string) => leaveProject(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (projectId === id) {
        setProjectId(null);
      }
      setActionProject(null);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: (vars: { id: string; description: string | null }) =>
      updateProject(vars.id, { description: vars.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDescriptionDraft("");
    },
  });
  const projects = q.data?.items ?? [];

  const selectedProject: Project | null = useMemo(
    () => (projectId ? projects.find((p) => p.id === projectId) ?? null : null),
    [projectId, projects],
  );

  const isOwner = String(selectedProject?.role ?? "").toUpperCase() === "OWNER";

  const incidentsQuery = useQuery({
    queryKey: ["project-incidents", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      if (!projectId) return null;
      return listIncidents(projectId);
    },
  });

  const usersQuery = useQuery({
    queryKey: ["project-users-count", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      if (!projectId) return [];
      return getProjectUsers(projectId);
    },
  });

  const tasksQuery = useQuery({
    queryKey: ["project-tasks-count", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      if (!projectId) return [];
      return listTasks(projectId);
    },
  });

  const incidentCount = (() => {
    const data: any = incidentsQuery.data as any;
    if (!data) return 0;
    const items = Array.isArray(data) ? data : data.items ?? data;
    return Array.isArray(items) ? items.length : 0;
  })();

  const userCount = usersQuery.data?.length ?? 0;
  const taskCount = tasksQuery.data?.length ?? 0;

  useEffect(() => {
    if (selectedProject && detailsOpen) {
      setDescriptionDraft(selectedProject.description ?? "");
    }
  }, [selectedProject, detailsOpen]);

  if (q.isLoading) return <div className="text-sm text-muted-foreground">Loading projects…</div>;
  if (q.isError) return <div className="text-sm text-red-500">{(q.error as Error).message}</div>;
  const invitedProjects = projects.filter((p) => p.membershipStatus === "INVITED");
  const activeProjects = projects.filter((p) => p.membershipStatus !== "INVITED");
  
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-semibold">Projects</div>
          <div className="text-sm text-muted-foreground">Select a project to view incidents.</div>
        </div>
        <div className="flex items-center gap-2">
          {projectId && (
            <button
              onClick={() => setProjectId(null)}
              className="text-sm px-3 py-1.5 rounded-lg border hover:bg-muted/30 transition"
            >
              Clear Selection
            </button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border hover:bg-muted/30 transition disabled:opacity-50"
                disabled={createMutation.isPending}
              >
                <Plus size={16} />
                New Project
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-125">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Give your project a name and optional description.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newProject.name.trim()) return;
                  createMutation.mutate({
                    name: newProject.name.trim(),
                    description: newProject.description.trim() || undefined,
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    required
                    placeholder="PulseBoard Core"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm min-h-20"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="What is this project for?"
                  />
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
                    disabled={!newProject.name.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3">
        {activeProjects.map((p) => (
          <div
            key={p.id}
            onClick={() => {
              console.log("[ProjectsPage] Active project clicked", p);
              if (projectId === p.id) {
                // If this project is already selected, open the details popup
                setDetailsOpen(true);
              } else {
                // First click: just select the project
                setProjectId(p.id);
                setDetailsOpen(false);
              }
            }}
            className={`cursor-pointer rounded-xl border p-4 transition ${
              projectId === p.id ? "bg-muted/50 border-muted-foreground/30" : "hover:bg-muted/30"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{p.name}</div>
                {p.description && <div className="text-sm text-muted-foreground mt-1">{p.description}</div>}
                <div className="text-xs text-muted-foreground mt-2 font-mono">{p.id}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-xs rounded-full border px-2 py-1">{p.role}</div>
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionProject(p);
                  }}
                  title={
                    String(p.role).toUpperCase() === "OWNER"
                      ? "Delete project"
                      : "Leave project"
                  }
                >
                  {String(p.role).toUpperCase() === "OWNER" ? (
                    <>
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-3 w-3" />
                      <span>Leave</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {invitedProjects.length > 0 && (
        <div className="space-y-2">
          <div className="mt-4 text-sm font-medium">Pending invitations (INVITED)</div>
          <div className="grid gap-3">
            {invitedProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  console.log("[ProjectsPage] Invited project clicked", p);
                  setInviteProject(p);
                  setProjectId(p.id);
                }}
                className="cursor-pointer rounded-xl border border-emerald-500/70 bg-emerald-500/10 p-4 flex items-center justify-between gap-3 hover:bg-emerald-500/20 transition"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  {p.description && (
                    <div className="text-sm text-muted-foreground mt-1">{p.description}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2 font-mono">{p.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs rounded-full border px-2 py-1">(INVITED)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog
        open={!!selectedProject && detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setDescriptionDraft("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <DialogTitle className="text-base">Project details</DialogTitle>
                <span className="text-xs rounded-full border px-2 py-1">{selectedProject.role}</span>
              </div>

              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Project name</div>
                  <div className="font-medium">{selectedProject.name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Created at</div>
                  <div>
                    {selectedProject.createdAt
                      ? new Date(selectedProject.createdAt).toLocaleString()
                      : "–"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Incidents</div>
                  <div>
                    {incidentsQuery.isLoading
                      ? "Loading…"
                      : incidentsQuery.isError
                      ? "Error loading incidents"
                      : `${incidentCount} incident${incidentCount === 1 ? "" : "s"}`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Users</div>
                  <div>
                    {usersQuery.isLoading
                      ? "Loading…"
                      : usersQuery.isError
                      ? "Error loading users"
                      : `${userCount} user${userCount === 1 ? "" : "s"}`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Tasks</div>
                  <div>
                    {tasksQuery.isLoading
                      ? "Loading…"
                      : tasksQuery.isError
                      ? "Error loading tasks"
                      : `${taskCount} task${taskCount === 1 ? "" : "s"}`}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Description{isOwner ? " (owner can edit)" : ""}
                </div>
                {isOwner ? (
                  <textarea
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-20"
                    value={descriptionDraft}
                    onChange={(e) => setDescriptionDraft(e.target.value)}
                    placeholder="Add a description for this project"
                  />
                ) : (
                  <p className="text-sm">
                    {selectedProject.description &&
                    selectedProject.description.trim().length > 0
                      ? selectedProject.description
                      : "No description yet."}
                  </p>
                )}
              </div>

              {isOwner && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    disabled={
                      !selectedProject ||
                      updateProjectMutation.isPending ||
                      descriptionDraft.trim() === (selectedProject.description ?? "").trim()
                    }
                    onClick={() => {
                      if (!selectedProject) return;
                      updateProjectMutation.mutate({
                        id: selectedProject.id,
                        description:
                          descriptionDraft.trim().length > 0
                            ? descriptionDraft.trim()
                            : null,
                      });
                    }}
                  >
                    {updateProjectMutation.isPending ? "Saving…" : "Save description"}
                  </button>
                </div>
              )}

              {selectedProject.membershipStatus === "INVITED" &&
                selectedProject.inviteMessage && (
                  <div className="rounded-md border border-emerald-400/60 bg-emerald-400/10 p-3 text-xs">
                    <div className="font-medium mb-1">Invite message</div>
                    <p>{selectedProject.inviteMessage}</p>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!inviteProject}
        onOpenChange={(open) => {
          if (!open) setInviteProject(null);
        }}
        title="Project invitation"
        desc={
          inviteProject
            ? `You have been invited to "${inviteProject.name}". You can accept to join the project or decline this invitation.` +
              (inviteProject.inviteMessage
                ? `\n\nInvite message: ${inviteProject.inviteMessage}`
                : "")
            : ""
        }
        confirmText={
          acceptInviteMutation.isPending ? "Accepting…" : "Accept invitation"
        }
        destructive={false}
        isLoading={acceptInviteMutation.isPending || declineInviteMutation.isPending}
        handleConfirm={() => {
          if (!inviteProject) return;
          acceptInviteMutation.mutate(inviteProject.id);
        }}
      >
        <div className="mt-2 flex justify-between gap-2">
          <button
            type="button"
            className="text-xs rounded-md border px-3 py-1 text-muted-foreground hover:bg-muted/60 disabled:opacity-50"
            disabled={declineInviteMutation.isPending || acceptInviteMutation.isPending}
            onClick={() => {
              if (!inviteProject) return;
              declineInviteMutation.mutate(inviteProject.id);
            }}
          >
            {declineInviteMutation.isPending ? "Declining…" : "Decline invitation"}
          </button>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!actionProject}
        onOpenChange={(open) => {
          if (!open) setActionProject(null);
        }}
        title={
          String(actionProject?.role ?? "").toUpperCase() === "OWNER"
            ? "Delete project"
            : "Leave project"
        }
        desc={
          String(actionProject?.role ?? "").toUpperCase() === "OWNER"
            ? `Are you sure you want to permanently delete "${actionProject?.name}"? This cannot be undone for you or other members.`
            : `Are you sure you want to leave "${actionProject?.name}"? You will lose access to its incidents, tasks, and settings.`
        }
        confirmText={
          String(actionProject?.role ?? "").toUpperCase() === "OWNER"
            ? "Delete project"
            : "Leave project"
        }
        destructive
        isLoading={deleteProjectMutation.isPending || leaveProjectMutation.isPending}
        handleConfirm={() => {
          if (!actionProject) return;
          const role = String(actionProject.role).toUpperCase();
          if (role === "OWNER") {
            deleteProjectMutation.mutate(actionProject.id);
          } else {
            leaveProjectMutation.mutate(actionProject.id);
          }
        }}
      />
    </div>
  );
}
