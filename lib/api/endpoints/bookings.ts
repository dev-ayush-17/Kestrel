import { apiClient } from "../client";
import {
  Booking,
  BookingStatus,
  CreateBookingPayload,
  CancelBookingPayload,
  ModifyBookingDatesPayload,
  Paginated,
} from "@/lib/types";

export async function listMyBookings(params: {
  status?: BookingStatus | "all";
  page?: number;
  page_size?: number;
} = {}): Promise<Paginated<Booking>> {
  return apiClient<Paginated<Booking>>("/bookings/my", {
    params: {
      status: params.status && params.status !== "all" ? params.status : undefined,
      page: params.page,
      page_size: params.page_size,
    },
  });
}

export async function getBooking(id: string): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}`);
}

export async function createBooking(
  payload: CreateBookingPayload
): Promise<Booking> {
  return apiClient<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelBooking(
  id: string,
  payload: CancelBookingPayload
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function modifyBookingDates(
  id: string,
  payload: ModifyBookingDatesPayload
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/modify-dates`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
