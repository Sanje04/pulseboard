import * as React from "react";

interface TopbarProps {
  children: React.ReactNode;
}

export function Topbar({ children }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      {children}
    </header>
  );
}
