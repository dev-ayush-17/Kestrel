import { User, UserRole, ApiError } from "@/lib/types";
import { getDb, saveDb, simulateLatency } from "./storage";

export async function mockListUsers(): Promise<User[]> {
  await simulateLatency(300, 500);
  const db = getDb();
  return db.users;
}

export async function mockUpdateUserRole(
  userId: string,
  role: UserRole
): Promise<User> {
  await simulateLatency(300, 500);
  const db = getDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    throw new ApiError("User not found", "NOT_FOUND", 404);
  }
  user.role = role;
  user.updated_at = new Date().toISOString();
  saveDb(db);
  return user;
}

export async function mockToggleUserActive(userId: string): Promise<User> {
  await simulateLatency(300, 500);
  const db = getDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    throw new ApiError("User not found", "NOT_FOUND", 404);
  }
  user.is_active = !user.is_active;
  user.updated_at = new Date().toISOString();
  saveDb(db);
  return user;
}
