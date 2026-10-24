import {
  Hotel,
  HotelFilterParams,
  Paginated,
  Destination,
  ApiError,
} from "@/lib/types";
import { getDb, simulateLatency } from "./storage";

export async function mockSearchHotels(
  params: HotelFilterParams = {}
): Promise<Paginated<Hotel>> {
  await simulateLatency(400, 750);
  const db = getDb();
  let results = [...db.hotels];

  // Destination query
  if (params.destination) {
    const destTerm = params.destination.toLowerCase().trim();
    results = results.filter(
      (h) =>
        h.location.city.toLowerCase().includes(destTerm) ||
        h.location.country.toLowerCase().includes(destTerm) ||
        h.name.toLowerCase().includes(destTerm)
    );
  }

  // Property types
  if (params.property_types && params.property_types.length > 0) {
    results = results.filter((h) =>
      params.property_types!.includes(h.property_type)
    );
  }

  // Price range (cents)
  if (params.min_price_cents !== undefined) {
    results = results.filter((h) => h.min_price_cents >= params.min_price_cents!);
  }
  if (params.max_price_cents !== undefined) {
    results = results.filter((h) => h.min_price_cents <= params.max_price_cents!);
  }

  // Minimum rating
  if (params.min_rating !== undefined) {
    results = results.filter((h) => h.average_rating >= params.min_rating!);
  }

  // Free cancellation
  if (params.free_cancellation_only) {
    results = results.filter((h) => h.policies.free_cancellation_hours > 0);
  }

  // Amenities
  if (params.amenity_ids && params.amenity_ids.length > 0) {
    results = results.filter((h) =>
      params.amenity_ids!.every((aid) => h.amenities.some((a) => a.id === aid))
    );
  }

  // Sorting
  const sortBy = params.sort_by || "recommended";
  if (sortBy === "price_asc") {
    results.sort((a, b) => a.min_price_cents - b.min_price_cents);
  } else if (sortBy === "price_desc") {
    results.sort((a, b) => b.min_price_cents - a.min_price_cents);
  } else if (sortBy === "rating_desc") {
    results.sort((a, b) => b.average_rating - a.average_rating);
  } else {
    // "recommended": featured first, then rating
    results.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.average_rating - a.average_rating;
    });
  }

  // Pagination
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, params.page_size || 6);
  const total = results.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const items = results.slice(startIndex, startIndex + pageSize);

  return {
    items,
    total,
    page,
    page_size: pageSize,
    total_pages: totalPages,
  };
}

export async function mockGetHotel(slug: string): Promise<Hotel> {
  await simulateLatency(300, 550);
  const db = getDb();
  const hotel = db.hotels.find((h) => h.slug === slug || h.id === slug);
  if (!hotel) {
    throw new ApiError(`Hotel "${slug}" not found`, "HOTEL_NOT_FOUND", 404);
  }
  return hotel;
}

export async function mockGetFeaturedHotels(): Promise<Hotel[]> {
  await simulateLatency(300, 500);
  const db = getDb();
  return db.hotels.filter((h) => h.featured);
}

export async function mockGetSimilarHotels(hotelId: string): Promise<Hotel[]> {
  await simulateLatency(250, 450);
  const db = getDb();
  const current = db.hotels.find((h) => h.id === hotelId);
  return db.hotels
    .filter(
      (h) =>
        h.id !== hotelId &&
        (current ? h.location.city === current.location.city || h.property_type === current.property_type : true)
    )
    .slice(0, 3);
}

export async function mockGetDestinations(): Promise<Destination[]> {
  await simulateLatency(250, 450);
  const db = getDb();
  return db.destinations;
}

export async function mockGetDestinationBySlug(slug: string): Promise<Destination> {
  await simulateLatency(300, 500);
  const db = getDb();
  const dest = db.destinations.find((d) => d.slug === slug);
  if (!dest) {
    throw new ApiError(`Destination "${slug}" not found`, "DESTINATION_NOT_FOUND", 404);
  }
  return dest;
}
