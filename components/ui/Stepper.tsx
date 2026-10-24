import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: string | number;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 0-indexed
  className?: string;
  onStepClick?: (stepIndex: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  className,
  onStepClick,
}) => {
  return (
    <nav aria-label="Booking progress" className={cn("w-full py-4", className)}>
      <ol className="flex items-center justify-between relative">
        {/* Connecting bar background */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-brand-border -z-0" />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isClickable = !!onStepClick && isCompleted;

          return (
            <li
              key={step.id}
              className="relative flex flex-col items-center group z-10"
              aria-current={isCurrent ? "step" : undefined}
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(idx)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all duration-200 select-none",
                  isCompleted && "bg-pine text-white",
                  isCurrent && "border-2 border-pine bg-brand-surface text-pine ring-4 ring-pine/10 font-bold",
                  !isCompleted && !isCurrent && "border border-brand-border bg-brand-surface text-brand-muted",
                  isClickable && "cursor-pointer hover:ring-2 hover:ring-pine/30"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : idx + 1}
              </button>
              <div className="mt-2 text-center max-w-[100px]">
                <span
                  className={cn(
                    "block text-xs font-medium uppercase tracking-wider leading-tight",
                    isCurrent ? "text-pine font-semibold" : isCompleted ? "text-brand-ink" : "text-brand-muted"
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="hidden md:block text-[11px] text-brand-muted mt-0.5">
                    {step.description}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
