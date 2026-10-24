"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Users, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface GuestValues {
  adults: number;
  children: number;
  rooms: number;
}

export interface GuestPickerProps {
  value?: GuestValues;
  onChange?: (val: GuestValues) => void;
  label?: string;
  className?: string;
}

export const GuestPicker: React.FC<GuestPickerProps> = ({
  value = { adults: 2, children: 0, rooms: 1 },
  onChange,
  label,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const update = (key: keyof GuestValues, delta: number) => {
    if (!onChange) return;
    const minVal = key === "adults" || key === "rooms" ? 1 : 0;
    const maxVal = key === "rooms" ? 5 : 10;
    const current = value[key] ?? 0;
    const nextVal = Math.min(Math.max(current + delta, minVal), maxVal);
    onChange({ ...value, [key]: nextVal });
  };

  const totalGuests = (value.adults || 1) + (value.children || 0);
  const roomsCount = value.rooms || 1;

  const displayString = `${totalGuests} guest${totalGuests !== 1 ? "s" : ""}, ${roomsCount} room${roomsCount !== 1 ? "s" : ""}`;

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
              className
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Users className="h-4 w-4 text-brand-muted shrink-0" />
              <span className="truncate">{displayString}</span>
            </div>
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 w-72 rounded-md border border-brand-border bg-brand-surface p-4 shadow-lg animate-in fade-in-0 zoom-in-95 space-y-4"
          >
            {/* Adults */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-ink">Adults</p>
                <p className="text-xs text-brand-muted">Ages 13 or above</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={value.adults <= 1}
                  onClick={() => update("adults", -1)}
                  className="h-7 w-7 rounded-full border border-brand-border flex items-center justify-center text-brand-muted hover:border-brand-ink hover:text-brand-ink disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-sm font-medium tabular-nums">
                  {value.adults}
                </span>
                <button
                  type="button"
                  disabled={value.adults >= 10}
                  onClick={() => update("adults", 1)}
                  className="h-7 w-7 rounded-full border border-brand-border flex items-center justify-center text-brand-muted hover:border-brand-ink hover:text-brand-ink disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Children */}
            <div className="flex items-center justify-between pt-2 border-t border-brand-border/60">
              <div>
                <p className="text-sm font-medium text-brand-ink">Children</p>
                <p className="text-xs text-brand-muted">Ages 0 to 12</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={value.children <= 0}
                  onClick={() => update("children", -1)}
                  className="h-7 w-7 rounded-full border border-brand-border flex items-center justify-center text-brand-muted hover:border-brand-ink hover:text-brand-ink disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-sm font-medium tabular-nums">
                  {value.children}
                </span>
                <button
                  type="button"
                  disabled={value.children >= 6}
                  onClick={() => update("children", 1)}
                  className="h-7 w-7 rounded-full border border-brand-border flex items-center justify-center text-brand-muted hover:border-brand-ink hover:text-brand-ink disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Rooms */}
            <div className="flex items-center justify-between pt-2 border-t border-brand-border/60">
              <div>
                <p className="text-sm font-medium text-brand-ink">Rooms</p>
                <p className="text-xs text-brand-muted">Number of rooms</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={value.rooms <= 1}
                  onClick={() => update("rooms", -1)}
                  className="h-7 w-7 rounded-full border border-brand-border flex items-center justify-center text-brand-muted hover:border-brand-ink hover:text-brand-ink disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-sm font-medium tabular-nums">
                  {value.rooms}
                </span>
                <button
                  type="button"
                  disabled={value.rooms >= 5}
                  onClick={() => update("rooms", 1)}
                  className="h-7 w-7 rounded-full border border-brand-border flex items-center justify-center text-brand-muted hover:border-brand-ink hover:text-brand-ink disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-brand-border flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                Done
              </Button>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
};
