import { apiRequest } from "./api";
import { userListSchema, type User } from "./features/users/data/schema";

export async function getProjectUsers(projectId: string): Promise<User[]> {
  const raw = await apiRequest<unknown>(`/projects/${projectId}/users`, {
    method: "GET",
  });

  // Backend may return either a bare array or an object with an `items` array.
  const items = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && "items" in (raw as any)
    ? (raw as any).items
    : raw;

  return userListSchema.parse(items);
}
