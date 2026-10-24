import * as React from "react";
import { formatCurrency, formatCurrencyDetailed } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface PriceBreakdownProps {
  nightlyRateCents: number;
  nights: number;
  taxesAndFeesCents?: number;
  cleaningFeeCents?: number;
  discountCents?: number;
  currency?: string;
  className?: string;
  detailed?: boolean;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  nightlyRateCents,
  nights,
  taxesAndFeesCents,
  cleaningFeeCents = 0,
  discountCents = 0,
  currency = "USD",
  className,
  detailed = false,
}) => {
  const staySubtotalCents = nightlyRateCents * Math.max(nights, 1);
  // Default taxes approx 14% if not explicitly passed
  const calculatedTaxesCents =
    taxesAndFeesCents !== undefined
      ? taxesAndFeesCents
      : Math.round(staySubtotalCents * 0.14);

  const totalCents = Math.max(
    0,
    staySubtotalCents + cleaningFeeCents + calculatedTaxesCents - discountCents
  );

  const formatFn = detailed ? formatCurrencyDetailed : formatCurrency;

  return (
    <div className={cn("space-y-2.5 text-sm", className)}>
      <div className="flex items-center justify-between text-brand-ink">
        <span className="text-brand-muted">
          {formatFn(nightlyRateCents, currency)} × {nights} {nights === 1 ? "night" : "nights"}
        </span>
        <span className="tabular-nums font-medium">
          {formatFn(staySubtotalCents, currency)}
        </span>
      </div>

      {cleaningFeeCents > 0 && (
        <div className="flex items-center justify-between text-brand-ink">
          <span className="text-brand-muted">Cleaning & service fee</span>
          <span className="tabular-nums font-medium">
            {formatFn(cleaningFeeCents, currency)}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-brand-ink">
        <span className="text-brand-muted">Taxes & local hospitality fees</span>
        <span className="tabular-nums font-medium">
          {formatFn(calculatedTaxesCents, currency)}
        </span>
      </div>

      {discountCents > 0 && (
        <div className="flex items-center justify-between text-success">
          <span>Special promotional offer</span>
          <span className="tabular-nums font-medium">
            -{formatFn(discountCents, currency)}
          </span>
        </div>
      )}

      <div className="pt-3 border-t border-brand-border flex items-baseline justify-between text-brand-ink">
        <div>
          <p className="font-semibold text-base">Total stay</p>
          <p className="text-xs text-brand-muted">Includes all taxes and fees</p>
        </div>
        <div className="text-right">
          <span className="font-serif text-xl font-normal tabular-nums text-pine">
            {formatFn(totalCents, currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
