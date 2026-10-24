import {
  Hotel,
  RoomType,
  Booking,
  Review,
  Favorite,
  User,
  Destination,
  Amenity,
} from "@/lib/types";
import {
  MOCK_HOTELS,
  MOCK_ROOMS,
  MOCK_USERS,
  MOCK_BOOKINGS,
  MOCK_REVIEWS,
  MOCK_FAVORITES,
  MOCK_DESTINATIONS,
  MOCK_AMENITIES,
} from "./data";

const STORAGE_KEY = "kestrel_mock_db_v1";

interface DatabaseState {
  hotels: Hotel[];
  rooms: RoomType[];
  users: User[];
  bookings: Booking[];
  reviews: Review[];
  favorites: Favorite[];
  destinations: Destination[];
  amenities: Amenity[];
}

function getDefaultState(): DatabaseState {
  return {
    hotels: [...MOCK_HOTELS],
    rooms: [...MOCK_ROOMS],
    users: [...MOCK_USERS],
    bookings: [...MOCK_BOOKINGS],
    reviews: [...MOCK_REVIEWS],
    favorites: [...MOCK_FAVORITES],
    destinations: [...MOCK_DESTINATIONS],
    amenities: [...MOCK_AMENITIES],
  };
}

let inMemoryDb: DatabaseState = getDefaultState();

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getDb(): DatabaseState {
  if (isClient()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback to memory
    }
  }
  return inMemoryDb;
}

export function saveDb(nextState: DatabaseState): void {
  inMemoryDb = nextState;
  if (isClient()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // Ignore localStorage errors
    }
  }
}

export function resetDb(): void {
  inMemoryDb = getDefaultState();
  if (isClient()) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

export async function simulateLatency(minMs = 300, maxMs = 600): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}
