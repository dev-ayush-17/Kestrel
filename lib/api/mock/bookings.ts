import {
  Booking,
  BookingStatus,
  CreateBookingPayload,
  CancelBookingPayload,
  ModifyBookingDatesPayload,
  Paginated,
  ApiError,
} from "@/lib/types";
import { getDb, saveDb, simulateLatency } from "./storage";
import { calculateNights } from "@/lib/utils";

export async function mockListMyBookings(params: {
  status?: BookingStatus | "all";
  page?: number;
  page_size?: number;
} = {}): Promise<Paginated<Booking>> {
  await simulateLatency(350, 600);
  const db = getDb();

  // Current customer bookings
  let items = db.bookings.filter((b) => b.user_id === "demo-user-1");

  if (params.status && params.status !== "all") {
    items = items.filter((b) => b.status === params.status);
  }

  // Sort by created_at desc
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, params.page_size || 5);
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems,
    total,
    page,
    page_size: pageSize,
    total_pages: totalPages,
  };
}

export async function mockGetBooking(id: string): Promise<Booking> {
  await simulateLatency(250, 450);
  const db = getDb();
  const booking = db.bookings.find((b) => b.id === id || b.booking_reference === id);
  if (!booking) {
    throw new ApiError(`Booking "${id}" not found`, "BOOKING_NOT_FOUND", 404);
  }
  return booking;
}

export async function mockCreateBooking(
  payload: CreateBookingPayload
): Promise<Booking> {
  await simulateLatency(500, 800);
  const db = getDb();

  const hotel = db.hotels.find((h) => h.id === payload.hotel_id);
  const room = db.rooms.find((r) => r.id === payload.room_type_id);

  if (!hotel || !room) {
    throw new ApiError("Invalid hotel or room selection", "INVALID_REQUEST", 400);
  }

  // Verify availability against active bookings
  const overlappingBookings = db.bookings.filter(
    (b) =>
      b.room_type_id === payload.room_type_id &&
      b.status !== "cancelled" &&
      payload.check_in_date < b.check_out_date &&
      payload.check_out_date > b.check_in_date
  );

  const bookedUnits = overlappingBookings.reduce(
    (acc, b) => acc + (b.rooms_count || 1),
    0
  );
  const availableUnits = room.total_inventory - bookedUnits;

  if (availableUnits < payload.rooms_count) {
    throw new ApiError(
      "The selected room is no longer available for these dates. Please choose alternative dates or another sanctuary suite.",
      "INVENTORY_EXHAUSTED",
      409
    );
  }

  const nights = calculateNights(payload.check_in_date, payload.check_out_date) || 1;
  const nightlyRate = room.base_nightly_rate_cents;
  const subtotalCents = nightlyRate * nights * payload.rooms_count;
  const taxesCents = Math.round(subtotalCents * 0.14);
  const cleaningFeeCents = 4500; // $45.00
  const totalCents = subtotalCents + taxesCents + cleaningFeeCents;

  const now = new Date().toISOString();
  const bookingRef = `KS-${Math.floor(100000 + Math.random() * 900000)}`;

  const newBooking: Booking = {
    id: `book-${Date.now()}`,
    booking_reference: bookingRef,
    user_id: "demo-user-1",
    hotel_id: hotel.id,
    hotel_name: hotel.name,
    hotel_slug: hotel.slug,
    hotel_city: hotel.location.city,
    hotel_country: hotel.location.country,
    hotel_image: hotel.hero_image,
    room_type_id: room.id,
    room_name: room.name,
    room_image: room.images[0] || hotel.hero_image,
    check_in_date: payload.check_in_date,
    check_out_date: payload.check_out_date,
    nights,
    adults: payload.adults,
    children: payload.children,
    rooms_count: payload.rooms_count,
    status: "confirmed",
    price_breakdown: {
      nightly_rate_cents: nightlyRate,
      nights,
      subtotal_cents: subtotalCents,
      taxes_and_fees_cents: taxesCents,
      cleaning_fee_cents: cleaningFeeCents,
      discount_cents: 0,
      total_cents: totalCents,
      currency: "USD",
    },
    guest_info: payload.guest_info,
    payment: {
      transaction_id: `tx_${Math.random().toString(36).substring(2, 10)}`,
      status: "succeeded",
      card_last4: "4242",
      card_brand: "Visa",
      amount_cents: totalCents,
      currency: "USD",
      paid_at: now,
    },
    status_history: [
      {
        id: `evt-${Date.now()}-1`,
        booking_id: `book-${Date.now()}`,
        status: "pending",
        note: "Reservation initialized via secure checkout",
        created_at: now,
      },
      {
        id: `evt-${Date.now()}-2`,
        booking_id: `book-${Date.now()}`,
        status: "confirmed",
        note: "Demo payment authorized; inventory guaranteed",
        created_at: now,
      },
    ],
    created_at: now,
    updated_at: now,
  };

  db.bookings.unshift(newBooking);
  saveDb(db);

  return newBooking;
}

export async function mockCancelBooking(
  id: string,
  payload: CancelBookingPayload
): Promise<Booking> {
  await simulateLatency(400, 700);
  const db = getDb();
  const booking = db.bookings.find((b) => b.id === id || b.booking_reference === id);

  if (!booking) {
    throw new ApiError(`Booking "${id}" not found`, "BOOKING_NOT_FOUND", 404);
  }

  if (booking.status === "cancelled") {
    throw new ApiError("Booking is already cancelled", "ALREADY_CANCELLED", 400);
  }

  const now = new Date().toISOString();
  booking.status = "cancelled";
  booking.cancellation_reason = payload.reason;
  booking.cancelled_at = now;
  booking.updated_at = now;
  booking.payment.status = "refunded";

  booking.status_history.push({
    id: `evt-${Date.now()}`,
    booking_id: booking.id,
    status: "cancelled",
    note: `Cancelled by guest: ${payload.reason}. Full refund processed to original card.`,
    created_at: now,
  });

  saveDb(db);
  return booking;
}

export async function mockModifyBookingDates(
  id: string,
  payload: ModifyBookingDatesPayload
): Promise<Booking> {
  await simulateLatency(400, 700);
  const db = getDb();
  const booking = db.bookings.find((b) => b.id === id || b.booking_reference === id);

  if (!booking) {
    throw new ApiError(`Booking "${id}" not found`, "BOOKING_NOT_FOUND", 404);
  }

  const nights = calculateNights(payload.new_check_in_date, payload.new_check_out_date) || 1;
  const subtotalCents = booking.price_breakdown.nightly_rate_cents * nights * booking.rooms_count;
  const taxesCents = Math.round(subtotalCents * 0.14);
  const totalCents = subtotalCents + taxesCents + booking.price_breakdown.cleaning_fee_cents;

  const now = new Date().toISOString();
  booking.check_in_date = payload.new_check_in_date;
  booking.check_out_date = payload.new_check_out_date;
  booking.nights = nights;
  booking.price_breakdown.nights = nights;
  booking.price_breakdown.subtotal_cents = subtotalCents;
  booking.price_breakdown.taxes_and_fees_cents = taxesCents;
  booking.price_breakdown.total_cents = totalCents;
  booking.updated_at = now;

  booking.status_history.push({
    id: `evt-${Date.now()}`,
    booking_id: booking.id,
    status: booking.status,
    note: `Stay dates modified to ${payload.new_check_in_date} – ${payload.new_check_out_date} (${nights} nights).`,
    created_at: now,
  });

  saveDb(db);
  return booking;
}
