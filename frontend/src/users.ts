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

export interface InviteProjectUserInput {
  email: string;
  role: string;
  desc?: string;
}

// Invite a user to a specific project. The backend is expected to:
// - Create the user if needed
// - Add them as a member of the given project (typically with status "invited")
export async function inviteProjectUser(
  projectId: string,
  input: InviteProjectUserInput,
): Promise<void> {
  await apiRequest<void>(`/projects/${projectId}/users`, {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      role: input.role,
      status: "invited",
      desc: input.desc,
    }),
  });
}
