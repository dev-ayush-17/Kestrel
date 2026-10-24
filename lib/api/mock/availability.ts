import {
  AvailabilityQuery,
  RoomAvailability,
} from "@/lib/types";
import { getDb, simulateLatency } from "./storage";
import { calculateNights } from "@/lib/utils";

export async function mockGetAvailability(
  query: AvailabilityQuery
): Promise<RoomAvailability[]> {
  await simulateLatency(350, 600);
  const db = getDb();

  const hotelRooms = db.rooms.filter((r) => r.hotel_id === query.hotel_id);
  const nights = calculateNights(query.check_in, query.check_out) || 1;
  const requestedRooms = query.rooms || 1;

  // Active bookings overlapping with requested date window
  const activeBookings = db.bookings.filter(
    (b) =>
      b.hotel_id === query.hotel_id &&
      b.status !== "cancelled" &&
      // Overlap condition: check_in < b_check_out && check_out > b_check_in
      query.check_in < b.check_out_date &&
      query.check_out > b.check_in_date
  );

  return hotelRooms.map((room) => {
    // Count units booked for this room during requested window
    const bookedUnits = activeBookings
      .filter((b) => b.room_type_id === room.id)
      .reduce((acc, b) => acc + (b.rooms_count || 1), 0);

    const availableUnits = Math.max(0, room.total_inventory - bookedUnits);
    const isAvailable = availableUnits >= requestedRooms;

    return {
      room_type_id: room.id,
      hotel_id: query.hotel_id,
      available_units: availableUnits,
      is_available: isAvailable,
      nightly_rate_cents: room.base_nightly_rate_cents,
      total_cents: room.base_nightly_rate_cents * nights * requestedRooms,
      nights,
    };
  });
}
