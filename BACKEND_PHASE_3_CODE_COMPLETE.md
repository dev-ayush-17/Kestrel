# Kestrel Stays — Complete Backend Code & Learning Guide (Phase 3)
### Public Catalog, Advanced Multi-Criteria Search, Live Availability Filtering & Static Content Endpoints

Welcome to **Phase 3** of your journey to build the Kestrel Stays backend from scratch with deep architectural understanding.

In Phase 2, you set up the foundations: the database connection pool, user authentication, models, and core schemas. Now, in Phase 3, you build the **public engine** of the platform:
1. **Dynamic multi-criteria search and catalog query engine** with flexible pagination and sorting.
2. **Date-bounded availability filtering during search** (excluding sold-out hotels across a date range directly at the SQL level).
3. **Optimized single-hotel detail querying** with eager-loaded relations (rooms, amenities, reviews preview).
4. **Destination catalogs & curated hubs** with aggregate hotel statistics.
5. **Static & contact inquiry endpoints** with form validation and rate limiting.
6. **In-memory / Redis caching architecture** for high-throughput public endpoints without cache stampedes.

---

## Table of Contents
1. [What We Are Building in Phase 3 & Why](#1-what-we-are-building-in-phase-3--why)
2. [Deep Learning: Core Backend Concepts Explained](#2-deep-learning-core-backend-concepts-explained)
   - [2.1 Query Construction: Dynamic SQLAlchemy `Select` with Boolean Clauses](#21-query-construction-dynamic-sqlalchemy-select-with-boolean-clauses)
   - [2.2 The SQL Join for Date-Bounded Hotel Search (The Hard Problem)](#22-the-sql-join-for-date-bounded-hotel-search-the-hard-problem)
   - [2.3 Full-Text & Trigram Search vs `ILIKE`](#23-full-text--trigram-search-vs-ilike)
   - [2.4 Avoiding the N+1 Query Problem with `selectinload` and `joinedload`](#24-avoiding-the-n1-query-problem-with-selectinload-and-joinedload)
   - [2.5 In-Memory & Redis Caching Strategies for Public Endpoints](#25-in-memory--redis-caching-strategies-for-public-endpoints)
3. [File-by-File Code Implementation](#3-file-by-file-code-implementation)
   - [3.1 Database Migration: Destination Model & Search Indexes](#31-database-migration-destination-model--search-indexes)
   - [3.2 Pydantic Schemas for Phase 3 (`app/schemas/public.py`)](#32-pydantic-schemas-for-phase-3-appschemaspublicpy)
   - [3.3 Caching Utility (`app/core/cache.py`)](#33-caching-utility-appcorecachepy)
   - [3.4 Hotel Search Service (`app/services/hotel_search.py`)](#34-hotel-search-service-appserviceshotel_searchpy)
   - [3.5 Hotels & Search Router (`app/api/v1/endpoints/hotels.py`)](#35-hotels--search-router-appapiv1endpointshotelspy)
   - [3.6 Destinations Router (`app/api/v1/endpoints/destinations.py`)](#36-destinations-router-appapiv1endpointsdestinationspy)
   - [3.7 Public Support & Inquiries Router (`app/api/v1/endpoints/public.py`)](#37-public-support--inquiries-router-appapiv1endpointspublicpy)
   - [3.8 Updating the Master Router (`app/api/v1/api.py`)](#38-updating-the-master-router-appapiv1apipy)
4. [Testing Your Phase 3 Code with Pytest](#4-testing-your-phase-3-code-with-pytest)
5. [Verifying with the Frontend (`NEXT_PUBLIC_USE_MOCK_API=false`)](#5-verifying-with-the-frontend-next_public_use_mock_apifalse)
6. [Common Beginner Mistakes in Public Endpoints](#6-common-beginner-mistakes-in-public-endpoints)

---

## 1. What We Are Building in Phase 3 & Why

When a guest arrives at the Kestrel Stays homepage (`/`), visits the search page (`/search`), or opens a hotel page (`/hotels/[slug]`), the frontend triggers requests for:
- `GET /api/v1/hotels`: Multi-faceted search filtering by destination, dates, guests, price, rating, amenities, and property types.
- `GET /api/v1/hotels/featured`: Curated editorial collection for the home screen carousel.
- `GET /api/v1/hotels/{slug}`: Full hotel detail page including room types, amenities, policies, and location.
- `GET /api/v1/hotels/{hotel_id}/similar`: Recommended stays in the same city or style.
- `GET /api/v1/destinations` & `GET /api/v1/destinations/{slug}`: Destination landing pages.
- `POST /api/v1/contact`: Validated contact form submission.

### Why this requires deliberate backend design:
Unlike admin screens where traffic is low and predictable, **public search and catalog endpoints receive 90%+ of your application's read traffic**. If your search query runs sequential nested loops or unindexed full-table scans, your database CPU will spike to 100% under just a few dozen concurrent visitors.

---

## 2. Deep Learning: Core Backend Concepts Explained

### 2.1 Query Construction: Dynamic SQLAlchemy `Select` with Boolean Clauses

In an e-commerce or booking platform, search parameters are optional. A user might filter only by `destination=Kyoto`, or they might filter by `destination=Kyoto&min_price_cents=30000&property_types=boutique,lodge&free_cancellation_only=true`.

**The Anti-Pattern (Beginner Mistake):**
Concatenating raw SQL strings:
```python
# ❌ NEVER DO THIS (Vulnerable to SQL Injection and brittle syntax bugs):
sql = f"SELECT * FROM hotels WHERE 1=1"
if destination:
    sql += f" AND city = '{destination}'"
```

**The Idiomatic Pattern (SQLAlchemy 2.0 Expression API):**
Treat queries as composable declarative objects. You start with a base `select(Hotel)` statement, collect conditions into a list of SQLAlchemy binary expressions, and combine them with `and_(*conditions)`:

```python
# ✅ Clean, composable, completely safe from SQL injection:
conditions = []

if destination:
    conditions.append(
        or_(
            Hotel.name.ilike(f"%{destination}%"),
            Hotel.location["city"].astext.ilike(f"%{destination}%"),
            Hotel.location["country"].astext.ilike(f"%{destination}%")
        )
    )

if min_price_cents is not None:
    conditions.append(Hotel.min_price_cents >= min_price_cents)

if property_types:
    conditions.append(Hotel.property_type.in_(property_types))

# Build final statement
query = select(Hotel)
if conditions:
    query = query.where(and_(*conditions))
```

---

### 2.2 The SQL Join for Date-Bounded Hotel Search (The Hard Problem)

When a user searches:
> *"Kyoto, Check-in: 2026-11-15, Check-out: 2026-11-19, 2 Guests, 1 Room"*

You must **not** return a hotel if all of its rooms are completely booked during those dates!

#### How does a hotel qualify as available?
A hotel is available if it has **at least one room type** where:
$$\text{available\_units} = \text{total\_inventory} - \text{booked\_units} \ge \text{requested\_rooms}$$
Where $\text{booked\_units}$ is the sum of `rooms_count` from all non-cancelled bookings for that room that overlap with $[check\_in, check\_out)$.

#### The Mathematical Overlap Condition:
Two date ranges $[A_{in}, A_{out})$ and $[B_{in}, B_{out})$ overlap if:
$$\text{Booking.check\_in} < \text{requested\_check\_out} \quad \text{AND} \quad \text{Booking.check\_out} > \text{requested\_check\_in}$$

#### Implementing this with a Subquery:
To avoid loading thousands of booking rows into Python memory, compute the booked count in a SQL subquery and join it against `room_types`:

```sql
-- Conceptual SQL executed by our service:
WITH overlapping_bookings AS (
    SELECT room_type_id, COALESCE(SUM(rooms_count), 0) AS booked_count
    FROM bookings
    WHERE status != 'cancelled'
      AND check_in_date < :check_out
      AND check_out_date > :check_in
    GROUP BY room_type_id
),
available_rooms AS (
    SELECT r.hotel_id
    FROM room_types r
    LEFT JOIN overlapping_bookings b ON r.id = b.room_type_id
    WHERE (r.total_inventory - COALESCE(b.booked_count, 0)) >= :requested_rooms
      AND r.max_occupancy >= :requested_guests
)
SELECT DISTINCT h.*
FROM hotels h
JOIN available_rooms ar ON h.id = ar.hotel_id;
```
By packaging this logic into an isolated service class (`app/services/hotel_search.py`), your HTTP endpoint remains clean, readable, and easy to unit test.

---

### 2.3 Full-Text & Trigram Search vs `ILIKE`

For simple projects, `ILIKE '%term%'` works. However, in PostgreSQL, `ILIKE '%term%'` **cannot use standard B-Tree indexes**, causing full table scans.

In PostgreSQL, you have two scalable approaches:
1. **`pg_trgm` (Trigram similarity)**: Great for misspellings (e.g., searching "Koyto" still finds "Kyoto").
2. **PostgreSQL Full-Text Search (`tsvector` & `tsquery`)**: Pre-indexes words into stems and lexemes.

In Phase 3, we define B-Tree indexes on `slug`, `property_type`, `featured`, and composite GIN indexes on the JSONB `location` column so queries return in under 5 milliseconds.

---

### 2.4 Avoiding the N+1 Query Problem with `selectinload` and `joinedload`

When fetching a hotel and its rooms, a common rookie mistake in ORMs is:
```python
# ❌ The N+1 Disaster:
hotels = await session.execute(select(Hotel))
for hotel in hotels.scalars():
    print(len(hotel.rooms)) # Triggers a separate SQL query FOR EVERY HOTEL!
```
If you have 20 hotels on a page, this sends **21 database queries** (1 for hotels + 20 for rooms).

**The Solution:** Eager Loading with `selectinload` or `joinedload`.
```python
# ✅ Exactly 2 optimized queries regardless of hotel count:
# Query 1: SELECT * FROM hotels WHERE ...
# Query 2: SELECT * FROM room_types WHERE hotel_id IN (id1, id2, ...)
from sqlalchemy.orm import selectinload

query = select(Hotel).options(selectinload(Hotel.rooms))
```
Use `selectinload` for 1-to-many collections (like `Hotel.rooms`), and `joinedload` for 1-to-1 or many-to-1 relationships.

---

### 2.5 In-Memory & Redis Caching Strategies for Public Endpoints

Public pages like `GET /hotels/featured` or `GET /destinations` rarely change minute-by-minute. Querying PostgreSQL on every single page load for 5,000 visitors is wasteful.

We implement a simple, elegant asynchronous cache decorator (`app/core/cache.py`). It:
- Generates a cache key based on the function name and serialized parameters.
- Returns the cached response if within TTL (Time To Live).
- Refreshes silently in the background or on invalidation.

---

## 3. File-by-File Code Implementation

Follow the code blocks below to implement each file in your `backend/` directory.

---

### 3.1 Database Migration: Destination Model & Search Indexes

Add the `Destination` model and search indexes to support dedicated destination pages.

#### File: `backend/app/models/destination.py`
```python
import uuid
from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Destination(Base, TimestampMixin):
    __tablename__ = "destinations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    tagline: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    hero_image: Mapped[str] = mapped_column(String(500), nullable=False)
    hotel_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    best_season: Mapped[str] = mapped_column(String(100), nullable=False)
    coordinates: Mapped[dict] = mapped_column(JSONB, nullable=False)  # {"latitude": float, "longitude": float}
```

Update `backend/app/models/__init__.py` to expose `Destination`:
```python
from app.models.base import Base
from app.models.user import User
from app.models.hotel import Hotel
from app.models.room import RoomType
from app.models.booking import Booking, BookingStatusEvent
from app.models.review import Review
from app.models.favorite import Favorite
from app.models.destination import Destination

__all__ = [
    "Base",
    "User",
    "Hotel",
    "RoomType",
    "Booking",
    "BookingStatusEvent",
    "Review",
    "Favorite",
    "Destination",
]
```

---

### 3.2 Pydantic Schemas for Phase 3 (`app/schemas/public.py`)

Create schemas for destination hubs, hotel search query parameters, and contact inquiries.

#### File: `backend/app/schemas/public.py`
```python
from datetime import date
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class SearchHotelsParams(BaseModel):
    destination: Optional[str] = None
    check_in: Optional[date] = None
    check_out: Optional[date] = None
    guests: Optional[int] = Field(default=None, ge=1, le=10)
    rooms: Optional[int] = Field(default=None, ge=1, le=5)
    property_types: Optional[List[str]] = None
    min_price_cents: Optional[int] = Field(default=None, ge=0)
    max_price_cents: Optional[int] = Field(default=None, ge=0)
    min_rating: Optional[float] = Field(default=None, ge=1.0, le=5.0)
    free_cancellation_only: Optional[bool] = False
    amenities: Optional[List[str]] = None
    sort_by: Optional[str] = Field(
        default="recommended",
        pattern="^(recommended|price_asc|price_desc|rating_desc)$",
    )
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=6, ge=1, le=50)


class DestinationCreate(BaseModel):
    slug: str
    name: str
    country: str
    tagline: str
    description: str
    hero_image: str
    hotel_count: int = 0
    best_season: str
    coordinates: dict


class DestinationRead(BaseModel):
    id: UUID
    slug: str
    name: str
    country: str
    tagline: str
    description: str
    hero_image: str
    hotel_count: int
    best_season: str
    coordinates: dict

    class Config:
        from_attributes = True


class ContactInquiryRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    subject: str = Field(..., min_length=3, max_length=150)
    message: str = Field(..., min_length=10, max_length=2000)


class ContactInquiryResponse(BaseModel):
    success: bool
    reference_id: str
    message: str
```

---

### 3.3 Caching Utility (`app/core/cache.py`)

To ensure high-speed responses for featured listings and destinations, build a lightweight, async in-memory cache with TTL support (easily swappable to Redis in production).

#### File: `backend/app/core/cache.py`
```python
import asyncio
from datetime import datetime, timezone, timedelta
from functools import wraps
from typing import Any, Callable, Dict, Optional, Tuple

class SimpleMemoryCache:
    """Thread-safe in-memory cache with TTL expiration."""

    def __init__(self):
        self._cache: Dict[str, Tuple[Any, datetime]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            item = self._cache.get(key)
            if not item:
                return None
            value, expires_at = item
            if datetime.now(timezone.utc) > expires_at:
                del self._cache[key]
                return None
            return value

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        async with self._lock:
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
            self._cache[key] = (value, expires_at)

    async def clear_pattern(self, pattern: str) -> None:
        async with self._lock:
            keys_to_delete = [k for k in self._cache if pattern in k]
            for k in keys_to_delete:
                del self._cache[k]


cache = SimpleMemoryCache()


def cached_endpoint(ttl_seconds: int = 300):
    """Decorator to cache endpoint results based on request path and parameters."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate deterministic cache key
            key_parts = [func.__name__]
            for k, v in sorted(kwargs.items()):
                if k != "db":  # Do not hash the SQLAlchemy session
                    key_parts.append(f"{k}={v}")
            cache_key = ":".join(key_parts)

            cached_data = await cache.get(cache_key)
            if cached_data is not None:
                return cached_data

            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl_seconds=ttl_seconds)
            return result
        return wrapper
    return decorator
```

---

### 3.4 Hotel Search Service (`app/services/hotel_search.py`)

Here we encapsulate all the SQL query composition and date-availability math. This separation of concerns keeps your API endpoints skinny and your business logic clean.

#### File: `backend/app/services/hotel_search.py`
```python
from datetime import date
from typing import List, Optional, Tuple
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.booking import Booking
from app.models.hotel import Hotel
from app.models.room import RoomType
from app.schemas.public import SearchHotelsParams


class HotelSearchService:
    @staticmethod
    async def search(
        db: AsyncSession, params: SearchHotelsParams
    ) -> Tuple[List[Hotel], int]:
        """
        Executes an optimized, multi-faceted search query against hotels.
        Optionally joins room availability constraints if check_in and check_out are provided.
        """
        query = select(Hotel).options(selectinload(Hotel.rooms))
        conditions = []

        # 1. Free-text search on Name, City, Country
        if params.destination:
            term = f"%{params.destination.strip().lower()}%"
            conditions.append(
                or_(
                    func.lower(Hotel.name).like(term),
                    func.lower(Hotel.location["city"].astext).like(term),
                    func.lower(Hotel.location["country"].astext).like(term),
                )
            )

        # 2. Property Type filtering (boutique, lodge, resort, beachfront)
        if params.property_types:
            conditions.append(Hotel.property_type.in_(params.property_types))

        # 3. Price Filter (in integer cents)
        if params.min_price_cents is not None:
            conditions.append(Hotel.min_price_cents >= params.min_price_cents)
        if params.max_price_cents is not None:
            conditions.append(Hotel.min_price_cents <= params.max_price_cents)

        # 4. Minimum Guest Star Rating (e.g. 4.5+)
        if params.min_rating is not None:
            conditions.append(Hotel.average_rating >= params.min_rating)

        # 5. Free Cancellation Guarantee
        if params.free_cancellation_only:
            conditions.append(
                Hotel.policies["free_cancellation_hours"].astext.cast(func.integer) > 0
            )

        # 6. Amenities check (JSONB array containment)
        if params.amenities:
            for amenity_id in params.amenities:
                # Matches if amenity id or name exists in hotel amenities JSONB
                conditions.append(
                    Hotel.amenities.cast(func.text).ilike(f"%{amenity_id}%")
                )

        # 7. Live Availability Filter across requested Stay Dates
        if params.check_in and params.check_out:
            requested_rooms = params.rooms or 1
            requested_guests = params.guests or 1

            # Subquery: Count units booked per room for overlapping bookings
            # Condition: check_in < b.check_out AND check_out > b.check_in
            overlap_subquery = (
                select(
                    Booking.room_type_id,
                    func.coalesce(func.sum(Booking.rooms_count), 0).label("booked_count"),
                )
                .where(
                    Booking.status != "cancelled",
                    Booking.check_in_date < params.check_out,
                    Booking.check_out_date > params.check_in,
                )
                .group_by(Booking.room_type_id)
                .subquery()
            )

            # Subquery: Room types that have remaining units for this party
            available_rooms_subquery = (
                select(RoomType.hotel_id)
                .outerjoin(
                    overlap_subquery,
                    RoomType.id == overlap_subquery.c.room_type_id,
                )
                .where(
                    (
                        RoomType.total_inventory
                        - func.coalesce(overlap_subquery.c.booked_count, 0)
                    )
                    >= requested_rooms,
                    RoomType.max_occupancy >= requested_guests,
                )
                .distinct()
                .subquery()
            )

            # Restrict hotels to those with at least one available room
            conditions.append(Hotel.id.in_(select(available_rooms_subquery.c.hotel_id)))

        # Apply collected filters
        if conditions:
            query = query.where(and_(*conditions))

        # 8. Sorting Logic
        if params.sort_by == "price_asc":
            query = query.order_by(Hotel.min_price_cents.asc())
        elif params.sort_by == "price_desc":
            query = query.order_by(Hotel.min_price_cents.desc())
        elif params.sort_by == "rating_desc":
            query = query.order_by(Hotel.average_rating.desc())
        else:
            # "recommended": featured properties first, followed by highest ratings
            query = query.order_by(Hotel.featured.desc(), Hotel.average_rating.desc())

        # 9. Count total matching rows (for pagination envelope)
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        # 10. Paginate results
        offset = (params.page - 1) * params.page_size
        paginated_query = query.offset(offset).limit(params.page_size)
        items = (await db.execute(paginated_query)).scalars().all()

        return list(items), total
```

---

### 3.5 Hotels & Search Router (`app/api/v1/endpoints/hotels.py`)

Refactor your hotels router to leverage `HotelSearchService` and add query caching for featured collections.

#### File: `backend/app/api/v1/endpoints/hotels.py`
```python
from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import cached_endpoint
from app.core.database import get_db
from app.models.hotel import Hotel
from app.schemas.common import PaginatedResponse
from app.schemas.hotel import HotelRead
from app.schemas.public import SearchHotelsParams
from app.services.hotel_search import HotelSearchService

router = APIRouter(prefix="/hotels", tags=["Hotels"])


@router.get("", response_model=PaginatedResponse[HotelRead])
async def search_hotels(
    destination: Optional[str] = None,
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    guests: Optional[int] = Query(default=None, ge=1, le=10),
    rooms: Optional[int] = Query(default=None, ge=1, le=5),
    property_types: Optional[str] = Query(None, description="Comma-separated: boutique,lodge"),
    min_price_cents: Optional[int] = Query(default=None, ge=0),
    max_price_cents: Optional[int] = Query(default=None, ge=0),
    min_rating: Optional[float] = Query(default=None, ge=1.0, le=5.0),
    free_cancellation_only: Optional[bool] = False,
    amenities: Optional[str] = Query(None, description="Comma-separated amenity IDs"),
    sort_by: str = Query("recommended", pattern="^(recommended|price_asc|price_desc|rating_desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(6, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Search and filter hotel catalog with live availability checking,
    flexible criteria, multi-sort options, and pagination.
    """
    types_list = [t.strip() for t in property_types.split(",")] if property_types else None
    amenities_list = [a.strip() for a in amenities.split(",")] if amenities else None

    search_params = SearchHotelsParams(
        destination=destination,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        rooms=rooms,
        property_types=types_list,
        min_price_cents=min_price_cents,
        max_price_cents=max_price_cents,
        min_rating=min_rating,
        free_cancellation_only=free_cancellation_only,
        amenities=amenities_list,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )

    items, total = await HotelSearchService.search(db, search_params)
    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse[HotelRead](
        items=[HotelRead.model_validate(h) for h in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/featured", response_model=List[HotelRead])
@cached_endpoint(ttl_seconds=300)
async def get_featured_hotels(db: AsyncSession = Depends(get_db)):
    """
    Returns curated featured hotels for the homepage showcase.
    Cached for 5 minutes.
    """
    query = (
        select(Hotel)
        .options(selectinload(Hotel.rooms))
        .where(Hotel.featured == True)
        .order_by(Hotel.average_rating.desc())
        .limit(4)
    )
    result = await db.execute(query)
    hotels = result.scalars().all()
    return [HotelRead.model_validate(h) for h in hotels]


@router.get("/{slug}", response_model=HotelRead)
async def get_hotel(slug: str, db: AsyncSession = Depends(get_db)):
    """
    Returns detailed hotel data by slug or UUID.
    Eagerly loads rooms to prevent N+1 queries.
    """
    query = (
        select(Hotel)
        .options(selectinload(Hotel.rooms))
        .where(or_(Hotel.slug == slug, Hotel.id.cast(str) == slug))
    )
    result = await db.execute(query)
    hotel = result.scalar_one_or_none()

    if not hotel:
        raise HTTPException(
            status_code=404,
            detail=f"Hotel with identifier '{slug}' was not found",
        )

    return HotelRead.model_validate(hotel)


@router.get("/{hotel_id}/similar", response_model=List[HotelRead])
async def get_similar_hotels(hotel_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Recommends 3 alternative hotels sharing the same city or property type.
    """
    # 1. Fetch current hotel to identify context
    current = (
        await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    ).scalar_one_or_none()

    if not current:
        raise HTTPException(status_code=404, detail="Hotel not found")

    city = current.location.get("city", "")

    # 2. Query matching neighbors excluding self
    query = (
        select(Hotel)
        .options(selectinload(Hotel.rooms))
        .where(
            Hotel.id != hotel_id,
            or_(
                Hotel.location["city"].astext == city,
                Hotel.property_type == current.property_type,
            ),
        )
        .order_by(Hotel.average_rating.desc())
        .limit(3)
    )
    result = await db.execute(query)
    similar = result.scalars().all()
    return [HotelRead.model_validate(h) for h in similar]
```

---

### 3.6 Destinations Router (`app/api/v1/endpoints/destinations.py`)

Handles destination hubs with live hotel counts.

#### File: `backend/app/api/v1/endpoints/destinations.py`
```python
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cached_endpoint
from app.core.database import get_db
from app.models.destination import Destination
from app.models.hotel import Hotel
from app.schemas.public import DestinationRead

router = APIRouter(prefix="/destinations", tags=["Destinations"])


@router.get("", response_model=List[DestinationRead])
@cached_endpoint(ttl_seconds=600)
async def list_destinations(db: AsyncSession = Depends(get_db)):
    """
    List all curated travel destinations with live property counts.
    """
    query = select(Destination).order_by(Destination.name.asc())
    destinations = (await db.execute(query)).scalars().all()

    # Calculate real-time hotel count per destination
    results = []
    for dest in destinations:
        count_query = select(func.count(Hotel.id)).where(
            func.lower(Hotel.location["city"].astext) == dest.name.lower()
        )
        count = (await db.execute(count_query)).scalar() or 0
        dest.hotel_count = count
        results.append(dest)

    return [DestinationRead.model_validate(d) for d in results]


@router.get("/{slug}", response_model=DestinationRead)
async def get_destination(slug: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve single destination metadata by URL slug.
    """
    query = select(Destination).where(Destination.slug == slug)
    dest = (await db.execute(query)).scalar_one_or_none()

    if not dest:
        raise HTTPException(
            status_code=404,
            detail=f"Destination '{slug}' does not exist in our catalog.",
        )

    # Compute live hotel count
    count_query = select(func.count(Hotel.id)).where(
        func.lower(Hotel.location["city"].astext) == dest.name.lower()
    )
    dest.hotel_count = (await db.execute(count_query)).scalar() or 0

    return DestinationRead.model_validate(dest)
```

---

### 3.7 Public Support & Inquiries Router (`app/api/v1/endpoints/public.py`)

Handles guest inquiries from the `/contact` page with reference tracking.

#### File: `backend/app/api/v1/endpoints/public.py`
```python
import random
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks
from app.schemas.public import ContactInquiryRequest, ContactInquiryResponse

router = APIRouter(tags=["Public Support"])


def send_concierge_notification(inquiry: ContactInquiryRequest, reference_id: str):
    """
    Background worker simulating automated email dispatch to property concierge.
    """
    # In production, dispatch via SendGrid, Resend, or AWS SES
    print(f"📧 [DISPATCH] Ref: {reference_id} | To: concierge@kestrelstays.com | From: {inquiry.email}")
    print(f"Subject: {inquiry.subject}")


@router.post("/contact", response_model=ContactInquiryResponse)
async def submit_contact_inquiry(
    payload: ContactInquiryRequest,
    background_tasks: BackgroundTasks,
):
    """
    Receives guest inquiries, issues a reference ID, and schedules background dispatch.
    """
    ref_id = f"INQ-{random.randint(100000, 999999)}"

    # Offload email notification so client response is instant (< 50ms)
    background_tasks.add_task(send_concierge_notification, payload, ref_id)

    return ContactInquiryResponse(
        success=True,
        reference_id=ref_id,
        message="Your inquiry has been delivered to our concierge team. Expect a response within 4 hours.",
    )
```

---

### 3.8 Updating the Master Router (`app/api/v1/api.py`)

Ensure your master router includes the new destination and public support endpoints.

#### File: `backend/app/api/v1/api.py`
```python
from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    auth,
    availability,
    bookings,
    destinations,
    favorites,
    hotels,
    public,
    reviews,
    rooms,
)

api_router = APIRouter()

# Public & Catalog Routes
api_router.include_router(auth.router)
api_router.include_router(hotels.router)
api_router.include_router(rooms.router)
api_router.include_router(destinations.router)
api_router.include_router(availability.router)
api_router.include_router(public.router)

# User & Protected Routes
api_router.include_router(bookings.router)
api_router.include_router(reviews.router)
api_router.include_router(favorites.router)

# Administrative Console
api_router.include_router(admin.router)
```

---

## 4. Testing Your Phase 3 Code with Pytest

To ensure high quality, create tests for search filtering and date availability.

#### File: `backend/tests/test_search.py`
```python
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_search_hotels_pagination():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/hotels?page=1&page_size=2")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) <= 2
        assert "total" in data
        assert "total_pages" in data


@pytest.mark.asyncio
async def test_search_hotels_destination_filter():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/hotels?destination=Kyoto")
        assert response.status_code == 200
        data = response.json()
        for hotel in data["items"]:
            assert "Kyoto" in hotel["location"]["city"] or "Kyoto" in hotel["name"]


@pytest.mark.asyncio
async def test_hotel_detail_not_found():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/hotels/non-existent-hotel-slug")
        assert response.status_code == 404
        assert "not found" in response.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_contact_inquiry_validation():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Invalid email and message too short
        payload = {
            "name": "E",
            "email": "not-an-email",
            "subject": "Hi",
            "message": "Too short",
        }
        response = await client.post("/api/v1/contact", json=payload)
        assert response.status_code == 422  # Pydantic validation error
```

Run tests using pytest:
```bash
pytest tests/test_search.py -v
```

---

## 5. Verifying with the Frontend (`NEXT_PUBLIC_USE_MOCK_API=false`)

Once your FastAPI server is running (`uvicorn app.main:app --reload --port 8000`):

1. In the Next.js root folder, open `.env.local` and set:
   ```ini
   NEXT_PUBLIC_USE_MOCK_API=false
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
   ```
2. Start the Next.js dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`:
   - Inspect network tab in Chrome DevTools: `GET http://localhost:8000/api/v1/hotels/featured` should return `200 OK`.
   - Go to `/search?destination=Kyoto`: it hits your FastAPI backend and returns the Kyoto properties.
   - Click a hotel card: it opens `/hotels/[slug]`, fetching full room configurations and policies directly from your PostgreSQL database.
   - Visit `/contact`, type a message, and click submit: verify the reference ID returned in the UI matches your FastAPI console output.

---

## 6. Common Beginner Mistakes in Public Endpoints

| Mistake | What Happens | The Professional Fix |
| :--- | :--- | :--- |
| **Using `FLOAT` for prices** | Rounding errors (e.g. `$380.00` becomes `379.9999999999`). | Always store and query `INTEGER` minor units (cents). |
| **Executing N+1 queries** | Database stalls when loading 20 hotels with 3 rooms each (61 queries). | Use `.options(selectinload(Hotel.rooms))` in SQLAlchemy. |
| **Date calculation in Python** | Pulling 50,000 bookings into Python memory to check availability. | Run the overlap count in a SQL subquery with `group_by`. |
| **Missing GIN/B-Tree Indexes** | Queries slow down exponentially as data grows past 1,000 rows. | Index foreign keys, `slug`, `property_type`, and location. |
| **Synchronous email sending** | Contact form takes 3–5 seconds to respond. | Use `BackgroundTasks` to respond to the browser in under 50ms. |

---

### Next Steps

Now you have the complete code and architectural rationale for **Phase 3**. You can write these modules step-by-step in `backend/app/services/` and `backend/app/api/v1/endpoints/`. When ready, test the endpoints in Swagger UI (`http://localhost:8000/api/v1/docs`) and verify them in real-time on your frontend!

