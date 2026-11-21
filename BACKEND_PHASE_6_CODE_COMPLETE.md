# Kestrel Stays — Phase 6 Execution & Learning Guide
## Full-Stack Integration, Live Data Wiring & Client Polish

Welcome to **Phase 6** of building **Kestrel Stays**!

Over Phases 2 through 5, you engineered a production-grade asynchronous backend in FastAPI backed by PostgreSQL, Alembic migrations, cryptographic security, deterministic integer-cent financial arithmetic, and pessimistic row-level locking.

In **Phase 6**, we bridge the frontend Next.js application with the live FastAPI backend. You will eliminate mock data, harmonize API contracts, wire authentication tokens into requests, build out the remaining interactive pages (Live Hotel Search, Hotel Detail & Booking Stepper, Account Bookings, and Admin Dashboard), and watch your database come alive in the browser.

---

### Phase Roadmap: How Many Phases Remain?

To answer your question: **There are only 2 phases left** before Kestrel Stays becomes a complete, well-polished, production-grade application!

```
[Phase 1] Frontend Foundation & Design System       [✓ COMPLETED]
[Phase 2] Data Layer, PostgreSQL, Auth & Core       [✓ COMPLETED]
[Phase 3] Public Catalog, Search & Destinations     [✓ COMPLETED]
[Phase 4] Booking Engine, Row-Level Lock & Account  [✓ COMPLETED]
[Phase 5] Admin Console, Analytics & Governance     [✓ COMPLETED]
────────────────────────────────────────────────────────────────────────
[Phase 6] Full-Stack Integration & Live Data Wiring [CURRENT PHASE]
[Phase 7] Dockerization, CI/CD & Production Ship   [FINAL PHASE]
```

* **Phase 6 (This Phase)**: Turn off mock mode, harmonize API contracts, connect real authentication, build the live catalog & booking stepper pages, and display real PostgreSQL records in the UI.
* **Phase 7 (Final Phase)**: Containerize the entire stack with Docker Compose (`docker-compose.yml`), configure production environment variables, setup health checks, and build production images.

---

## 1. Architectural Overview of Full-Stack Integration

When frontend applications interact with separate API servers, four critical bridge patterns must be solved:

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│     Next.js Frontend (3000)     │                 │      FastAPI Backend (8000)     │
│                                 │                 │                                 │
│  Zustand Auth Store             │    JWT Bearer   │  OAuth2 Password Bearer / Deps  │
│  `lib/stores/authStore.ts`      │───────────────>│  `app/api/deps.py`             │
│                                 │                 │                                 │
│  API Gateway Switch             │  JSON / REST    │  Versioned API Routers          │
│  `NEXT_PUBLIC_USE_MOCK_API=false`│───────────────>│  `/api/v1/hotels`, `/bookings`  │
│                                 │                 │                                 │
│  CORS Credentials: include      │ <────────────── │  CORSMiddleware: allow_origins  │
│  `credentials: "include"`       │   Set-Cookie    │  `localhost:3000`               │
└─────────────────────────────────┘                 └─────────────────────────────────┘
```

1. **API Gateway Decoupling**: In `lib/api/index.ts`, the frontend was designed with a dual-mode switch (`USE_MOCK_API`). Setting `NEXT_PUBLIC_USE_MOCK_API=false` activates the real HTTP client in `lib/api/client.ts`.
2. **CORS (Cross-Origin Resource Sharing)**: The browser blocks cross-origin requests (`localhost:3000` to `localhost:8000`) unless the backend explicitly emits headers allowing origins, headers, and credentials. Our backend `app/main.py` is pre-configured with `CORSMiddleware`.
3. **Authorization Header Injection**: When a user logs in, FastAPI issues a standard JWT access token. The frontend client stores this token in memory and automatically attaches `Authorization: Bearer <token>` to every subsequent request.
4. **Contract Harmonization**: Ensure route paths, request payload keys, and response shapes match with 100% fidelity between TypeScript types (`lib/types/`) and Pydantic schemas (`app/schemas/`).

---

## 2. Step 1: Backend Endpoint Harmonization

In `lib/api/endpoints/users.ts`, the frontend calls `PATCH /api/v1/admin/users/{userId}/toggle-active` without requiring a payload body. Let's add this lightweight ergonomic endpoint to `backend/app/api/v1/endpoints/admin.py` alongside the existing `/status` endpoint.

### File to Update: `backend/app/api/v1/endpoints/admin.py`

Add this endpoint right after `update_user_status`:

```python
@router.patch("/users/{user_id}/toggle-active", response_model=UserRead)
async def toggle_user_active(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Toggle a user's active/suspended state without requiring a request body.
    Designed for one-click admin toggle controls.
    """
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return UserRead.model_validate(user)
```

---

## 3. Step 2: Configure Frontend Environment Variables

Next.js reads public environment variables prefixed with `NEXT_PUBLIC_`.

Create or update `.env.local` in the project root:

```env
# Frontend Environment Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_MOCK_API=false
```

> [!IMPORTANT]
> When `NEXT_PUBLIC_USE_MOCK_API` is set to `false`, all API calls routed through `lib/api/index.ts` bypass `lib/api/mock/` and invoke your real FastAPI server and PostgreSQL database!

---

## 4. Step 3: Implement the Live Hotel Search Page

Create `app/(public)/search/page.tsx` so users can search, filter by city/price/rating, and browse hotels loaded dynamically from PostgreSQL.

### File: `app/(public)/search/page.tsx`

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { searchHotels } from "@/lib/api";
import { Hotel } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Rating } from "@/components/ui/Rating";
import { Search, MapPin, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get("city") || "";

  const [city, setCity] = React.useState(initialCity);
  const [minRating, setMinRating] = React.useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState<string>("featured");
  const [hotels, setHotels] = React.useState<Hotel[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(true);

  const fetchHotels = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await searchHotels({
        city: city || undefined,
        min_rating: minRating,
        sort_by: sortBy as any,
        page: 1,
        page_size: 12,
      });
      setHotels(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load hotels:", err);
    } finally {
      setLoading(false);
    }
  }, [city, minRating, sortBy]);

  React.useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Search & Filter Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-brand-ink">
            Explore Sanctuaries
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            {total} {total === 1 ? "property" : "properties"} available across our collection
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Input
              placeholder="Search by city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-brand-muted" />}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-md text-brand-ink focus:outline-none focus:ring-2 focus:ring-pine/30"
          >
            <option value="featured">Featured First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Results Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-sm text-brand-muted mt-4">Consulting live catalog...</p>
        </div>
      ) : hotels.length === 0 ? (
        <EmptyState
          title="No sanctuaries found"
          description="We couldn't find any properties matching your criteria. Try adjusting your filters."
          actionLabel="Reset Search"
          onAction={() => {
            setCity("");
            setMinRating(undefined);
            setSortBy("featured");
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hotels.map((hotel) => (
            <Link
              key={hotel.id}
              href={`/hotels/${hotel.slug}`}
              className="group block rounded-lg border border-brand-border bg-brand-surface overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-[16/10] relative overflow-hidden bg-brand-border/30">
                <img
                  src={hotel.hero_image}
                  alt={hotel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-brand-ink/75 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Rating value={hotel.average_rating} size="sm" />
                  <span>({hotel.review_count})</span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-brand-muted mb-2">
                  <MapPin className="h-3.5 w-3.5 text-pine" />
                  <span>
                    {hotel.location.city}, {hotel.location.country}
                  </span>
                </div>

                <h3 className="font-serif text-xl font-medium text-brand-ink group-hover:text-pine transition-colors">
                  {hotel.name}
                </h3>
                <p className="text-xs text-brand-muted mt-1 line-clamp-2">
                  {hotel.tagline}
                </p>

                <div className="mt-4 pt-4 border-t border-brand-border flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-wider text-brand-muted">From</span>
                  <span className="font-serif text-lg font-medium text-brand-ink">
                    ${(hotel.min_price_cents / 100).toFixed(0)}{" "}
                    <span className="text-xs font-sans text-brand-muted">/ night</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 5. Step 4: Implement the Live Hotel Detail & Booking Stepper Page

Create `app/(public)/hotels/[slug]/page.tsx` so users can view hotel details, available room suites, and trigger reservations.

### File: `app/(public)/hotels/[slug]/page.tsx`

```tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { getHotel, getRoomsForHotel, createBooking } from "@/lib/api";
import { Hotel, RoomType } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Rating } from "@/components/ui/Rating";
import { PriceBreakdown } from "@/components/ui/PriceBreakdown";
import { MapPin, Users, Bed, Check, Calendar, ArrowRight } from "lucide-react";

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuthStore();

  const [hotel, setHotel] = React.useState<Hotel | null>(null);
  const [rooms, setRooms] = React.useState<RoomType[]>([]);
  const [selectedRoom, setSelectedRoom] = React.useState<RoomType | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [bookingLoading, setBookingLoading] = React.useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = React.useState<string | null>(null);

  // Dates: Next 3 days by default
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
        const roomsData = await getRoomsForHotel(hotelData.id);
        setRooms(roomsData);
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

  const handleBooking = async () => {
    if (!selectedRoom || !hotel) return;

    if (!isAuthenticated) {
      alert("Please sign in or use the quick role switcher in the navbar to book.");
      return;
    }

    try {
      setBookingLoading(true);
      const res = await createBooking({
        room_type_id: selectedRoom.id,
        check_in_date: checkInStr,
        check_out_date: checkOutStr,
        adults: 2,
        children: 0,
        rooms_count: 1,
        guest_notes: "Arriving late in the evening. Quiet room preferred.",
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
      {/* Hero Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-brand-muted mb-2">
          <MapPin className="h-4 w-4 text-pine" />
          <span>
            {hotel.location.address}, {hotel.location.city}, {hotel.location.country}
          </span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-medium text-brand-ink">
          {hotel.name}
        </h1>
        <p className="text-lg text-brand-muted mt-2 max-w-3xl font-light">
          {hotel.description}
        </p>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 rounded-lg overflow-hidden">
        <div className="md:col-span-2 aspect-[16/10] bg-brand-border/30">
          <img src={hotel.hero_image} alt={hotel.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-4">
          {hotel.images.slice(1, 3).map((img, i) => (
            <div key={i} className="aspect-[16/10] bg-brand-border/30 rounded-lg overflow-hidden">
              <img src={img} alt={`${hotel.name} detail`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Reservation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Room Suites Selection (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-serif text-2xl font-medium text-brand-ink">Select Your Suite</h2>

          <div className="space-y-4">
            {rooms.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`p-6 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "border-pine bg-pine-light/30 shadow-xs"
                      : "border-brand-border bg-brand-surface hover:border-brand-border/80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-xl font-medium text-brand-ink">
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
                      <p className="text-sm text-brand-muted mt-3">{room.description}</p>
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

        {/* Live Reservation Card (1 col) */}
        <div>
          <div className="sticky top-24 p-6 rounded-lg border border-brand-border bg-brand-surface shadow-sm">
            <h3 className="font-serif text-xl font-medium text-brand-ink mb-4">
              Reservation Summary
            </h3>

            {bookingSuccess ? (
              <div className="p-4 rounded-md bg-pine-light text-pine border border-pine/30 text-center">
                <Check className="h-8 w-8 mx-auto mb-2 text-pine" />
                <h4 className="font-serif text-lg font-medium">Reservation Confirmed!</h4>
                <p className="text-xs text-pine-hover mt-1 font-mono">
                  Reference: <strong>{bookingSuccess}</strong>
                </p>
                <Button
                  className="mt-4 w-full"
                  size="sm"
                  onClick={() => router.push("/account/bookings")}
                >
                  View My Bookings
                </Button>
              </div>
            ) : (
              <>
                <div className="text-sm text-brand-muted mb-4 space-y-1">
                  <div className="flex justify-between">
                    <span>Dates:</span>
                    <strong className="text-brand-ink font-medium">
                      {checkInStr} → {checkOutStr}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <strong className="text-brand-ink font-medium">{nights} nights</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Suite:</span>
                    <strong className="text-brand-ink font-medium">
                      {selectedRoom?.name || "None selected"}
                    </strong>
                  </div>
                </div>

                {selectedRoom && (
                  <div className="py-4 border-t border-brand-border">
                    <PriceBreakdown
                      nights={nights}
                      basePriceCents={selectedRoom.base_nightly_rate_cents}
                      cleaningFeeCents={4500}
                      taxRate={0.14}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Step 5: Implement the Live Customer Bookings Page

Create `app/(account)/account/bookings/page.tsx` so authenticated users can view real bookings queried from PostgreSQL, review status histories, and inspect active reservations.

### File: `app/(account)/account/bookings/page.tsx`

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { listMyBookings } from "@/lib/api";
import { Booking } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar, MapPin, ArrowRight } from "lucide-react";

export default function MyBookingsPage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true);
        const res = await listMyBookings({ page: 1, page_size: 20 });
        setBookings(res.items);
      } catch (err) {
        console.error("Failed to load user reservations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-medium text-brand-ink">My Reservations</h1>
        <p className="text-sm text-brand-muted mt-1">
          Review your upcoming retreats, date modifications, and historical stays.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-sm text-brand-muted mt-4">Retrieving reservations...</p>
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No reservations found"
          description="You haven't booked any retreats yet. Explore our curated sanctuaries to plan your next stay."
          actionLabel="Explore Hotels"
          onAction={() => window.location.assign("/search")}
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="p-6 rounded-lg border border-brand-border bg-brand-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-semibold text-pine">
                    {booking.booking_reference}
                  </span>
                  <Badge
                    variant={
                      booking.status === "confirmed"
                        ? "success"
                        : booking.status === "cancelled"
                        ? "danger"
                        : "neutral"
                    }
                  >
                    {booking.status}
                  </Badge>
                </div>

                <h3 className="font-serif text-xl font-medium text-brand-ink">
                  {booking.hotel_name}
                </h3>
                <p className="text-xs text-brand-muted mt-1">
                  {booking.room_type_name} • {booking.adults} Guests • {booking.rooms_count} Room
                </p>

                <div className="flex items-center gap-2 text-xs text-brand-muted mt-2">
                  <Calendar className="h-3.5 w-3.5 text-pine" />
                  <span>
                    {booking.check_in_date} → {booking.check_out_date} ({booking.nights} nights)
                  </span>
                </div>
              </div>

              <div className="text-right sm:self-center">
                <div className="font-serif text-xl font-medium text-brand-ink">
                  ${(booking.price_breakdown.total_cents / 100).toFixed(2)}
                </div>
                <div className="text-xs text-brand-muted">Total Paid</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 7. Step 6: Automated Test Verification for Phase 6

Let's ensure the new `/toggle-active` endpoint is covered in our test suite.

Add the following test to `backend/tests/test_admin.py`:

```python
@pytest.mark.asyncio
async def test_admin_toggle_active_endpoint(client: httpx.AsyncClient, admin_token: str):
    res_users = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    users = res_users.json()
    target_customer = next((u for u in users if u["role"] == "customer"), None)
    assert target_customer is not None

    user_id = target_customer["id"]
    initial_status = target_customer["is_active"]

    # Toggle active
    res_toggle = await client.patch(
        f"/api/v1/admin/users/{user_id}/toggle-active",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_toggle.status_code == 200
    assert res_toggle.json()["is_active"] is not initial_status

    # Toggle back to original
    res_toggle_back = await client.patch(
        f"/api/v1/admin/users/{user_id}/toggle-active",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_toggle_back.status_code == 200
    assert res_toggle_back.json()["is_active"] is initial_status
```

---

## 8. Verification & Live Website Testing Checklist

Once you complete writing these files:

1. **Verify Backend Tests**:
   ```bash
   backend\venv\Scripts\pytest backend\tests
   ```
   All 38 tests must pass with 0 warnings.

2. **Verify Frontend Typechecking**:
   ```bash
   npm run typecheck
   ```
   Ensures zero TypeScript compiler errors.

3. **Verify in Browser**:
   * Open [http://localhost:3000/search](http://localhost:3000/search) and observe hotels loaded directly from PostgreSQL!
   * Filter by city or change the sort order. Notice the instantaneous query execution.
   * Click any hotel card to visit `/hotels/<slug>`.
   * Click a room suite, review the deterministic price breakdown, and click **Complete Reservation**.
   * Switch roles or navigate to [http://localhost:3000/account/bookings](http://localhost:3000/account/bookings) to see the reservation recorded in PostgreSQL with its unique `KS-XXXXXX` reference code!

