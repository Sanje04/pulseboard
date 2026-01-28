import { useNavigate, useLocation } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { logout as clearAuthToken } from '@/auth'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { auth } = useAuthStore()
   const queryClient = useQueryClient()

  const handleSignOut = () => {
    // Clear auth state and tokens
    auth.reset()
    clearAuthToken()

    // Clear any project selection persisted across sessions
    localStorage.removeItem('pb_projectId')

    // Clear cached server data (projects, incidents, users, etc.)
    queryClient.clear()
    // Preserve current location for redirect after sign-in
    const currentPath = location.href
    navigate({
      to: '/sign-in',
      search: { redirect: currentPath },
      replace: true,
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText='Sign out'
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}
