import * as React from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "success" | "warning" | "destructive" | "subtle";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  outline: "border border-purple-500/30 text-text-secondary",
  success: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  warning: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  destructive: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
  subtle: "bg-surface-medium text-text-tertiary border border-transparent",
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-2xl px-3 py-1 text-xs font-semibold uppercase tracking-wide",
      variantClasses[variant],
      className,
    )}
    {...props}
  />
));
Badge.displayName = "Badge";


