import { apiClient, setAccessToken } from "../client";
import {
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  User,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from "@/lib/types";

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const data = await apiClient<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (data?.access_token) {
    setAccessToken(data.access_token);
  }
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthTokens> {
  const data = await apiClient<AuthTokens>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (data?.access_token) {
    setAccessToken(data.access_token);
  }
  return data;
}

export async function logout(): Promise<{ success: boolean }> {
  const data = await apiClient<{ success: boolean }>("/auth/logout", {
    method: "POST",
  });
  setAccessToken(null);
  return data;
}

export async function getCurrentUser(): Promise<User> {
  return apiClient<User>("/auth/me");
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  return apiClient<User>("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function changePassword(payload: ChangePasswordPayload): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}
