"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Heart,
  MessageSquare,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/authStore";

export const AccountSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navItems = [
    { label: "Overview", href: "/account", icon: LayoutDashboard },
    { label: "My Bookings", href: "/account/bookings", icon: Calendar },
    { label: "Saved Hotels", href: "/account/favorites", icon: Heart },
    { label: "My Reviews", href: "/account/reviews", icon: MessageSquare },
    { label: "Profile & Settings", href: "/account/profile", icon: User },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="rounded-lg border border-brand-border bg-brand-surface p-5 space-y-6">
        {/* User Card */}
        <div className="flex items-center gap-3 pb-5 border-b border-brand-border">
          <div className="h-11 w-11 rounded-full bg-pine/10 text-pine flex items-center justify-center font-semibold text-sm">
            {user?.full_name ? user.full_name.charAt(0) : "G"}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-base font-medium text-brand-ink truncate">
              {user?.full_name || "Guest Traveler"}
            </h3>
            <p className="text-xs text-brand-muted truncate">
              {user?.email || "guest@example.com"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/account"
                ? pathname === "/account"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-pine-light text-pine font-semibold"
                    : "text-brand-ink hover:bg-brand-surface-subtle"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-pine" : "text-brand-muted")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="pt-4 border-t border-brand-border">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3.5 py-2 rounded-md text-sm font-medium text-error hover:bg-error-light transition-colors text-left cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
