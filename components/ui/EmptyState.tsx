import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-lg border border-dashed border-brand-border bg-brand-surface-subtle/50 max-w-md mx-auto my-6",
        className
      )}
    >
      {icon && (
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-brand-surface border border-brand-border text-brand-muted mb-4 shadow-2xs">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-lg font-medium text-brand-ink mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-brand-muted leading-relaxed max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
};
