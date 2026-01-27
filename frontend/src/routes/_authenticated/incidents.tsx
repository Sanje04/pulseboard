import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { IncidentsPage } from '@/features/pulseboard/IncidentPage'
import { useSelectedProject } from '@/features/pulseboard/useSelectedProject'

export const Route = createFileRoute('/_authenticated/incidents')({
  component: RouteComponent,
})

function RouteComponent() {
  const { projectId } = useSelectedProject()
  // Legacy entry point: if we know the project, immediately deep-link to it.
  // Otherwise, just render IncidentsPage, which will show the "Select a project" message.

  useEffect(() => {
    // No-op here; navigation is driven from the sidebar into the new routes.
  }, [])

  return <IncidentsPage projectId={projectId ?? undefined} />
}
