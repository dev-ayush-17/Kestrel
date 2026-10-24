"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "underline" | "pill";
  }
>(({ className, variant = "underline", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center text-brand-muted",
      variant === "underline" && "border-b border-brand-border w-full justify-start gap-8",
      variant === "pill" && "rounded-md bg-brand-surface-subtle p-1 border border-brand-border gap-1",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: "underline" | "pill";
  }
>(({ className, variant = "underline", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/30 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
      variant === "underline" &&
        "pb-3 pt-2 text-brand-muted border-b-2 border-transparent hover:text-brand-ink data-[state=active]:border-pine data-[state=active]:text-pine data-[state=active]:font-semibold",
      variant === "pill" &&
        "rounded-sm px-3.5 py-1.5 text-xs tracking-wider uppercase text-brand-muted hover:text-brand-ink data-[state=active]:bg-brand-surface data-[state=active]:text-brand-ink data-[state=active]:shadow-xs",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/30",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
