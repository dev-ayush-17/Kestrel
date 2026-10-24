import { TimestampString } from "./common";

export type PropertyType = "boutique" | "resort" | "city" | "lodge" | "beachfront";

export interface Amenity {
  id: string;
  name: string;
  icon_name: string;
  category: "room" | "property" | "wellness" | "dining";
  description?: string;
}

export interface HotelLocation {
  city: string;
  country: string;
  address: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  neighborhood_description: string;
}

export interface HotelPolicies {
  check_in_time: string; // "15:00"
  check_out_time: string; // "11:00"
  cancellation_policy_summary: string;
  free_cancellation_hours: number;
  pet_friendly: boolean;
  smoking_allowed: boolean;
  min_age_requirement: number;
}

export interface Hotel {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  property_type: PropertyType;
  star_rating: number; // 1 to 5
  average_rating: number; // e.g. 4.9
  review_count: number;
  featured: boolean;
  min_price_cents: number; // integer minor units
  currency: string;
  location: HotelLocation;
  amenities: Amenity[];
  images: string[];
  hero_image: string;
  policies: HotelPolicies;
  created_at: TimestampString;
  updated_at: TimestampString;
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  country: string;
  tagline: string;
  description: string;
  hero_image: string;
  hotel_count: number;
  best_season: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface HotelFilterParams {
  destination?: string;
  check_in?: string; // "YYYY-MM-DD"
  check_out?: string; // "YYYY-MM-DD"
  guests?: number;
  rooms?: number;
  property_types?: PropertyType[];
  min_price_cents?: number;
  max_price_cents?: number;
  amenity_ids?: string[];
  min_rating?: number;
  free_cancellation_only?: boolean;
  sort_by?: "recommended" | "price_asc" | "price_desc" | "rating_desc";
  page?: number;
  page_size?: number;
}
