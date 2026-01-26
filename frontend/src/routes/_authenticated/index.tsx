import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/features/pulseboard/projects-page'

export const Route = createFileRoute('/_authenticated/')({
  component: ProjectsPage,
})
