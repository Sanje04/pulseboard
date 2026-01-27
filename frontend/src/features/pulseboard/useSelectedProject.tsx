import { useEffect, useState } from "react";

export function useSelectedProject() {
  const [projectId, setProjectId] = useState<string | null>(() => {
    return localStorage.getItem("pb_projectId");
  });

  useEffect(() => {
    if (projectId) localStorage.setItem("pb_projectId", projectId);
    else localStorage.removeItem("pb_projectId");
  }, [projectId]);

  return { projectId, setProjectId };
}
