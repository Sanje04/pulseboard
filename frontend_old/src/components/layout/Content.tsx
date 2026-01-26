import * as React from "react";

interface ContentProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function Content({ children, title, description }: ContentProps) {
  return (
    <main className="flex flex-1 flex-col overflow-auto bg-slate-50">
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:p-8">
          {title && (
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
              {description && (
                <p className="text-base text-slate-600">{description}</p>
              )}
            </div>
          )}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
