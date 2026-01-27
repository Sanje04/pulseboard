import { createFileRoute } from '@tanstack/react-router'
import { IncidentsPage } from '@/features/pulseboard/IncidentPage'

export const Route = createFileRoute('/_authenticated/incidents')({
  component: IncidentsPage,
})
