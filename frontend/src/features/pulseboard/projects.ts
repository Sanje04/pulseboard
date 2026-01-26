import { api } from "@/lib/api";

export function listProjects() {
  return api<{ items: Array<{ id: string; name: string; role: string; description?: string }> }>("/projects");
}
