import { api } from '@/lib/api'

export async function apiRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  return api<T>(path, init)
}
