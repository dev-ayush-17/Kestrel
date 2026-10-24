import { Favorite } from "@/lib/types";
import { getDb, saveDb, simulateLatency } from "./storage";

export async function mockListFavorites(): Promise<Favorite[]> {
  await simulateLatency(250, 450);
  const db = getDb();
  return db.favorites.filter((f) => f.user_id === "demo-user-1");
}

export async function mockAddFavorite(hotelId: string): Promise<Favorite> {
  await simulateLatency(250, 400);
  const db = getDb();
  const hotel = db.hotels.find((h) => h.id === hotelId);

  const existing = db.favorites.find(
    (f) => f.user_id === "demo-user-1" && f.hotel_id === hotelId
  );
  if (existing) {
    return existing;
  }

  const newFav: Favorite = {
    id: `fav-${Date.now()}`,
    user_id: "demo-user-1",
    hotel_id: hotelId,
    hotel: hotel || db.hotels[0],
    created_at: new Date().toISOString(),
  };

  db.favorites.unshift(newFav);
  saveDb(db);
  return newFav;
}

export async function mockRemoveFavorite(hotelId: string): Promise<{ success: boolean }> {
  await simulateLatency(250, 400);
  const db = getDb();
  db.favorites = db.favorites.filter(
    (f) => !(f.user_id === "demo-user-1" && f.hotel_id === hotelId)
  );
  saveDb(db);
  return { success: true };
}
