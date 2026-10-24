import { Hotel } from "./hotel";
import { TimestampString } from "./common";

export interface Favorite {
  id: string;
  user_id: string;
  hotel_id: string;
  hotel: Hotel;
  created_at: TimestampString;
}
