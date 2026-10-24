import {
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  User,
  ApiError,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from "@/lib/types";
import { getDb, saveDb, simulateLatency } from "./storage";

export async function mockLogin(payload: LoginPayload): Promise<AuthTokens> {
  await simulateLatency(400, 700);
  const db = getDb();

  const user = db.users.find(
    (u) => u.email.toLowerCase() === payload.email.toLowerCase()
  );

  if (!user) {
    throw new ApiError("Invalid email or password", "INVALID_CREDENTIALS", 401);
  }

  return {
    access_token: `mock_jwt_${user.id}_${Date.now()}`,
    token_type: "Bearer",
    expires_in: 3600,
    user,
  };
}

export async function mockRegister(payload: RegisterPayload): Promise<AuthTokens> {
  await simulateLatency(400, 700);
  const db = getDb();

  const existing = db.users.find(
    (u) => u.email.toLowerCase() === payload.email.toLowerCase()
  );

  if (existing) {
    throw new ApiError(
      "An account with this email already exists",
      "EMAIL_ALREADY_EXISTS",
      409,
      { email: "Email is already registered" }
    );
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    email: payload.email,
    full_name: payload.full_name,
    phone_number: payload.phone_number,
    role: "customer",
    avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDb(db);

  return {
    access_token: `mock_jwt_${newUser.id}_${Date.now()}`,
    token_type: "Bearer",
    expires_in: 3600,
    user: newUser,
  };
}

export async function mockGetCurrentUser(): Promise<User> {
  await simulateLatency(200, 400);
  const db = getDb();
  // Return default active customer
  return db.users[1]; // Clara Oswald
}

export async function mockUpdateProfile(payload: UpdateProfilePayload): Promise<User> {
  await simulateLatency(300, 500);
  const db = getDb();
  const user = db.users[1];
  if (payload.full_name) user.full_name = payload.full_name;
  if (payload.phone_number !== undefined) user.phone_number = payload.phone_number;
  if (payload.avatar_url) user.avatar_url = payload.avatar_url;
  user.updated_at = new Date().toISOString();
  saveDb(db);
  return user;
}

export async function mockChangePassword(payload: ChangePasswordPayload): Promise<{ success: boolean }> {
  await simulateLatency(400, 600);
  if (payload.current_password === "wrongpassword") {
    throw new ApiError("Current password is incorrect", "INVALID_PASSWORD", 400);
  }
  return { success: true };
}

export async function mockForgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  await simulateLatency(400, 600);
  return {
    success: true,
    message: `Password reset instructions dispatched to ${email}`,
  };
}

export async function mockResetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
  await simulateLatency(400, 600);
  if (!token || !newPassword) {
    throw new ApiError("Invalid or expired reset token or missing password", "INVALID_TOKEN", 400);
  }
  return { success: true };
}
