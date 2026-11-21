"use client";

import * as React from "react";
import Link from "next/link";
import { listMyReviews } from "@/lib/api";
import { Review } from "@/lib/types";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar } from "lucide-react";

export default function MyReviewsPage() {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function loadReviews() {
      try {
        setLoading(true);
        const data = await listMyReviews();
        setReviews(data);
      } catch (err) {
        console.error("Failed to load user reviews:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium text-brand-ink">My Reviews</h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-1 font-light">
          Feedback and verified impressions from your completed sanctuary retreats.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-xs text-brand-muted mt-4">Retrieving reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews submitted"
          description="After completing a stay, share your impressions to guide future intentional travelers."
          actionLabel="View My Bookings"
          onAction={() => window.location.assign("/account/bookings")}
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-xl border border-brand-border bg-brand-surface space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rating score={rev.overall_rating} size="sm" />
                  <span className="text-xs font-semibold text-brand-ink">{rev.overall_rating.toFixed(1)}/5</span>
                </div>
                <Badge
                  variant={
                    rev.moderation_status === "approved"
                      ? "success"
                      : rev.moderation_status === "rejected"
                      ? "error"
                      : "default"
                  }
                >
                  {rev.moderation_status}
                </Badge>
              </div>

              <h3 className="font-serif text-lg font-medium text-brand-ink">
                {rev.title}
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted font-light leading-relaxed">
                {rev.content}
              </p>

              <div className="text-[11px] text-brand-muted pt-2 border-t border-brand-border/60">
                Submitted on {new Date(rev.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
