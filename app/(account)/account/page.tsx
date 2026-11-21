"use client";

import * as React from "react";
import Link from "next/link";
import { listMyBookings, listFavorites } from "@/lib/api";
import { Booking, Favorite } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import {
  Calendar,
  Heart,
  User,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function AccountOverviewPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [favorites, setFavorites] = React.useState<Favorite[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [bookingsRes, favsRes] = await Promise.all([
          listMyBookings({ page: 1, page_size: 5 }),
          listFavorites(),
        ]);
        setBookings(bookingsRes.items);
        setFavorites(favsRes);
      } catch (err) {
        console.error("Failed to load overview data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const upcomingBookings = bookings.filter((b) => b.status === "confirmed");

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-2xl bg-brand-surface border border-brand-border">
        <span className="text-xs font-semibold uppercase tracking-widest text-pine">
          Guest Portal
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-brand-ink mt-2">
          Welcome back, {user?.full_name || "Traveler"}
        </h1>
        <p className="text-sm text-brand-muted mt-2 font-light max-w-2xl leading-relaxed">
          Manage your upcoming retreats, review historical stays, and access direct concierge assistance.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-brand-border">
          <div className="p-4 rounded-lg bg-brand-surface-subtle border border-brand-border/60">
            <div className="text-xs text-brand-muted uppercase tracking-wider">Upcoming Stays</div>
            <div className="font-serif text-3xl font-medium text-brand-ink mt-1">
              {upcomingBookings.length}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-brand-surface-subtle border border-brand-border/60">
            <div className="text-xs text-brand-muted uppercase tracking-wider">Total Bookings</div>
            <div className="font-serif text-3xl font-medium text-brand-ink mt-1">
              {bookings.length}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-brand-surface-subtle border border-brand-border/60">
            <div className="text-xs text-brand-muted uppercase tracking-wider">Saved Sanctuaries</div>
            <div className="font-serif text-3xl font-medium text-brand-ink mt-1">
              {favorites.length}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Box */}
      <div className="rounded-2xl bg-brand-surface border border-brand-border p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-normal text-brand-ink">
            Upcoming & Active Stays
          </h2>
          <Link
            href="/account/bookings"
            className="text-xs font-medium text-pine hover:text-pine-hover flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Spinner size="md" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-brand-muted mb-4 font-light">
              You do not have any active reservations recorded.
            </p>
            <Link href="/search">
              <Button size="sm">Explore Sanctuaries</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.slice(0, 3).map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-xl border border-brand-border bg-brand-surface-subtle/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-semibold text-pine">
                      {b.booking_reference}
                    </span>
                    <Badge variant={b.status === "confirmed" ? "success" : "default"}>
                      {b.status}
                    </Badge>
                  </div>
                  <h3 className="font-serif text-lg font-medium text-brand-ink">
                    {b.hotel_name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-brand-muted mt-1.5">
                    <Calendar className="h-3.5 w-3.5 text-pine" />
                    <span>
                      {b.check_in_date} → {b.check_out_date} ({b.nights} nights)
                    </span>
                  </div>
                </div>

                <div className="text-right sm:self-center">
                  <div className="font-serif text-lg font-medium text-brand-ink">
                    ${(b.price_breakdown.total_cents / 100).toFixed(2)}
                  </div>
                  <span className="text-xs text-brand-muted">Total Paid</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
