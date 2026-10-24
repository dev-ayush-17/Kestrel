import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RatingProps {
  score: number; // e.g. 4.85
  maxScore?: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  showNumeric?: boolean;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  score,
  maxScore = 5,
  reviewCount,
  size = "md",
  showNumeric = true,
  className,
}) => {
  const roundedScore = Math.min(Math.max(score, 0), maxScore);

  const starSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base font-medium",
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="flex items-center text-terracotta">
        {Array.from({ length: maxScore }).map((_, i) => {
          const filled = i < Math.floor(roundedScore);
          const isHalf = !filled && i < roundedScore;
          return (
            <Star
              key={i}
              className={cn(
                starSizes[size],
                filled
                  ? "fill-current text-terracotta"
                  : isHalf
                  ? "fill-current text-terracotta/50"
                  : "text-brand-border-dark fill-transparent"
              )}
            />
          );
        })}
      </div>
      {showNumeric && (
        <span className={cn("font-medium tabular-nums text-brand-ink", textSizes[size])}>
          {roundedScore.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={cn("text-brand-muted tabular-nums", textSizes[size])}>
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
};
