import { useQuery } from '@tanstack/react-query'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useSelectedProject } from '@/features/pulseboard/useSelectedProject'
import { listTasks } from '@/tasks'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import { TasksProvider } from './components/tasks-provider'
import { TasksTable } from './components/tasks-table'

export function Tasks() {
  const { projectId } = useSelectedProject()

  const tasksQuery = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => listTasks(projectId!),
    enabled: Boolean(projectId),
  })

  return (
    <TasksProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>Tasks</h2>
            <p className='text-muted-foreground'>
              View and manage tasks for the selected project.
            </p>
          </div>
          <TasksPrimaryButtons />
        </div>
        {!projectId && (
          <div className='text-sm text-muted-foreground'>
            Select a project first to see its tasks.
          </div>
        )}
        {projectId && tasksQuery.isLoading && (
          <div className='text-sm text-muted-foreground'>
            Loading tasks33
          </div>
        )}
        {projectId && tasksQuery.isError && (
          <div className='text-sm text-red-500'>
            {(tasksQuery.error as Error).message}
          </div>
        )}
        {projectId && tasksQuery.data && (
          <TasksTable data={tasksQuery.data} />
        )}
      </Main>

      <TasksDialogs />
    </TasksProvider>
  )
}
