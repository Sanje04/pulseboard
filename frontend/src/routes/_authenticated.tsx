import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { SearchProvider } from '@/context/search-provider'
import { LayoutProvider } from '@/context/layout-provider'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const isAuthenticated = useAuthStore.getState().auth.isAuthenticated
    
    if (!isAuthenticated) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <LayoutProvider>
      <SearchProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Header>
              <div className='flex items-center gap-2'>
                <SidebarTrigger className='-ml-1' />
                <TopNav links={topNav} />
              </div>
              <div className='ms-auto flex items-center space-x-4'>
                <Search />
                <ThemeSwitch />
                <ProfileDropdown />
              </div>
            </Header>

            <Main>
              <div className='mb-6'>
                <div className='flex gap-4 border-b'>
                  <Link
                    to='/projects'
                    className='px-4 py-2 text-sm font-medium transition [&.active]:border-b-2 [&.active]:border-primary [&.active]:text-primary text-muted-foreground hover:text-foreground'
                    activeProps={{ className: 'active' }}
                  >
                    Projects
                  </Link>
                  <Link
                    to='/incidents'
                    className='px-4 py-2 text-sm font-medium transition [&.active]:border-b-2 [&.active]:border-primary [&.active]:text-primary text-muted-foreground hover:text-foreground'
                    activeProps={{ className: 'active' }}
                  >
                    Incidents
                  </Link>
                </div>
              </div>

              <Outlet />
            </Main>
          </SidebarInset>
        </SidebarProvider>
      </SearchProvider>
    </LayoutProvider>
  )
}

const topNav = [
  {
    title: 'PulseBoard',
    href: '/projects',
    isActive: true,
    disabled: false,
  },
]
