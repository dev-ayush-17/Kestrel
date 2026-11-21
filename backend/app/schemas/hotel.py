from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


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

    model_config = ConfigDict(from_attributes=True)


class HotelCreate(BaseModel):
    slug: str
    name: str
    tagline: str
    description: str
    property_type: str
    star_rating: int = 5
    average_rating: float = 5.0
    review_count: int = 0
    featured: bool = False
    min_price_cents: int
    currency: str = "USD"
    location: HotelLocationSchema
    policies: HotelPoliciesSchema
    amenities: List[dict] = []
    images: List[str] = []
    hero_image: str


class HotelUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    star_rating: Optional[int] = None
    featured: Optional[bool] = None
    min_price_cents: Optional[int] = None
    currency: Optional[str] = None
    location: Optional[HotelLocationSchema] = None
    policies: Optional[HotelPoliciesSchema] = None
    amenities: Optional[List[dict]] = None
    images: Optional[List[str]] = None
    hero_image: Optional[str] = None


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
