import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "./projects.api";

// Optional projectIdFromRoute allows URL params to drive the active project.
// When provided, it becomes the source of truth while we still keep
// localStorage in sync for other parts of the app that rely on it.
export function useSelectedProject(projectIdFromRoute?: string | null) {
  const [projectIdState, setProjectIdState] = useState<string | null>(() => {
    return localStorage.getItem("pb_projectId");
  });

  const effectiveProjectId = projectIdFromRoute ?? projectIdState;

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  const currentProject = projectsQuery.data?.items.find((p) => p.id === effectiveProjectId);

  // Keep localStorage in sync. If the route is driving the project, prefer that.
  useEffect(() => {
    const idToPersist = projectIdFromRoute ?? projectIdState;
    if (idToPersist) localStorage.setItem("pb_projectId", idToPersist);
    else localStorage.removeItem("pb_projectId");
  }, [projectIdFromRoute, projectIdState]);

  return { projectId: effectiveProjectId, setProjectId: setProjectIdState, currentProject };
}
