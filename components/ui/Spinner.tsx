import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "pine" | "terracotta" | "muted" | "white";
}

export function Spinner({
  className,
  size = "md",
  variant = "pine",
  ...props
}: SpinnerProps) {
  const sizeStyles = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const variantStyles = {
    pine: "text-pine",
    terracotta: "text-terracotta",
    muted: "text-brand-muted",
    white: "text-white",
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      <Loader2
        className={cn(
          "animate-spin",
          sizeStyles[size],
          variantStyles[variant]
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
