import { createFileRoute } from '@tanstack/react-router'
import { ProjectAuditPage } from '@/features/pulseboard/ProjectAuditPage'

export const Route = createFileRoute('/_authenticated/projects/$projectId/audit')({
  component: RouteComponent,
})

function RouteComponent() {
  const { projectId } = Route.useParams()

  return <ProjectAuditPage projectId={projectId} />
}
