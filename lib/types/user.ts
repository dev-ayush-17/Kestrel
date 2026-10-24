import { TimestampString } from "./common";

export type UserRole = "guest" | "customer" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: TimestampString;
  updated_at: TimestampString;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}
