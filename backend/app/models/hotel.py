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