import { useQuery } from "@tanstack/react-query";
import { getAvailability, getRoomsForHotel } from "@/lib/api";
import { AvailabilityQuery } from "@/lib/types";

export const availabilityKeys = {
  all: ["availability"] as const,
  query: (q: AvailabilityQuery) => [...availabilityKeys.all, q] as const,
  rooms: (hotelId: string) => ["rooms", hotelId] as const,
};

export function useRooms(hotelId: string) {
  return useQuery({
    queryKey: availabilityKeys.rooms(hotelId),
    queryFn: () => getRoomsForHotel(hotelId),
    enabled: !!hotelId,
  });
}

export function useAvailability(query: AvailabilityQuery, enabled = true) {
  return useQuery({
    queryKey: availabilityKeys.query(query),
    queryFn: () => getAvailability(query),
    enabled: enabled && !!query.hotel_id && !!query.check_in && !!query.check_out,
  });
}
