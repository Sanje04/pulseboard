import * as React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
        variant === "default" && "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
        variant === "outline" && "border border-slate-200 bg-white text-slate-900",
        className
      )}
      {...props}
    />
  );
}
