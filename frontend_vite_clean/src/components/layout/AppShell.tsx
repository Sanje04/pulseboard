import type { ReactNode } from "react";

export function AppShell({
  sidebar,
  topbar,
  children,
}: {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur">
        {topbar}
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">{sidebar}</aside>
        <main className="col-span-12 md:col-span-9">{children}</main>
      </div>
    </div>
  );
}
