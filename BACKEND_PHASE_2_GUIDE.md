# Kestrel Stays — Backend Architectural & Execution Guide (Phase 2)
### Building a Production-Grade FastAPI + PostgreSQL Backend for Kestrel Stays

> **Welcome to the Backend Blueprint.** This guide is crafted specifically for you to build the backend yourself with deep conceptual understanding—no copy-paste "vibe coding." Every design decision here aligns with the clean, decoupled Next.js frontend you have already established.

---

## 1. Architectural Overview & Frontend Contract

The Kestrel Stays frontend communicates via REST JSON endpoints. It is completely agnostic about whether the backend is the TypeScript mock or your real Python FastAPI server.

### Core Contract Conventions:
1. **Field Naming**: The frontend domain models in `/lib/types` use `snake_case`. This maps directly to Pydantic models and SQLAlchemy column attributes with zero translation overhead.
2. **Currency & Financial Math**: **Never use floating-point numbers for money.** All amounts (`min_price_cents`, `base_nightly_rate_cents`, `total_cents`, `taxes_and_fees_cents`) are stored as **64-bit integer cents** (e.g., `$380.00` = `38000`). Currency is a 3-letter ISO code string (e.g. `"USD"`).
3. **Calendar Dates vs. Timestamps**:
   - Stay dates (`check_in_date`, `check_out_date`) are strictly `YYYY-MM-DD` string calendar dates (PostgreSQL `DATE`), without timezones or time components. Check-out day is not charged.
   - Audit dates (`created_at`, `updated_at`, `paid_at`) are ISO 8601 UTC strings (`TIMESTAMPTZ`), e.g., `2026-10-24T14:30:00Z`.
4. **Standard Pagination Envelope**:
   ```json
   {
     "items": [...],
     "total": 42,
     "page": 1,
     "page_size": 10,
     "total_pages": 5
   }
   ```
5. **Standard Error Envelope**:
   ```json
   {
     "error": {
       "code": "INVENTORY_EXHAUSTED",
       "message": "The selected room is no longer available for these dates.",
       "fields": {
         "room_type_id": "Sold out"
       }
     }
   }
   ```

---

## 2. Recommended FastAPI Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py              # Auth dependencies: get_current_user, require_admin
│   │   └── v1/
│   │       ├── api.py           # APIRouter combining all endpoint routers
│   │       └── endpoints/
│   │           ├── auth.py
│   │           ├── hotels.py
│   │           ├── rooms.py
│   │           ├── availability.py
│   │           ├── bookings.py
│   │           ├── reviews.py
│   │           ├── favorites.py
│   │           ├── users.py
│   │           └── admin.py
│   ├── core/
│   │   ├── config.py            # Pydantic v2 BaseSettings (DATABASE_URL, JWT_SECRET)
│   │   ├── database.py          # SQLAlchemy 2.0 AsyncEngine and sessionmaker
│   │   └── security.py          # Passlib (bcrypt) & python-jose JWT encode/decode
│   ├── models/                  # SQLAlchemy ORM declarative models
│   │   ├── user.py
│   │   ├── hotel.py
│   │   ├── room.py
│   │   ├── booking.py
│   │   ├── review.py
│   │   └── favorite.py
│   ├── schemas/                 # Pydantic v2 validation models
│   │   ├── auth.py
│   │   ├── hotel.py
│   │   ├── room.py
│   │   ├── booking.py
│   │   ├── review.py
│   │   └── common.py            # PaginatedResponse[T], ApiError
│   ├── services/                # Business logic isolated from HTTP transport
│   │   ├── availability.py      # Range overlap & room count math
│   │   ├── booking_engine.py    # Concurrency locking & reservation state machine
│   │   └── pricing.py           # Nights math & tax calculations
│   └── main.py                  # FastAPI application entrypoint & CORS middleware
├── alembic/                     # Database migrations
│   ├── versions/
│   └── env.py
├── tests/                       # Pytest test suite with test database
│   ├── test_auth.py
│   ├── test_availability.py
│   └── test_booking_concurrency.py
├── alembic.ini
├── pyproject.toml / requirements.txt
└── Dockerfile
```

---

## 3. PostgreSQL Database Schema & Relational Design

### Tables Overview:
1. `users`: Authentication, profile data, and roles (`admin`, `customer`).
2. `hotels`: Property details, location, star rating, average rating, hero images.
3. `amenities` & `hotel_amenities`: Many-to-many relationship mapping amenities to properties.
4. `room_types`: Specific room units per hotel, total inventory capacity, base rate in cents.
5. `bookings`: Reservations, stay dates, guest snapshot, payment reference, and current status.
6. `booking_status_events`: Audit log tracking every transition (`pending` → `confirmed` → `completed` or `cancelled`).
7. `reviews`: Guest reviews with individual rating categories and moderation flags.
8. `favorites`: User-saved hotels.

### Suggested SQLAlchemy Models Reference:

```python
# app/models/hotel.py
import uuid
from sqlalchemy import String, Integer, Float, Boolean, Text, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class Hotel(Base):
    __tablename__ = "hotels"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    tagline: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    property_type: Mapped[str] = mapped_column(String(50), nullable=False) # boutique, resort, lodge, beachfront
    star_rating: Mapped[int] = mapped_column(Integer, default=5)
    average_rating: Mapped[float] = mapped_column(Float, default=5.0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    min_price_cents: Mapped[int] = mapped_column(Integer, nullable=False) # integer cents
    currency: Mapped[str] = mapped_column(String(3), default="USD")

    # Embedded or related Location & Policies (JSONB or separate table)
    location: Mapped[dict] = mapped_column(JSONB, nullable=False)
    policies: Mapped[dict] = mapped_column(JSONB, nullable=False)
    images: Mapped[list] = mapped_column(JSONB, default=list)
    hero_image: Mapped[str] = mapped_column(String(500), nullable=False)

    rooms: Mapped[list["RoomType"]] = relationship("RoomType", back_populates="hotel", cascade="all, delete-orphan")
```

```python
# app/models/room.py
class RoomType(Base):
    __tablename__ = "room_types"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hotel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hotels.id", ondelete="CASCADE"), index=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    max_occupancy: Mapped[int] = mapped_column(Integer, nullable=False)
    bed_type: Mapped[str] = mapped_column(String(50), nullable=False) # king, queen, tatami
    bed_count: Mapped[int] = mapped_column(Integer, default=1)
    size_sqm: Mapped[int] = mapped_column(Integer, nullable=False)
    base_nightly_rate_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    total_inventory: Mapped[int] = mapped_column(Integer, nullable=False) # Total physical units of this room

    hotel: Mapped["Hotel"] = relationship("Hotel", back_populates="rooms")
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="room_type")

    __table_args__ = (
        CheckConstraint("total_inventory > 0", name="check_positive_inventory"),
        CheckConstraint("base_nightly_rate_cents > 0", name="check_positive_rate"),
    )
```

```python
# app/models/booking.py
from datetime import date
from sqlalchemy import Date, Enum

class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_reference: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False) # "KS-892147"
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    hotel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hotels.id"), index=True)
    room_type_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("room_types.id"), index=True)

    check_in_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    check_out_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    nights: Mapped[int] = mapped_column(Integer, nullable=False)
    adults: Mapped[int] = mapped_column(Integer, nullable=False)
    children: Mapped[int] = mapped_column(Integer, default=0)
    rooms_count: Mapped[int] = mapped_column(Integer, default=1)

    status: Mapped[str] = mapped_column(String(30), default="confirmed", index=True) # pending, confirmed, cancelled, completed

    # Snapshots (guarantees historical accuracy even if room price changes later)
    price_breakdown: Mapped[dict] = mapped_column(JSONB, nullable=False)
    guest_info: Mapped[dict] = mapped_column(JSONB, nullable=False)
    payment: Mapped[dict] = mapped_column(JSONB, nullable=False)

    room_type: Mapped["RoomType"] = relationship("RoomType", back_populates="bookings")
```

---

## 4. Deep-Dive: The 4 Hard Backend Problems (With Solutions & Hints)

### Problem 1: Preventing Double-Booking Under Concurrent Requests
- **The Pitfall**: Two users click "Confirm Reservation" at the exact same millisecond for the last available room suite. If both requests do a simple `SELECT count(*)`, both queries return `available = 1`, and both insert a booking, creating an oversell disaster.
- **The Solution**: **Row-Level Pessimistic Locking** inside an ACID transaction.
  When booking, lock the target `room_types` row with `FOR UPDATE`:
  ```python
  async with session.begin():
      # 1. Lock room_type row so concurrent bookings for this room must wait
      room = await session.execute(
          select(RoomType).where(RoomType.id == payload.room_type_id).with_for_update()
      )
      room = room.scalar_one_or_none()

      # 2. Count overlapping confirmed bookings
      overlapping = await session.execute(
          select(func.sum(Booking.rooms_count))
          .where(
              Booking.room_type_id == payload.room_type_id,
              Booking.status != "cancelled",
              Booking.check_in_date < payload.check_out_date,
              Booking.check_out_date > payload.check_in_date,
          )
      )
      booked_units = overlapping.scalar() or 0

      # 3. Verify capacity
      if (room.total_inventory - booked_units) < payload.rooms_count:
          raise HTTPException(status_code=409, detail="INVENTORY_EXHAUSTED")

      # 4. Insert new booking
      new_booking = Booking(...)
      session.add(new_booking)
  ```

### Problem 2: Date Overlap Geometry
- Two date ranges $[A_{in}, A_{out})$ and $[B_{in}, B_{out})$ overlap if and only if:
  $$\text{check\_in} < B_{out} \quad \text{AND} \quad \text{check\_out} > B_{in}$$
- Remember: Check-out day is a departure day! If Guest A checks out on `2026-11-15` and Guest B checks in on `2026-11-15`, **they do NOT overlap** (`11-15 < 11-15` is false). This exact formula handles back-to-back stays seamlessly.

### Problem 3: State Machine for Booking & Cancellation
- Define an explicit state transition graph:
  - `pending` $\rightarrow$ `confirmed` (upon payment authorization)
  - `confirmed` $\rightarrow$ `completed` (after check-out date passes)
  - `confirmed` $\rightarrow$ `cancelled` (eligible for refund based on property policy)
  - `cancelled` $\rightarrow$ **terminal** (cannot be un-cancelled)
- Every transition appends a record to `booking_status_events` with timestamps, notes, and the actor (`user` or `admin`).

### Problem 4: JWT Authentication with Refresh Token Rotation
- **Access Token**: Short-lived (e.g. 15 minutes), passed in the `Authorization: Bearer <token>` header. Held in frontend memory.
- **Refresh Token**: Long-lived (e.g. 7 days), stored in an `httpOnly`, `SameSite=Lax`, `Secure` cookie.
- When the access token expires, the frontend client transparently posts to `/api/v1/auth/refresh`. The backend validates the refresh cookie, invalidates the old refresh token (rotation), issues a new pair, and returns the new access token.

---

## 5. Step-by-Step Implementation Roadmap

Follow these 7 sequential milestones:

| Milestone | What You Will Build in FastAPI | Frontend Verification | Concepts Learned |
| :--- | :--- | :--- | :--- |
| **M1: Setup & DB** | PostgreSQL Docker container, SQLAlchemy 2.0 AsyncEngine, Alembic migration for `users`, `hotels`, `rooms`. | Check database tables created via pgAdmin or `psql`. | Async I/O, Alembic versions, connection pooling. |
| **M2: Auth API** | `/auth/register`, `/auth/login`, `/auth/me`, `/auth/refresh` with bcrypt password hashing and JWT. | Open [`/login`](http://localhost:3000/login) with `NEXT_PUBLIC_USE_MOCK_API=false` and log in. | Password salting, JWT payloads, dependency injection (`Depends`). |
| **M3: Hotels Catalog** | `GET /hotels` with filter query params (`destination`, `min_price_cents`, `sort_by`), `GET /hotels/{slug}`. | Search results at `/search` and detail pages at `/hotels/[slug]`. | Dynamic SQLAlchemy query filtering, Pydantic responses. |
| **M4: Live Availability** | `GET /availability` calculating overlapping units per room. | Hotel detail page room selector reflects live availability. | Date math, range overlap algorithms, SQL aggregation. |
| **M5: Booking Engine** | `POST /bookings`, `GET /bookings/my`, `POST /bookings/{id}/cancel` with pessimistic row locking. | Multi-step booking checkout at `/book` creates real database records. | ACID transactions, row locking (`FOR UPDATE`), race condition mitigation. |
| **M6: Customer Area** | Saved favorites CRUD (`/favorites`), reviews submission (`/reviews`). | Customer dashboard at `/account` displays real bookings, saved stays, and reviews. | Foreign key constraints, cascade deletes, data aggregation. |
| **M7: Admin Console** | `GET /admin/dashboard` metrics, hotel/room CRUD endpoints. | `/admin` metrics cards, charts, and bookings drawer. | Role-based access control (RBAC), summary metrics aggregation. |

---

## 6. Definition of Done Checklist for Production

Before deploying your FastAPI backend to production:
- [ ] **Security**: CORS headers restricted to frontend origin; rate limiting enabled (e.g., `slowapi`).
- [ ] **Transactions**: All booking and inventory updates wrapped in atomic database transactions.
- [ ] **Money Integrity**: Zero floating-point math; all prices and calculations stored in integer cents.
- [ ] **Data Validation**: Strict Pydantic models with custom validators for email, date ranges, and positive counts.
- [ ] **Automated Tests**: Unit tests for date overlap logic and concurrent booking simulations.
- [ ] **Configuration**: All secrets (`DATABASE_URL`, `JWT_SECRET`) loaded via environment variables with `.env` files git-ignored.
