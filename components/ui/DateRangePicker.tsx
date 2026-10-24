"use client";

import * as React from "react";
import { format, isBefore } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import "react-day-picker/dist/style.css";

export interface DateRangePickerProps {
  value?: { from?: Date; to?: Date };
  onChange?: (range: { from?: Date; to?: Date } | undefined) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  minDate?: Date;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "Select check-in & check-out",
  error,
  className,
  minDate,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedRange: DateRange | undefined = value?.from
    ? {
        from: value.from,
        to: value.to,
      }
    : undefined;

  const handleSelect = (range: DateRange | undefined) => {
    if (onChange) {
      onChange(
        range ? { from: range.from, to: range.to } : undefined
      );
    }
    // Auto close if both dates selected
    if (range?.from && range?.to) {
      setIsOpen(false);
    }
  };

  const formattedDisplay = React.useMemo(() => {
    if (!value?.from) return null;
    if (value.from && !value.to) {
      return `${format(value.from, "MMM d")} – Check-out`;
    }
    if (value.from && value.to) {
      return `${format(value.from, "MMM d, yyyy")} – ${format(value.to, "MMM d, yyyy")}`;
    }
    return null;
  }, [value]);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wider text-brand-muted">
          {label}
        </label>
      )}
      <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full h-10 items-center justify-between rounded-md border border-brand-border bg-brand-surface px-3.5 py-2 text-sm text-brand-ink transition-colors",
              "focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine cursor-pointer",
              !formattedDisplay && "text-brand-subtle/70",
              error && "border-error focus:border-error focus:ring-error",
              className
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-4 w-4 text-brand-muted shrink-0" />
              <span className="truncate">{formattedDisplay || placeholder}</span>
            </div>
            {value?.from && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(undefined);
                }}
                className="p-1 hover:bg-brand-surface-subtle rounded-full text-brand-muted hover:text-brand-ink"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 w-auto rounded-md border border-brand-border bg-brand-surface p-3 shadow-lg animate-in fade-in-0 zoom-in-95"
          >
            <div className="p-2">
              <DayPicker
                mode="range"
                defaultMonth={value?.from || minDate}
                selected={selectedRange}
                onSelect={handleSelect}
                numberOfMonths={1}
                disabled={(date) => (minDate ? isBefore(date, minDate) : false)}
              />
            </div>
            <div className="flex items-center justify-between border-t border-brand-border pt-3 px-2">
              <span className="text-xs text-brand-muted">
                {value?.from && value?.to
                  ? `${Math.ceil((value.to.getTime() - value.from.getTime()) / (1000 * 60 * 60 * 24))} nights selected`
                  : "Choose check-in and check-out dates"}
              </span>
              <button
                type="button"
                onClick={() => onChange?.(undefined)}
                className="text-xs text-brand-muted hover:text-brand-ink underline"
              >
                Clear
              </button>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      {error && <p className="text-xs text-error font-medium">{error}</p>}
    </div>
  );
};
