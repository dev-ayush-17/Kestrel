import { apiClient } from "../client";
import { User, UserRole } from "@/lib/types";

export async function listUsers(): Promise<User[]> {
  return apiClient<User[]>("/admin/users");
}

export async function updateUserRole(userId: string, role: UserRole): Promise<User> {
  return apiClient<User>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function toggleUserActive(userId: string): Promise<User> {
  return apiClient<User>(`/admin/users/${userId}/toggle-active`, {
    method: "PATCH",
  });
}
