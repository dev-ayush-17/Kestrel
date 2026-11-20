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