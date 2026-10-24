import { TimestampString } from "./common";

export interface ReviewRatingCategories {
  cleanliness: number;
  location: number;
  service: number;
  comfort: number;
  value: number;
}

export interface Review {
  id: string;
  hotel_id: string;
  hotel_name?: string;
  booking_id?: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  overall_rating: number; // 1.0 to 5.0
  title: string;
  content: string;
  stay_date: string; // "October 2026"
  room_name?: string;
  categories: ReviewRatingCategories;
  helpful_count: number;
  moderation_status: "approved" | "pending" | "rejected";
  created_at: TimestampString;
  updated_at: TimestampString;
}

export interface ReviewRatingSummary {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  category_averages: ReviewRatingCategories;
}

export interface CreateReviewPayload {
  hotel_id: string;
  booking_id?: string;
  overall_rating: number;
  title: string;
  content: string;
  categories: ReviewRatingCategories;
}
