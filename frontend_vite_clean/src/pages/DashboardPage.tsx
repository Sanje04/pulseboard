import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-semibold">Dashboard</div>
        <div className="text-sm text-[hsl(var(--muted-foreground))]">
          Projects, incidents, timelines, audit feed.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Open Incidents</CardTitle>
            <CardDescription>Across selected project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">—</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mitigating</CardTitle>
            <CardDescription>In progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">—</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resolved</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">—</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next</CardTitle>
          <CardDescription>We’ll drop your Projects/Incidents UI here.</CardDescription>
        </CardHeader>
        <CardContent>Ready.</CardContent>
      </Card>
    </div>
  );
}
