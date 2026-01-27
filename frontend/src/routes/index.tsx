import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().auth.isAuthenticated
    
    if (isAuthenticated) {
      throw redirect({
        to: '/projects',
      })
    }
    else {
      throw redirect({
        to: '/sign-in',
      })
    }
  },
  component: () => null,
})
