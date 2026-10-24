"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback(
    ({ title, description, variant = "default", duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, variant, duration }]);
    },
    []
  );

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            duration={t.duration}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
            className={cn(
              "group pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-md border p-4 shadow-md transition-all",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
              t.variant === "default" && "border-brand-border bg-brand-surface text-brand-ink",
              t.variant === "success" && "border-success/30 bg-success-light text-brand-ink",
              t.variant === "error" && "border-error/30 bg-error-light text-brand-ink",
              t.variant === "warning" && "border-warning/30 bg-warning-light text-brand-ink"
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.variant === "success" && <CheckCircle className="h-4 w-4 text-success" />}
              {t.variant === "error" && <AlertCircle className="h-4 w-4 text-error" />}
              {t.variant === "warning" && <AlertTriangle className="h-4 w-4 text-warning" />}
              {t.variant === "default" && <Info className="h-4 w-4 text-pine" />}
            </div>
            <div className="grid gap-1 flex-1 text-left">
              {t.title && (
                <ToastPrimitive.Title className="text-sm font-semibold text-brand-ink">
                  {t.title}
                </ToastPrimitive.Title>
              )}
              {t.description && (
                <ToastPrimitive.Description className="text-xs text-brand-muted leading-relaxed">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close className="absolute right-2.5 top-2.5 rounded-xs p-1 text-brand-muted opacity-70 transition-opacity hover:opacity-100 hover:bg-brand-surface-subtle focus:opacity-100 focus:outline-none">
              <X className="h-3.5 w-3.5" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed top-4 right-4 z-[100] flex max-h-screen w-full max-w-[420px] flex-col-reverse gap-2 p-4 pointer-events-none sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
