import { apiClient } from "../client";
import { Favorite } from "@/lib/types";

export async function listFavorites(): Promise<Favorite[]> {
  return apiClient<Favorite[]>("/favorites");
}

export async function addFavorite(hotelId: string): Promise<Favorite> {
  return apiClient<Favorite>("/favorites", {
    method: "POST",
    body: JSON.stringify({ hotel_id: hotelId }),
  });
}

export async function removeFavorite(hotelId: string): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/favorites/${hotelId}`, {
    method: "DELETE",
  });
}
