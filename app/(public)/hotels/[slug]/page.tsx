"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { getHotel, getRoomsForHotel, createBooking, getReviewsForHotel, addFavorite } from "@/lib/api";
import { Hotel, RoomType, Review } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Rating } from "@/components/ui/Rating";
import { PriceBreakdown } from "@/components/ui/PriceBreakdown";
import { Badge } from "@/components/ui/Badge";
import {
  MapPin,
  Users,
  Bed,
  Check,
  Calendar,
  ArrowRight,
  Heart,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";

function HotelDetailContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuthStore();

  const [hotel, setHotel] = React.useState<Hotel | null>(null);
  const [rooms, setRooms] = React.useState<RoomType[]>([]);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [selectedRoom, setSelectedRoom] = React.useState<RoomType | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [bookingLoading, setBookingLoading] = React.useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = React.useState<string | null>(null);
  const [favoriteSaved, setFavoriteSaved] = React.useState<boolean>(false);

  // Default booking dates: 7 days in future, 3 nights
  const today = new Date();
  const checkIn = new Date(today);
  checkIn.setDate(today.getDate() + 7);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkIn.getDate() + 3);

  const checkInStr = checkIn.toISOString().split("T")[0];
  const checkOutStr = checkOut.toISOString().split("T")[0];
  const nights = 3;

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const hotelData = await getHotel(slug);
        setHotel(hotelData);
        const [roomsData, reviewsData] = await Promise.all([
          getRoomsForHotel(hotelData.id),
          getReviewsForHotel(hotelData.id),
        ]);
        setRooms(roomsData);
        setReviews(reviewsData.reviews);
        if (roomsData.length > 0) {
          setSelectedRoom(roomsData[0]);
        }
      } catch (err) {
        console.error("Failed to load hotel detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const handleFavoriteToggle = async () => {
    if (!hotel) return;
    try {
      await addFavorite(hotel.id);
      setFavoriteSaved(true);
    } catch (err) {
      console.error("Failed to add favorite:", err);
    }
  };

  const handleBooking = async () => {
    if (!selectedRoom || !hotel) return;

    if (!isAuthenticated) {
      alert("Please sign in or use the quick role switcher in the navbar to book.");
      return;
    }

    try {
      setBookingLoading(true);
      const res = await createBooking({
        hotel_id: hotel.id,
        room_type_id: selectedRoom.id,
        check_in_date: checkInStr,
        check_out_date: checkOutStr,
        adults: 2,
        children: 0,
        rooms_count: 1,
        guest_info: {
          full_name: "Clara Oswald",
          email: "clara.oswald@example.com",
          phone_number: "+1 555-0192",
          special_requests: "Arriving in late afternoon. High floor preferred.",
        },
      });
      setBookingSuccess(res.booking_reference);
    } catch (err: any) {
      alert(`Booking failed: ${err.message || "Room unavailable for selected dates"}`);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading || !hotel) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="text-sm text-brand-muted mt-4">Preparing hotel sanctuary...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title & Actions Bar */}
      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-brand-muted mb-2">
            <MapPin className="h-4 w-4 text-pine" />
            <span>
              {hotel.location.address}, {hotel.location.city}, {hotel.location.country}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-brand-ink">
            {hotel.name}
          </h1>
          <p className="text-base sm:text-lg text-brand-muted mt-2 max-w-3xl font-light">
            {hotel.tagline}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={handleFavoriteToggle}
            leftIcon={
              <Heart
                className={`h-4 w-4 ${favoriteSaved ? "fill-error text-error" : "text-brand-muted"}`}
              />
            }
          >
            {favoriteSaved ? "Saved to Favorites" : "Save Property"}
          </Button>
        </div>
      </div>

      {/* Hero Image Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 rounded-xl overflow-hidden shadow-xs">
        <div className="md:col-span-2 aspect-[16/10] bg-brand-border/30">
          <img src={hotel.hero_image} alt={hotel.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-4">
          {hotel.images.slice(1, 3).map((img, i) => (
            <div key={i} className="aspect-[16/10] bg-brand-border/30 rounded-lg overflow-hidden">
              <img src={img} alt={`${hotel.name} detail ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Details & Suites */}
        <div className="lg:col-span-2 space-y-12">
          {/* Description & Overview */}
          <div>
            <h2 className="font-serif text-2xl font-normal text-brand-ink mb-4">
              About This Sanctuary
            </h2>
            <p className="text-sm sm:text-base text-brand-muted leading-relaxed font-light">
              {hotel.description}
            </p>

            {/* Property Amenities */}
            <div className="mt-8 pt-8 border-t border-brand-border">
              <h3 className="font-serif text-lg font-medium text-brand-ink mb-4">
                Curated Amenities
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {hotel.amenities.map((amenity, i) => (
                  <Badge key={i} variant="default">
                    {typeof amenity === "string" ? amenity : amenity.name || JSON.stringify(amenity)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Policies */}
            <div className="mt-8 pt-8 border-t border-brand-border grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-brand-muted">
              <div>
                <span className="font-semibold text-brand-ink block mb-1">Check-in & Check-out</span>
                <span>Check-in: {hotel.policies.check_in_time} • Check-out: {hotel.policies.check_out_time}</span>
              </div>
              <div>
                <span className="font-semibold text-brand-ink block mb-1">Cancellation Policy</span>
                <span>{hotel.policies.cancellation_policy_summary}</span>
              </div>
            </div>
          </div>

          {/* Suites Selection */}
          <div className="pt-8 border-t border-brand-border space-y-6">
            <h2 className="font-serif text-2xl font-normal text-brand-ink">Available Suites</h2>

            <div className="space-y-4">
              {rooms.map((room) => {
                const isSelected = selectedRoom?.id === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-6 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-pine bg-pine-light/25 shadow-xs"
                        : "border-brand-border bg-brand-surface hover:border-brand-border/80"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-xl font-normal text-brand-ink">
                          {room.name}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-brand-muted mt-2">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> Max {room.max_occupancy} guests
                          </span>
                          <span className="flex items-center gap-1">
                            <Bed className="h-3.5 w-3.5" /> {room.bed_count} {room.bed_type}
                          </span>
                          <span>{room.size_sqm} m²</span>
                        </div>
                        <p className="text-xs sm:text-sm text-brand-muted mt-3 font-light">
                          {room.description}
                        </p>
                      </div>

                      <div className="text-right sm:self-center shrink-0">
                        <div className="font-serif text-2xl font-medium text-brand-ink">
                          ${(room.base_nightly_rate_cents / 100).toFixed(0)}
                        </div>
                        <div className="text-xs text-brand-muted">per night</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guest Reviews Section */}
          <div className="pt-8 border-t border-brand-border space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-normal text-brand-ink">
                  Guest Reviews
                </h2>
                <p className="text-xs text-brand-muted mt-1">
                  Overall rating of {hotel.average_rating.toFixed(1)} based on {hotel.review_count} verified stays.
                </p>
              </div>
              <Rating score={hotel.average_rating} size="md" />
            </div>

            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-lg border border-brand-border bg-brand-surface"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-brand-ink">{rev.user_name}</span>
                    <Rating score={rev.overall_rating} size="sm" />
                  </div>
                  <h4 className="font-serif text-base font-medium text-brand-ink mb-1">
                    {rev.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-brand-muted font-light leading-relaxed">
                    {rev.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Widget */}
        <div>
          <div className="sticky top-24 p-6 sm:p-7 rounded-xl border border-brand-border bg-brand-surface shadow-md">
            <h3 className="font-serif text-2xl font-normal text-brand-ink mb-6">
              Reserve Your Stay
            </h3>

            {bookingSuccess ? (
              <div className="p-6 rounded-lg bg-pine-light border border-pine/30 text-center space-y-3">
                <Check className="h-10 w-10 mx-auto text-pine" />
                <h4 className="font-serif text-xl font-normal text-pine-hover">
                  Reservation Confirmed!
                </h4>
                <p className="text-xs text-pine-hover font-mono">
                  Reference: <strong>{bookingSuccess}</strong>
                </p>
                <p className="text-xs text-brand-muted font-light">
                  Your reservation is stored in PostgreSQL and locked for your stay.
                </p>
                <Button
                  className="mt-4 w-full"
                  size="md"
                  onClick={() => router.push("/account/bookings")}
                >
                  View in My Bookings
                </Button>
              </div>
            ) : (
              <>
                <div className="text-xs text-brand-muted mb-6 space-y-2.5 pb-4 border-b border-brand-border">
                  <div className="flex justify-between">
                    <span>Stay Dates:</span>
                    <strong className="text-brand-ink font-medium">
                      {checkInStr} → {checkOutStr}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <strong className="text-brand-ink font-medium">{nights} nights</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Selected Suite:</span>
                    <strong className="text-brand-ink font-medium truncate max-w-[150px]">
                      {selectedRoom?.name || "None"}
                    </strong>
                  </div>
                </div>

                {selectedRoom && (
                  <div className="py-2">
                    <PriceBreakdown
                      nights={nights}
                      nightlyRateCents={selectedRoom.base_nightly_rate_cents}
                      cleaningFeeCents={4500}
                    />
                  </div>
                )}

                <Button
                  className="w-full mt-6"
                  size="lg"
                  disabled={!selectedRoom || bookingLoading}
                  onClick={handleBooking}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {bookingLoading ? "Reserving via PostgreSQL..." : "Complete Reservation"}
                </Button>

                <p className="text-[11px] text-center text-brand-muted mt-3">
                  Pessimistic serialization guarantees no double-bookings.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function HotelDetailPage() {
  return (
    <React.Suspense fallback={<div className="py-24 flex justify-center"><Spinner size="lg" /></div>}>
      <HotelDetailContent />
    </React.Suspense>
  );
}
