"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options?: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = "Select an option",
  options,
  value,
  defaultValue,
  onValueChange,
  error,
  helperText,
  disabled,
  className,
  children,
}) => {
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wider text-brand-muted">
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          className={cn(
            "flex w-full h-10 items-center justify-between rounded-md border border-brand-border bg-brand-surface px-3.5 py-2 text-sm text-brand-ink transition-colors",
            "focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine",
            "disabled:cursor-not-allowed disabled:bg-brand-surface-subtle disabled:text-brand-subtle",
            error && "border-error focus:border-error focus:ring-error",
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 text-brand-muted shrink-0" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-brand-border bg-brand-surface text-brand-ink shadow-md animate-in fade-in-80"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options
                ? options.map((opt) => (
                    <SelectPrimitive.Item
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm outline-none transition-colors",
                        "focus:bg-pine-light focus:text-pine data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      )}
                    >
                      <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
                        <SelectPrimitive.ItemIndicator>
                          <Check className="h-4 w-4 text-pine" />
                        </SelectPrimitive.ItemIndicator>
                      </span>
                      <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))
                : children}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error ? (
        <p className="text-xs text-error font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-brand-muted">{helperText}</p>
      ) : null}
    </div>
  );
};
