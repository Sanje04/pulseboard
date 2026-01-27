import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createProject, listProjects } from "./projects.api";
import { useSelectedProject } from "./useSelectedProject";

export function ProjectsPage() {
  const q = useQuery<Awaited<ReturnType<typeof listProjects>>>({
    queryKey: ["projects"],
    queryFn: listProjects,
  });
  const { projectId, setProjectId } = useSelectedProject();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });

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

  if (q.isLoading) return <div className="text-sm text-muted-foreground">Loading projects…</div>;
  if (q.isError) return <div className="text-sm text-red-500">{(q.error as Error).message}</div>;
  
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
        {q.data.items.map((p) => (
          <div
            key={p.id}
            onClick={() => setProjectId(p.id)}
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
              <div className="text-xs rounded-full border px-2 py-1">{p.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
