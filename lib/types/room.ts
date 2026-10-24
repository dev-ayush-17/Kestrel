import { Amenity } from "./hotel";
import { TimestampString, DateString } from "./common";

export type BedType = "king" | "queen" | "twin" | "double" | "tatami";

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  slug: string;
  description: string;
  max_occupancy: number;
  bed_type: BedType;
  bed_count: number;
  size_sqm: number;
  base_nightly_rate_cents: number;
  currency: string;
  total_inventory: number;
  images: string[];
  amenities: Amenity[];
  features: string[];
  created_at: TimestampString;
  updated_at: TimestampString;
}

export interface RoomAvailability {
  room_type_id: string;
  hotel_id: string;
  available_units: number;
  is_available: boolean;
  nightly_rate_cents: number;
  total_cents: number;
  nights: number;
}

export interface AvailabilityQuery {
  hotel_id: string;
  check_in: DateString;
  check_out: DateString;
  guests?: number;
  rooms?: number;
}
