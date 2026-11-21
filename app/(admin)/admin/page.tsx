"use client";

import * as React from "react";
import Link from "next/link";
import { getAdminDashboard } from "@/lib/api";
import { AdminDashboardData } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import {
  DollarSign,
  TrendingUp,
  BedDouble,
  Users,
  CalendarCheck,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = React.useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await getAdminDashboard();
        setData(res);
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="text-xs text-brand-muted mt-4">Computing real-time analytics from PostgreSQL...</p>
      </div>
    );
  }

  const { metrics, revenue_chart, occupancy_chart, recent_bookings } = data;

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="font-serif text-3xl font-medium text-brand-ink">Executive Overview</h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-1 font-light">
          Real-time inventory occupancy, ADR calculations, and reservation metrics across all properties.
        </p>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-xl border border-brand-border bg-brand-surface shadow-xs">
          <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
            <span>Gross Revenue</span>
            <DollarSign className="h-4 w-4 text-pine" />
          </div>
          <div className="font-serif text-3xl font-medium text-brand-ink">
            ${(metrics.total_revenue_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </div>
          <div className="flex items-center gap-1 text-xs text-success mt-2">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+{metrics.revenue_growth_percent}% vs last cycle</span>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-brand-border bg-brand-surface shadow-xs">
          <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
            <span>Occupancy Rate</span>
            <BedDouble className="h-4 w-4 text-pine" />
          </div>
          <div className="font-serif text-3xl font-medium text-brand-ink">
            {metrics.occupancy_rate_percent.toFixed(1)}%
          </div>
          <div className="text-xs text-brand-muted mt-2">
            Dynamic live platform load
          </div>
        </div>

        <div className="p-6 rounded-xl border border-brand-border bg-brand-surface shadow-xs">
          <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
            <span>Average Daily Rate (ADR)</span>
            <TrendingUp className="h-4 w-4 text-pine" />
          </div>
          <div className="font-serif text-3xl font-medium text-brand-ink">
            ${(metrics.average_daily_rate_cents / 100).toFixed(0)}
          </div>
          <div className="text-xs text-brand-muted mt-2">
            Per booked room night
          </div>
        </div>

        <div className="p-6 rounded-xl border border-brand-border bg-brand-surface shadow-xs">
          <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
            <span>Confirmed Bookings</span>
            <CalendarCheck className="h-4 w-4 text-pine" />
          </div>
          <div className="font-serif text-3xl font-medium text-brand-ink">
            {metrics.confirmed_bookings_count}
          </div>
          <div className="text-xs text-brand-muted mt-2">
            {metrics.active_guests_count} registered guests
          </div>
        </div>
      </div>

      {/* Charts Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bars */}
        <div className="p-6 rounded-xl border border-brand-border bg-brand-surface shadow-xs">
          <h3 className="font-serif text-lg font-medium text-brand-ink mb-1">
            Revenue Performance
          </h3>
          <p className="text-xs text-brand-muted mb-6">Historical gross revenue trajectory</p>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 border-b border-brand-border">
            {revenue_chart.map((pt, i) => {
              const maxRev = Math.max(...revenue_chart.map((p) => p.revenue_dollars)) || 1;
              const heightPct = Math.round((pt.revenue_dollars / maxRev) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] text-brand-muted font-mono">
                    ${(pt.revenue_dollars / 1000).toFixed(0)}k
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-pine/80 hover:bg-pine rounded-t transition-all"
                  />
                  <span className="text-xs text-brand-muted">{pt.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day Occupancy Trend */}
        <div className="p-6 rounded-xl border border-brand-border bg-brand-surface shadow-xs">
          <h3 className="font-serif text-lg font-medium text-brand-ink mb-1">
            Weekly Occupancy Pace
          </h3>
          <p className="text-xs text-brand-muted mb-6">Occupancy percentage across platform rooms</p>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 border-b border-brand-border">
            {occupancy_chart.map((pt, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] text-brand-muted font-mono">
                  {pt.occupancy_rate}%
                </span>
                <div
                  style={{ height: `${pt.occupancy_rate}%` }}
                  className="w-full bg-pine-light border border-pine/40 rounded-t transition-all"
                />
                <span className="text-[11px] text-brand-muted truncate w-full text-center">
                  {pt.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="p-6 rounded-xl border border-brand-border bg-brand-surface shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-medium text-brand-ink">
            Recent System Reservations
          </h3>
          <Link
            href="/admin/bookings"
            className="text-xs text-pine font-medium hover:underline flex items-center gap-1"
          >
            <span>Manage All Bookings</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-brand-border text-brand-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {recent_bookings.map((b) => (
                <tr key={b.id} className="hover:bg-brand-surface-subtle/50">
                  <td className="py-3 px-4 font-mono font-semibold text-pine">
                    {b.booking_reference}
                  </td>
                  <td className="py-3 px-4 font-medium text-brand-ink">
                    {b.hotel_name}
                  </td>
                  <td className="py-3 px-4 text-brand-muted">
                    {b.check_in_date} → {b.check_out_date}
                  </td>
                  <td className="py-3 px-4 font-medium text-brand-ink">
                    ${(b.price_breakdown.total_cents / 100).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={b.status === "confirmed" ? "success" : "default"}>
                      {b.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
