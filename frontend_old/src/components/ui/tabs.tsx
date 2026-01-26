import * as React from "react";
import { cn } from "../../lib/utils";

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-3", className)}>{React.Children.map(children, (child: any) =>
    React.isValidElement(child) ? React.cloneElement(child, { value, onValueChange } as any) : child
  )}</div>;
}

export function TabsList({
  value,
  onValueChange,
  children,
  className,
}: any) {
  return (
    <div className={cn("inline-flex rounded-2xl border border-slate-200 bg-white p-1", className)}>
      {React.Children.map(children, (child: any) =>
        React.isValidElement(child) ? React.cloneElement(child, { value, onValueChange } as any) : child
      )}
    </div>
  );
}

export function TabsTrigger({
  value: current,
  onValueChange,
  tabValue,
  children,
  className,
}: any) {
  const active = current === tabValue;
  return (
    <button
      type="button"
      onClick={() => onValueChange(tabValue)}
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-medium transition",
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50",
        className
      )}
    >
      {children}
    </button>
  );
}
