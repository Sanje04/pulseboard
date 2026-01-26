import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { listProjects } from './projects'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function ProjectsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
  })

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Failed to load projects: {error instanceof Error ? error.message : 'Unknown error'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-6'>
      <Card>
        <CardHeader>
          <CardTitle>PulseBoard Projects</CardTitle>
          <CardDescription>
            Your projects from the backend API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className='text-center text-muted-foreground'>
                    No projects found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className='font-mono text-sm'>{project.id}</TableCell>
                    <TableCell className='font-medium'>{project.name}</TableCell>
                    <TableCell>{project.role}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {project.description || '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
