import { MailPlus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUsers } from './users-provider'

type UsersPrimaryButtonsProps = {
  // When false, project members without sufficient privileges cannot add/invite users
  canManageUsers?: boolean
}

export function UsersPrimaryButtons({
  canManageUsers = true,
}: UsersPrimaryButtonsProps) {
  const { setOpen } = useUsers()
  const disabled = !canManageUsers
  const title = disabled
    ? 'You do not have permission to manage users for this project'
    : undefined

  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        className='space-x-1'
        onClick={() => setOpen('invite')}
        disabled={disabled}
        title={title}
      >
        <span>Invite User</span> <MailPlus size={18} />
      </Button>
      <Button
        className='space-x-1'
        onClick={() => setOpen('add')}
        disabled={disabled}
        title={title}
      >
        <span>Add User</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
