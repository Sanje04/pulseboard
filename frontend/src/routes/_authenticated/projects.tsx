import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/features/pulseboard/ProjectsPage'

export const Route = createFileRoute('/_authenticated/projects')({
  component: ProjectsPage,
})
