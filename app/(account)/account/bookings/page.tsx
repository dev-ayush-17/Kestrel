"use client";

import * as React from "react";
import Link from "next/link";
import { listMyBookings, cancelBooking, modifyBookingDates } from "@/lib/api";
import { Booking } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Calendar, MapPin, ArrowRight, AlertTriangle, Check, RefreshCw } from "lucide-react";

export default function MyBookingsPage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [activeTab, setActiveTab] = React.useState<"all" | "upcoming" | "past">("all");

  // Reschedule state
  const [rescheduleBooking, setRescheduleBooking] = React.useState<Booking | null>(null);
  const [newCheckIn, setNewCheckIn] = React.useState("");
  const [newCheckOut, setNewCheckOut] = React.useState("");
  const [rescheduleLoading, setRescheduleLoading] = React.useState(false);

  // Cancel state
  const [cancelTarget, setCancelTarget] = React.useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelLoading, setCancelLoading] = React.useState(false);

  const fetchBookings = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await listMyBookings({
        status: activeTab === "all" ? undefined : activeTab === "upcoming" ? "confirmed" : "completed",
        page: 1,
        page_size: 20,
      });
      setBookings(res.items);
    } catch (err) {
      console.error("Failed to load user reservations:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleOpenReschedule = (b: Booking) => {
    setRescheduleBooking(b);
    setNewCheckIn(b.check_in_date);
    setNewCheckOut(b.check_out_date);
  };

  const handleExecuteReschedule = async () => {
    if (!rescheduleBooking || !newCheckIn || !newCheckOut) return;
    try {
      setRescheduleLoading(true);
      await modifyBookingDates(rescheduleBooking.id, {
        new_check_in_date: newCheckIn,
        new_check_out_date: newCheckOut,
      });
      setRescheduleBooking(null);
      await fetchBookings();
    } catch (err: any) {
      alert(`Date modification failed: ${err.message || "Selected dates conflict with inventory"}`);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleExecuteCancel = async () => {
    if (!cancelTarget) return;
    try {
      setCancelLoading(true);
      await cancelBooking(cancelTarget.id, {
        reason: cancelReason || "Guest requested cancellation",
      });
      setCancelTarget(null);
      await fetchBookings();
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-brand-ink">My Reservations</h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1 font-light">
            Review upcoming retreats, reschedule dates, or review past sanctuary stays.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-brand-surface border border-brand-border rounded-lg text-xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "all" ? "bg-pine text-white" : "text-brand-muted hover:text-brand-ink"
            }`}
          >
            All Stays
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "upcoming" ? "bg-pine text-white" : "text-brand-muted hover:text-brand-ink"
            }`}
          >
            Confirmed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-xs text-brand-muted mt-4">Retrieving reservations from PostgreSQL...</p>
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No reservations found"
          description="You haven't booked any retreats yet. Explore our curated sanctuaries to plan your next escape."
          actionLabel="Explore Hotels"
          onAction={() => window.location.assign("/search")}
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="p-6 rounded-xl border border-brand-border bg-brand-surface shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-pine">
                      {booking.booking_reference}
                    </span>
                    <Badge
                      variant={
                        booking.status === "confirmed"
                          ? "success"
                          : booking.status === "cancelled"
                          ? "error"
                          : "default"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                  <h3 className="font-serif text-xl font-normal text-brand-ink">
                    {booking.hotel_name}
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {booking.room_name} • {booking.adults} Guests
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="font-serif text-xl font-medium text-brand-ink">
                    ${(booking.price_breakdown.total_cents / 100).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-brand-muted">Total Paid</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-brand-muted">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-pine shrink-0" />
                  <span>
                    <strong>Check-in:</strong> {booking.check_in_date} ➔ <strong>Check-out:</strong> {booking.check_out_date} ({booking.nights} nights)
                  </span>
                </div>

                {booking.status === "confirmed" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReschedule(booking)}
                    >
                      Reschedule Dates
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-error hover:bg-error-light"
                      onClick={() => setCancelTarget(booking)}
                    >
                      Cancel Stay
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Dates Dialog */}
      <Dialog open={!!rescheduleBooking} onOpenChange={(open) => !open && setRescheduleBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Stay Dates</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm text-brand-ink">
            <p className="text-xs text-brand-muted font-light leading-relaxed">
              Atomic inventory checks verify suite availability for the modified dates and recompute total rates without loss of reservation.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="New Check-in Date"
                type="date"
                value={newCheckIn}
                onChange={(e) => setNewCheckIn(e.target.value)}
              />
              <Input
                label="New Check-out Date"
                type="date"
                value={newCheckOut}
                onChange={(e) => setNewCheckOut(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleBooking(null)}>
              Dismiss
            </Button>
            <Button disabled={rescheduleLoading} onClick={handleExecuteReschedule}>
              {rescheduleLoading ? "Recalculating..." : "Confirm Date Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Stay Confirmation Dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm text-brand-ink">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-error-light border border-error/20 text-error text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Cancelling will release your room inventory immediately back into the public catalog. This action cannot be reversed.
              </span>
            </div>

            <Input
              label="Cancellation Reason (Optional)"
              placeholder="e.g. Schedule change, travel conflict..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep Reservation
            </Button>
            <Button
              className="bg-error hover:bg-error/90 text-white"
              disabled={cancelLoading}
              onClick={handleExecuteCancel}
            >
              {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
