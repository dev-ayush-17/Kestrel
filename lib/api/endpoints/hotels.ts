import { apiClient } from "../client";
import {
  Hotel,
  HotelFilterParams,
  Paginated,
  Destination,
} from "@/lib/types";

export async function searchHotels(
  params: HotelFilterParams = {}
): Promise<Paginated<Hotel>> {
  const queryParams: Record<string, string | number | boolean | undefined> = {
    destination: params.destination,
    check_in: params.check_in,
    check_out: params.check_out,
    guests: params.guests,
    rooms: params.rooms,
    min_price_cents: params.min_price_cents,
    max_price_cents: params.max_price_cents,
    min_rating: params.min_rating,
    free_cancellation_only: params.free_cancellation_only,
    sort_by: params.sort_by,
    page: params.page,
    page_size: params.page_size,
  };

  if (params.property_types && params.property_types.length > 0) {
    queryParams["property_types"] = params.property_types.join(",");
  }
  if (params.amenity_ids && params.amenity_ids.length > 0) {
    queryParams["amenities"] = params.amenity_ids.join(",");
  }

  return apiClient<Paginated<Hotel>>("/hotels", { params: queryParams });
}

export async function getHotel(slug: string): Promise<Hotel> {
  return apiClient<Hotel>(`/hotels/${slug}`);
}

export async function getFeaturedHotels(): Promise<Hotel[]> {
  return apiClient<Hotel[]>("/hotels/featured");
}

export async function getSimilarHotels(hotelId: string): Promise<Hotel[]> {
  return apiClient<Hotel[]>(`/hotels/${hotelId}/similar`);
}

export async function getDestinations(): Promise<Destination[]> {
  return apiClient<Destination[]>("/destinations");
}

export async function getDestinationBySlug(slug: string): Promise<Destination> {
  return apiClient<Destination>(`/destinations/${slug}`);
}
