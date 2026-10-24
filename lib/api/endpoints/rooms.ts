import { apiClient } from "../client";
import { RoomType } from "@/lib/types";

export async function getRoomsForHotel(hotelId: string): Promise<RoomType[]> {
  return apiClient<RoomType[]>(`/hotels/${hotelId}/rooms`);
}

export async function getRoom(roomId: string): Promise<RoomType> {
  return apiClient<RoomType>(`/rooms/${roomId}`);
}
