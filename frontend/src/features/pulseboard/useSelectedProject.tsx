import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "./projects.api";

export function useSelectedProject() {
  const [projectId, setProjectId] = useState<string | null>(() => {
    return localStorage.getItem("pb_projectId");
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  const currentProject = projectsQuery.data?.items.find((p) => p.id === projectId);

  useEffect(() => {
    if (projectId) localStorage.setItem("pb_projectId", projectId);
    else localStorage.removeItem("pb_projectId");
  }, [projectId]);

  return { projectId, setProjectId, currentProject };
}
