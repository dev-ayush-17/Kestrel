"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "pine"
    | "terracotta"
    | "success"
    | "warning"
    | "error"
    | "outline";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center font-medium tracking-wide uppercase rounded-xs transition-colors select-none";

  const variantStyles = {
    default:
      "bg-brand-surface-subtle text-brand-muted border border-brand-border",
    pine:
      "bg-pine-light text-pine border border-pine/20",
    terracotta:
      "bg-terracotta-light text-terracotta border border-terracotta/25",
    success:
      "bg-success-light text-success border border-success/20",
    warning:
      "bg-warning-light text-warning border border-warning/20",
    error:
      "bg-error-light text-error border border-error/20",
    outline:
      "bg-transparent text-brand-ink border border-brand-border-dark",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] tracking-wider",
    md: "px-2.5 py-1 text-xs tracking-wider",
  };

  return (
    <span
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
