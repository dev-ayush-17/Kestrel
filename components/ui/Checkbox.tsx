"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string | React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, description, error, id, ...props }, ref) => {
  const checkboxId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex items-start gap-2.5">
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-xs border border-brand-border bg-brand-surface transition-colors cursor-pointer mt-0.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/30",
          "data-[state=checked]:bg-pine data-[state=checked]:border-pine data-[state=checked]:text-white",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-error",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <Check className="h-3 w-3 stroke-[3]" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {(label || description) && (
        <div className="text-left select-none">
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-brand-ink leading-tight cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-brand-muted mt-0.5">{description}</p>
          )}
          {error && <p className="text-xs text-error mt-0.5">{error}</p>}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = "Checkbox";
