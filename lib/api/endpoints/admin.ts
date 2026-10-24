import { apiClient } from "../client";
import {
  AdminDashboardData,
  Booking,
  BookingStatus,
  Hotel,
  RoomType,
  Review,
  Paginated,
} from "@/lib/types";

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiClient<AdminDashboardData>("/admin/dashboard");
}

export async function listAllBookings(params: {
  search?: string;
  status?: string;
  hotel_id?: string;
  page?: number;
  page_size?: number;
} = {}): Promise<Paginated<Booking>> {
  return apiClient<Paginated<Booking>>("/admin/bookings", {
    params: {
      search: params.search,
      status: params.status && params.status !== "all" ? params.status : undefined,
      hotel_id: params.hotel_id && params.hotel_id !== "all" ? params.hotel_id : undefined,
      page: params.page,
      page_size: params.page_size,
    },
  });
}

export async function updateAdminBookingStatus(
  bookingId: string,
  newStatus: BookingStatus
): Promise<Booking> {
  return apiClient<Booking>(`/admin/bookings/${bookingId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus }),
  });
}

export async function createHotel(payload: Partial<Hotel>): Promise<Hotel> {
  return apiClient<Hotel>("/admin/hotels", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateHotel(id: string, payload: Partial<Hotel>): Promise<Hotel> {
  return apiClient<Hotel>(`/admin/hotels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteHotel(id: string): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/admin/hotels/${id}`, {
    method: "DELETE",
  });
}

export async function createRoom(hotelId: string, payload: Partial<RoomType>): Promise<RoomType> {
  return apiClient<RoomType>(`/admin/hotels/${hotelId}/rooms`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRoom(roomId: string, payload: Partial<RoomType>): Promise<RoomType> {
  return apiClient<RoomType>(`/admin/rooms/${roomId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function moderateReview(
  reviewId: string,
  status: "approved" | "rejected"
): Promise<Review> {
  return apiClient<Review>(`/admin/reviews/${reviewId}/moderate`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
