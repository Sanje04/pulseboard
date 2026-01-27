import { useAuthStore } from '@/stores/auth-store'

export const useAuth = () => {
  const auth = useAuthStore((state) => state.auth)
  return auth
}
