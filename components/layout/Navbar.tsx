"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Menu,
  X,
  User as UserIcon,
  Heart,
  Calendar,
  LogOut,
  Shield,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/Dropdown";
import { useAuthStore } from "@/lib/stores/authStore";
import { cn } from "@/lib/utils";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, isAuthenticated, logout, setUser } = useAuthStore();

  const navLinks = [
    { label: "Hotels", href: "/search" },
    { label: "Destinations", href: "/destinations" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ];

  const handleQuickSwitchRole = (role: "guest" | "customer" | "admin") => {
    if (role === "guest") {
      logout();
    } else if (role === "customer") {
      setUser({
        id: "demo-user-1",
        email: "clara.oswald@example.com",
        full_name: "Clara Oswald",
        role: "customer",
        avatar_url:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      });
    } else {
      setUser({
        id: "demo-admin-1",
        email: "admin@kestrelstays.com",
        full_name: "Alexander Vance",
        role: "admin",
        avatar_url:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-border bg-brand-surface/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/30 rounded-xs"
        >
          <div className="h-8 w-8 rounded-md bg-pine flex items-center justify-center text-white shadow-xs group-hover:bg-pine-hover transition-colors">
            <Compass className="h-4 w-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-serif text-xl font-normal tracking-tight text-brand-ink leading-none">
              Kestrel Stays
            </span>
            <span className="text-[10px] uppercase tracking-widest text-brand-muted mt-0.5">
              Sanctuaries & Inns
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-pine relative py-1",
                  isActive ? "text-pine font-semibold" : "text-brand-muted"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pine rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Quick Styleguide link */}
          <Link href="/styleguide">
            <Button variant="ghost" size="sm" className="text-xs text-brand-muted">
              <Layers className="h-3.5 w-3.5 mr-1" />
              Styleguide
            </Button>
          </Link>

          {/* Role switcher indicator */}
          <div className="flex items-center bg-brand-surface-subtle border border-brand-border rounded-md p-0.5 text-xs">
            <button
              onClick={() => handleQuickSwitchRole("guest")}
              className={cn(
                "px-2 py-1 rounded-sm text-[11px] font-medium transition-colors cursor-pointer",
                !isAuthenticated ? "bg-white text-brand-ink shadow-2xs" : "text-brand-muted hover:text-brand-ink"
              )}
            >
              Guest
            </button>
            <button
              onClick={() => handleQuickSwitchRole("customer")}
              className={cn(
                "px-2 py-1 rounded-sm text-[11px] font-medium transition-colors cursor-pointer",
                isAuthenticated && user?.role === "customer"
                  ? "bg-white text-pine font-semibold shadow-2xs"
                  : "text-brand-muted hover:text-brand-ink"
              )}
            >
              Customer
            </button>
            <button
              onClick={() => handleQuickSwitchRole("admin")}
              className={cn(
                "px-2 py-1 rounded-sm text-[11px] font-medium transition-colors cursor-pointer",
                isAuthenticated && user?.role === "admin"
                  ? "bg-pine text-white font-semibold shadow-2xs"
                  : "text-brand-muted hover:text-brand-ink"
              )}
            >
              Admin
            </button>
          </div>

          {/* User Profile / Auth State */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-brand-border bg-brand-surface hover:bg-brand-surface-subtle transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-pine/30">
                  <div className="h-7 w-7 rounded-full bg-pine/10 text-pine flex items-center justify-center font-medium text-xs">
                    {user.full_name.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-brand-ink max-w-[100px] truncate">
                    {user.full_name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal text-xs text-brand-muted">
                  Signed in as <span className="font-semibold text-brand-ink">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center gap-2 cursor-pointer">
                    <UserIcon className="h-4 w-4 text-brand-muted" />
                    <span>My Account</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/bookings" className="flex items-center gap-2 cursor-pointer">
                    <Calendar className="h-4 w-4 text-brand-muted" />
                    <span>Bookings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/favorites" className="flex items-center gap-2 cursor-pointer">
                    <Heart className="h-4 w-4 text-brand-muted" />
                    <span>Saved Hotels</span>
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 text-pine font-medium cursor-pointer">
                        <Shield className="h-4 w-4 text-pine" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-error cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Join Stays
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-brand-ink rounded-md hover:bg-brand-surface-subtle focus:outline-none"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-brand-border bg-brand-surface px-4 pt-3 pb-6 space-y-3 animate-in fade-in-0 slide-in-from-top-2">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-3 py-2 text-sm rounded-md font-medium transition-colors",
                  pathname === link.href
                    ? "bg-pine-light text-pine font-semibold"
                    : "text-brand-ink hover:bg-brand-surface-subtle"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/styleguide"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm rounded-md font-medium text-brand-muted hover:bg-brand-surface-subtle"
            >
              Component Styleguide
            </Link>
          </nav>

          <div className="pt-3 border-t border-brand-border space-y-2">
            <p className="text-xs uppercase font-medium tracking-wider text-brand-muted px-3">
              Role Simulator
            </p>
            <div className="grid grid-cols-3 gap-2 px-1">
              <Button
                variant={!isAuthenticated ? "primary" : "secondary"}
                size="sm"
                onClick={() => handleQuickSwitchRole("guest")}
              >
                Guest
              </Button>
              <Button
                variant={isAuthenticated && user?.role === "customer" ? "primary" : "secondary"}
                size="sm"
                onClick={() => handleQuickSwitchRole("customer")}
              >
                Customer
              </Button>
              <Button
                variant={isAuthenticated && user?.role === "admin" ? "terracotta" : "secondary"}
                size="sm"
                onClick={() => handleQuickSwitchRole("admin")}
              >
                Admin
              </Button>
            </div>
          </div>

          <div className="pt-3 border-t border-brand-border">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-brand-surface-subtle rounded-md text-xs text-brand-muted">
                  Signed in as <span className="font-semibold text-brand-ink">{user.full_name}</span> ({user.role})
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Account
                    </Button>
                  </Link>
                  {user.role === "admin" && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" onClick={logout} className="w-full text-error">
                    Sign out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
