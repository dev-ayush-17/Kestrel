"use client";

import * as React from "react";
import { updateProfile, changePassword, getCurrentUser } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, Lock, Mail, Phone, Check } from "lucide-react";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();

  const [fullName, setFullName] = React.useState(user?.full_name || "");
  const [phoneNumber, setPhoneNumber] = React.useState("+1 (555) 234-5678");
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatar_url || "");
  const [profileSaving, setProfileSaving] = React.useState(false);
  const [profileSuccess, setProfileSuccess] = React.useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [pwdSaving, setPwdSaving] = React.useState(false);
  const [pwdSuccess, setPwdSuccess] = React.useState(false);
  const [pwdError, setPwdError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadFreshProfile() {
      try {
        const freshUser = await getCurrentUser();
        setFullName(freshUser.full_name);
        setPhoneNumber(freshUser.phone_number || "+1 (555) 234-5678");
        setAvatarUrl(freshUser.avatar_url || "");
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    }
    loadFreshProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileSuccess(false);
      const updated = await updateProfile({
        full_name: fullName,
        phone_number: phoneNumber,
        avatar_url: avatarUrl,
      });
      setUser({
        id: updated.id,
        email: updated.email,
        full_name: updated.full_name,
        role: updated.role,
        avatar_url: updated.avatar_url,
      });
      setProfileSuccess(true);
    } catch (err: any) {
      alert(`Profile update failed: ${err.message}`);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwdError("New password must be at least 8 characters long.");
      return;
    }

    try {
      setPwdSaving(true);
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwdSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdError(err.message || "Failed to change password. Verify your current password.");
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-medium text-brand-ink">Profile & Security</h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-1 font-light">
          Manage your personal details, contact preferences, and cryptographic authentication.
        </p>
      </div>

      {/* Personal Info Form */}
      <div className="p-6 sm:p-8 rounded-xl border border-brand-border bg-brand-surface shadow-xs">
        <h2 className="font-serif text-xl font-normal text-brand-ink mb-6">
          Personal Information
        </h2>

        {profileSuccess && (
          <div className="mb-6 p-3 rounded-md bg-pine-light text-pine border border-pine/30 text-xs flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>Profile details updated successfully in PostgreSQL.</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
          <Input
            label="Full Name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="h-4 w-4 text-brand-muted" />}
          />

          <Input
            label="Email Address"
            disabled
            value={user?.email || "clara.oswald@example.com"}
            leftIcon={<Mail className="h-4 w-4 text-brand-muted" />}
          />

          <Input
            label="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            leftIcon={<Phone className="h-4 w-4 text-brand-muted" />}
          />

          <Button type="submit" size="md" disabled={profileSaving}>
            {profileSaving ? "Saving..." : "Save Profile Details"}
          </Button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="p-6 sm:p-8 rounded-xl border border-brand-border bg-brand-surface shadow-xs">
        <h2 className="font-serif text-xl font-normal text-brand-ink mb-6">
          Change Password
        </h2>

        {pwdSuccess && (
          <div className="mb-6 p-3 rounded-md bg-pine-light text-pine border border-pine/30 text-xs flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>Password rotated successfully.</span>
          </div>
        )}

        {pwdError && (
          <div className="mb-6 p-3 rounded-md bg-error-light text-error border border-error/20 text-xs">
            {pwdError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <Input
            label="Current Password"
            type="password"
            required
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4 text-brand-muted" />}
          />

          <Input
            label="New Password (min 8 chars)"
            type="password"
            required
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4 text-brand-muted" />}
          />

          <Input
            label="Confirm New Password"
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4 text-brand-muted" />}
          />

          <Button type="submit" size="md" disabled={pwdSaving}>
            {pwdSaving ? "Updating Password..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

