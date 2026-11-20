from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel


class RoomTypeCreate(BaseModel):
    slug: str
    name: str
    description: str
    max_occupancy: int
    bed_type: str
    bed_count: int = 1
    size_sqm: int
    base_nightly_rate_cents: int
    currency: str = "USD"
    total_inventory: int = 5
    images: List[str] = []
    amenities: List[dict] = []
    features: List[str] = []


class RoomTypeUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    max_occupancy: Optional[int] = None
    bed_type: Optional[str] = None
    bed_count: Optional[int] = None
    size_sqm: Optional[int] = None
    base_nightly_rate_cents: Optional[int] = None
    currency: Optional[str] = None
    total_inventory: Optional[int] = None
    images: Optional[List[str]] = None
    amenities: Optional[List[dict]] = None
    features: Optional[List[str]] = None


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
