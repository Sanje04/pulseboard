import * as React from "react";
import { cn } from "../../lib/cn";

type Variant = "default" | "outline" | "ghost";
type Size = "default" | "sm";

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] disabled:opacity-60 disabled:pointer-events-none",
        variant === "default" && "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:opacity-90",
        variant === "outline" && "border border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--muted))]",
        variant === "ghost" && "hover:bg-[hsl(var(--muted))]",
        size === "default" && "h-10 px-4",
        size === "sm" && "h-9 px-3",
        className
      )}
      {...props}
    />
  );
}
