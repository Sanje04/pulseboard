import * as React from "react";
import { cn } from "../../lib/cn";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]",
        props.className
      )}
    />
  );
}
