import { createFileRoute } from '@tanstack/react-router'
import { IncidentsPage } from '@/features/pulseboard/IncidentPage'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/incidents/$incidentId'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { projectId, incidentId } = Route.useParams()

  return <IncidentsPage projectId={projectId} initialIncidentId={incidentId} />
}
