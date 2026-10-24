import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminDashboard,
  listAllBookings,
  updateAdminBookingStatus,
  createHotel,
  updateHotel,
  deleteHotel,
  createRoom,
  updateRoom,
  moderateReview,
  listUsers,
  updateUserRole,
  toggleUserActive,
} from "@/lib/api";
import {
  BookingStatus,
  Hotel,
  RoomType,
  UserRole,
} from "@/lib/types";

export const adminKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminKeys.all, "dashboard"] as const,
  bookings: (params?: { search?: string; status?: string; hotel_id?: string; page?: number }) =>
    [...adminKeys.all, "bookings", params] as const,
  users: () => [...adminKeys.all, "users"] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () => getAdminDashboard(),
  });
}

export function useAdminBookings(params: {
  search?: string;
  status?: string;
  hotel_id?: string;
  page?: number;
  page_size?: number;
} = {}) {
  return useQuery({
    queryKey: adminKeys.bookings(params),
    queryFn: () => listAllBookings(params),
  });
}

export function useUpdateAdminBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: BookingStatus;
    }) => updateAdminBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useAdminHotelsMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (payload: Partial<Hotel>) => createHotel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Hotel> }) =>
      updateHotel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteHotel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
    },
  });

  return { create, update, remove };
}

export function useAdminRoomsMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: ({ hotelId, payload }: { hotelId: string; payload: Partial<RoomType> }) =>
      createRoom(hotelId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ roomId, payload }: { roomId: string; payload: Partial<RoomType> }) =>
      updateRoom(roomId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  return { create, update };
}

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: adminKeys.users(),
    queryFn: () => listUsers(),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });

  const toggleActive = useMutation({
    mutationFn: (userId: string) => toggleUserActive(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });

  return { ...usersQuery, updateRole, toggleActive };
}

export function useModerateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      status,
    }: {
      reviewId: string;
      status: "approved" | "rejected";
    }) => moderateReview(reviewId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
