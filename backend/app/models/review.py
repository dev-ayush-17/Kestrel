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