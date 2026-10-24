"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, disabled, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-medium uppercase tracking-wider text-brand-muted"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          disabled={disabled}
          ref={ref}
          className={cn(
            "w-full min-h-[90px] px-3.5 py-2.5 bg-brand-surface text-brand-ink text-sm rounded-md border border-brand-border placeholder:text-brand-subtle/70 transition-colors",
            "focus-visible:outline-none focus-visible:border-pine focus-visible:ring-1 focus-visible:ring-pine",
            "disabled:bg-brand-surface-subtle disabled:text-brand-subtle disabled:cursor-not-allowed",
            error && "border-error focus-visible:border-error focus-visible:ring-error",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-error font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-brand-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
