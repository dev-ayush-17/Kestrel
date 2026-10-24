import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: "guest" | "customer" | "admin";
  avatar_url?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null, token?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: "demo-user-1",
    email: "clara.oswald@example.com",
    full_name: "Clara Oswald",
    role: "customer",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  },
  token: "demo-mock-jwt-token",
  isAuthenticated: true,
  setUser: (user, token = null) =>
    set({
      user,
      token,
      isAuthenticated: !!user,
    }),
  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    }),
}));
