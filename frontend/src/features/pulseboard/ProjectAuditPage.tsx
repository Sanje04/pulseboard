import { useQuery } from "@tanstack/react-query";
import { getAuditFeed } from "@/audit";

interface ProjectAuditPageProps {
  projectId: string;
}

export function ProjectAuditPage({ projectId }: ProjectAuditPageProps) {
  const auditQ = useQuery({
    queryKey: ["audit", projectId],
    queryFn: () => getAuditFeed(projectId),
    enabled: Boolean(projectId),
  });

  if (!projectId) {
    return <div className="text-sm text-muted-foreground">Select a project first.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Audit Feed</h2>
        <div className="text-xs text-muted-foreground">Project ID: {projectId}</div>
      </div>

      {auditQ.isLoading && (
        <div className="text-sm text-muted-foreground">Loading audit feed85</div>
      )}
      {auditQ.isError && (
        <div className="text-sm text-red-500">{(auditQ.error as Error).message}</div>
      )}

      <div className="space-y-2">
        {(auditQ.data?.items ?? []).map((item: any) => (
          <div key={item.id} className="rounded-lg border p-3 text-sm">
            <div className="font-medium">{item.message}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(item.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
