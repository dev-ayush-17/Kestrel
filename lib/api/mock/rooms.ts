import { RoomType, ApiError } from "@/lib/types";
import { getDb, simulateLatency } from "./storage";

export async function mockGetRoomsForHotel(hotelId: string): Promise<RoomType[]> {
  await simulateLatency(300, 500);
  const db = getDb();
  return db.rooms.filter((r) => r.hotel_id === hotelId);
}

export async function mockGetRoom(roomId: string): Promise<RoomType> {
  await simulateLatency(250, 450);
  const db = getDb();
  const room = db.rooms.find((r) => r.id === roomId || r.slug === roomId);
  if (!room) {
    throw new ApiError(`Room "${roomId}" not found`, "ROOM_NOT_FOUND", 404);
  }
  return room;
}
