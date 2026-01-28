import { z } from "zod";
import { apiRequest } from "./api";
import { taskSchema, taskListSchema, type Task } from "./features/tasks/data/schema";

export type { Task };

function normalizeList(raw: unknown): Task[] {
  const items = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && "items" in (raw as any)
    ? (raw as any).items
    : raw;

  return taskListSchema.parse(items);
}

function normalizeSingle(raw: unknown): Task {
  const task =
    raw && typeof raw === "object" && "task" in (raw as any)
      ? (raw as any).task
      : raw;
  return taskSchema.parse(task);
}

export async function listTasks(projectId: string): Promise<Task[]> {
  const raw = await apiRequest<unknown>(`/projects/${projectId}/tasks`, {
    method: "GET",
  });
  return normalizeList(raw);
}

export interface CreateTaskInput {
  title: string;
  status: string;
  label: string;
  priority: string;
  description?: string | null;
}

export async function createTask(
  projectId: string,
  input: CreateTaskInput,
): Promise<Task> {
  const raw = await apiRequest<unknown>(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizeSingle(raw);
}

export interface UpdateTaskInput {
  title?: string;
  status?: string;
  label?: string;
  priority?: string;
  description?: string | null;
}

export async function updateTask(
  projectId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const raw = await apiRequest<unknown>(
    `/projects/${projectId}/tasks/${taskId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return normalizeSingle(raw);
}

export async function deleteTask(
  projectId: string,
  taskId: string,
): Promise<void> {
  await apiRequest<void>(`/projects/${projectId}/tasks/${taskId}`, {
    method: "DELETE",
  });
}
