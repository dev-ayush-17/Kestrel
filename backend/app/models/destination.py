import uuid
from sqlalchemy import Integer, String, Text
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
    coordinates: Mapped[dict] = mapped_column(JSONB, nullable=False)
