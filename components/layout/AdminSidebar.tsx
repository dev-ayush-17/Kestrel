"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Building2,
  BedDouble,
  Users,
  MessageSquareCheck,
  ArrowLeft,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
    { label: "Hotels Catalog", href: "/admin/hotels", icon: Building2 },
    { label: "Rooms & Inventory", href: "/admin/rooms", icon: BedDouble },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Review Moderation", href: "/admin/reviews", icon: MessageSquareCheck },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-brand-surface border-r border-brand-border min-h-screen p-5 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Admin Header */}
        <div className="flex items-center gap-2.5 px-2">
          <div className="h-8 w-8 rounded-md bg-pine flex items-center justify-center text-white">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-medium text-brand-ink leading-tight">
              Kestrel Console
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-pine font-semibold">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-pine text-white font-semibold shadow-xs"
                    : "text-brand-ink hover:bg-brand-surface-subtle"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Back to Public Site */}
      <div className="pt-6 border-t border-brand-border">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-brand-muted hover:text-brand-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Exit to Guest Site</span>
        </Link>
      </div>
    </aside>
  );
};
