"use client";

import * as React from "react";
import { listAllBookings, updateAdminBookingStatus } from "@/lib/api";
import { Booking, BookingStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Search, Calendar, CheckCircle2, XCircle } from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const fetchBookings = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await listAllBookings({
        search: search || undefined,
        status: statusFilter,
        page: 1,
        page_size: 25,
      });
      setBookings(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load admin bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      setActionLoading(bookingId);
      await updateAdminBookingStatus(bookingId, newStatus);
      await fetchBookings();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-brand-ink">
            Reservation Management
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1 font-light">
            Total of {total} reservations recorded across all properties.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Input
              placeholder="Search reference or hotel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-brand-muted" />}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded-md text-brand-ink focus:outline-none focus:ring-2 focus:ring-pine/30"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-xs text-brand-muted mt-4">Consulting reservation ledger...</p>
        </div>
      ) : (
        <div className="rounded-xl border border-brand-border bg-brand-surface shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-surface-subtle/50 border-b border-brand-border text-brand-muted uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Hotel Sanctuary</th>
                  <th className="py-3 px-4">Suite</th>
                  <th className="py-3 px-4">Stay Dates</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-brand-surface-subtle/40">
                    <td className="py-3.5 px-4 font-mono font-semibold text-pine">
                      {b.booking_reference}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-brand-ink">
                      {b.hotel_name}
                    </td>
                    <td className="py-3.5 px-4 text-brand-muted truncate max-w-[120px]">
                      {b.room_name}
                    </td>
                    <td className="py-3.5 px-4 text-brand-muted">
                      {b.check_in_date} → {b.check_out_date}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-brand-ink">
                      ${(b.price_breakdown.total_cents / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          b.status === "confirmed"
                            ? "success"
                            : b.status === "cancelled"
                            ? "error"
                            : "default"
                        }
                      >
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {b.status === "confirmed" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStatusChange(b.id, "completed")}
                            disabled={actionLoading === b.id}
                            className="text-xs text-pine hover:underline cursor-pointer"
                          >
                            Mark Completed
                          </button>
                          <span className="text-brand-border">•</span>
                          <button
                            onClick={() => handleStatusChange(b.id, "cancelled")}
                            disabled={actionLoading === b.id}
                            className="text-xs text-error hover:underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
