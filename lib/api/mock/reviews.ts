import {
  Review,
  ReviewRatingSummary,
  CreateReviewPayload,
  ApiError,
} from "@/lib/types";
import { getDb, saveDb, simulateLatency } from "./storage";

export async function mockGetReviewsForHotel(
  hotelId: string
): Promise<{ reviews: Review[]; summary: ReviewRatingSummary }> {
  await simulateLatency(300, 500);
  const db = getDb();
  const reviews = db.reviews.filter(
    (r) => r.hotel_id === hotelId && r.moderation_status === "approved"
  );

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? Number((reviews.reduce((acc, r) => acc + r.overall_rating, 0) / totalReviews).toFixed(2))
    : 5.0;

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.overall_rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[star] = (distribution[star] || 0) + 1;
  });

  const catAverages = {
    cleanliness: totalReviews > 0 ? Number((reviews.reduce((acc, r) => acc + r.categories.cleanliness, 0) / totalReviews).toFixed(1)) : 5.0,
    location: totalReviews > 0 ? Number((reviews.reduce((acc, r) => acc + r.categories.location, 0) / totalReviews).toFixed(1)) : 5.0,
    service: totalReviews > 0 ? Number((reviews.reduce((acc, r) => acc + r.categories.service, 0) / totalReviews).toFixed(1)) : 5.0,
    comfort: totalReviews > 0 ? Number((reviews.reduce((acc, r) => acc + r.categories.comfort, 0) / totalReviews).toFixed(1)) : 5.0,
    value: totalReviews > 0 ? Number((reviews.reduce((acc, r) => acc + r.categories.value, 0) / totalReviews).toFixed(1)) : 5.0,
  };

  return {
    reviews,
    summary: {
      average_rating: avgRating,
      total_reviews: totalReviews,
      rating_distribution: distribution,
      category_averages: catAverages,
    },
  };
}

export async function mockCreateReview(payload: CreateReviewPayload): Promise<Review> {
  await simulateLatency(400, 650);
  const db = getDb();
  const hotel = db.hotels.find((h) => h.id === payload.hotel_id);

  if (!hotel) {
    throw new ApiError("Hotel not found", "NOT_FOUND", 404);
  }

  const now = new Date().toISOString();
  const newReview: Review = {
    id: `rev-${Date.now()}`,
    hotel_id: payload.hotel_id,
    hotel_name: hotel.name,
    booking_id: payload.booking_id,
    user_id: "demo-user-1",
    user_name: "Clara Oswald",
    user_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    overall_rating: payload.overall_rating,
    title: payload.title,
    content: payload.content,
    stay_date: "Recent Stay",
    categories: payload.categories,
    helpful_count: 0,
    moderation_status: "approved",
    created_at: now,
    updated_at: now,
  };

  db.reviews.unshift(newReview);

  // Recalculate hotel stats
  const hotelReviews = db.reviews.filter((r) => r.hotel_id === hotel.id);
  hotel.review_count = hotelReviews.length;
  hotel.average_rating = Number(
    (hotelReviews.reduce((acc, r) => acc + r.overall_rating, 0) / hotelReviews.length).toFixed(2)
  );

  saveDb(db);
  return newReview;
}

export async function mockListMyReviews(): Promise<Review[]> {
  await simulateLatency(300, 500);
  const db = getDb();
  return db.reviews.filter((r) => r.user_id === "demo-user-1");
}
