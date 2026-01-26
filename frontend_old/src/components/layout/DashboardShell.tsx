import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export function DashboardShell({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900">{title}</div>
            {subtitle && <div className="text-sm text-slate-600">{subtitle}</div>}
          </div>
          {right}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
