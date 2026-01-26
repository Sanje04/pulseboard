import { useAuthStore } from '@/stores/auth-store'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().auth.accessToken

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    // Handle 401 errors - token expired or invalid
    if (res.status === 401) {
      useAuthStore.getState().auth.reset()
    }

    const data = await res.json().catch(() => ({}))
    throw new Error(data?.error || `Request failed (${res.status})`)
  }

  return res.json() as Promise<T>
}

// Auth API calls
export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    accountNo: string
    email: string
    role: string[]
    exp: number
  }
  accessToken: string
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  logout: async (): Promise<void> => {
    await api<void>('/auth/logout', {
      method: 'POST',
    })
  },

  refreshToken: async (): Promise<AuthResponse> => {
    return api<AuthResponse>('/auth/refresh', {
      method: 'POST',
    })
  },
}
