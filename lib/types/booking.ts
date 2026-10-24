import { DateString, TimestampString } from "./common";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

export interface BookingStatusEvent {
  id: string;
  booking_id: string;
  status: BookingStatus;
  note: string;
  created_at: TimestampString;
  created_by?: string;
}

export interface GuestInfo {
  full_name: string;
  email: string;
  phone_number: string;
  special_requests?: string;
  estimated_arrival_time?: string;
}

export interface BookingPayment {
  transaction_id: string;
  status: "succeeded" | "refunded" | "pending";
  card_last4: string;
  card_brand: string;
  amount_cents: number;
  currency: string;
  paid_at: TimestampString;
}

export interface PriceBreakdownDetails {
  nightly_rate_cents: number;
  nights: number;
  subtotal_cents: number;
  taxes_and_fees_cents: number;
  cleaning_fee_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: string;
}

export interface Booking {
  id: string;
  booking_reference: string; // e.g. "KS-892147"
  user_id: string;
  hotel_id: string;
  hotel_name: string;
  hotel_slug: string;
  hotel_city: string;
  hotel_country: string;
  hotel_image: string;
  room_type_id: string;
  room_name: string;
  room_image: string;
  check_in_date: DateString; // "YYYY-MM-DD"
  check_out_date: DateString; // "YYYY-MM-DD"
  nights: number;
  adults: number;
  children: number;
  rooms_count: number;
  status: BookingStatus;
  price_breakdown: PriceBreakdownDetails;
  guest_info: GuestInfo;
  payment: BookingPayment;
  status_history: BookingStatusEvent[];
  cancellation_reason?: string;
  cancelled_at?: TimestampString;
  created_at: TimestampString;
  updated_at: TimestampString;
}

export interface CreateBookingPayload {
  hotel_id: string;
  room_type_id: string;
  check_in_date: DateString;
  check_out_date: DateString;
  adults: number;
  children: number;
  rooms_count: number;
  guest_info: GuestInfo;
  payment_method_id?: string;
}

export interface CancelBookingPayload {
  reason: string;
}

export interface ModifyBookingDatesPayload {
  new_check_in_date: DateString;
  new_check_out_date: DateString;
}
