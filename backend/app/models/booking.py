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