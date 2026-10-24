import {
  AdminDashboardData,
  Booking,
  BookingStatus,
  Hotel,
  RoomType,
  Review,
  Paginated,
  ApiError,
} from "@/lib/types";
import { getDb, saveDb, simulateLatency } from "./storage";

export async function mockGetAdminDashboard(): Promise<AdminDashboardData> {
  await simulateLatency(400, 700);
  const db = getDb();

  const totalBookings = db.bookings.length;
  const confirmedBookings = db.bookings.filter((b) => b.status === "confirmed" || b.status === "completed");
  const totalRevenueCents = confirmedBookings.reduce(
    (acc, b) => acc + b.price_breakdown.total_cents,
    0
  );
  const activeGuests = confirmedBookings.reduce(
    (acc, b) => acc + (b.adults + (b.children || 0)),
    0
  );

  return {
    metrics: {
      total_revenue_cents: totalRevenueCents,
      total_bookings_count: totalBookings,
      confirmed_bookings_count: confirmedBookings.length,
      active_guests_count: activeGuests,
      occupancy_rate_percent: 78.4,
      average_daily_rate_cents: 48500,
      revenue_growth_percent: 18.2,
    },
    revenue_chart: [
      { month: "May", revenue_dollars: 28400, bookings_count: 42 },
      { month: "Jun", revenue_dollars: 42100, bookings_count: 65 },
      { month: "Jul", revenue_dollars: 58900, bookings_count: 88 },
      { month: "Aug", revenue_dollars: 64200, bookings_count: 94 },
      { month: "Sep", revenue_dollars: 51800, bookings_count: 76 },
      { month: "Oct", revenue_dollars: 48300, bookings_count: 71 },
    ],
    occupancy_chart: [
      { date: "Oct 18", occupancy_rate: 72, available_rooms: 8 },
      { date: "Oct 19", occupancy_rate: 76, available_rooms: 7 },
      { date: "Oct 20", occupancy_rate: 85, available_rooms: 4 },
      { date: "Oct 21", occupancy_rate: 82, available_rooms: 5 },
      { date: "Oct 22", occupancy_rate: 91, available_rooms: 2 },
      { date: "Oct 23", occupancy_rate: 88, available_rooms: 3 },
      { date: "Oct 24", occupancy_rate: 84, available_rooms: 4 },
    ],
    recent_bookings: db.bookings.slice(0, 5),
  };
}

export async function mockListAllBookings(params: {
  search?: string;
  status?: string;
  hotel_id?: string;
  page?: number;
  page_size?: number;
} = {}): Promise<Paginated<Booking>> {
  await simulateLatency(400, 650);
  const db = getDb();
  let items = [...db.bookings];

  if (params.search) {
    const term = params.search.toLowerCase();
    items = items.filter(
      (b) =>
        b.booking_reference.toLowerCase().includes(term) ||
        b.guest_info.full_name.toLowerCase().includes(term) ||
        b.hotel_name.toLowerCase().includes(term)
    );
  }

  if (params.status && params.status !== "all") {
    items = items.filter((b) => b.status === params.status);
  }

  if (params.hotel_id && params.hotel_id !== "all") {
    items = items.filter((b) => b.hotel_id === params.hotel_id);
  }

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, params.page_size || 10);
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

export async function mockUpdateAdminBookingStatus(
  bookingId: string,
  newStatus: BookingStatus
): Promise<Booking> {
  await simulateLatency(350, 550);
  const db = getDb();
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) {
    throw new ApiError("Booking not found", "NOT_FOUND", 404);
  }

  booking.status = newStatus;
  booking.updated_at = new Date().toISOString();
  booking.status_history.push({
    id: `evt-${Date.now()}`,
    booking_id: booking.id,
    status: newStatus,
    note: `Status manually updated to ${newStatus} by hotel administrator.`,
    created_at: new Date().toISOString(),
    created_by: "Alexander Vance (Admin)",
  });

  saveDb(db);
  return booking;
}

export async function mockCreateHotel(payload: Partial<Hotel>): Promise<Hotel> {
  await simulateLatency(500, 800);
  const db = getDb();
  const now = new Date().toISOString();

  const newHotel: Hotel = {
    id: `hotel-${Date.now()}`,
    slug: (payload.name || "new-hotel").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: payload.name || "New Boutique Sanctuary",
    tagline: payload.tagline || "Artisanal hospitality in harmony with nature.",
    description: payload.description || "Thoughtfully designed retreat.",
    property_type: payload.property_type || "boutique",
    star_rating: payload.star_rating || 5,
    average_rating: 5.0,
    review_count: 0,
    featured: payload.featured || false,
    min_price_cents: payload.min_price_cents || 35000,
    currency: "USD",
    location: payload.location || {
      city: "Kyoto",
      country: "Japan",
      address: "1 Central Lane",
      postal_code: "100-0001",
      latitude: 35.0,
      longitude: 135.0,
      neighborhood_description: "Serene garden quarter.",
    },
    amenities: payload.amenities || [db.amenities[0], db.amenities[1], db.amenities[2]],
    images: payload.images && payload.images.length > 0
      ? payload.images
      : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"],
    hero_image: payload.hero_image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    policies: payload.policies || {
      check_in_time: "15:00",
      check_out_time: "11:00",
      cancellation_policy_summary: "Free cancellation until 48 hours before arrival.",
      free_cancellation_hours: 48,
      pet_friendly: false,
      smoking_allowed: false,
      min_age_requirement: 18,
    },
    created_at: now,
    updated_at: now,
  };

  db.hotels.unshift(newHotel);
  saveDb(db);
  return newHotel;
}

export async function mockUpdateHotel(id: string, payload: Partial<Hotel>): Promise<Hotel> {
  await simulateLatency(400, 700);
  const db = getDb();
  const hotelIndex = db.hotels.findIndex((h) => h.id === id);
  if (hotelIndex === -1) {
    throw new ApiError("Hotel not found", "NOT_FOUND", 404);
  }

  const existing = db.hotels[hotelIndex];
  const updatedHotel: Hotel = {
    ...existing,
    ...payload,
    location: payload.location ? { ...existing.location, ...payload.location } : existing.location,
    policies: payload.policies ? { ...existing.policies, ...payload.policies } : existing.policies,
    updated_at: new Date().toISOString(),
  };

  db.hotels[hotelIndex] = updatedHotel;
  saveDb(db);
  return updatedHotel;
}

export async function mockDeleteHotel(id: string): Promise<{ success: boolean }> {
  await simulateLatency(400, 600);
  const db = getDb();
  db.hotels = db.hotels.filter((h) => h.id !== id);
  db.rooms = db.rooms.filter((r) => r.hotel_id !== id);
  saveDb(db);
  return { success: true };
}

export async function mockCreateRoom(hotelId: string, payload: Partial<RoomType>): Promise<RoomType> {
  await simulateLatency(400, 700);
  const db = getDb();
  const now = new Date().toISOString();

  const newRoom: RoomType = {
    id: `room-${Date.now()}`,
    hotel_id: hotelId,
    name: payload.name || "Signature Deluxe Room",
    slug: (payload.name || "signature-deluxe-room").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: payload.description || "Spacious artisan bedroom with timber finishes.",
    max_occupancy: payload.max_occupancy || 2,
    bed_type: payload.bed_type || "king",
    bed_count: payload.bed_count || 1,
    size_sqm: payload.size_sqm || 40,
    base_nightly_rate_cents: payload.base_nightly_rate_cents || 32000,
    currency: "USD",
    total_inventory: payload.total_inventory || 3,
    images: payload.images && payload.images.length > 0
      ? payload.images
      : ["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"],
    amenities: payload.amenities || [db.amenities[1], db.amenities[2]],
    features: payload.features || ["King bed", "Soaking tub", "Espresso bar"],
    created_at: now,
    updated_at: now,
  };

  db.rooms.push(newRoom);
  saveDb(db);
  return newRoom;
}

export async function mockUpdateRoom(roomId: string, payload: Partial<RoomType>): Promise<RoomType> {
  await simulateLatency(350, 600);
  const db = getDb();
  const roomIndex = db.rooms.findIndex((r) => r.id === roomId);
  if (roomIndex === -1) {
    throw new ApiError("Room not found", "NOT_FOUND", 404);
  }

  const existing = db.rooms[roomIndex];
  const updatedRoom = {
    ...existing,
    ...payload,
    updated_at: new Date().toISOString(),
  };

  db.rooms[roomIndex] = updatedRoom;
  saveDb(db);
  return updatedRoom;
}

export async function mockModerateReview(
  reviewId: string,
  status: "approved" | "rejected"
): Promise<Review> {
  await simulateLatency(300, 500);
  const db = getDb();
  const review = db.reviews.find((r) => r.id === reviewId);
  if (!review) {
    throw new ApiError("Review not found", "NOT_FOUND", 404);
  }

  review.moderation_status = status;
  review.updated_at = new Date().toISOString();
  saveDb(db);
  return review;
}
