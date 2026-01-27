import { getRouteApi } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useSelectedProject } from '@/features/pulseboard/useSelectedProject'
import { getProjectUsers } from '@/users'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { projectId, currentProject } = useSelectedProject()

  const usersQuery = useQuery({
    queryKey: ['project-users', projectId],
    queryFn: () => getProjectUsers(projectId!),
    enabled: Boolean(projectId),
  })

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Project members</h2>
            <p className='text-muted-foreground'>
              View and manage users who are part of the selected project.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        {!projectId && (
          <div className='text-sm text-muted-foreground'>
            Select a project first to see its members.
          </div>
        )}
        {projectId && usersQuery.isLoading && (
          <div className='text-sm text-muted-foreground'>
            Loading project members…
          </div>
        )}
        {projectId && usersQuery.isError && (
          <div className='text-sm text-red-500'>
            {(usersQuery.error as Error).message}
          </div>
        )}
        {projectId && usersQuery.data && (
          <UsersTable data={usersQuery.data} search={search} navigate={navigate} />
        )}
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
