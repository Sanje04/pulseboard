import * as React from "react";

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white shadow-sm">
      <div className="flex h-full flex-col">
        {children}
      </div>
    </aside>
  );
}
