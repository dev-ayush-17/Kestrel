import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAccessToken } from "@/lib/api/client";

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: {
        id: "demo-user-1",
        email: "clara.oswald@example.com",
        full_name: "Clara Oswald",
        role: "customer",
        avatar_url:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      },
      token: null,
      isAuthenticated: true,
      setUser: (user, token = null) => {
        if (token) {
          setAccessToken(token);
        }
        set({
          user,
          token,
          isAuthenticated: !!user,
        });
      },
      logout: () => {
        setAccessToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "kestrel_auth_storage",
    }
  )
);
