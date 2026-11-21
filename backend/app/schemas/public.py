from datetime import date
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field

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

    model_config = ConfigDict(from_attributes=True)


class ContactInquiryRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    subject: str = Field(..., min_length=3, max_length=150)
    message: str = Field(..., min_length=10, max_length=2000)


class ContactInquiryResponse(BaseModel):
    success: bool
    reference_id: str
    message: str