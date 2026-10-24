import { apiClient } from "../client";
import {
  Review,
  ReviewRatingSummary,
  CreateReviewPayload,
} from "@/lib/types";

export async function getReviewsForHotel(
  hotelId: string
): Promise<{ reviews: Review[]; summary: ReviewRatingSummary }> {
  return apiClient<{ reviews: Review[]; summary: ReviewRatingSummary }>(
    `/hotels/${hotelId}/reviews`
  );
}

export async function createReview(
  payload: CreateReviewPayload
): Promise<Review> {
  return apiClient<Review>("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listMyReviews(): Promise<Review[]> {
  return apiClient<Review[]>("/reviews/my");
}
