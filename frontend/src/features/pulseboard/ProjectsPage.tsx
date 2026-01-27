import { useQuery } from "@tanstack/react-query";
import { listProjects } from "./projects.api";
import { useSelectedProject } from "./useSelectedProject";

export function ProjectsPage() {
  const q = useQuery<Awaited<ReturnType<typeof listProjects>>>({
    queryKey: ["projects"],
    queryFn: listProjects,
  });
  const { projectId, setProjectId } = useSelectedProject();

  if (q.isLoading) return <div className="text-sm text-muted-foreground">Loading projects…</div>;
  if (q.isError) return <div className="text-sm text-red-500">{(q.error as Error).message}</div>;
  
  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold">Projects</div>
        <div className="text-sm text-muted-foreground">Select a project to view incidents.</div>
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
