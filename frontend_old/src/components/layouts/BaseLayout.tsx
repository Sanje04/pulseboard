import * as React from "react";

interface BaseLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function BaseLayout({ children, title, description }: BaseLayoutProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {title && (
            <div className="px-4 lg:px-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && (
                  <p className="text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
