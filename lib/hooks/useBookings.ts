import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listMyBookings,
  getBooking,
  createBooking,
  cancelBooking,
  modifyBookingDates,
} from "@/lib/api";
import {
  BookingStatus,
  CreateBookingPayload,
  CancelBookingPayload,
  ModifyBookingDatesPayload,
} from "@/lib/types";

export const bookingKeys = {
  all: ["bookings"] as const,
  mine: (params?: { status?: BookingStatus | "all"; page?: number }) =>
    [...bookingKeys.all, "my", params] as const,
  detail: (id: string) => [...bookingKeys.all, "detail", id] as const,
};

export function useMyBookings(params: {
  status?: BookingStatus | "all";
  page?: number;
  page_size?: number;
} = {}) {
  return useQuery({
    queryKey: bookingKeys.mine(params),
    queryFn: () => listMyBookings(params),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => getBooking(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CancelBookingPayload;
    }) => cancelBooking(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useModifyBookingDates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ModifyBookingDatesPayload;
    }) => modifyBookingDates(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}
