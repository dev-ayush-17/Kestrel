import { useQuery } from "@tanstack/react-query";
import {
  searchHotels,
  getHotel,
  getFeaturedHotels,
  getSimilarHotels,
  getDestinations,
  getDestinationBySlug,
} from "@/lib/api";
import { HotelFilterParams } from "@/lib/types";

export const hotelKeys = {
  all: ["hotels"] as const,
  lists: () => [...hotelKeys.all, "list"] as const,
  list: (params: HotelFilterParams) => [...hotelKeys.lists(), params] as const,
  details: () => [...hotelKeys.all, "detail"] as const,
  detail: (slug: string) => [...hotelKeys.details(), slug] as const,
  featured: () => [...hotelKeys.all, "featured"] as const,
  similar: (hotelId: string) => [...hotelKeys.all, "similar", hotelId] as const,
  destinations: () => ["destinations"] as const,
  destination: (slug: string) => ["destinations", slug] as const,
};

export function useSearchHotels(params: HotelFilterParams = {}) {
  return useQuery({
    queryKey: hotelKeys.list(params),
    queryFn: () => searchHotels(params),
  });
}

export function useHotel(slug: string) {
  return useQuery({
    queryKey: hotelKeys.detail(slug),
    queryFn: () => getHotel(slug),
    enabled: !!slug,
  });
}

export function useFeaturedHotels() {
  return useQuery({
    queryKey: hotelKeys.featured(),
    queryFn: () => getFeaturedHotels(),
  });
}

export function useSimilarHotels(hotelId: string) {
  return useQuery({
    queryKey: hotelKeys.similar(hotelId),
    queryFn: () => getSimilarHotels(hotelId),
    enabled: !!hotelId,
  });
}

export function useDestinations() {
  return useQuery({
    queryKey: hotelKeys.destinations(),
    queryFn: () => getDestinations(),
  });
}

export function useDestination(slug: string) {
  return useQuery({
    queryKey: hotelKeys.destination(slug),
    queryFn: () => getDestinationBySlug(slug),
    enabled: !!slug,
  });
}
