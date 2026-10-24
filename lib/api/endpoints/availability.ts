import { apiClient } from "../client";
import { AvailabilityQuery, RoomAvailability } from "@/lib/types";

export async function getAvailability(
  query: AvailabilityQuery
): Promise<RoomAvailability[]> {
  return apiClient<RoomAvailability[]>("/availability", {
    params: {
      hotel_id: query.hotel_id,
      check_in: query.check_in,
      check_out: query.check_out,
      guests: query.guests,
      rooms: query.rooms,
    },
  });
}
