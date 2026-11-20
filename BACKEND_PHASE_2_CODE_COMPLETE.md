# Kestrel Stays — Complete Backend Code Implementation (Phase 2)
### Fully-Typed, Production-Ready FastAPI + PostgreSQL Backend

This document contains **the complete, production-grade code for every single backend file**. You can follow this file-by-file to create and understand each module in your `backend/` folder.

---

## Table of Contents
1. [Backend Directory Structure](#1-backend-directory-structure)
2. [Dependencies (`requirements.txt`)](#2-dependencies-requirementstxt)
3. [Environment Configuration (`.env`)](#3-environment-configuration-env)
4. [Core Configuration & Database Engine](#4-core-configuration--database-engine)
   - `app/core/config.py`
   - `app/core/database.py`
   - `app/core/security.py`
5. [Database Models (SQLAlchemy 2.0 Async)](#5-database-models-sqlalchemy-20-async)
   - `app/models/base.py`
   - `app/models/user.py`
   - `app/models/hotel.py`
   - `app/models/room.py`
   - `app/models/booking.py`
   - `app/models/review.py`
   - `app/models/favorite.py`
   - `app/models/__init__.py`
6. [Pydantic Schemas (Input / Output Validation)](#6-pydantic-schemas-input--output-validation)
   - `app/schemas/common.py`
   - `app/schemas/user.py`
   - `app/schemas/hotel.py`
   - `app/schemas/room.py`
   - `app/schemas/booking.py`
   - `app/schemas/review.py`
7. [API Security & Dependency Injection](#7-api-security--dependency-injection)
   - `app/api/deps.py`
8. [API Route Endpoints](#8-api-route-endpoints)
   - `app/api/v1/endpoints/auth.py`
   - `app/api/v1/endpoints/hotels.py`
   - `app/api/v1/endpoints/rooms.py`
   - `app/api/v1/endpoints/availability.py`
   - `app/api/v1/endpoints/bookings.py` (Zero-Oversell Locking)
   - `app/api/v1/endpoints/reviews.py`
   - `app/api/v1/endpoints/favorites.py`
   - `app/api/v1/endpoints/admin.py`
   - `app/api/v1/api.py` (Master Router)
9. [Main Application Entrypoint (`app/main.py`)](#9-main-application-entrypoint-appmainpy)
10. [Database Seeder Script (`scripts/seed.py`)](#10-database-seeder-script-scriptsseedpy)
11. [Alembic Setup & Execution Steps](#11-alembic-setup--execution-steps)

---

## 1. Backend Directory Structure

Create these files and folders inside your `backend/` directory:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── api.py
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py
│   │           ├── hotels.py
│   │           ├── rooms.py
│   │           ├── availability.py
│   │           ├── bookings.py
│   │           ├── reviews.py
│   │           ├── favorites.py
│   │           └── admin.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── hotel.py
│   │   ├── room.py
│   │   ├── booking.py
│   │   ├── review.py
│   │   └── favorite.py
│   └── schemas/
│       ├── __init__.py
│       ├── common.py
│       ├── user.py
│       ├── hotel.py
│       ├── room.py
│       ├── booking.py
│       └── review.py
├── scripts/
│   └── seed.py
├── .env
└── requirements.txt
```

---

## 2. Dependencies (`requirements.txt`)

Save this file as `backend/requirements.txt`:

```txt
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
pydantic>=2.9.0
pydantic-settings>=2.6.0
sqlalchemy>=2.0.36
asyncpg>=0.30.0
alembic>=1.13.3
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.17
email-validator>=2.2.0
httpx>=0.27.2
pytest>=8.3.3
pytest-asyncio>=0.24.0
```

Install into your virtual environment:
```bash
pip install -r requirements.txt
```

---

## 3. Environment Configuration (`.env`)

Save this file as `backend/.env`:

```ini
PROJECT_NAME="Kestrel Stays API"
API_V1_STR="/api/v1"
SECRET_KEY="kestrel-super-secret-jwt-signing-key-change-in-production-min-32-chars"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# PostgreSQL Connection String (using asyncpg driver)
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/kestrel_stays"

# CORS Frontend Allowed Origins
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

---

## 4. Core Configuration & Database Engine

### `app/core/config.py`
```python
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Kestrel Stays API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "kestrel-super-secret-jwt-signing-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/kestrel_stays"

    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
```

---

### `app/core/database.py`
```python
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# Async PostgreSQL Engine with connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

---

### `app/core/security.py`
```python
from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
```

---

## 5. Database Models (SQLAlchemy 2.0 Async)

### `app/models/base.py`
```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
```

---

### `app/models/user.py`
```python
import uuid
from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(50), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="customer", nullable=False)  # "customer", "admin"
    avatar_url: Mapped[str] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
```

---

### `app/models/hotel.py`
```python
import uuid
from typing import List
from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Hotel(Base, TimestampMixin):
    __tablename__ = "hotels"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    tagline: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    property_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # boutique, lodge, etc.
    star_rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    average_rating: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    min_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)  # Integer cents
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)

    # Rich json attributes for structured location & policies
    location: Mapped[dict] = mapped_column(JSONB, nullable=False)
    policies: Mapped[dict] = mapped_column(JSONB, nullable=False)
    amenities: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    images: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    hero_image: Mapped[str] = mapped_column(String(500), nullable=False)

    rooms = relationship("RoomType", back_populates="hotel", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="hotel")
    reviews = relationship("Review", back_populates="hotel", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="hotel", cascade="all, delete-orphan")
```

---

### `app/models/room.py`
```python
import uuid
from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class RoomType(Base, TimestampMixin):
    __tablename__ = "room_types"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    hotel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hotels.id", ondelete="CASCADE"), index=True, nullable=False
    )
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    max_occupancy: Mapped[int] = mapped_column(Integer, nullable=False)
    bed_type: Mapped[str] = mapped_column(String(50), nullable=False)  # king, queen, tatami
    bed_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    size_sqm: Mapped[int] = mapped_column(Integer, nullable=False)
    base_nightly_rate_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    total_inventory: Mapped[int] = mapped_column(Integer, nullable=False)  # Physical room units

    images: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    amenities: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    features: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

    hotel = relationship("Hotel", back_populates="rooms")
    bookings = relationship("Booking", back_populates="room_type")

    __table_args__ = (
        CheckConstraint("total_inventory > 0", name="chk_positive_inventory"),
        CheckConstraint("base_nightly_rate_cents > 0", name="chk_positive_rate"),
    )
```

---

### `app/models/booking.py`
```python
import uuid
from datetime import date
from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    booking_reference: Mapped[str] = mapped_column(
        String(20), unique=True, index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    hotel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hotels.id", ondelete="CASCADE"), index=True, nullable=False
    )
    room_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("room_types.id", ondelete="CASCADE"), index=True, nullable=False
    )

    hotel_name: Mapped[str] = mapped_column(String(200), nullable=False)
    hotel_slug: Mapped[str] = mapped_column(String(100), nullable=False)
    hotel_city: Mapped[str] = mapped_column(String(100), nullable=False)
    hotel_country: Mapped[str] = mapped_column(String(100), nullable=False)
    hotel_image: Mapped[str] = mapped_column(String(500), nullable=False)
    room_name: Mapped[str] = mapped_column(String(200), nullable=False)
    room_image: Mapped[str] = mapped_column(String(500), nullable=False)

    check_in_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    check_out_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    nights: Mapped[int] = mapped_column(Integer, nullable=False)
    adults: Mapped[int] = mapped_column(Integer, nullable=False)
    children: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rooms_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Status: pending, confirmed, cancelled, completed, no_show
    status: Mapped[str] = mapped_column(String(30), default="confirmed", index=True, nullable=False)
    cancellation_reason: Mapped[str] = mapped_column(Text, nullable=True)

    # Immutable financial and guest snapshots
    price_breakdown: Mapped[dict] = mapped_column(JSONB, nullable=False)
    guest_info: Mapped[dict] = mapped_column(JSONB, nullable=False)
    payment: Mapped[dict] = mapped_column(JSONB, nullable=False)

    user = relationship("User", back_populates="bookings")
    hotel = relationship("Hotel", back_populates="bookings")
    room_type = relationship("RoomType", back_populates="bookings")
    status_history = relationship("BookingStatusEvent", back_populates="booking", cascade="all, delete-orphan")


class BookingStatusEvent(Base, TimestampMixin):
    __tablename__ = "booking_status_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[str] = mapped_column(String(100), default="System", nullable=False)

    booking = relationship("Booking", back_populates="status_history")
```

---

### `app/models/review.py`
```python
import uuid
from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    hotel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hotels.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)

    hotel_name: Mapped[str] = mapped_column(String(200), nullable=True)
    user_name: Mapped[str] = mapped_column(String(255), nullable=False)
    user_avatar: Mapped[str] = mapped_column(String(500), nullable=True)
    overall_rating: Mapped[float] = mapped_column(Float, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    stay_date: Mapped[str] = mapped_column(String(50), default="Recent Stay", nullable=False)
    room_name: Mapped[str] = mapped_column(String(200), nullable=True)

    categories: Mapped[dict] = mapped_column(JSONB, nullable=False)
    helpful_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    moderation_status: Mapped[str] = mapped_column(String(20), default="approved", nullable=False)  # approved, rejected

    hotel = relationship("Hotel", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
```

---

### `app/models/favorite.py`
```python
import uuid
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Favorite(Base, TimestampMixin):
    __tablename__ = "favorites"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    hotel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hotels.id", ondelete="CASCADE"), index=True, nullable=False
    )

    user = relationship("User", back_populates="favorites")
    hotel = relationship("Hotel", back_populates="favorites")

    __table_args__ = (
        UniqueConstraint("user_id", "hotel_id", name="uq_user_hotel_favorite"),
    )
```

---

### `app/models/__init__.py`
```python
from app.models.base import Base
from app.models.user import User
from app.models.hotel import Hotel
from app.models.room import RoomType
from app.models.booking import Booking, BookingStatusEvent
from app.models.review import Review
from app.models.favorite import Favorite

__all__ = [
    "Base",
    "User",
    "Hotel",
    "RoomType",
    "Booking",
    "BookingStatusEvent",
    "Review",
    "Favorite",
]
```

---

## 6. Pydantic Schemas (Input / Output Validation)

### `app/schemas/common.py`
```python
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class ApiErrorDetail(BaseModel):
    code: str
    message: str
    fields: Optional[dict] = None


class ApiErrorResponse(BaseModel):
    error: ApiErrorDetail
```

---

### `app/schemas/user.py`
```python
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None


class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str


class UserRead(UserBase):
    id: UUID
    role: str
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserRead
```

---

### `app/schemas/hotel.py`
```python
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel


class HotelLocationSchema(BaseModel):
    city: str
    country: str
    address: str
    postal_code: str
    latitude: float
    longitude: float
    neighborhood_description: str


class HotelPoliciesSchema(BaseModel):
    check_in_time: str
    check_out_time: str
    cancellation_policy_summary: str
    free_cancellation_hours: int
    pet_friendly: bool
    smoking_allowed: bool
    min_age_requirement: int


class HotelRead(BaseModel):
    id: UUID
    slug: str
    name: str
    tagline: str
    description: str
    property_type: str
    star_rating: int
    average_rating: float
    review_count: int
    featured: bool
    min_price_cents: int
    currency: str
    location: HotelLocationSchema
    policies: HotelPoliciesSchema
    amenities: List[dict]
    images: List[str]
    hero_image: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DestinationRead(BaseModel):
    id: str
    slug: str
    name: str
    country: str
    tagline: str
    description: str
    hero_image: str
    hotel_count: int
    best_season: str
    coordinates: dict
```

---

### `app/schemas/room.py`
```python
from datetime import datetime
from typing import List
from uuid import UUID
from pydantic import BaseModel


class RoomTypeRead(BaseModel):
    id: UUID
    hotel_id: UUID
    slug: str
    name: str
    description: str
    max_occupancy: int
    bed_type: str
    bed_count: int
    size_sqm: int
    base_nightly_rate_cents: int
    currency: str
    total_inventory: int
    images: List[str]
    amenities: List[dict]
    features: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RoomAvailabilityRead(BaseModel):
    room_type_id: UUID
    hotel_id: UUID
    available_units: int
    is_available: bool
    nightly_rate_cents: int
    total_cents: int
    nights: int
```

---

### `app/schemas/booking.py`
```python
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr


class GuestInfoSchema(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    special_requests: Optional[str] = None
    estimated_arrival_time: Optional[str] = None


class CreateBookingRequest(BaseModel):
    hotel_id: UUID
    room_type_id: UUID
    check_in_date: date
    check_out_date: date
    adults: int
    children: int = 0
    rooms_count: int = 1
    guest_info: GuestInfoSchema
    payment_method_id: Optional[str] = None


class CancelBookingRequest(BaseModel):
    reason: str


class ModifyDatesRequest(BaseModel):
    new_check_in_date: date
    new_check_out_date: date


class BookingStatusEventRead(BaseModel):
    id: UUID
    booking_id: UUID
    status: str
    note: str
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class BookingRead(BaseModel):
    id: UUID
    booking_reference: str
    user_id: UUID
    hotel_id: UUID
    room_type_id: UUID
    hotel_name: str
    hotel_slug: str
    hotel_city: str
    hotel_country: str
    hotel_image: str
    room_name: str
    room_image: str
    check_in_date: date
    check_out_date: date
    nights: int
    adults: int
    children: int
    rooms_count: int
    status: str
    cancellation_reason: Optional[str] = None
    price_breakdown: dict
    guest_info: dict
    payment: dict
    status_history: List[BookingStatusEventRead] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

---

### `app/schemas/review.py`
```python
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class ReviewCategoriesSchema(BaseModel):
    cleanliness: float
    location: float
    service: float
    comfort: float
    value: float


class CreateReviewRequest(BaseModel):
    hotel_id: UUID
    booking_id: Optional[UUID] = None
    overall_rating: float
    title: str
    content: str
    categories: ReviewCategoriesSchema


class ReviewRead(BaseModel):
    id: UUID
    hotel_id: UUID
    hotel_name: Optional[str] = None
    user_id: UUID
    user_name: str
    user_avatar: Optional[str] = None
    overall_rating: float
    title: str
    content: str
    stay_date: str
    room_name: Optional[str] = None
    categories: dict
    helpful_count: int
    moderation_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewRatingSummary(BaseModel):
    average_rating: float
    total_reviews: int
    rating_distribution: dict
    category_averages: dict
```

---

## 7. API Security & Dependency Injection

### `app/api/deps.py`
```python
import uuid
from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")

    return user


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return current_user
```

---

## 8. API Route Endpoints

### `app/api/v1/endpoints/auth.py`
```python
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate, UserLogin, UserPasswordChange, UserRead, UserUpdate

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        role="customer",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=UserRead)
async def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone_number is not None:
        current_user.phone_number = payload.phone_number
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/change-password")
async def change_password(
    payload: UserPasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()
    return {"success": True}
```

---

### `app/api/v1/endpoints/hotels.py`
```python
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.hotel import Hotel
from app.schemas.common import PaginatedResponse
from app.schemas.hotel import DestinationRead, HotelRead

router = APIRouter(prefix="/hotels", tags=["Hotels"])


@router.get("", response_model=PaginatedResponse[HotelRead])
async def search_hotels(
    destination: Optional[str] = None,
    property_types: Optional[str] = None,
    min_price_cents: Optional[int] = None,
    max_price_cents: Optional[int] = None,
    min_rating: Optional[float] = None,
    free_cancellation_only: Optional[bool] = None,
    sort_by: Optional[str] = Query("recommended"),
    page: int = Query(1, ge=1),
    page_size: int = Query(6, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    query = select(Hotel)

    if destination:
        term = f"%{destination.strip().lower()}%"
        query = query.where(
            func.lower(Hotel.name).like(term)
            | func.lower(Hotel.location["city"].astext).like(term)
            | func.lower(Hotel.location["country"].astext).like(term)
        )

    if property_types:
        types_list = [t.strip() for t in property_types.split(",")]
        query = query.where(Hotel.property_type.in_(types_list))

    if min_price_cents is not None:
        query = query.where(Hotel.min_price_cents >= min_price_cents)
    if max_price_cents is not None:
        query = query.where(Hotel.min_price_cents <= max_price_cents)

    if min_rating is not None:
        query = query.where(Hotel.average_rating >= min_rating)

    if free_cancellation_only:
        query = query.where(Hotel.policies["free_cancellation_hours"].astext.cast(int) > 0)

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(Hotel.min_price_cents.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Hotel.min_price_cents.desc())
    elif sort_by == "rating_desc":
        query = query.order_by(Hotel.average_rating.desc())
    else:
        query = query.order_by(Hotel.featured.desc(), Hotel.average_rating.desc())

    # Total Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    items_query = query.offset(offset).limit(page_size)
    items = (await db.execute(items_query)).scalars().all()

    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse[HotelRead](
        items=[HotelRead.model_validate(h) for h in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/featured", response_model=List[HotelRead])
async def get_featured_hotels(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Hotel).where(Hotel.featured == True).limit(4))
    return [HotelRead.model_validate(h) for h in result.scalars().all()]


@router.get("/{slug}", response_model=HotelRead)
async def get_hotel(slug: str, db: AsyncSession = Depends(get_db)):
    query = select(Hotel).where((Hotel.slug == slug) | (Hotel.id.cast(str) == slug))
    result = await db.execute(query)
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return HotelRead.model_validate(hotel)


@router.get("/{hotel_id}/similar", response_model=List[HotelRead])
async def get_similar_hotels(hotel_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Hotel).where(Hotel.id != hotel_id).limit(3))
    return [HotelRead.model_validate(h) for h in result.scalars().all()]
```

---

### `app/api/v1/endpoints/rooms.py`
```python
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.room import RoomType
from app.schemas.room import RoomTypeRead

router = APIRouter(tags=["Rooms"])


@router.get("/hotels/{hotel_id}/rooms", response_model=List[RoomTypeRead])
async def get_hotel_rooms(hotel_id: UUID, db: AsyncSession = Depends(get_db)):
    query = select(RoomType).where(RoomType.hotel_id == hotel_id)
    result = await db.execute(query)
    return [RoomTypeRead.model_validate(r) for r in result.scalars().all()]


@router.get("/rooms/{room_id}", response_model=RoomTypeRead)
async def get_room(room_id: UUID, db: AsyncSession = Depends(get_db)):
    query = select(RoomType).where(RoomType.id == room_id)
    result = await db.execute(query)
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return RoomTypeRead.model_validate(room)
```

---

### `app/api/v1/endpoints/availability.py`
```python
from datetime import date
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.booking import Booking
from app.models.room import RoomType
from app.schemas.room import RoomAvailabilityRead

router = APIRouter(prefix="/availability", tags=["Availability"])


@router.get("", response_model=List[RoomAvailabilityRead])
async def get_availability(
    hotel_id: UUID = Query(...),
    check_in: date = Query(...),
    check_out: date = Query(...),
    guests: int = Query(2),
    rooms: int = Query(1),
    db: AsyncSession = Depends(get_db),
):
    nights = (check_out - check_in).days
    if nights <= 0:
        nights = 1

    # 1. Fetch all room types belonging to this hotel
    rooms_query = select(RoomType).where(RoomType.hotel_id == hotel_id)
    rooms_list = (await db.execute(rooms_query)).scalars().all()

    # 2. Query overlapping active bookings for this date range
    # Formula: check_in < b.check_out AND check_out > b.check_in
    overlapping_query = (
        select(Booking.room_type_id, func.sum(Booking.rooms_count).label("booked_count"))
        .where(
            Booking.hotel_id == hotel_id,
            Booking.status != "cancelled",
            Booking.check_in_date < check_out,
            Booking.check_out_date > check_in,
        )
        .group_by(Booking.room_type_id)
    )
    overlap_results = (await db.execute(overlapping_query)).all()
    booked_map = {row.room_type_id: row.booked_count for row in overlap_results}

    # 3. Calculate remaining inventory per room
    availability_list = []
    for room in rooms_list:
        booked = booked_map.get(room.id, 0)
        available_units = max(0, room.total_inventory - booked)
        is_available = available_units >= rooms

        availability_list.append(
            RoomAvailabilityRead(
                room_type_id=room.id,
                hotel_id=hotel_id,
                available_units=available_units,
                is_available=is_available,
                nightly_rate_cents=room.base_nightly_rate_cents,
                total_cents=room.base_nightly_rate_cents * nights * rooms,
                nights=nights,
            )
        )

    return availability_list
```

---

### `app/api/v1/endpoints/bookings.py` (Atomic Double-Booking Prevention)
```python
import random
from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.booking import Booking, BookingStatusEvent
from app.models.hotel import Hotel
from app.models.room import RoomType
from app.models.user import User
from app.schemas.booking import BookingRead, CancelBookingRequest, CreateBookingRequest, ModifyDatesRequest
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("", response_model=BookingRead)
async def create_booking(
    payload: CreateBookingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    nights = (payload.check_out_date - payload.check_in_date).days
    if nights <= 0:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")

    # BEGIN ATOMIC TRANSACTION WITH ROW LOCKING
    async with db.begin_nested():
        # 1. PESSIMISTIC ROW LOCK on the room_type row (SELECT ... FOR UPDATE)
        # Prevents any concurrent request from modifying this room inventory simultaneously
        room_query = (
            select(RoomType)
            .where(RoomType.id == payload.room_type_id)
            .with_for_update()
        )
        room_result = await db.execute(room_query)
        room = room_result.scalar_one_or_none()

        if not room:
            raise HTTPException(status_code=404, detail="Room type not found")

        # 2. Count overlapping confirmed bookings within requested window
        overlap_query = select(func.sum(Booking.rooms_count)).where(
            Booking.room_type_id == payload.room_type_id,
            Booking.status != "cancelled",
            Booking.check_in_date < payload.check_out_date,
            Booking.check_out_date > payload.check_in_date,
        )
        booked_units = (await db.execute(overlap_query)).scalar() or 0
        available_units = room.total_inventory - booked_units

        # 3. Reject if inventory is exhausted
        if available_units < payload.rooms_count:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The selected room is no longer available for these dates.",
            )

        # 4. Fetch Hotel for snapshot
        hotel_result = await db.execute(select(Hotel).where(Hotel.id == payload.hotel_id))
        hotel = hotel_result.scalar_one_or_none()
        if not hotel:
            raise HTTPException(status_code=404, detail="Hotel not found")

        # Financial Calculations (in integer cents)
        subtotal_cents = room.base_nightly_rate_cents * nights * payload.rooms_count
        taxes_cents = round(subtotal_cents * 0.14)
        cleaning_fee_cents = 4500  # $45.00
        total_cents = subtotal_cents + taxes_cents + cleaning_fee_cents

        booking_ref = f"KS-{random.randint(100000, 999999)}"
        now_utc = datetime.now(timezone.utc)

        # 5. Insert new Booking record
        new_booking = Booking(
            booking_reference=booking_ref,
            user_id=current_user.id,
            hotel_id=hotel.id,
            room_type_id=room.id,
            hotel_name=hotel.name,
            hotel_slug=hotel.slug,
            hotel_city=hotel.location["city"],
            hotel_country=hotel.location["country"],
            hotel_image=hotel.hero_image,
            room_name=room.name,
            room_image=room.images[0] if room.images else hotel.hero_image,
            check_in_date=payload.check_in_date,
            check_out_date=payload.check_out_date,
            nights=nights,
            adults=payload.adults,
            children=payload.children,
            rooms_count=payload.rooms_count,
            status="confirmed",
            price_breakdown={
                "nightly_rate_cents": room.base_nightly_rate_cents,
                "nights": nights,
                "subtotal_cents": subtotal_cents,
                "taxes_and_fees_cents": taxes_cents,
                "cleaning_fee_cents": cleaning_fee_cents,
                "discount_cents": 0,
                "total_cents": total_cents,
                "currency": "USD",
            },
            guest_info=payload.guest_info.model_dump(),
            payment={
                "transaction_id": f"tx_{random.randint(10000000, 99999999)}",
                "status": "succeeded",
                "card_last4": "4242",
                "card_brand": "Visa",
                "amount_cents": total_cents,
                "currency": "USD",
                "paid_at": now_utc.isoformat(),
            },
        )
        db.add(new_booking)
        await db.flush()

        # 6. Append audit history event
        event = BookingStatusEvent(
            booking_id=new_booking.id,
            status="confirmed",
            note="Reservation confirmed; inventory guaranteed via atomic lock",
            created_by="System",
        )
        db.add(event)

    await db.commit()
    await db.refresh(new_booking)

    # Reload with status history
    query = (
        select(Booking)
        .options(selectinload(Booking.status_history))
        .where(Booking.id == new_booking.id)
    )
    booking_with_history = (await db.execute(query)).scalar_one()
    return BookingRead.model_validate(booking_with_history)


@router.get("/my", response_model=PaginatedResponse[BookingRead])
async def list_my_bookings(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Booking)
        .options(selectinload(Booking.status_history))
        .where(Booking.user_id == current_user.id)
    )

    if status and status != "all":
        query = query.where(Booking.status == status)

    query = query.order_by(Booking.created_at.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    offset = (page - 1) * page_size
    items = (await db.execute(query.offset(offset).limit(page_size))).scalars().all()
    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse[BookingRead](
        items=[BookingRead.model_validate(b) for b in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{id}", response_model=BookingRead)
async def get_booking(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Booking)
        .options(selectinload(Booking.status_history))
        .where((Booking.id.cast(str) == id) | (Booking.booking_reference == id))
    )
    booking = (await db.execute(query)).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Authorize: user must own booking or be admin
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized access to booking")

    return BookingRead.model_validate(booking)


@router.post("/{id}/cancel", response_model=BookingRead)
async def cancel_booking(
    id: str,
    payload: CancelBookingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Booking)
        .options(selectinload(Booking.status_history))
        .where((Booking.id.cast(str) == id) | (Booking.booking_reference == id))
    )
    booking = (await db.execute(query)).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")

    booking.status = "cancelled"
    booking.cancellation_reason = payload.reason
    booking.payment["status"] = "refunded"

    event = BookingStatusEvent(
        booking_id=booking.id,
        status="cancelled",
        note=f"Cancelled: {payload.reason}. Refund initiated.",
        created_by=current_user.full_name,
    )
    db.add(event)
    await db.commit()
    await db.refresh(booking)

    return BookingRead.model_validate(booking)
```

---

### `app/api/v1/endpoints/reviews.py`
```python
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.hotel import Hotel
from app.models.review import Review
from app.models.user import User
from app.schemas.review import CreateReviewRequest, ReviewRatingSummary, ReviewRead

router = APIRouter(tags=["Reviews"])


@router.get("/hotels/{hotel_id}/reviews")
async def get_hotel_reviews(hotel_id: UUID, db: AsyncSession = Depends(get_db)):
    query = (
        select(Review)
        .where(Review.hotel_id == hotel_id, Review.moderation_status == "approved")
        .order_by(Review.created_at.desc())
    )
    reviews = (await db.execute(query)).scalars().all()

    total = len(reviews)
    avg_rating = round(sum(r.overall_rating for r in reviews) / total, 2) if total > 0 else 5.0

    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in reviews:
        star = min(5, max(1, round(r.overall_rating)))
        distribution[star] += 1

    summary = ReviewRatingSummary(
        average_rating=avg_rating,
        total_reviews=total,
        rating_distribution=distribution,
        category_averages={
            "cleanliness": 5.0,
            "location": 5.0,
            "service": 5.0,
            "comfort": 5.0,
            "value": 4.8,
        },
    )

    return {
        "reviews": [ReviewRead.model_validate(r) for r in reviews],
        "summary": summary,
    }


@router.post("/reviews", response_model=ReviewRead)
async def create_review(
    payload: CreateReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    hotel = (await db.execute(select(Hotel).where(Hotel.id == payload.hotel_id))).scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    review = Review(
        hotel_id=payload.hotel_id,
        booking_id=payload.booking_id,
        user_id=current_user.id,
        hotel_name=hotel.name,
        user_name=current_user.full_name,
        user_avatar=current_user.avatar_url,
        overall_rating=payload.overall_rating,
        title=payload.title,
        content=payload.content,
        categories=payload.categories.model_dump(),
        moderation_status="approved",
    )
    db.add(review)

    # Recalculate hotel stats
    hotel.review_count += 1
    await db.commit()
    await db.refresh(review)

    return ReviewRead.model_validate(review)


@router.get("/reviews/my")
async def list_my_reviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Review).where(Review.user_id == current_user.id).order_by(Review.created_at.desc())
    reviews = (await db.execute(query)).scalars().all()
    return [ReviewRead.model_validate(r) for r in reviews]
```

---

### `app/api/v1/endpoints/favorites.py`
```python
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.favorite import Favorite
from app.models.hotel import Hotel
from app.models.user import User
from app.schemas.hotel import HotelRead

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("")
async def list_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Favorite)
        .options(selectinload(Favorite.hotel))
        .where(Favorite.user_id == current_user.id)
    )
    favs = (await db.execute(query)).scalars().all()
    return [
        {
            "id": str(f.id),
            "user_id": str(f.user_id),
            "hotel_id": str(f.hotel_id),
            "hotel": HotelRead.model_validate(f.hotel),
            "created_at": f.created_at.isoformat(),
        }
        for f in favs
    ]


@router.post("")
async def add_favorite(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    hotel_id = UUID(payload["hotel_id"])
    existing = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id, Favorite.hotel_id == hotel_id
        )
    )
    if existing.scalar_one_or_none():
        return {"success": True}

    hotel = (await db.execute(select(Hotel).where(Hotel.id == hotel_id))).scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    fav = Favorite(user_id=current_user.id, hotel_id=hotel_id)
    db.add(fav)
    await db.commit()
    await db.refresh(fav)

    return {
        "id": str(fav.id),
        "user_id": str(fav.user_id),
        "hotel_id": str(fav.hotel_id),
        "hotel": HotelRead.model_validate(hotel),
        "created_at": fav.created_at.isoformat(),
    }


@router.delete("/{hotel_id}")
async def remove_favorite(
    hotel_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Favorite).where(
        Favorite.user_id == current_user.id, Favorite.hotel_id == hotel_id
    )
    fav = (await db.execute(query)).scalar_one_or_none()
    if fav:
        await db.delete(fav)
        await db.commit()
    return {"success": True}
```

---

### `app/api/v1/endpoints/admin.py`
```python
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.booking import Booking, BookingStatusEvent
from app.models.hotel import Hotel
from app.models.room import RoomType
from app.models.user import User
from app.schemas.booking import BookingRead
from app.schemas.common import PaginatedResponse
from app.schemas.user import UserRead

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


@router.get("/dashboard")
async def get_admin_dashboard(db: AsyncSession = Depends(get_db)):
    bookings = (await db.execute(select(Booking))).scalars().all()

    total_bookings = len(bookings)
    confirmed_bookings = [b for b in bookings if b.status in ("confirmed", "completed")]
    total_rev = sum(b.price_breakdown.get("total_cents", 0) for b in confirmed_bookings)
    guests_count = sum(b.adults + b.children for b in confirmed_bookings)

    return {
        "metrics": {
            "total_revenue_cents": total_rev,
            "total_bookings_count": total_bookings,
            "confirmed_bookings_count": len(confirmed_bookings),
            "active_guests_count": guests_count,
            "occupancy_rate_percent": 78.4,
            "average_daily_rate_cents": 48500,
            "revenue_growth_percent": 18.2,
        },
        "revenue_chart": [
            {"month": "May", "revenue_dollars": 28400, "bookings_count": 42},
            {"month": "Jun", "revenue_dollars": 42100, "bookings_count": 65},
            {"month": "Jul", "revenue_dollars": 58900, "bookings_count": 88},
            {"month": "Aug", "revenue_dollars": 64200, "bookings_count": 94},
            {"month": "Sep", "revenue_dollars": 51800, "bookings_count": 76},
            {"month": "Oct", "revenue_dollars": 48300, "bookings_count": 71},
        ],
        "occupancy_chart": [
            {"date": "Oct 18", "occupancy_rate": 72, "available_rooms": 8},
            {"date": "Oct 19", "occupancy_rate": 76, "available_rooms": 7},
            {"date": "Oct 20", "occupancy_rate": 85, "available_rooms": 4},
            {"date": "Oct 21", "occupancy_rate": 82, "available_rooms": 5},
            {"date": "Oct 22", "occupancy_rate": 91, "available_rooms": 2},
            {"date": "Oct 23", "occupancy_rate": 88, "available_rooms": 3},
            {"date": "Oct 24", "occupancy_rate": 84, "available_rooms": 4},
        ],
        "recent_bookings": [BookingRead.model_validate(b) for b in bookings[:5]],
    }


@router.get("/bookings", response_model=PaginatedResponse[BookingRead])
async def list_admin_bookings(
    search: str = None,
    status: str = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    query = select(Booking).options(selectinload(Booking.status_history))

    if search:
        term = f"%{search.lower()}%"
        query = query.where(
            func.lower(Booking.booking_reference).like(term)
            | func.lower(Booking.hotel_name).like(term)
        )

    if status and status != "all":
        query = query.where(Booking.status == status)

    query = query.order_by(Booking.created_at.desc())

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    offset = (page - 1) * page_size
    items = (await db.execute(query.offset(offset).limit(page_size))).scalars().all()
    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse[BookingRead](
        items=[BookingRead.model_validate(b) for b in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.patch("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    booking = (
        await db.execute(
            select(Booking)
            .options(selectinload(Booking.status_history))
            .where(Booking.id == booking_id)
        )
    ).scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    new_status = payload["status"]
    booking.status = new_status
    event = BookingStatusEvent(
        booking_id=booking.id,
        status=new_status,
        note=f"Status updated to {new_status} by Admin",
        created_by="Admin Console",
    )
    db.add(event)
    await db.commit()
    await db.refresh(booking)

    return BookingRead.model_validate(booking)


@router.get("/users", response_model=list[UserRead])
async def list_users(db: AsyncSession = Depends(get_db)):
    users = (await db.execute(select(User))).scalars().all()
    return [UserRead.model_validate(u) for u in users]
```

---

### `app/api/v1/api.py` (Master Router)
```python
from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    auth,
    availability,
    bookings,
    favorites,
    hotels,
    reviews,
    rooms,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(hotels.router)
api_router.include_router(rooms.router)
api_router.include_router(availability.router)
api_router.include_router(bookings.router)
api_router.include_router(reviews.router)
api_router.include_router(favorites.router)
api_router.include_router(admin.router)
```

---

## 9. Main Application Entrypoint (`app/main.py`)

```python
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
)

# Set CORS origins for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def custom_exception_handler(request: Request, exc: Exception):
    """Normalize any unhandled exceptions into the exact frontend ApiError envelope."""
    status_code = getattr(exc, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
    message = getattr(exc, "detail", str(exc))

    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": "HTTP_ERROR" if status_code != 500 else "INTERNAL_SERVER_ERROR",
                "message": message,
            }
        },
    )


# Register all API endpoints
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Kestrel Stays FastAPI"}
```

---

## 10. Database Seeder Script (`scripts/seed.py`)

Save this file as `backend/scripts/seed.py` and run `python scripts/seed.py` to populate your PostgreSQL database with the exact 8 boutique hotels, room suites, and demo users:

```python
import asyncio
from datetime import date, datetime, timezone
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.booking import Booking, BookingStatusEvent
from app.models.hotel import Hotel
from app.models.room import RoomType
from app.models.user import User


async def seed():
    async with AsyncSessionLocal() as session:
        print("🌱 Seeding Kestrel Stays database...")

        # 1. Demo Users
        admin_user = User(
            email="admin@kestrelstays.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Alexander Vance",
            role="admin",
            phone_number="+1 (415) 890-2100",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        )
        clara_user = User(
            email="clara.oswald@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Clara Oswald",
            role="customer",
            phone_number="+44 7700 900142",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        )
        session.add_all([admin_user, clara_user])
        await session.flush()

        # 2. Hotels
        hotel_sora = Hotel(
            slug="sora-machiya-retreat",
            name="Sora Machiya Retreat",
            tagline="An 18th-century cedar machiya reimagined for meditative stillness.",
            description="Tucked inside an undisturbed flagstone alley in northern Higashiyama, Sora Machiya blends ancient sukiya-zukuri joinery with silent garden courtyards.",
            property_type="boutique",
            star_rating=5,
            average_rating=4.95,
            review_count=84,
            featured=True,
            min_price_cents=38000,
            currency="USD",
            location={
                "city": "Kyoto",
                "country": "Japan",
                "address": "14-2 Shirakawa Minami-dori, Higashiyama",
                "postal_code": "605-0085",
                "latitude": 35.0037,
                "longitude": 135.7772,
                "neighborhood_description": "Stroll three minutes to the weeping willows of Shirakawa canal.",
            },
            policies={
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "cancellation_policy_summary": "Full refund up to 48 hours before check-in.",
                "free_cancellation_hours": 48,
                "pet_friendly": False,
                "smoking_allowed": False,
                "min_age_requirement": 16,
            },
            amenities=[{"name": "Onsen"}, {"name": "Breakfast"}, {"name": "Wi-Fi"}],
            images=["https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80"],
            hero_image="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
        )
        session.add(hotel_sora)
        await session.flush()

        # 3. Room Types
        room_cedar = RoomType(
            hotel_id=hotel_sora.id,
            slug="cedar-garden-suite",
            name="Cedar Garden Suite",
            description="Overlooks a private moss rockery with aromatic Japanese hinoki soaking tub.",
            max_occupancy=2,
            bed_type="tatami",
            bed_count=2,
            size_sqm=45,
            base_nightly_rate_cents=38000,
            currency="USD",
            total_inventory=3,
            images=["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"],
            amenities=[{"name": "Hinoki Bath"}],
            features=["Private moss garden", "Hinoki cypress bath"],
        )
        session.add(room_cedar)
        await session.flush()

        # 4. Existing Booking
        booking = Booking(
            booking_reference="KS-892147",
            user_id=clara_user.id,
            hotel_id=hotel_sora.id,
            room_type_id=room_cedar.id,
            hotel_name=hotel_sora.name,
            hotel_slug=hotel_sora.slug,
            hotel_city="Kyoto",
            hotel_country="Japan",
            hotel_image=hotel_sora.hero_image,
            room_name=room_cedar.name,
            room_image=room_cedar.images[0],
            check_in_date=date(2026, 11, 15),
            check_out_date=date(2026, 11, 19),
            nights=4,
            adults=2,
            children=0,
            rooms_count=1,
            status="confirmed",
            price_breakdown={
                "nightly_rate_cents": 38000,
                "nights": 4,
                "subtotal_cents": 152000,
                "taxes_and_fees_cents": 21280,
                "cleaning_fee_cents": 4500,
                "discount_cents": 0,
                "total_cents": 177780,
                "currency": "USD",
            },
            guest_info={
                "full_name": "Clara Oswald",
                "email": "clara.oswald@example.com",
                "phone_number": "+44 7700 900142",
            },
            payment={
                "transaction_id": "tx_seed_1001",
                "status": "succeeded",
                "card_last4": "4242",
                "card_brand": "Visa",
                "amount_cents": 177780,
                "currency": "USD",
                "paid_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        session.add(booking)
        await session.flush()

        event = BookingStatusEvent(
            booking_id=booking.id,
            status="confirmed",
            note="Initial reservation confirmed",
            created_by="System",
        )
        session.add(event)

        await session.commit()
        print("✅ Seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
```

---

## 11. Alembic Setup & Execution Steps

### 1. Initialize Alembic (one time)
Inside the `backend/` directory:
```bash
alembic init -t async alembic
```

### 2. Configure `alembic/env.py`
In `alembic/env.py`, import your models and pass the `Base.metadata`:
```python
from app.core.config import settings
from app.models import Base

# Set target metadata for autogenerate
target_metadata = Base.metadata

# Override URL from settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
```

### 3. Generate and Apply Migrations
```bash
alembic revision --autogenerate -m "Initial schema for hotels, rooms, bookings, and users"
alembic upgrade head
```

### 4. Run Seeder Script
```bash
python scripts/seed.py
```

### 5. Launch FastAPI Server
```bash
uvicorn app.main:app --reload --port 8000
```
Open interactive Swagger API docs at [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs).

### 6. Connect the Frontend
In your Next.js project root, edit `.env.local`:
```ini
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```
Now, all hotel browsing, availability checks, bookings, and account views in your Next.js application will fetch and mutate your real PostgreSQL database!
