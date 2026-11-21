"use client";

import * as React from "react";
import { searchHotels, getReviewsForHotel, moderateReview } from "@/lib/api";
import { Hotel, Review } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { Spinner } from "@/components/ui/Spinner";
import { Check, X, MessageSquare, Building2 } from "lucide-react";

export default function AdminReviewsPage() {
  const [hotels, setHotels] = React.useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = React.useState<string>("");
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadHotels() {
      try {
        setLoading(true);
        const res = await searchHotels({ page: 1, page_size: 50 });
        setHotels(res.items);
        if (res.items.length > 0) {
          setSelectedHotelId(res.items[0].id);
        }
      } catch (err) {
        console.error("Failed to load hotels:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHotels();
  }, []);

  const fetchReviews = React.useCallback(async () => {
    if (!selectedHotelId) return;
    try {
      setLoading(true);
      const data = await getReviewsForHotel(selectedHotelId);
      setReviews(data.reviews);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedHotelId]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleModerate = async (reviewId: string, status: "approved" | "rejected") => {
    try {
      setActionLoading(reviewId);
      await moderateReview(reviewId, status);
      await fetchReviews();
    } catch (err: any) {
      alert(`Moderation failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-brand-ink">
            Review Moderation Queue
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1 font-light">
            Audit guest feedback, uphold anthology standards, and update hotel averages dynamically.
          </p>
        </div>

        {/* Hotel Selector */}
        <div className="w-full sm:w-72">
          <select
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
            className="w-full h-10 px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded-md text-brand-ink focus:outline-none focus:ring-2 focus:ring-pine/30 font-medium"
          >
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-xs text-brand-muted mt-4">Consulting review moderation queue...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-brand-surface rounded-xl border border-brand-border text-brand-muted text-sm font-light">
          No reviews found for this property.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-xl border border-brand-border bg-brand-surface space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm text-brand-ink">{rev.user_name}</span>
                  <Rating score={rev.overall_rating} size="sm" />
                  <span className="text-xs text-brand-muted font-mono">
                    {rev.overall_rating.toFixed(1)}/5
                  </span>
                </div>

                <div className="flex items-center gap-2">
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

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading === rev.id || rev.moderation_status === "approved"}
                      onClick={() => handleModerate(rev.id, "approved")}
                      leftIcon={<Check className="h-3.5 w-3.5 text-success" />}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-error hover:bg-error-light"
                      disabled={actionLoading === rev.id || rev.moderation_status === "rejected"}
                      onClick={() => handleModerate(rev.id, "rejected")}
                      leftIcon={<X className="h-3.5 w-3.5" />}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>

              <h3 className="font-serif text-lg font-medium text-brand-ink">{rev.title}</h3>
              <p className="text-xs sm:text-sm text-brand-muted font-light leading-relaxed">
                {rev.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
